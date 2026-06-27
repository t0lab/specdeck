"""Path safety (SC-004 / FR-007).

Every workspace path the gateway touches MUST resolve to a location strictly
inside the managed root. `resolve_in_root` follows symlinks (via `Path.resolve`)
so a symlink planted inside the root that points outside is rejected too.
"""

from __future__ import annotations

from pathlib import Path


class PathOutsideRoot(ValueError):
    """Raised when a candidate path escapes the managed root."""


def resolve_in_root(root: Path | str, candidate: Path | str) -> Path:
    """Resolve `candidate` (relative to `root`, or absolute) and assert it stays
    within `root`. Returns the fully-resolved absolute path.

    Raises `PathOutsideRoot` on any traversal, absolute escape, or out-of-root
    symlink target.
    """
    base = Path(root).resolve()
    candidate_path = Path(candidate)
    # Joining an absolute candidate discards `base` — which is exactly what we
    # want to detect: it will resolve outside the root and be rejected below.
    target = (base / candidate_path).resolve()
    assert_within_root(base, target)
    return target


def assert_within_root(root: Path | str, path: Path | str) -> None:
    base = Path(root).resolve()
    resolved = Path(path).resolve()
    if resolved != base and not resolved.is_relative_to(base):
        raise PathOutsideRoot(f"path {resolved} is outside managed root {base}")
