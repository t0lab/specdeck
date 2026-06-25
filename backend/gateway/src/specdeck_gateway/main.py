"""SpecDeck gateway — REST commands + SSE bridge.

Talks to the LangGraph agent server via the LangGraph SDK; it does NOT run the
graph in-process. Secrets/API-keys live here and in the agent server, never in
the web client.
"""

from __future__ import annotations

import asyncio
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langgraph_sdk import get_client
from sse_starlette.sse import EventSourceResponse

AGENT_URL = os.getenv("AGENT_URL", "http://localhost:2024")
WEB_ORIGIN = os.getenv("WEB_ORIGIN", "http://localhost:3000")

app = FastAPI(title="SpecDeck Gateway", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[WEB_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    client = get_client(url=AGENT_URL)
    try:
        result = await client.runs.wait(None, "planner", input={"input": "ping"})
        return {"ok": True, "agent": result}
    except Exception as exc:  # agent server not up yet
        return {"ok": False, "error": str(exc)}
