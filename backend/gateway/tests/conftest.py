"""Shared test fixtures for the gateway.

DB fixtures import lazily inside the fixture body so that a missing module under
TDD surfaces as a failure in the test that needs it — not a collection error that
hides every other (red) test.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path

import pytest

# A fixed, valid Fernet key for tests that don't care about key rotation.
TEST_FERNET_KEY = "tDp1mTf-3Pn9rUo9b8aV3hQmC4eD0xN7y6sZ2wK1bF8="


@pytest.fixture(autouse=True)
def _test_env(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """Baseline env so `Settings` can construct in any test."""
    root = tmp_path / "workspaces"
    root.mkdir(exist_ok=True)
    monkeypatch.setenv("WORKSPACE_ROOT", str(root))
    monkeypatch.setenv("TOKEN_ENCRYPTION_KEY", TEST_FERNET_KEY)
    monkeypatch.setenv("GITHUB_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("DATABASE_URL", "postgresql://specdeck:specdeck@localhost:5432/specdeck")
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")
    # Drop any cached settings singleton between tests.
    try:
        from specdeck_gateway.config import get_settings

        get_settings.cache_clear()
    except Exception:
        pass


@pytest.fixture
def workspace_root(tmp_path: Path) -> Path:
    """Managed root for path-safety / git-ops tests (already set in env above)."""
    return tmp_path / "workspaces"


@pytest.fixture
async def engine() -> AsyncIterator[object]:
    """In-memory async SQLite engine with all gateway tables created."""
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy.pool import StaticPool

    from specdeck_gateway.db import Base
    import specdeck_gateway.models  # noqa: F401  (register mappers)

    eng = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        yield eng
    finally:
        await eng.dispose()


@pytest.fixture
async def session(engine: object) -> AsyncIterator[object]:
    from sqlalchemy.ext.asyncio import async_sessionmaker

    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with maker() as s:
        yield s


@pytest.fixture
async def client(engine: object) -> AsyncIterator[object]:
    """ASGI test client with `get_session` bound to the in-memory test DB.

    The app's lifespan (alembic + reconcile) is intentionally NOT triggered —
    httpx's ASGITransport doesn't emit lifespan events, so no Postgres is touched.
    respx only patches the real-network transport, so calls *into* the app are
    untouched while the app's *outbound* GitHub calls are mocked.
    """
    from httpx import ASGITransport, AsyncClient
    from sqlalchemy.ext.asyncio import async_sessionmaker

    from specdeck_gateway.db import get_session
    from specdeck_gateway.main import app

    maker = async_sessionmaker(engine, expire_on_commit=False)

    async def _override() -> AsyncIterator[object]:
        async with maker() as s:
            yield s

    app.dependency_overrides[get_session] = _override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c
    app.dependency_overrides.clear()
