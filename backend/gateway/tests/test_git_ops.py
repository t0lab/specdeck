"""T025 — clone via subprocess + GIT_ASKPASS (SC-001/SC-005, FR-013).

Uses a local bare repo as the remote (no network). Asserts the clone produces a
valid git repo with HEAD, refuses a non-empty target, and never writes the token
into .git/config.
"""

from __future__ import annotations

import subprocess
from pathlib import Path

import pytest

from specdeck_gateway.services.git_ops import TargetNotEmpty, clone


def _git(*args: str, cwd: Path) -> None:
    subprocess.run(
        ["git", "-c", "user.email=t@t", "-c", "user.name=tester", *args],
        cwd=cwd,
        check=True,
        capture_output=True,
    )


@pytest.fixture
def bare_remote(tmp_path: Path) -> Path:
    src = tmp_path / "src"
    src.mkdir()
    _git("init", "-b", "main", cwd=src)
    (src / "README.md").write_text("hello\n")
    _git("add", ".", cwd=src)
    _git("commit", "-m", "init", cwd=src)
    bare = tmp_path / "remote.git"
    subprocess.run(["git", "clone", "--bare", str(src), str(bare)], check=True, capture_output=True)
    return bare


async def test_clone_local_repo_is_valid_git_with_head(bare_remote: Path, workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    dest = workspace_root / "proj"
    await clone(str(bare_remote), dest, branch="main")

    assert (dest / ".git").is_dir()
    assert (dest / "README.md").read_text() == "hello\n"
    head = subprocess.run(
        ["git", "-C", str(dest), "rev-parse", "--abbrev-ref", "HEAD"],
        capture_output=True,
        text=True,
        check=True,
    )
    assert head.stdout.strip() == "main"


async def test_clone_rejects_non_empty_target(bare_remote: Path, workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    dest = workspace_root / "proj"
    dest.mkdir()
    (dest / "stray.txt").write_text("x")
    with pytest.raises(TargetNotEmpty):
        await clone(str(bare_remote), dest, branch="main")


async def test_clone_never_writes_token_to_git_config(bare_remote: Path, workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    dest = workspace_root / "proj"
    # local remote ignores credentials, but the token must never be persisted.
    await clone(str(bare_remote), dest, branch="main", token="gho_supersecret")
    config = (dest / ".git" / "config").read_text()
    assert "gho_supersecret" not in config
    assert "x-access-token" not in config


async def test_clone_streams_raw_log_lines(bare_remote: Path, workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    dest = workspace_root / "proj"
    lines: list[tuple[str, bool]] = []
    await clone(
        str(bare_remote),
        dest,
        branch="main",
        on_log=lambda text, transient: lines.append((text, transient)),
    )
    # `git clone --progress` always announces the destination on stderr.
    assert any("Cloning into" in text for text, _ in lines)
    for text, transient in lines:
        assert isinstance(text, str) and text.strip()
        assert isinstance(transient, bool)


async def test_clone_invokes_progress_callback_signature(bare_remote: Path, workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    dest = workspace_root / "proj"
    seen: list[tuple[str, int]] = []
    await clone(str(bare_remote), dest, branch="main", on_progress=lambda ph, pct: seen.append((ph, pct)))
    # A tiny local clone may emit few/no percent lines; we only require that any
    # emitted progress is well-formed (phase str, 0..100).
    for phase, pct in seen:
        assert isinstance(phase, str) and 0 <= pct <= 100
