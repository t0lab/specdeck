"""T006 — path-safety (SC-004). All workspace paths MUST resolve within the root."""

from __future__ import annotations

from pathlib import Path

import pytest

from specdeck_gateway.core.pathsafe import PathOutsideRoot, resolve_in_root


def test_accepts_simple_relative_path(workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    resolved = resolve_in_root(workspace_root, "my-project")
    assert resolved == (workspace_root.resolve() / "my-project")
    assert resolved.is_relative_to(workspace_root.resolve())


def test_accepts_nested_relative_path(workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    resolved = resolve_in_root(workspace_root, "a/b/c")
    assert resolved.is_relative_to(workspace_root.resolve())


def test_rejects_dotdot_traversal(workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    with pytest.raises(PathOutsideRoot):
        resolve_in_root(workspace_root, "../escape")


def test_rejects_deep_dotdot_traversal(workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    with pytest.raises(PathOutsideRoot):
        resolve_in_root(workspace_root, "a/../../etc/passwd")


def test_rejects_absolute_path_outside_root(workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    with pytest.raises(PathOutsideRoot):
        resolve_in_root(workspace_root, "/etc/passwd")


def test_rejects_symlink_pointing_outside_root(workspace_root: Path, tmp_path: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    outside = tmp_path / "outside"
    outside.mkdir()
    link = workspace_root / "sneaky"
    link.symlink_to(outside)
    with pytest.raises(PathOutsideRoot):
        resolve_in_root(workspace_root, "sneaky/secret.txt")


def test_empty_path_resolves_to_root(workspace_root: Path) -> None:
    workspace_root.mkdir(parents=True, exist_ok=True)
    assert resolve_in_root(workspace_root, "") == workspace_root.resolve()
