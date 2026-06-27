"""T029 — workspace router validation paths (FR-007/FR-013).

Covers the non-streaming branches (the full clone + SSE relay are exercised
end-to-end by quickstart.md). These paths return before any background task or
Redis use, so they're deterministic.
"""

from __future__ import annotations

from pathlib import Path


async def test_get_workspace_defaults_to_unlinked(client) -> None:
    r = await client.get("/api/projects/ghost/workspace")
    assert r.status_code == 200
    assert r.json()["status"] == "unlinked"


async def test_create_workspace_unsupported_mode(client) -> None:
    r = await client.post("/api/projects/demo/workspace", json={"mode": "init"})
    assert r.status_code == 400
    assert r.json()["error"] == "unsupported_mode"


async def test_clone_requires_remote_url(client) -> None:
    r = await client.post("/api/projects/demo/workspace", json={"mode": "clone"})
    assert r.status_code == 400
    assert r.json()["error"] == "invalid_request"


async def test_clone_rejects_non_empty_target(client, workspace_root: Path) -> None:
    dest = workspace_root / "demo"
    dest.mkdir(parents=True)
    (dest / "stray.txt").write_text("x")
    r = await client.post(
        "/api/projects/demo/workspace",
        json={"mode": "clone", "remote_url": "https://github.com/o/r.git", "base_branch": "main"},
    )
    assert r.status_code == 409
    assert r.json()["error"] == "target_not_empty"


async def test_cancel_without_active_job_is_409(client) -> None:
    r = await client.post("/api/projects/demo/workspace/cancel")
    assert r.status_code == 409
    assert r.json()["error"] == "no_active_job"
