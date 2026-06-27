"""Generic streamed-run infrastructure: Redis publish + SSE snapshot-then-relay.

Instance #1 is provisioning (channel ws:provision:<job_id>). agent-execution will
reuse the SAME `sse_relay` with a different `snapshot_loader` and channel. Redis
is mandatory: the publisher (gateway for provisioning, agent server later) may run
in a different container than the SSE endpoint, so an in-memory broker won't do.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator, Awaitable, Callable

import redis.asyncio as aioredis


class RedisPublisher:
    """Publishes a streamed-run event (dict → JSON) onto a Redis channel."""

    def __init__(self, url: str) -> None:
        self._client = aioredis.from_url(url)

    async def publish(self, channel: str, event: dict) -> None:
        await self._client.publish(channel, json.dumps(event))

    async def aclose(self) -> None:
        await self._client.aclose()


SnapshotLoader = Callable[[], Awaitable[dict]]


async def sse_relay(
    redis_url: str,
    channel: str,
    snapshot_loader: SnapshotLoader,
    *,
    heartbeat: float = 15.0,
) -> AsyncIterator[dict]:
    """Subscribe to Redis, yield an SSE `snapshot` from the DB, then relay events.

    Maps the published payloads onto event names: terminal `ready` → `done`,
    payloads carrying `error` → `error` (then closes), raw `log` lines → `log`;
    everything else → `progress`. Emits a heartbeat comment every `heartbeat`
    seconds of silence. `snapshot_loader` is swappable so agent-execution reuses
    this verbatim.

    The Redis subscribe happens BEFORE the snapshot so any event published in the
    snapshot→relay window is buffered, not dropped (terminal `ready` must survive a
    fast clone). If the run already finished, the snapshot reflects the final state.
    """
    client = aioredis.from_url(redis_url)
    pubsub = client.pubsub()
    await pubsub.subscribe(channel)
    try:
        snapshot = await snapshot_loader()
        yield {"event": "snapshot", "data": json.dumps(snapshot)}

        while True:
            msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=heartbeat)
            if msg is None:
                yield {"event": "ping", "data": ""}
                continue
            payload = msg["data"]
            if isinstance(payload, bytes):
                payload = payload.decode()
            event = json.loads(payload)
            if event.get("error"):
                yield {"event": "error", "data": json.dumps(event)}
                break
            if event.get("workspace_status") == "ready":
                yield {"event": "done", "data": json.dumps(event)}
                break
            if "log" in event:
                yield {"event": "log", "data": json.dumps(event)}
                continue
            yield {"event": "progress", "data": json.dumps(event)}
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.aclose()
        await client.aclose()
