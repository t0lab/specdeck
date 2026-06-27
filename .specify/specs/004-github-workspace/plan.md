# Implementation Plan: Workspace Provisioning + GitHub OAuth

**Branch**: `004-github-workspace` | **Date**: 2026-06-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.specify/specs/004-github-workspace/spec.md`

## Summary

Biến `repo` (chuỗi mock của Project ở 003) thành một **Workspace** thật: một git repo nằm trên một Docker named volume `workspaces`, sẵn-sàng cho `git worktree`. **Gateway (FastAPI) sở hữu provisioning**: chạy OAuth web flow với GitHub, lưu token mã hoá ở Postgres (server-only), và thực thi `git clone`/`git init` như subprocess — stream tiến độ qua Redis pub/sub → SSE xuống Next.js. Agent Server mount **cùng** volume `workspaces` (rw) để sau này tách worktree (ngoài phạm vi 004). Web wire bước "Connect code" trong NewProjectDialog + khối Workspace ở Project Settings vào API thật.

## Technical Context

**Language/Version**: Python 3.12 (gateway), TypeScript/Next.js 16 (web)

**Primary Dependencies**: FastAPI + `sse-starlette` (đã có), `redis` (đã có), `httpx` (đã có); **thêm**: `sqlalchemy[asyncio]>=2.0` + `asyncpg` + `alembic` (persistence — gateway chưa có), `cryptography` (Fernet — mã hoá token at-rest). Web: dùng API client gọi gateway qua `/api/*` (same-origin qua tunnel), `EventSource` cho SSE.

**Storage**: PostgreSQL (Postgres 17, container `specdeck-postgres`) cho `github_connection` / `workspace` / `provisioning_job` (+ một bảng `project` tối thiểu làm FK). Git repos sống trên named volume `workspaces`. Redis cho pub/sub tiến độ.

**Testing**: `pytest` + `pytest-asyncio` (gateway: unit cho path-safety, askpass, progress-parser, token-crypto; integration cho clone/init vào tmp root, OAuth callback với GitHub mock qua `respx`). Vitest (web: API client + SSE hook). TDD: red trước.

**Target Platform**: Linux server trong Docker Compose, sau Cloudflare Tunnel (web + gateway public; postgres/redis/agent private).

**Project Type**: Web application — frontend (`web/`) + backend (`backend/gateway/`, `backend/shared/`).

**Performance Goals**: Tiến độ clone hiển thị ≤2s sau khi bắt đầu, cập nhật liên tục (SC-002); list repo + browse phản hồi nhanh (<1s với rate-limit bình thường).

**Constraints**: Token GitHub KHÔNG bao giờ tới client (SC-001); mọi path PHẢI nằm trong managed root, chống traversal/symlink (SC-004); không publish host port (giữ nguyên compose); job không kẹt `provisioning` sau restart (SC-006); Workspace `ready` phải tạo được worktree thật (SC-005).

**Scale/Scope**: Self-host 1 user, 1 GitHubConnection; vài chục Project; repo cỡ vừa. Không multi-tenant.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Review tầng ý định** — Không phải feature Spec/Check của agent (đây là infra provisioning); nguyên tắc Evidence áp dụng cho verification của chính 004 (test + demo worktree), không phát sinh Check agent. PASS.
- [x] **II. Spec hợp đồng** — N/A cho agent-Spec; tuy nhiên contracts/ định nghĩa hợp đồng REST/SSE rõ ràng. PASS.
- [x] **III. Checker độc lập** — N/A (không có agent verification trong 004). PASS.
- [x] **IV. Single-agent/đơn vị** — Một feature tuyến tính, một writer. PASS.
- [x] **V. Spec-driven hard gate** — spec.md đã duyệt + commit; plan này trước khi code. PASS.
- [x] **VI. TDD + Docs-as-code** — Cam kết TDD cho lõi (path-safety/askpass/progress/crypto/state-machine). **Cần 1 ADR** `docs/design-docs/workspace-provisioning.md`: (a) Gateway sở hữu git provisioning + chia sẻ volume với Agent, (b) chọn SQLAlchemy async + Alembic làm persistence layer đầu tiên của backend.
- [x] **Stack/Security** — Giữ Gateway ≠ Agent Server (chỉ **chia sẻ volume**, không chia sẻ trách nhiệm); secret (OAuth token, encryption key) chỉ ở backend, mã hoá at-rest; không lộ ra Next.js client; topology DeerFlow v2 nguyên vẹn. PASS.

→ Không vi phạm cần biện minh; **Complexity Tracking** để trống.

## Project Structure

### Documentation (this feature)

```text
specs/004-github-workspace/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions (OAuth, askpass, progress, crypto, persistence, reconcile)
├── data-model.md        # Phase 1 — 3 entities + state machine
├── quickstart.md        # Phase 1 — end-to-end validation scenarios
├── contracts/
│   ├── workspace-api.md      # REST endpoints (OAuth + workspace + browse)
│   └── provisioning-events.md# SSE event schema
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
backend/
├── gateway/src/specdeck_gateway/
│   ├── main.py                  # mở rộng: include routers, startup reconcile + DB init
│   ├── db.py                    # async engine/session (SQLAlchemy 2.0 + asyncpg)
│   ├── config.py                # settings (env): GITHUB_*, WORKSPACE_ROOT, TOKEN_ENCRYPTION_KEY
│   ├── models_db.py             # ORM: Project, GitHubConnection, Workspace, ProvisioningJob
│   ├── crypto.py                # Fernet encrypt/decrypt token
│   ├── github_oauth.py          # web flow: authorize redirect, callback, repo list
│   ├── git_ops.py               # clone/init subprocess + GIT_ASKPASS + progress parse
│   ├── pathsafe.py              # resolve + assert-within-root
│   ├── provisioning.py          # job orchestration + Redis publish + reconcile
│   └── routers/
│       ├── github.py            # /api/github/*
│       └── workspace.py         # /api/projects/{id}/workspace*, /api/workspaces/browse
│   └── migrations/              # Alembic
└── gateway/tests/               # pytest (unit + integration)

web/src/
├── lib/api/                     # gateway client (github, workspace) + SSE hook
└── components/workspace/        # new-project-dialog (Connect code step), settings-form (Workspace block)

docker-compose.yml               # + named volume `workspaces` mounted rw into gateway & agent; + env
.gitignore / .dockerignore       # (volume is external to repo; ensure no stray workspaces/ tracked)
```

**Structure Decision**: Web-application shape mapped lên cây thật của repo — `backend/gateway/src/specdeck_gateway/` (FastAPI provisioning + persistence mới) và `web/src/` (wire UI). `backend/shared/` chỉ thêm nếu có shape dùng chung cả agent; provisioning models là gateway-local (agent chưa cần). Managed root = Docker named volume `workspaces` (không phải bind-mount host), gắn vào cả gateway (provision) và agent (worktree sau) tại `${WORKSPACE_ROOT:-/workspaces}`.

## Phasing (gắn user stories trong spec)

- **Foundational** (chặn mọi US): DB layer + Alembic + bảng; `config.py`; `crypto.py`; `pathsafe.py`; volume `workspaces` + env trong compose; startup reconcile.
- **US1 (P1)**: `github_oauth.py` + router `/api/github/*` (connect/callback/status/disconnect/repos); web Connect-GitHub + repo picker.
- **US2 (P1)**: `git_ops.py` clone + GIT_ASKPASS + progress; `provisioning.py` job + Redis; SSE endpoint; web clone progress.
- **US3 (P2)**: `git init` nhánh trong git_ops/provisioning; web "Start empty".
- **US4 (P2)**: link + auto-detect remote (`git remote`) + browse endpoint (path-safe); web folder picker trong managed root.
- **US5 (P3)**: health-check broken-link + reconnect + unlink; web trạng thái broken + actions.

## Complexity Tracking

> Không có vi phạm Constitution cần biện minh.
