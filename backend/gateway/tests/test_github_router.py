"""T017 — GitHub status/repos/disconnect (SC-001, FR-004/FR-005).

The access token MUST NEVER appear in any response. repos returns the documented
shape; an expired/revoked token surfaces `github_reauth_required` (401).
"""

from __future__ import annotations

import httpx
import respx
from sqlalchemy import select

from specdeck_gateway.core.crypto import TokenCipher
from specdeck_gateway.models import ConnectionStatus, GitConnection, GitProvider
from tests.conftest import TEST_FERNET_KEY

BASE = "/api/integrations/github"


async def _seed_connection(session, token: str = "gho_live") -> None:
    session.add(
        GitConnection(
            provider=GitProvider.github,
            account_login="octocat",
            token_ciphertext=TokenCipher(TEST_FERNET_KEY).encrypt(token),
            scope="repo,read:user",
            status=ConnectionStatus.active,
        )
    )
    await session.commit()


async def test_status_disconnected(client) -> None:
    r = await client.get(f"{BASE}/status")
    assert r.status_code == 200
    assert r.json() == {"connected": False, "github_login": None, "scope": None, "status": None}


async def test_status_connected_never_leaks_token(client, session) -> None:
    await _seed_connection(session, token="gho_topsecret")
    r = await client.get(f"{BASE}/status")
    assert r.status_code == 200
    body = r.json()
    assert body["connected"] is True
    assert body["github_login"] == "octocat"
    assert body["status"] == "active"
    assert "gho_topsecret" not in r.text  # SC-001
    assert "token" not in body


@respx.mock
async def test_repos_shape_and_filter_no_token_leak(client, session) -> None:
    await _seed_connection(session, token="gho_topsecret")
    respx.get("https://api.github.com/user/repos").mock(
        return_value=httpx.Response(
            200,
            json=[
                {"full_name": "octocat/spec-deck", "private": True, "default_branch": "main"},
                {"full_name": "octocat/other", "private": False, "default_branch": "master"},
            ],
        )
    )
    r = await client.get(f"{BASE}/repos?query=spec")
    assert r.status_code == 200
    body = r.json()
    assert [x["full_name"] for x in body["repos"]] == ["octocat/spec-deck"]
    assert body["repos"][0] == {
        "full_name": "octocat/spec-deck",
        "private": True,
        "default_branch": "main",
    }
    assert "gho_topsecret" not in r.text  # SC-001


@respx.mock
async def test_repos_401_marks_reauth(client, session) -> None:
    await _seed_connection(session)
    respx.get("https://api.github.com/user/repos").mock(return_value=httpx.Response(401))
    r = await client.get(f"{BASE}/repos")
    assert r.status_code == 401
    assert r.json()["error"] == "github_reauth_required"
    # connection flips to expired so the UI can prompt re-auth
    conn = (await session.execute(select(GitConnection))).scalar_one()
    assert conn.status == ConnectionStatus.expired


async def test_disconnect_removes_connection(client, session) -> None:
    await _seed_connection(session)
    r = await client.delete(f"{BASE}/connection")
    assert r.status_code == 204
    rows = (await session.execute(select(GitConnection))).scalars().all()
    assert rows == []


@respx.mock
async def test_branches_shape_no_token_leak(client, session) -> None:
    await _seed_connection(session, token="gho_topsecret")
    respx.get("https://api.github.com/repos/octocat/spec-deck/branches").mock(
        return_value=httpx.Response(
            200,
            json=[{"name": "main", "protected": True}, {"name": "dev", "protected": False}],
        )
    )
    r = await client.get(f"{BASE}/branches?repo=octocat/spec-deck")
    assert r.status_code == 200
    body = r.json()
    assert body["branches"] == ["main", "dev"]
    assert body["next_page"] is None  # fewer than a full page
    assert "gho_topsecret" not in r.text  # SC-001


@respx.mock
async def test_branches_pagination_next_page(client, session) -> None:
    await _seed_connection(session)
    # a full page (per_page=30) → there may be more → next_page = 2
    full_page = [{"name": f"feature/{i}"} for i in range(30)]
    respx.get("https://api.github.com/repos/octocat/spec-deck/branches").mock(
        return_value=httpx.Response(200, json=full_page)
    )
    r = await client.get(f"{BASE}/branches?repo=octocat/spec-deck&page=1")
    assert r.status_code == 200
    assert r.json()["next_page"] == 2
    assert len(r.json()["branches"]) == 30


@respx.mock
async def test_branches_missing_repo_is_clean_error(client, session) -> None:
    await _seed_connection(session, token="gho_topsecret")
    respx.get("https://api.github.com/repos/octocat/gone/branches").mock(
        return_value=httpx.Response(404, json={"message": "Not Found"})
    )
    r = await client.get(f"{BASE}/branches?repo=octocat/gone")
    assert r.status_code == 502  # clean error, not an unhandled 500
    assert r.json()["error"] == "branches_unavailable"
    assert "gho_topsecret" not in r.text  # SC-001


@respx.mock
async def test_branches_401_marks_reauth(client, session) -> None:
    await _seed_connection(session)
    respx.get("https://api.github.com/repos/octocat/spec-deck/branches").mock(
        return_value=httpx.Response(401)
    )
    r = await client.get(f"{BASE}/branches?repo=octocat/spec-deck")
    assert r.status_code == 401
    assert r.json()["error"] == "github_reauth_required"
    conn = (await session.execute(select(GitConnection))).scalar_one()
    assert conn.status == ConnectionStatus.expired
