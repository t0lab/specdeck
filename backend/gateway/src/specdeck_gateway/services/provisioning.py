"""Provisioning — shared streamed-run infrastructure (instance #1).

For 004 this holds the reusable pieces that agent-execution will inherit later:
- `channel_for` — Redis channel naming convention.
- `reconcile_running_jobs` — startup sweep that clears jobs stuck `running`.

Job orchestration (clone/init + Redis publish + cleanup) is added in US2/US3.
"""

from __future__ import annotations

import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Protocol

from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from specdeck_gateway.services.git_ops import LogCb, ProgressCb
from specdeck_gateway.models import (
    JobKind,
    JobStatus,
    Project,
    ProvisioningJob,
    WorkspaceSource,
    WorkspaceStatus,
)


class ProvisioningError(Exception):
    """Base for provisioning failures."""


class ProjectNotFound(ProvisioningError):
    """No project row for the given id."""


class ActiveJobExists(ProvisioningError):
    """A running job already exists for this project (→ HTTP 409)."""


class FolderAlreadyLinked(ProvisioningError):
    """The folder is already linked to a different Project (→ HTTP 409, FR-015)."""


class Publisher(Protocol):
    """Anything that can fan a streamed-run event out to subscribers."""

    async def publish(self, channel: str, event: dict) -> None: ...


class CloneRunner(Protocol):
    """Runs the actual clone, reporting progress + raw log lines. Injected so the
    orchestrator is testable without git/network."""

    async def __call__(self, on_progress: ProgressCb, on_log: LogCb) -> None: ...


def channel_for(prefix: str, run_id: object) -> str:
    """Redis channel id for a streamed run.

    Convention: ``<prefix>:<run_id>`` — provisioning uses ``ws:provision:<job_id>``;
    agent-execution will use ``agent:thread:<thread_id>``. Generic on purpose.
    """
    return f"{prefix}:{run_id}"


async def reconcile_running_jobs(session: AsyncSession) -> int:
    """Flip every `running` job to `error` and fix its project's workspace status.

    Called once on startup (FR-019). A clone/init left mid-flight leaves a
    half-built workspace → `error`; a `reconnect` was on a pre-existing workspace
    → `broken`. Returns the number of jobs swept.
    """
    jobs = (
        await session.execute(
            select(ProvisioningJob).where(ProvisioningJob.status == JobStatus.running)
        )
    ).scalars().all()

    now = datetime.now(timezone.utc)
    for job in jobs:
        job.status = JobStatus.error
        job.ended_at = now
        job.message = "interrupted by gateway restart"
        project = await session.get(Project, job.project_id)
        if project is not None:
            project.workspace_status = (
                WorkspaceStatus.broken
                if job.kind == JobKind.reconnect
                else WorkspaceStatus.error
            )
            if project.active_job_id == job.id:
                project.active_job_id = None

    await session.commit()
    return len(jobs)


# ── Clone job lifecycle (US2) ─────────────────────────────────────────────────


async def create_clone_job(
    session: AsyncSession, *, project_id: str, remote_url: str, base_branch: str | None
) -> ProvisioningJob:
    """Open a running clone job + mark the workspace provisioning.

    The partial unique index guarantees ≤1 running job per project: a concurrent
    insert raises IntegrityError → ActiveJobExists (→ 409).
    """
    project = await session.get(Project, project_id)
    if project is None:
        raise ProjectNotFound(project_id)

    job = ProvisioningJob(project_id=project_id, kind=JobKind.clone, status=JobStatus.running)
    session.add(job)
    try:
        await session.flush()
    except IntegrityError as exc:
        await session.rollback()
        raise ActiveJobExists(project_id) from exc

    project.workspace_status = WorkspaceStatus.provisioning
    project.source = WorkspaceSource.clone
    project.remote_url = remote_url
    project.base_branch = base_branch
    project.rel_path = project_id
    project.active_job_id = job.id
    await session.commit()
    return job


