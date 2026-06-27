"""`/api/integrations/github/*` — OAuth **Device Flow** + status/repos/disconnect.

The GitHub access token lives only in `git_connection.token_ciphertext` (Fernet)
and is decrypted server-side per call. No endpoint here ever returns it, nor the
device_code (SC-001).
"""

from __future__ import annotations

import time
from dataclasses import dataclass

import httpx

from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import JSONResponse
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from specdeck_gateway.services import github_oauth
from specdeck_gateway.core.crypto import cipher_from_settings
from specdeck_gateway.db import get_session
from specdeck_gateway.models import ConnectionStatus, GitConnection, GitProvider

router = APIRouter(prefix="/api/integrations/github", tags=["github"])


@dataclass
class _DevicePending:
    """Server-side device-flow state (single-user, single provider in flight)."""

    device_code: str
    interval: int
    expires_at: float


# In-memory pending device flow. The gateway is a single process per deployment,
# so an in-process slot is sufficient; device_code never leaves the server.
_pending: _DevicePending | None = None


async def _get_connection(session: AsyncSession) -> GitConnection | None:
    return (
        await session.execute(
            select(GitConnection).where(GitConnection.provider == GitProvider.github)
        )
    ).scalar_one_or_none()


async def _store_token(session: AsyncSession, token: str, scope: str) -> str:
    """Persist the encrypted token + login; returns github_login."""
    user = await github_oauth.fetch_user(token)
    ciphertext = cipher_from_settings().encrypt(token)
    conn = await _get_connection(session)
    if conn is None:
        conn = GitConnection(provider=GitProvider.github, token_ciphertext=ciphertext)
        session.add(conn)
    conn.account_login = user["login"]
    conn.token_ciphertext = ciphertext
    conn.scope = scope or github_oauth.OAUTH_SCOPE
    conn.status = ConnectionStatus.active
    await session.commit()
    return user["login"]


@router.post("/device/start")
async def device_start() -> dict:
    global _pending
    data = await github_oauth.start_device_flow()
    interval = int(data.get("interval", 5))
    expires_in = int(data.get("expires_in", 900))
    _pending = _DevicePending(
        device_code=data["device_code"],
        interval=interval,
        expires_at=time.time() + expires_in,
    )
    return {
        "user_code": data["user_code"],
        "verification_uri": data.get("verification_uri", "https://github.com/login/device"),
        "expires_in": expires_in,
        "interval": interval,
    }


@router.post("/device/poll", response_model=None)
async def device_poll(session: AsyncSession = Depends(get_session)) -> JSONResponse | dict:
    global _pending
    if _pending is None:
        return JSONResponse({"error": "no_pending_device_flow"}, status_code=409)
    if time.time() > _pending.expires_at:
        _pending = None
        return {"state": "expired"}

    data = await github_oauth.poll_device_token(_pending.device_code)

    if "access_token" in data:
        login = await _store_token(session, data["access_token"], data.get("scope", ""))
        _pending = None
        return {"state": "connected", "github_login": login}

    error = data.get("error")
    if error == "authorization_pending":
        return {"state": "pending"}
    if error == "slow_down":
        _pending.interval = int(data.get("interval", _pending.interval + 5))
        return {"state": "pending", "interval": _pending.interval}
    if error == "expired_token":
        _pending = None
        return {"state": "expired"}
    if error == "access_denied":
        _pending = None
        return {"state": "denied"}
    _pending = None
    return {"state": "error", "error": error or "unknown"}


@router.get("/status")
async def status(session: AsyncSession = Depends(get_session)) -> dict:
    conn = await _get_connection(session)
    if conn is None:
        return {"connected": False, "github_login": None, "scope": None, "status": None}
    return {
        "connected": True,
        "github_login": conn.account_login,
        "scope": conn.scope,
        "status": conn.status.value,
    }


@router.delete("/connection", status_code=204)
async def disconnect(session: AsyncSession = Depends(get_session)) -> Response:
    await session.execute(
        delete(GitConnection).where(GitConnection.provider == GitProvider.github)
    )
    await session.commit()
    return Response(status_code=204)


@router.get("/repos", response_model=None)
async def repos(
    session: AsyncSession = Depends(get_session),
    query: str = Query(default=""),
    page: int = Query(default=1, ge=1),
) -> JSONResponse | dict:
    conn = await _get_connection(session)
    if conn is None or conn.status != ConnectionStatus.active:
        return JSONResponse({"error": "github_reauth_required"}, status_code=401)

    token = cipher_from_settings().decrypt(conn.token_ciphertext)
    try:
        return await github_oauth.list_repos(token, query=query, page=page)
    except github_oauth.GitHubReauthRequired:
        conn.status = ConnectionStatus.expired
        await session.commit()
        return JSONResponse({"error": "github_reauth_required"}, status_code=401)


@router.get("/branches", response_model=None)
async def branches(
    session: AsyncSession = Depends(get_session),
    repo: str = Query(..., description="full_name, e.g. octocat/spec-deck"),
    page: int = Query(default=1, ge=1),
) -> JSONResponse | dict:
    conn = await _get_connection(session)
    if conn is None or conn.status != ConnectionStatus.active:
        return JSONResponse({"error": "github_reauth_required"}, status_code=401)

    token = cipher_from_settings().decrypt(conn.token_ciphertext)
    try:
        return await github_oauth.list_branches(token, repo, page=page)
    except github_oauth.GitHubReauthRequired:
        conn.status = ConnectionStatus.expired
        await session.commit()
        return JSONResponse({"error": "github_reauth_required"}, status_code=401)
    except httpx.HTTPStatusError:
        # repo gone / no access / GitHub hiccup — clean error, never a raw 500
        return JSONResponse({"error": "branches_unavailable"}, status_code=502)
