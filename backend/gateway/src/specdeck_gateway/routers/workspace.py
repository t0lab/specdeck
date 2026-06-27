"""`/api/projects/{id}/workspace*` — provision (clone, US2), status, cancel, SSE.

The clone runs as a background task that streams progress to Redis; the SSE
endpoint relays it via the generic `sse_relay`. init/link arrive in US3/US4.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from specdeck_gateway.config import get_settings
from specdeck_gateway.core.crypto import cipher_from_settings
from specdeck_gateway.core.pathsafe import PathOutsideRoot, resolve_in_root
from specdeck_gateway.db import get_session, get_sessionmaker
from specdeck_gateway.models import (
    ConnectionStatus,
    GitConnection,
    GitProvider,
    JobStatus,
    Project,
    ProvisioningJob,
    WorkspaceStatus,
)
from specdeck_gateway.services import git_ops
from specdeck_gateway.services.provisioning import (
    ActiveJobExists,
    FolderAlreadyLinked,
    channel_for,
    create_clone_job,
    link_existing,
    run_clone_job,
)
from specdeck_gateway.services.streaming import RedisPublisher, sse_relay

router = APIRouter(tags=["workspace"])

_publisher: RedisPublisher | None = None


def _get_publisher() -> RedisPublisher:
    global _publisher
    if _publisher is None:
        _publisher = RedisPublisher(get_settings().redis_url)
    return _publisher


class CreateWorkspaceBody(BaseModel):
    mode: Literal["clone", "init", "link"]
    remote_url: str | None = None
    base_branch: str | None = None
    default_branch: str | None = None
    rel_path: str | None = None
    name: str | None = None


def _err(code: str, message: str, status: int) -> JSONResponse:
    return JSONResponse({"error": code, "message": message}, status_code=status)


def _job_dict(job: ProvisioningJob | None) -> dict | None:
    if job is None:
        return None
    return {
        "id": str(job.id),
        "kind": job.kind.value,
        "status": job.status.value,
        "phase": job.phase,
        "progress": job.progress,
        "message": job.message,
    }


async def _workspace_state(session: AsyncSession, project_id: str) -> dict | None:
    project = await session.get(Project, project_id)
    if project is None:
        return None
    job = (
        await session.get(ProvisioningJob, project.active_job_id)
        if project.active_job_id
        else None
    )
    return {
        "status": project.workspace_status.value,
        "source": project.source.value if project.source else None,
        "remote_url": project.remote_url,
        "base_branch": project.base_branch,
        "rel_path": project.rel_path,
        "latest_job": _job_dict(job),
    }


async def _ensure_project(session: AsyncSession, project_id: str, name: str | None) -> None:
    if await session.get(Project, project_id) is None:
        session.add(Project(id=project_id, name=name or project_id))
        await session.commit()


async def _github_token(session: AsyncSession) -> str | None:
    conn = (
        await session.execute(
            select(GitConnection).where(GitConnection.provider == GitProvider.github)
        )
    ).scalar_one_or_none()
    if conn is None or conn.status != ConnectionStatus.active:
        return None
    return cipher_from_settings().decrypt(conn.token_ciphertext)


async def _run_clone_bg(job_id: object, remote_url: str, branch: str | None, dest) -> None:
    async with get_sessionmaker()() as session:
        token = await _github_token(session)

        async def runner(on_progress: git_ops.ProgressCb, on_log: git_ops.LogCb) -> None:
            await git_ops.clone(
                remote_url, dest, branch=branch, token=token, on_progress=on_progress, on_log=on_log
            )

        await run_clone_job(session, job_id, dest, clone_runner=runner, publisher=_get_publisher())


@router.post("/api/projects/{project_id}/workspace", status_code=202, response_model=None)
async def create_workspace(
    project_id: str,
    body: CreateWorkspaceBody,
    session: AsyncSession = Depends(get_session),
):
    root = get_settings().workspace_root

    # link (US4) — synchronous: inspect an existing folder in the managed root,
    # auto-detect its remote (or `git init` a non-git folder), then mark `ready`.
    if body.mode == "link":
        rel_path = (body.rel_path or project_id).strip("/")
        try:
            folder = resolve_in_root(root, rel_path)
        except PathOutsideRoot:
            return _err("path_outside_root", "Resolved path escapes the managed root.", 400)
        if not folder.is_dir():
            return _err("invalid_request", "Folder does not exist in the managed root.", 400)

        # A folder nested inside another repo belongs to that repo — link its root.
        if git_ops.enclosing_repo_root(folder, root) is not None:
            return _err(
                "folder_inside_repo",
                "This folder is inside another repository — link the repository root instead.",
                400,
            )

        if git_ops.is_repo_root(folder):
            remote_url = await git_ops.detect_remote(folder)
            base_branch = await git_ops.detect_branch(folder)
        elif git_ops.has_repo_children(folder):
            # A container of repos, not a workspace — `git init` would wrap them.
            return _err(
                "folder_has_repos",
                "This folder contains repositories — open it and link one of them.",
                400,
            )
        else:
            await git_ops.git_init(folder)
            remote_url, base_branch = None, await git_ops.detect_branch(folder)

        await _ensure_project(session, project_id, body.name)
        try:
            await link_existing(
                session,
                project_id=project_id,
                rel_path=rel_path,
                remote_url=remote_url,
                base_branch=base_branch,
            )
        except FolderAlreadyLinked:
            return _err("folder_already_linked", "This folder is already linked to another Project.", 409)
        return JSONResponse(
            {"workspace": await _workspace_state(session, project_id), "job_id": None},
            status_code=200,
        )

    try:
        dest = resolve_in_root(root, project_id)
    except PathOutsideRoot:
        return _err("path_outside_root", "Resolved path escapes the managed root.", 400)

    if body.mode != "clone":
        return _err("unsupported_mode", f"mode '{body.mode}' lands in a later story.", 400)
    if not body.remote_url:
        return _err("invalid_request", "remote_url is required for clone.", 400)
    if dest.exists() and any(dest.iterdir()):
        return _err("target_not_empty", "Target directory already has contents.", 409)

    await _ensure_project(session, project_id, body.name)
    try:
        job = await create_clone_job(
            session, project_id=project_id, remote_url=body.remote_url, base_branch=body.base_branch
        )
    except ActiveJobExists:
        return _err("active_job_exists", "A provisioning job is already running.", 409)

    asyncio.create_task(_run_clone_bg(job.id, body.remote_url, body.base_branch, dest))
    return {"workspace": await _workspace_state(session, project_id), "job_id": str(job.id)}


@router.get("/api/projects/{project_id}/workspace", response_model=None)
async def get_workspace(
    project_id: str, session: AsyncSession = Depends(get_session)
) -> JSONResponse | dict:
    state = await _workspace_state(session, project_id)
    if state is None:
        return {"status": "unlinked", "source": None, "remote_url": None, "base_branch": None,
                "rel_path": None, "latest_job": None}
    return state


@router.get("/api/workspaces/browse", response_model=None)
async def browse_workspaces(path: str = "") -> JSONResponse | dict:
    """List direct child directories inside the managed root for the folder picker.

    Each entry is annotated with `is_git` + auto-detected `remote_url` (FR-008).
    `path` is relative to the root (empty = root); anything escaping the root →
    `400 path_outside_root` (SC-004).
    """
    root = get_settings().workspace_root
    rel = path.strip("/")
    try:
        base = resolve_in_root(root, rel)
    except PathOutsideRoot:
        return _err("path_outside_root", "Resolved path escapes the managed root.", 400)
    if not base.is_dir():
        return {"path": rel, "dirs": []}

    dirs = []
    for child in sorted(p for p in base.iterdir() if p.is_dir()):
        child_rel = f"{rel}/{child.name}" if rel else child.name
        is_git = git_ops.is_repo_root(child)
        # A repo is a selectable LEAF (link as-is, no drilling in). A plain folder
        # holding repos is a browse-only container; a plain leaf is selectable
        # (git init on link) and browsable.
        if is_git:
            selectable, can_enter = True, False
            remote_url = await git_ops.detect_remote(child)
        else:
            selectable, can_enter = not git_ops.has_repo_children(child), True
            remote_url = None
        dirs.append(
            {
                "name": child.name,
                "rel_path": child_rel,
                "is_git": is_git,
                "remote_url": remote_url,
                "selectable": selectable,
                "can_enter": can_enter,
            }
        )
    return {"path": rel, "dirs": dirs}


@router.post("/api/projects/{project_id}/workspace/cancel", response_model=None)
async def cancel_workspace(
    project_id: str, session: AsyncSession = Depends(get_session)
) -> JSONResponse | dict:
    project = await session.get(Project, project_id)
    if project is None or project.active_job_id is None:
        return _err("no_active_job", "No running job to cancel.", 409)
    job = await session.get(ProvisioningJob, project.active_job_id)
    if job is not None and job.status == JobStatus.running:
        job.status = JobStatus.cancelled
        job.ended_at = datetime.now(timezone.utc)
        job.message = "cancelled by user"
    project.workspace_status = WorkspaceStatus.unlinked
    project.active_job_id = None
    await session.commit()
    # best-effort cleanup of any half-built directory
    try:
        dest = resolve_in_root(get_settings().workspace_root, project_id)
        if dest.exists():
            import shutil

            shutil.rmtree(dest, ignore_errors=True)
    except PathOutsideRoot:
        pass
    return {"status": "cancelled"}


@router.get("/api/projects/{project_id}/workspace/events")
async def workspace_events(project_id: str) -> EventSourceResponse:
    async def snapshot_loader() -> dict:
        async with get_sessionmaker()() as session:
            project = await session.get(Project, project_id)
            if project is None:
                return {"status": "unlinked", "job": None}
            job = (
                await session.get(ProvisioningJob, project.active_job_id)
                if project.active_job_id
                else None
            )
            return {"status": project.workspace_status.value, "job": _job_dict(job)}

    # Project-scoped channel (matches run_clone_job): stable + known before the
    # job exists, so connecting early never lands on the wrong channel.
    channel = channel_for("ws:provision", project_id)
    return EventSourceResponse(
        sse_relay(get_settings().redis_url, channel, snapshot_loader)
    )
