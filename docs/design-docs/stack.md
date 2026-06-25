# Tech stack: Next.js + shadcn (FE), FastAPI Gateway + LangGraph Agent Server (BE), Postgres + Redis, SSE pub/sub, self-host qua Cloudflare Tunnel

**Status:** proposed
**Date:** 2026-06-25
**Deciders:** chủ dự án

## Context

Orchestrator agent đã chốt là Python LangGraph/DeepAgents ([agent-architecture](agent-architecture.md)). Cần chốt stack cụ thể để scaffold base project. Ràng buộc: web app cho cả dev lẫn non-dev; backend **long-running** (git worktree, spawn CLI subprocess, container, task chạy nhiều phút) → *không hợp serverless*; UI cần đẹp (review là màn sống/chết); solo dev, gom về một server.

**Topology theo DeerFlow v2** (ByteDance): **tách agent khỏi backend** — FastAPI làm Gateway (REST/config/file/metadata + bridge SSE), agent chạy trên **LangGraph Server riêng** (graph đăng ký trong `langgraph.json`, middleware, async checkpointer, stream qua LangGraph protocol). Gateway gọi Agent Server qua LangGraph SDK client.

## Decision

Topology 3 tầng: **Next.js → FastAPI Gateway → LangGraph Agent Server**, sau một reverse proxy (Nginx/Cloudflare Tunnel).

| Tầng | Chốt |
|---|---|
| **Frontend** | **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui**; UI design qua skill **design-taste-frontend**. Hệ sinh thái Vercel làm *framework/tooling*, **KHÔNG** deploy lên Vercel cloud. Deps qua `pnpm`. |
| **Gateway (backend)** | **FastAPI (Python)** — REST cho board/task/spec/check/evidence/config/file/auth/metadata; **bridge SSE** xuống FE; gọi Agent Server qua **LangGraph SDK client**. *Không* chạy graph in-process. Deps qua `uv`. |
| **Agent service** | **LangGraph (Agent) Server riêng** — chạy graph Planner/Builder/Checker (đăng ký trong `langgraph.json`), middleware (vd giới hạn subagent song song), **async checkpointer (Postgres)** cho durability/HITL, stream qua LangGraph streaming protocol. Đây là chỗ tách-biệt theo DeerFlow v2. |
| **DB** | **Postgres** (board/task/spec/check/evidence + LangGraph checkpoint). ORM cho app data: SQLModel/SQLAlchemy. |
| **Realtime** | **SSE** (LangGraph streaming protocol) + **Redis pub/sub** backplane ở Gateway: nhiều run/Builder/Checker publish event lên Redis channel, Gateway fan-out xuống client qua SSE. Lệnh (duyệt/gật/steer) đi **REST POST**, không nhét vào kênh SSE. |
| **Ingress** | Reverse proxy (Nginx hoặc trực tiếp Cloudflare Tunnel) làm điểm vào duy nhất, route FE / Gateway / Agent Server. |
| **Repo** | **Monorepo**: `/web` (Next.js) + `/backend` (FastAPI Gateway + LangGraph app, `langgraph.json`) + `/docs` + `/.specify`. |
| **Deploy** | **Self-host tất cả trên một server** (Docker compose), expose qua **Cloudflare Tunnel** — **không publish host port**; chỉ `web`+`gateway` join network của tunnel (`t0lab_network`), còn lại nói chuyện qua **DNS nội bộ Docker**. Mọi service long-running, container-hóa. |
| **Auth (provider)** | API-key cho mọi agent provider, chỉ ở backend/Agent Server. |

## Alternatives considered

- **Embed LangGraph (library) thẳng trong FastAPI** (một process) — rejected: chủ dự án chọn tách agent khỏi backend (DeerFlow v2). Tách cho phép scale/khởi động lại agent độc lập, dùng được LangGraph Studio/tooling, và checkpointer/streaming là việc của Agent Server thay vì nhồi vào Gateway.
- **Deploy FE lên Vercel cloud** — rejected: gom tất cả về một server qua CF Tunnel. Vercel chỉ dùng làm ecosystem/tooling.
- **WebSocket thay SSE** — rejected lúc này: SSE đủ cho push 1 chiều + pub/sub (đúng cách DeerFlow stream qua SSE); WS phức tạp hơn. Revisit nếu cần 2 chiều mạnh (collab nhiều người).
- **Redis pub/sub vs Postgres LISTEN/NOTIFY** — chọn **Redis** (chuẩn cho fan-out + tái dùng làm broker/cache sau); LISTEN/NOTIFY là phương án lean nếu muốn bớt một service.
- **Backend serverless (Vercel functions/Lambda)** — rejected: long-running agent + worktree + subprocess + container không chạy trên serverless.
- **Hai repo tách** — rejected: monorepo để spec/ADR đồng bộ với code.

## Consequences

**Better:**
- **Tách agent/Gateway**: scale, restart, debug Agent Server độc lập; dùng được LangGraph Studio; Gateway gọn (chỉ REST + bridge), không gánh runtime graph.
- Mỗi tầng một ngôn ngữ với tooling chuẩn: Next/shadcn dựng UI đẹp nhanh, FastAPI/LangGraph hợp orchestrator Python.
- SSE + Redis pub/sub: nhiều Builder song song publish độc lập → fan-out sạch xuống board.
- Self-host + CF Tunnel: một server, chi phí thấp, không mở port vào máy, không lệ thuộc nền tảng.
- Monorepo: spec/ADR/glossary đi cùng code.

**Worse:**
- **Nhiều service hơn** (FE + Gateway + Agent Server + Postgres + Redis + proxy) → compose/ops phức tạp hơn embed một process.
- Một network hop FE→Gateway→Agent Server (thêm độ trễ, cần bridge stream cẩn thận).
- Self-host = tự lo ops/uptime/scale (không auto-scale như Vercel).
- Next.js self-host bỏ phí vài tối ưu Vercel-native (ISR/edge) — chấp nhận.
- CF Tunnel là một điểm phụ thuộc cho truy cập ngoài.

**Must now be true:**
- Agent chạy trên **LangGraph Server riêng**; FastAPI **Gateway gọi qua LangGraph SDK**, không chạy graph in-process.
- Graph đăng ký trong `langgraph.json`; durability/HITL dựa **async checkpointer (Postgres)** ở Agent Server.
- Event agent đi **Redis pub/sub → SSE** ở Gateway; lệnh đi **REST**.
- Mọi secret/API-key ở backend/Agent Server, **không lộ ra Next.js client**.
- FE + BE cùng **monorepo**, deploy cùng một server (Docker compose) sau **Cloudflare Tunnel**.

## Revisit if

- Cần multi-user/collab realtime mạnh → cân nhắc WebSocket.
- Tải vượt một server → tách service ra nhiều máy / container PaaS (topology tách sẵn nên dễ).
- Durability/fan-out vượt LangGraph checkpointer → Temporal/Restate (theo [agent-architecture](agent-architecture.md)).

## Tham chiếu

- [ADR: agent-architecture](agent-architecture.md) — orchestrator/Builder/Checker.
- DeerFlow v2 (topology tham chiếu): repo <https://github.com/bytedance/deer-flow> · kiến trúc <https://deepwiki.com/bytedance/deer-flow/3-architecture> · LangGraph Agent Server <https://deepwiki.com/bytedance/deer-flow/5.2-langgraph-agent-server>
- Concept: [docs/DESIGN.md](../DESIGN.md) · thuật ngữ: [docs/glossary.md](../glossary.md).
