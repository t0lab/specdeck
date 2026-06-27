"""T026 — provisioning job lifecycle + concurrency (FR-014, SC-003).

A clone job moves the workspace provisioning→ready on success; on failure the
half-built dir is cleaned and the workspace goes error. The partial unique index
allows at most one running job per project.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from specdeck_gateway.models import JobStatus, Project, ProvisioningJob, WorkspaceStatus
from specdeck_gateway.services.provisioning import (
    ActiveJobExists,
    create_clone_job,
    run_clone_job,
)


class FakePublisher:
    def __init__(self) -> None:
        self.events: list[tuple[str, dict]] = []

    async def publish(self, channel: str, event: dict) -> None:
        self.events.append((channel, event))


async def _make_project(session, pid: str = "demo") -> Project:
    project = Project(id=pid, name="Demo")
    session.add(project)
    await session.commit()
    return project


async def test_create_clone_job_sets_provisioning(session) -> None:
    await _make_project(session)
    job = await create_clone_job(
        session, project_id="demo", remote_url="https://github.com/o/r.git", base_branch="main"
    )
    project = await session.get(Project, "demo")
    assert job.status == JobStatus.running
    assert project.workspace_status == WorkspaceStatus.provisioning
    assert project.active_job_id == job.id
    assert project.remote_url == "https://github.com/o/r.git"
    assert project.rel_path == "demo"


async def test_second_running_job_rejected(session) -> None:
    await _make_project(session)
    await create_clone_job(session, project_id="demo", remote_url="u", base_branch="main")
    with pytest.raises(ActiveJobExists):
        await create_clone_job(session, project_id="demo", remote_url="u", base_branch="main")


async def test_run_clone_job_success_marks_ready(session, tmp_path: Path) -> None:
    await _make_project(session)
    job = await create_clone_job(session, project_id="demo", remote_url="u", base_branch="main")
    dest = tmp_path / "demo"
    pub = FakePublisher()

    async def fake_clone(on_progress, on_log):
        await on_log("Cloning into 'demo'...", False)
        await on_progress("Receiving objects", 57)

    await run_clone_job(session, job.id, dest, clone_runner=fake_clone, publisher=pub)

    await session.refresh(job)
    project = await session.get(Project, "demo")
    assert job.status == JobStatus.success
    assert job.progress == 100
    assert project.workspace_status == WorkspaceStatus.ready
    assert project.active_job_id is None
    states = [e["progress"] for _, e in pub.events if "progress" in e]
    assert 57 in states
    assert any(e.get("workspace_status") == "ready" for _, e in pub.events)
    # raw log line is fanned out for the live terminal
    assert any(e.get("log") == "Cloning into 'demo'..." for _, e in pub.events)


async def test_run_clone_job_failure_cleans_up_and_errors(session, tmp_path: Path) -> None:
    await _make_project(session)
    job = await create_clone_job(session, project_id="demo", remote_url="u", base_branch="main")
    dest = tmp_path / "demo"
    dest.mkdir()
    (dest / "half.txt").write_text("partial")
    pub = FakePublisher()

    async def boom(on_progress, on_log):
        raise RuntimeError("clone exploded")

    await run_clone_job(session, job.id, dest, clone_runner=boom, publisher=pub)

    await session.refresh(job)
    project = await session.get(Project, "demo")
    assert job.status == JobStatus.error
    assert "clone exploded" in (job.message or "")
    assert project.workspace_status == WorkspaceStatus.error
    assert project.active_job_id is None
    assert not dest.exists()  # half-built dir removed (FR-014)
    assert any(e.get("error") for _, e in pub.events)
