# SpecDeck

## Project

**Purpose:** UI/UX cho vibe coding bất đồng bộ — điều phối nhiều coding agent qua bảng Kanban, con người duyệt ở tầng *spec/checklist* thay vì đọc diff. Tên: **SpecDeck** (spec + deck — control deck để điều phối agent). Concept đầy đủ: [docs/DESIGN.md](docs/DESIGN.md), thuật ngữ: [docs/glossary.md](docs/glossary.md).

## Stack

Monorepo, self-host qua Cloudflare Tunnel. Topology 3 tầng kiểu DeerFlow v2:
- **FE:** Next.js (App Router) + Tailwind + shadcn/ui — UI design qua skill `design-taste-frontend`.
- **Gateway:** FastAPI (Python) — REST + bridge SSE; gọi Agent Server qua LangGraph SDK.
- **Agent:** LangGraph Server *riêng* (Planner/Builder/Checker, `langgraph.json`, checkpointer Postgres).
- **Data/realtime:** Postgres + Redis pub/sub; SSE xuống board.

Chi tiết: [ADR: stack](docs/design-docs/stack.md) · [ADR: agent-architecture](docs/design-docs/agent-architecture.md).


## Conventions

- Commits: Conventional Commits — invoke `git-conventional` skill before committing
- TDD: write failing test → implement → pass → commit
- Spec before implementation: this project uses **GitHub Spec Kit** (`.specify/`) — specs/plans/tasks live in `.specify/specs/NNN-<name>/`, not `docs/exec-plans/`. See the `spec-driven` rule.

## Memory


<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
