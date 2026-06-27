"""SpecDeck gateway — REST commands + SSE bridge.

Talks to the LangGraph agent server via the LangGraph SDK; it does NOT run the
graph in-process. Secrets/API-keys live here and in the agent server, never in
the web client.

On startup the gateway applies pending Alembic migrations and reconciles any
provisioning jobs left `running` by a previous crash/restart (FR-019, SC-006).
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langgraph_sdk import get_client
from sse_starlette.sse import EventSourceResponse

import specdeck_gateway.models  # noqa: F401  (register mappers before reconcile)
from specdeck_gateway.config import get_settings
from specdeck_gateway.db import get_sessionmaker
from specdeck_gateway.routers import api_router
from specdeck_gateway.services.provisioning import reconcile_running_jobs

settings = get_settings()


def _alembic_config() -> Config:
    """Alembic config pinned to this package's migrations dir (cwd-independent)."""
    migrations_dir = Path(__file__).resolve().parent / "migrations"
    cfg = Config()
    cfg.set_main_option("script_location", str(migrations_dir))
    return cfg


def _run_migrations() -> None:
    # env.py drives an async engine via asyncio.run(), which cannot run inside an
    # already-running loop — so this is invoked through asyncio.to_thread().
    command.upgrade(_alembic_config(), "head")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await asyncio.to_thread(_run_migrations)
    async with get_sessionmaker()() as session:
        swept = await reconcile_running_jobs(session)
        if swept:
            app.state.reconciled_jobs = swept
    yield


app = FastAPI(title="SpecDeck Gateway", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.web_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok", "service": "gateway"}


@app.get("/api/stream")
async def stream() -> EventSourceResponse:
    """Demo SSE channel — proves the board's realtime bridge end-to-end.
    Real board events will be fanned out from Redis pub/sub."""

    async def gen():
        for i in range(1, 6):
            yield {"event": "tick", "data": f"tick {i}"}
            await asyncio.sleep(1)
        yield {"event": "done", "data": "stream complete"}

    return EventSourceResponse(gen())


@app.get("/api/agent/ping")
async def agent_ping() -> dict:
    """Demo gateway -> agent server round-trip via the LangGraph SDK."""
    client = get_client(url=settings.agent_url)
    try:
        result = await client.runs.wait(None, "planner", input={"input": "ping"})
        return {"ok": True, "agent": result}
    except Exception as exc:  # agent server not up yet
        return {"ok": False, "error": str(exc)}
