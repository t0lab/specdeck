"""GitHub OAuth **Device Flow** + repo listing.

Pure HTTP layer (no DB). The access token is passed in/out as a plain string and
only ever decrypted server-side by the caller — it never crosses to the client.
Device Flow needs only a (non-secret) client_id: no client secret, no callback.
"""

from __future__ import annotations

import httpx

from specdeck_gateway.config import get_settings

GITHUB_DEVICE_CODE_URL = "https://github.com/login/device/code"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_API = "https://api.github.com"
OAUTH_SCOPE = "repo read:user"
DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code"
_TIMEOUT = 15.0


class GitHubReauthRequired(Exception):
    """Raised when GitHub rejects the token (401) — the user must re-authorize."""


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}


async def start_device_flow() -> dict:
    """Request a device + user code (POST /login/device/code).

    Returns the raw GitHub payload: device_code, user_code, verification_uri,
    expires_in, interval. The caller keeps `device_code` server-side.
    """
    s = get_settings()
    async with httpx.AsyncClient(timeout=_TIMEOUT) as c:
        r = await c.post(
            GITHUB_DEVICE_CODE_URL,
            data={"client_id": s.github_client_id, "scope": OAUTH_SCOPE},
            headers={"Accept": "application/json"},
        )
    r.raise_for_status()
    return r.json()


async def poll_device_token(device_code: str) -> dict:
    """One poll of the token endpoint with a device_code.

    Returns the raw GitHub payload — either `{access_token, scope, ...}` on
    success, or `{error: authorization_pending|slow_down|expired_token|access_denied}`.
    """
    s = get_settings()
    async with httpx.AsyncClient(timeout=_TIMEOUT) as c:
        r = await c.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": s.github_client_id,
                "device_code": device_code,
                "grant_type": DEVICE_GRANT,
            },
            headers={"Accept": "application/json"},
        )
    r.raise_for_status()
    return r.json()


async def fetch_user(token: str) -> dict:
    async with httpx.AsyncClient(timeout=_TIMEOUT) as c:
        r = await c.get(f"{GITHUB_API}/user", headers=_auth_headers(token))
    if r.status_code == 401:
        raise GitHubReauthRequired()
    r.raise_for_status()
    return r.json()


async def list_repos(token: str, query: str = "", page: int = 1, per_page: int = 50) -> dict:
    """List the connected user's repos (private included). Filters by `query`
    substring on full_name. Raises GitHubReauthRequired on 401."""
    async with httpx.AsyncClient(timeout=_TIMEOUT) as c:
        r = await c.get(
            f"{GITHUB_API}/user/repos",
            params={
                "per_page": per_page,
                "page": page,
                "sort": "updated",
                "affiliation": "owner,collaborator,organization_member",
            },
            headers=_auth_headers(token),
        )
    if r.status_code == 401:
        raise GitHubReauthRequired()
    r.raise_for_status()
    items = r.json()
    repos = [
        {
            "full_name": x["full_name"],
            "private": x["private"],
            "default_branch": x.get("default_branch", "main"),
        }
        for x in items
    ]
    if query:
        q = query.lower()
        repos = [x for x in repos if q in x["full_name"].lower()]
    next_page = page + 1 if len(items) == per_page else None
    return {"repos": repos, "next_page": next_page}


async def list_branches(
    token: str, full_name: str, page: int = 1, per_page: int = 30
) -> dict:
    """List branch names for `owner/repo`, paginated. Raises GitHubReauthRequired
    on 401. Returns `{branches: [...], next_page: int|None}`."""
    async with httpx.AsyncClient(timeout=_TIMEOUT) as c:
        r = await c.get(
            f"{GITHUB_API}/repos/{full_name}/branches",
            params={"per_page": per_page, "page": page},
            headers=_auth_headers(token),
        )
    if r.status_code == 401:
        raise GitHubReauthRequired()
    r.raise_for_status()
    items = r.json()
    next_page = page + 1 if len(items) == per_page else None
    return {"branches": [b["name"] for b in items], "next_page": next_page}
