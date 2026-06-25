# SpecDeck — Architecture

> Bản đồ module + hướng phụ thuộc. **Skeleton đã scaffold** (web + backend gateway/agent/shared + docker-compose); logic board/agent thật chưa có. Quyết định gốc: [agent-architecture](docs/design-docs/agent-architecture.md), [stack](docs/design-docs/stack.md).

## Topology (3 tầng, kiểu DeerFlow v2)

```
                 Cloudflare Tunnel (ingress duy nhất)
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   Next.js (FE)   ──REST──▶  FastAPI Gateway  ──LangGraph SDK──▶  LangGraph Agent Server
   shadcn/taste   ◀──SSE───   (REST + bridge)                     (Planner/Builder/Checker)
                                  │   │                                │
                                  │   └──────── Redis (pub/sub) ───────┤  publish events
                                  ▼                                     ▼
                              Postgres (app data)            Postgres (checkpointer)
```

- **FE → Gateway:** REST (lệnh: duyệt/gật/steer) + SSE (board realtime, stream tiến độ).
- **Gateway → Agent Server:** LangGraph SDK client (tạo thread/run, stream). Gateway **không** chạy graph in-process.
- **Realtime:** Builder/Checker publish event lên **Redis pub/sub**; Gateway fan-out xuống FE qua **SSE**.
- **Builder** chạy trong **git worktree** (→ container khi scale), nằm sau **structured event contract**.

## Package map (monorepo dự kiến)

| Package | Vai trò | Được import từ |
|---|---|---|
| `web/` | Next.js + Tailwind + shadcn/ui; board, review checklist, inbox | (gọi Gateway qua REST/SSE) |
| `backend/gateway/` | FastAPI: REST app API + bridge SSE; auth; lưu board/task/spec/check/evidence | `backend/shared` |
| `backend/agent/` | LangGraph app: graph Planner/Builder/Checker, `langgraph.json`, middleware, checkpointer | `backend/shared` |
| `backend/shared/` | Schema chung (Spec/Check/Evidence/event contract), types | (nothing) |
| `.specify/` | Spec Kit: spec/plan/tasks per feature + constitution | — |
| `docs/` | DESIGN, glossary, references, ADR | — |

## Dependency direction (ràng buộc)

- `web` **chỉ** nói chuyện với `gateway` (REST/SSE) — KHÔNG gọi thẳng Agent Server.
- `gateway` điều phối Agent Server qua LangGraph SDK; là nơi *duy nhất* giữ secret/API-key (KHÔNG lộ ra FE).
- `agent` không phụ thuộc `gateway`; giao tiếp qua LangGraph protocol + Redis pub/sub.
- `backend/shared` thuần (schema/types), không I/O — cả gateway và agent đều import.

## Key boundaries

- **Secret chỉ ở backend** (gateway/agent), không bao giờ trong Next.js client.
- **Builder sau structured event contract** — swap engine (wrap-CLI → native SDK) không đụng gateway/Checker.
- **Cô lập per-Builder:** worktree → container; xử lý infra-collision (port/DB/Docker/cache).
- **Checker** đọc output+Spec qua context riêng (khác model), không thấy reasoning Builder.

_(Quy ước: ASCII diagram ngắn; chi tiết class-level để trong code/JSDoc, lý-do để trong ADR.)_
