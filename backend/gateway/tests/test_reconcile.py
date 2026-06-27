"""T014 — reconcile-on-startup (SC-006, FR-019).

A gateway restart must not leave jobs stuck `running` / workspaces stuck
`provisioning`. The startup sweep flips them to a terminal/broken state.
"""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import select

from specdeck_gateway.models import (
    JobKind,
    JobStatus,
    Project,
    ProvisioningJob,
    WorkspaceSource,
    WorkspaceStatus,
)
from specdeck_gateway.services.provisioning import channel_for, reconcile_running_jobs


async def _seed(session, *, kind: JobKind, status: WorkspaceStatus) -> tuple[str, uuid.UUID]:
    job_id = uuid.uuid4()
    project = Project(
        id=f"proj-{kind.value}",
        name="P",
        rel_path=f"proj-{kind.value}",
        source=WorkspaceSource.clone,
        workspace_status=status,
        active_job_id=job_id,
    )
    job = ProvisioningJob(id=job_id, project_id=project.id, kind=kind, status=JobStatus.running)
    session.add_all([project, job])
    await session.commit()
    return project.id, job_id


async def test_clone_job_reconciled_to_error(session) -> None:
    project_id, job_id = await _seed(
        session, kind=JobKind.clone, status=WorkspaceStatus.provisioning
    )
    n = await reconcile_running_jobs(session)
    assert n == 1

    job = await session.get(ProvisioningJob, job_id)
    project = await session.get(Project, project_id)
    assert job.status == JobStatus.error
    assert job.ended_at is not None
    assert project.workspace_status == WorkspaceStatus.error
    assert project.active_job_id is None


async def test_reconnect_job_reconciled_to_broken(session) -> None:
    project_id, _ = await _seed(
        session, kind=JobKind.reconnect, status=WorkspaceStatus.provisioning
    )
    await reconcile_running_jobs(session)
    project = await session.get(Project, project_id)
    # A reconnect failing mid-flight leaves a previously-existing workspace broken.
    assert project.workspace_status == WorkspaceStatus.broken


async def test_no_running_jobs_is_noop(session) -> None:
    assert await reconcile_running_jobs(session) == 0
    # idempotent: a second sweep also finds nothing.
    assert await reconcile_running_jobs(session) == 0


async def test_only_running_jobs_are_swept(session) -> None:
    project = Project(id="done-proj", name="P", workspace_status=WorkspaceStatus.ready)
    job = ProvisioningJob(
        project_id="done-proj", kind=JobKind.clone, status=JobStatus.success
    )
    session.add_all([project, job])
    await session.commit()

    assert await reconcile_running_jobs(session) == 0
    refreshed = (await session.execute(select(ProvisioningJob))).scalars().all()
    assert all(j.status == JobStatus.success for j in refreshed)


def test_channel_for_convention() -> None:
    jid = uuid.uuid4()
    assert channel_for("ws:provision", jid) == f"ws:provision:{jid}"
    assert channel_for("agent:thread", "abc") == "agent:thread:abc"
