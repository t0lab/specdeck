"""Git operations as subprocesses — clone (US2), with progress parsing.

The GitHub token is supplied to `git` only via GIT_ASKPASS + environment, never
embedded in the remote URL or written to .git/config (SC-001). init/link land in
US3/US4.
"""

from __future__ import annotations

import asyncio
import inspect
import os
import re
import tempfile
from collections.abc import Callable
from pathlib import Path
from typing import Any

# Progress callback may be sync or async (awaited if it returns a coroutine).
ProgressCb = Callable[[str, int], Any]


class GitOpsError(Exception):
    """Base for git operation failures."""


class TargetNotEmpty(GitOpsError):
    """Destination exists and is not empty (FR-013)."""


class CloneFailed(GitOpsError):
    """`git clone` exited non-zero."""


class GitInitFailed(GitOpsError):
    """`git init` exited non-zero."""


async def _run_git(*args: str, cwd: Path | str | None = None) -> tuple[int, str]:
    """Run `git <args>` capturing stdout; returns (returncode, stdout-stripped)."""
    proc = await asyncio.create_subprocess_exec(
        "git",
        *args,
        cwd=str(cwd) if cwd is not None else None,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.DEVNULL,
    )
    out, _ = await proc.communicate()
    return proc.returncode or 0, out.decode(errors="replace").strip()


def is_repo_root(path: Path | str) -> bool:
    """True only if `path` is the ROOT of a git repo (owns a `.git`), FR-012.

    A subdirectory of a repo is NOT a root — distinguishing the two is what stops
    the picker from linking a folder nested inside another repository.
    """
    path = Path(path)
    return path.is_dir() and (path / ".git").exists()


def has_repo_children(path: Path | str) -> bool:
    """True if `path` directly contains at least one git repo (FR-012).

    Such a folder is a *container* (an org/grouping dir), not itself a workspace:
    `git init`-ing it would wrap the nested repos.
    """
    path = Path(path)
    if not path.is_dir():
        return False
    return any(c.is_dir() and (c / ".git").exists() for c in path.iterdir())


def enclosing_repo_root(path: Path | str, root: Path | str) -> Path | None:
    """The nearest ancestor of `path` (within `root`) that is a repo root, or None.

    Used to reject linking a folder that lives inside an existing repository —
    that folder belongs to the repo, not to a new Project.
    """
    p = Path(path).resolve()
    root = Path(root).resolve()
    for cur in p.parents:
        if (cur / ".git").exists():
            return cur
        if cur == root:
            break
    return None


async def detect_remote(path: Path | str) -> str | None:
    """Read `origin`'s fetch URL for the repo at `path`, or None if unset (FR-012)."""
    rc, out = await _run_git("-C", str(path), "remote", "get-url", "origin")
    return out or None if rc == 0 else None


async def detect_branch(path: Path | str) -> str | None:
    """Current branch name for the repo at `path`, or None (detached/unborn)."""
    rc, out = await _run_git("-C", str(path), "rev-parse", "--abbrev-ref", "HEAD")
    return out if rc == 0 and out and out != "HEAD" else None


async def git_init(path: Path | str, default_branch: str = "main") -> None:
    """Initialize a git repo in-place at `path` (US3/US4 link of a non-git folder).

    Existing files are preserved. Raises GitInitFailed on non-zero exit.
    """
    path = Path(path)
    path.mkdir(parents=True, exist_ok=True)
    rc, _ = await _run_git("-C", str(path), "init", "-b", default_branch)
    if rc != 0:
        raise GitInitFailed(f"git init exited {rc}")


# Coarse progress bands: each clone phase maps onto a slice of the 0..100 bar.
_PHASE_BANDS = [
    ("Counting objects", 0, 10),
    ("Compressing objects", 10, 25),
    ("Receiving objects", 25, 90),
    ("Resolving deltas", 90, 100),
]
_PCT_RE = re.compile(r"(\d+)%")


def parse_progress_line(line: str) -> tuple[str, int] | None:
    """Map one stderr line to (phase, overall_percent), or None if not progress."""
    line = line.strip()
    if not line:
        return None
    for name, lo, hi in _PHASE_BANDS:
        if name in line:
            m = _PCT_RE.search(line)
            if not m:
                return None
            pct = int(m.group(1))
            return name, lo + (hi - lo) * pct // 100
    return None


