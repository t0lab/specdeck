"""T040 — link an existing folder inside the managed root (FR-012/FR-015).

Link is synchronous (no streaming): a git folder with a remote auto-detects +
prefills the remote and lands `ready`; a non-git folder is `git init`-ed in place
and lands `ready`. A folder already linked to another Project → `409
folder_already_linked` (one folder ↔ one Project). A `rel_path` escaping the
managed root → `400 path_outside_root`.
"""

from __future__ import annotations

import subprocess
from pathlib import Path

from sqlalchemy import select

from specdeck_gateway.models import Project, WorkspaceSource, WorkspaceStatus


def _git(*args: str, cwd: Path) -> None:
    subprocess.run(
        ["git", "-c", "user.email=t@t", "-c", "user.name=tester", *args],
        cwd=cwd,
        check=True,
        capture_output=True,
    )


def _make_git_dir(path: Path, remote: str | None) -> None:
    path.mkdir(parents=True)
    _git("init", "-b", "main", cwd=path)
    if remote:
        _git("remote", "add", "origin", remote, cwd=path)


async def test_link_git_folder_autodetects_remote_and_is_ready(
    client, session, workspace_root: Path
) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    _make_git_dir(workspace_root / "myrepo", "https://github.com/octocat/myrepo.git")

    r = await client.post(
        "/api/projects/proj-a/workspace",
        json={"mode": "link", "rel_path": "myrepo", "name": "Alpha"},
    )
    assert r.status_code == 200
    ws = r.json()["workspace"]
    assert ws["status"] == "ready"
    assert ws["source"] == "linked"
    assert ws["remote_url"] == "https://github.com/octocat/myrepo.git"
    assert ws["rel_path"] == "myrepo"

    project = (await session.execute(select(Project).where(Project.id == "proj-a"))).scalar_one()
    assert project.workspace_status == WorkspaceStatus.ready
    assert project.source == WorkspaceSource.linked


async def test_link_non_git_folder_inits_and_is_ready(
    client, session, workspace_root: Path
) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    folder = workspace_root / "plain"
    folder.mkdir()
    (folder / "notes.md").write_text("hi\n")

    r = await client.post(
        "/api/projects/proj-b/workspace",
        json={"mode": "link", "rel_path": "plain"},
    )
    assert r.status_code == 200
    ws = r.json()["workspace"]
    assert ws["status"] == "ready"
    assert ws["source"] == "linked"
    assert ws["remote_url"] is None
    # the folder is now a git repo (init in place), file preserved
    assert (folder / ".git").is_dir()
    assert (folder / "notes.md").read_text() == "hi\n"


async def test_link_folder_already_linked_is_409(client, workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    _make_git_dir(workspace_root / "shared", "https://github.com/octocat/shared.git")

    first = await client.post(
        "/api/projects/owner-one/workspace",
        json={"mode": "link", "rel_path": "shared"},
    )
    assert first.status_code == 200

    second = await client.post(
        "/api/projects/owner-two/workspace",
        json={"mode": "link", "rel_path": "shared"},
    )
    assert second.status_code == 409
    assert second.json()["error"] == "folder_already_linked"


async def test_link_rejects_path_outside_root(client, workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    r = await client.post(
        "/api/projects/proj-c/workspace",
        json={"mode": "link", "rel_path": "../../etc"},
    )
    assert r.status_code == 400
    assert r.json()["error"] == "path_outside_root"


async def test_link_rejects_folder_inside_a_repo(client, workspace_root: Path) -> None:
    """A subdirectory of a repo belongs to that repo — link the repo root instead."""
    workspace_root.mkdir(parents=True, exist_ok=True)
    _make_git_dir(workspace_root / "repo", "https://github.com/octocat/repo.git")
    (workspace_root / "repo" / "src").mkdir()

    r = await client.post(
        "/api/projects/proj-d/workspace",
        json={"mode": "link", "rel_path": "repo/src"},
    )
    assert r.status_code == 400
    assert r.json()["error"] == "folder_inside_repo"


async def test_link_rejects_container_folder(client, workspace_root: Path) -> None:
    """A plain folder that holds repos is a container, not a workspace."""
    workspace_root.mkdir(parents=True, exist_ok=True)
    _make_git_dir(workspace_root / "org" / "inner", "https://github.com/octocat/inner.git")

    r = await client.post(
        "/api/projects/proj-e/workspace",
        json={"mode": "link", "rel_path": "org"},
    )
    assert r.status_code == 400
    assert r.json()["error"] == "folder_has_repos"
