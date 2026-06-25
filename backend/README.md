# SpecDeck backend

uv workspace with three members:

| Member | Package | Role |
|---|---|---|
| `shared/` | `specdeck-shared` | Pure domain models (Spec / Check / Evidence + event contract) |
| `gateway/` | `specdeck-gateway` | FastAPI — REST commands + SSE bridge; talks to the agent via LangGraph SDK |
| `agent/` | `specdeck-agent` | LangGraph server — Planner / Builder / Checker graphs |

## Local dev

```bash
uv sync                       # one venv for the whole workspace

# Agent server (LangGraph, in-memory checkpointer):
cd agent && uv run langgraph dev --port 2024

# Gateway (separate shell):
cd gateway && uv run uvicorn specdeck_gateway.main:app --reload --port 8000
```

The gateway reaches the agent at `AGENT_URL` (default `http://localhost:2024`)
via the LangGraph SDK — it does **not** run the graph in-process.

Secrets / API-keys stay in the backend (gateway + agent), **never** in the web
client. See [../ARCHITECTURE.md](../ARCHITECTURE.md).