async def link_existing(
    session: AsyncSession,
    *,
    project_id: str,
    rel_path: str,
    remote_url: str | None,
    base_branch: str | None,
) -> None:
    """Link a folder already present in the managed root (US4, synchronous).

    The git inspection (is-git / remote / init) is done by the caller; this only
    persists the workspace state → `ready`. The unique `rel_path` index enforces
    one-folder-↔-one-Project: a clash raises FolderAlreadyLinked (→ 409, FR-015).
    """
    project = await session.get(Project, project_id)
    if project is None:
        raise ProjectNotFound(project_id)

    clash = (
        await session.execute(
            select(Project).where(Project.rel_path == rel_path, Project.id != project_id)
        )
    ).scalar_one_or_none()
    if clash is not None:
        raise FolderAlreadyLinked(rel_path)

    project.workspace_status = WorkspaceStatus.ready
    project.source = WorkspaceSource.linked
    project.remote_url = remote_url
    project.base_branch = base_branch
    project.rel_path = rel_path
    project.active_job_id = None
    try:
        await session.commit()
    except IntegrityError as exc:  # backstop: concurrent link to the same folder
        await session.rollback()
        raise FolderAlreadyLinked(rel_path) from exc


async def finalize_success(session: AsyncSession, job_id: object) -> None:
    job = await session.get(ProvisioningJob, job_id)
    if job is None:
        return
    job.status = JobStatus.success
    job.progress = 100
    job.ended_at = datetime.now(timezone.utc)
    project = await session.get(Project, job.project_id)
    if project is not None:
        project.workspace_status = WorkspaceStatus.ready
        if project.active_job_id == job.id:
            project.active_job_id = None
    await session.commit()


async def finalize_failure(
    session: AsyncSession, job_id: object, message: str, *, cleanup_path: Path | None = None
) -> None:
    job = await session.get(ProvisioningJob, job_id)
    if job is None:
        return
    job.status = JobStatus.error
    job.message = message
    job.ended_at = datetime.now(timezone.utc)
    project = await session.get(Project, job.project_id)
    if project is not None:
        project.workspace_status = WorkspaceStatus.error
        if project.active_job_id == job.id:
            project.active_job_id = None
    await session.commit()
    # remove any half-built directory (FR-014)
    if cleanup_path is not None and Path(cleanup_path).exists():
        shutil.rmtree(cleanup_path, ignore_errors=True)


async def run_clone_job(
    session: AsyncSession,
    job_id: object,
    dest: Path,
    *,
    clone_runner: CloneRunner,
    publisher: Publisher,
) -> None:
    """Drive a clone: stream progress to Redis + persist snapshots, then finalize.

    Generic shape (snapshot persisted to DB, fine-grained ticks to Redis) is the
    streamed-run template agent-execution will reuse.
    """
    # Channel is scoped to the PROJECT, not the job: the SSE endpoint may connect
    # before the job row exists (it can't know the job_id yet), so a job-scoped
    # channel races and drops every event. project_id is stable + known to both ends.
    job0 = await session.get(ProvisioningJob, job_id)
    scope = job0.project_id if job0 is not None else job_id
    channel = channel_for("ws:provision", scope)

    async def on_progress(phase: str, pct: int) -> None:
        job = await session.get(ProvisioningJob, job_id)
        if job is not None:
            job.phase = phase
            job.progress = pct
            await session.commit()
        await publisher.publish(
            channel,
            {"job_id": str(job_id), "kind": "clone", "phase": phase, "progress": pct, "message": None},
        )

    async def on_log(line: str, transient: bool) -> None:
        # Raw git stderr line for the live terminal — ephemeral, not persisted.
        await publisher.publish(
            channel, {"job_id": str(job_id), "log": line, "transient": transient}
        )

    try:
        await clone_runner(on_progress, on_log)
    except Exception as exc:  # noqa: BLE001 — any clone failure → error state + cleanup
        await finalize_failure(session, job_id, str(exc), cleanup_path=dest)
        await publisher.publish(
            channel,
            {
                "job_id": str(job_id),
                "workspace_status": "error",
                "error": "clone_failed",
                "message": str(exc),
            },
        )
        return

    await finalize_success(session, job_id)
    await publisher.publish(
        channel, {"job_id": str(job_id), "workspace_status": "ready"}
    )