def _is_non_empty_dir(p: Path) -> bool:
    return p.exists() and any(p.iterdir())


def _write_askpass(directory: Path) -> Path:
    """GIT_ASKPASS helper that echoes the token from the environment.

    The token is read from $GH_TOKEN at call time — it is NOT baked into the
    script text, the args, or .git/config.
    """
    script = (
        "#!/bin/sh\n"
        'case "$1" in\n'
        '  Username*) echo "x-access-token" ;;\n'
        '  Password*) echo "$GH_TOKEN" ;;\n'
        "esac\n"
    )
    fd, path = tempfile.mkstemp(prefix="askpass-", suffix=".sh", dir=str(directory))
    os.close(fd)
    p = Path(path)
    p.write_text(script)
    p.chmod(0o700)
    return p


# on_log receives (line_text, transient): transient lines are `\r` progress
# updates that overwrite the previous line in a real terminal; permanent lines end
# in `\n`. The frontend uses the flag to replace-vs-append.
LogCb = Callable[[str, bool], Any]


async def _maybe_await(value: Any) -> None:
    if inspect.isawaitable(value):
        await value


async def _consume_output(
    stream: asyncio.StreamReader | None,
    on_progress: ProgressCb | None,
    on_log: LogCb | None,
) -> None:
    """Read git's stderr, splitting on `\\r`/`\\n`, and fan each line out to
    `on_progress` (parsed phase/percent) and `on_log` (raw text + transient flag).

    `\\r\\n` is treated as one permanent newline; a lone `\\r` marks a transient
    progress update. A trailing `\\r` at a chunk boundary is held back in case the
    next chunk starts with `\\n`.
    """
    if stream is None:
        return
    if on_progress is None and on_log is None:
        while await stream.read(4096):  # drain so the pipe never blocks the child
            pass
        return

    async def emit(seg: bytes, transient: bool) -> None:
        text = seg.decode(errors="replace").strip()
        if not text:
            return
        if on_log is not None:
            await _maybe_await(on_log(text, transient))
        if on_progress is not None:
            res = parse_progress_line(text)
            if res:
                await _maybe_await(on_progress(*res))

    buf = b""
    while True:
        chunk = await stream.read(256)
        if not chunk:
            break
        buf += chunk
        while True:
            m = re.search(rb"[\r\n]", buf)
            if m is None:
                break
            i = m.start()
            ch = buf[i : i + 1]
            # A `\r` as the very last byte may be the start of `\r\n` — wait for more.
            if ch == b"\r" and i == len(buf) - 1:
                break
            seg = buf[:i]
            if ch == b"\r" and buf[i + 1 : i + 2] == b"\n":
                buf = buf[i + 2 :]
                await emit(seg, False)
            elif ch == b"\r":
                buf = buf[i + 1 :]
                await emit(seg, True)
            else:  # \n
                buf = buf[i + 1 :]
                await emit(seg, False)
    if buf:
        await emit(buf, False)


async def clone(
    remote: str,
    dest: Path | str,
    branch: str | None = None,
    token: str | None = None,
    on_progress: ProgressCb | None = None,
    on_log: LogCb | None = None,
) -> None:
    """Clone `remote` into `dest` (which must not be a non-empty dir).

    Raises TargetNotEmpty or CloneFailed. The caller owns cleanup on failure.
    """
    dest = Path(dest)
    if _is_non_empty_dir(dest):
        raise TargetNotEmpty(str(dest))
    dest.parent.mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    askpass: Path | None = None
    if token:
        askpass = _write_askpass(dest.parent)
        env["GIT_ASKPASS"] = str(askpass)
        env["GH_TOKEN"] = token

    args = ["git", "clone", "--progress"]
    if branch:
        args += ["--branch", branch]
    args += [str(remote), str(dest)]

    proc = await asyncio.create_subprocess_exec(
        *args,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.PIPE,
        env=env,
    )
    try:
        await _consume_output(proc.stderr, on_progress, on_log)
        rc = await proc.wait()
    finally:
        if askpass is not None:
            askpass.unlink(missing_ok=True)
    if rc != 0:
        raise CloneFailed(f"git clone exited {rc}")
