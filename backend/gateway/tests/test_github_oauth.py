"""T016 — GitHub OAuth Device Flow (FR-001/FR-002, US1.3).

device/start returns a user_code (never the device_code); polling exchanges the
device_code for a token, which is stored ENCRYPTED. A denied/expired flow stores
no connection.
"""

from __future__ import annotations

import httpx
import pytest
import respx
from sqlalchemy import select

from specdeck_gateway.core.crypto import TokenCipher
from specdeck_gateway.models import ConnectionStatus, GitConnection
from tests.conftest import TEST_FERNET_KEY

BASE = "/api/integrations/github"
DEVICE_CODE_URL = "https://github.com/login/device/code"
TOKEN_URL = "https://github.com/login/oauth/access_token"
USER_URL = "https://api.github.com/user"


@pytest.fixture(autouse=True)
def _reset_pending():
    """Clear the in-process device-flow slot between tests."""
    from specdeck_gateway.routers import github as gh_router

    gh_router._pending = None
    yield
    gh_router._pending = None


def _mock_device_code(user_code="WDJB-MJHT"):
    respx.post(DEVICE_CODE_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "device_code": "DEVICE-SECRET-CODE",
                "user_code": user_code,
                "verification_uri": "https://github.com/login/device",
                "expires_in": 900,
                "interval": 5,
            },
        )
    )


@respx.mock
async def test_device_start_returns_user_code_not_device_code(client) -> None:
    _mock_device_code()
    r = await client.post(f"{BASE}/device/start")
    assert r.status_code == 200
    body = r.json()
    assert body["user_code"] == "WDJB-MJHT"
    assert body["verification_uri"] == "https://github.com/login/device"
    assert body["interval"] == 5
    # device_code MUST stay server-side
    assert "DEVICE-SECRET-CODE" not in r.text
    assert "device_code" not in body


@respx.mock
async def test_poll_pending_then_connected_stores_encrypted_token(client, session) -> None:
    _mock_device_code()
    respx.post(TOKEN_URL).mock(
        side_effect=[
            httpx.Response(200, json={"error": "authorization_pending"}),
            httpx.Response(200, json={"access_token": "gho_secret", "scope": "repo,read:user"}),
        ]
    )
    respx.get(USER_URL).mock(return_value=httpx.Response(200, json={"login": "octocat"}))

    await client.post(f"{BASE}/device/start")

    r1 = await client.post(f"{BASE}/device/poll")
    assert r1.json() == {"state": "pending"}

    r2 = await client.post(f"{BASE}/device/poll")
    body = r2.json()
    assert body["state"] == "connected"
    assert body["github_login"] == "octocat"

    rows = (await session.execute(select(GitConnection))).scalars().all()
    assert len(rows) == 1
    conn = rows[0]
    assert conn.account_login == "octocat"
    assert conn.status == ConnectionStatus.active
    assert b"gho_secret" not in conn.token_ciphertext
    assert TokenCipher(TEST_FERNET_KEY).decrypt(conn.token_ciphertext) == "gho_secret"


@respx.mock
async def test_poll_access_denied_creates_no_connection(client, session) -> None:
    _mock_device_code()
    respx.post(TOKEN_URL).mock(
        return_value=httpx.Response(200, json={"error": "access_denied"})
    )
    await client.post(f"{BASE}/device/start")
    r = await client.post(f"{BASE}/device/poll")
    assert r.json() == {"state": "denied"}
    rows = (await session.execute(select(GitConnection))).scalars().all()
    assert rows == []


@respx.mock
async def test_poll_expired_token_creates_no_connection(client, session) -> None:
    _mock_device_code()
    respx.post(TOKEN_URL).mock(
        return_value=httpx.Response(200, json={"error": "expired_token"})
    )
    await client.post(f"{BASE}/device/start")
    r = await client.post(f"{BASE}/device/poll")
    assert r.json() == {"state": "expired"}
    assert (await session.execute(select(GitConnection))).scalars().all() == []


async def test_poll_without_start_is_409(client) -> None:
    r = await client.post(f"{BASE}/device/poll")
    assert r.status_code == 409
    assert r.json()["error"] == "no_pending_device_flow"
