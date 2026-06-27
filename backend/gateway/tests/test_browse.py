"""T039 — browse managed root for the folder picker (FR-008, SC-004).

Lists ONLY direct child directories inside the managed root, each annotated with
`is_git` + `remote_url` + `selectable`/`can_enter`. A git repo is a LEAF
(selectable, can't drill in — its subfolders belong to it). A plain folder that
contains repos is a container (browse-only, not selectable); a plain leaf folder
is selectable (it gets `git init` on link). A `path` that escapes the root →
`400 path_outside_root`. Plain files are never listed.
"""

from __future__ import annotations

import subprocess
from pathlib import Path


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


async def test_browse_lists_direct_dirs_with_git_metadata(client, workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    (workspace_root / "plain").mkdir()
    _make_git_dir(workspace_root / "repo", "https://github.com/octocat/repo.git")
    (workspace_root / "loose.txt").write_text("not a dir")

    r = await client.get("/api/workspaces/browse")
    assert r.status_code == 200
    body = r.json()
    assert body["path"] == ""
    by_name = {d["name"]: d for d in body["dirs"]}
    # only directories — the loose file is excluded
    assert set(by_name) == {"plain", "repo"}

    # a plain leaf folder: selectable (git init on link) + browsable
    assert by_name["plain"]["is_git"] is False
    assert by_name["plain"]["remote_url"] is None
    assert by_name["plain"]["rel_path"] == "plain"
    assert by_name["plain"]["selectable"] is True
    assert by_name["plain"]["can_enter"] is True

    # a git repo: selectable (link as-is) but a LEAF — you can't drill into it
    assert by_name["repo"]["is_git"] is True
    assert by_name["repo"]["remote_url"] == "https://github.com/octocat/repo.git"
    assert by_name["repo"]["rel_path"] == "repo"
    assert by_name["repo"]["selectable"] is True
    assert by_name["repo"]["can_enter"] is False


async def test_browse_container_folder_is_browse_only(client, workspace_root: Path) -> None:
    """A plain folder that holds git repos is a container: browsable, not selectable
    (linking it would `git init` a repo wrapping the nested ones)."""
    workspace_root.mkdir(parents=True, exist_ok=True)
    _make_git_dir(workspace_root / "org" / "inner", "https://github.com/octocat/inner.git")

    r = await client.get("/api/workspaces/browse")
    assert r.status_code == 200
    by_name = {d["name"]: d for d in r.json()["dirs"]}
    assert by_name["org"]["is_git"] is False
    assert by_name["org"]["selectable"] is False
    assert by_name["org"]["can_enter"] is True


async def test_browse_subdir_path_is_relative(client, workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    (workspace_root / "team" / "alpha").mkdir(parents=True)
    (workspace_root / "team" / "beta").mkdir()

    r = await client.get("/api/workspaces/browse", params={"path": "team"})
    assert r.status_code == 200
    body = r.json()
    assert body["path"] == "team"
    assert {d["name"] for d in body["dirs"]} == {"alpha", "beta"}
    assert {d["rel_path"] for d in body["dirs"]} == {"team/alpha", "team/beta"}


async def test_browse_rejects_path_outside_root(client, workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    r = await client.get("/api/workspaces/browse", params={"path": "../../etc"})
    assert r.status_code == 400
    assert r.json()["error"] == "path_outside_root"
