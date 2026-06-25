# SpecDeck — Project Map

> Pointer map cho AI agent. Giữ dưới ~100 dòng. Đây KHÔNG phải tài liệu — là *bản đồ tới tài liệu*.

## What This Does

UI/UX cho **vibe coding bất đồng bộ** (**SpecDeck** = spec + deck). Điều phối nhiều coding agent qua bảng Kanban 4 cột; con người duyệt ở tầng *Spec + Checklist + Evidence* thay vì đọc từng diff. Nhắm cả dev lẫn non-dev.

**Status:** kiến trúc + stack đã chốt; **chưa có application code** (sắp scaffold).

## Stack

Monorepo, self-host qua Cloudflare Tunnel. Topology 3 tầng kiểu DeerFlow v2:
- **FE:** Next.js (App Router) + Tailwind + shadcn/ui — UI design qua skill `design-taste-frontend`. (`pnpm`)
- **Gateway:** FastAPI (Python) — REST + bridge SSE; gọi Agent Server qua LangGraph SDK. (`uv`)
- **Agent:** LangGraph Server *riêng* (Planner/Builder/Checker, `langgraph.json`, checkpointer Postgres).
- **Data/realtime:** Postgres + Redis pub/sub → SSE; lệnh đi REST.

Chi tiết: [ARCHITECTURE.md](ARCHITECTURE.md) · [ADR: stack](docs/design-docs/stack.md).

## Vai agent

**Planner** (sinh Spec) · **Builder** (code trong git worktree, chạy song song trên card độc lập) · **Checker** (độc lập, khác model, chấm từng Check kèm Evidence). Thuật ngữ chuẩn: [docs/glossary.md](docs/glossary.md).

## Conventions

- **Spec-driven:** dùng **Spec Kit** (`.specify/`) — spec→plan→tasks trước code, hard gate. Xem rule `spec-driven`.
- **Commits:** Conventional Commits (skill `git-conventional`). **TDD:** test fail → code → pass → commit.
- **Docs-as-code:** quyết định kiến trúc → ADR trong `docs/design-docs/`. Project Context = [constitution](.specify/memory/constitution.md).

## Docs

- [docs/DESIGN.md](docs/DESIGN.md) — concept: vấn đề, spec-contract, vai agent, board 4 cột, màn hình chính, non-goals, còn-mở.
- [docs/glossary.md](docs/glossary.md) — thuật ngữ chuẩn.
- [docs/references.md](docs/references.md) — nguồn ngoài (vibe-kanban, Spec Kit, SDD, HTML-vs-Markdown, harness...).
- [.specify/memory/constitution.md](.specify/memory/constitution.md) — **Project Context**: 6 nguyên tắc + ràng buộc stack/bảo mật.
- ADR (`docs/design-docs/`):
  - [spec-contract-model](docs/design-docs/spec-contract-model.md) — Spec làm hợp đồng + chia vai Planner/Builder/Checker.
  - [board-columns](docs/design-docs/board-columns.md) — vì sao 4 cột theo cổng-người.
  - [agent-architecture](docs/design-docs/agent-architecture.md) — orchestrator Python/LangGraph, Builder pluggable, Checker độc lập.
  - [stack](docs/design-docs/stack.md) — Next.js/FastAPI/LangGraph/Postgres+Redis, self-host CF Tunnel.
  - [spec-format](docs/design-docs/spec-format.md) — Spec nguồn structured, UI render tab, Evidence HTML.
  - [review-merge-flow](docs/design-docs/review-merge-flow.md) — review hai tầng → PR → agent/tự merge.

## Key Files

_Điền khi có code: entry points, config, module chính (frontend/, backend/gateway/, backend/agent/)._
