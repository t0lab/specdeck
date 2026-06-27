---
description: "Task list for Workspace Provisioning + GitHub OAuth"
---

# Tasks: Workspace Provisioning + GitHub OAuth

**Input**: Design documents from `.specify/specs/004-github-workspace/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: INCLUDED — Constitution VI + plan commit to TDD (red trước). Lõi an toàn (pathsafe, crypto, askpass, progress-parser, state-machine, reconcile, OAuth callback) MUST có test fail trước khi implement.

**Organization**: Tasks grouped by user story (US1–US5) để implement + test độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: chạy song song được (khác file, không phụ thuộc task chưa xong)
- **[Story]**: US1…US5 (chỉ trên task thuộc phase user story)
- Mọi task có đường dẫn file cụ thể

## Path Conventions

- Backend gateway: `backend/gateway/src/specdeck_gateway/`, test `backend/gateway/tests/`
- Web: `web/src/`
- Migrations: `backend/gateway/src/specdeck_gateway/migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Khai báo dependency + volume + env, dựng khung persistence chưa có ở gateway.

- [ ] T001 Thêm runtime deps vào `backend/gateway/pyproject.toml`: `sqlalchemy[asyncio]>=2.0`, `asyncpg`, `alembic`, `cryptography`; và dev deps `pytest`, `pytest-asyncio`, `respx` (theo research.md "Dependencies thêm")
- [ ] T002 [P] Thêm named volume `workspaces` (mount rw vào service `gateway` và `agent` tại `${WORKSPACE_ROOT:-/workspaces}`) + env `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`/`GITHUB_OAUTH_CALLBACK`/`WORKSPACE_ROOT`/`TOKEN_ENCRYPTION_KEY` cho service `gateway` trong `docker-compose.yml`
- [ ] T003 [P] Cập nhật `.gitignore` + `.dockerignore` để chắc chắn không có `workspaces/` lọt vào repo/build context (volume là external)
- [ ] T004 [P] Tạo `.env.example` (hoặc cập nhật) liệt kê các biến `GITHUB_*`, `WORKSPACE_ROOT`, `TOKEN_ENCRYPTION_KEY` (giá trị placeholder; secret thật chỉ ở deployment)
- [ ] T005 Cấu hình `pytest` cho gateway (`backend/gateway/pyproject.toml` `[tool.pytest.ini_options]` với `asyncio_mode = "auto"`) + tạo `backend/gateway/tests/__init__.py` và `backend/gateway/tests/conftest.py` khung (tmp `WORKSPACE_ROOT`, fixture engine SQLite/`asyncpg` test)

**Checkpoint**: deps + compose + test harness sẵn sàng.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB layer + Alembic + config + crypto + pathsafe + startup reconcile — **chặn mọi US**.

**⚠️ CRITICAL**: Không US nào bắt đầu trước khi phase này xong.

### Tests (red trước)

- [ ] T006 [P] Test `pathsafe`: chặn `../`, đường dẫn tuyệt đối ngoài root, symlink trỏ ra ngoài; chấp nhận đường dẫn hợp lệ trong root — `backend/gateway/tests/test_pathsafe.py` (SC-004)
- [ ] T007 [P] Test `crypto`: encrypt→decrypt roundtrip, ciphertext ≠ plaintext, key sai → fail — `backend/gateway/tests/test_crypto.py` (FR-002)

### Implementation

- [ ] T008 [P] `config.py`: pydantic `Settings` đọc env `GITHUB_CLIENT_ID/SECRET/OAUTH_CALLBACK`, `WORKSPACE_ROOT`, `TOKEN_ENCRYPTION_KEY`, `DATABASE_URL`, `REDIS_URL` — `backend/gateway/src/specdeck_gateway/config.py`
- [ ] T009 [P] `crypto.py`: Fernet encrypt/decrypt token từ `TOKEN_ENCRYPTION_KEY` — `backend/gateway/src/specdeck_gateway/crypto.py` (làm T007 xanh)
- [ ] T010 [P] `pathsafe.py`: `resolve_in_root(root, candidate)` + `assert_within_root` (resolve→`is_relative_to`) — `backend/gateway/src/specdeck_gateway/pathsafe.py` (làm T006 xanh)
- [ ] T011 `db.py`: async engine + `async_sessionmaker` (SQLAlchemy 2.0 + asyncpg), `Base` declarative, dependency `get_session` — `backend/gateway/src/specdeck_gateway/db.py`
- [ ] T012 `models_db.py`: ORM **3 bảng** `Project` (gộp workspace: `rel_path` unique, `source`/`remote_url`/`base_branch`/`workspace_status`, `active_job_id` FK nullable), `GitConnection` (`provider` unique, `token_ciphertext` bytea), `ProvisioningJob` (uuid PK, `project_id` FK, `kind`/`status`/`phase`/`progress`/`message`) + enums theo data-model.md — `backend/gateway/src/specdeck_gateway/models_db.py` (depends T011)
- [ ] T013 Khởi tạo Alembic (`alembic.ini` + `migrations/env.py` async) + migration tạo **3 bảng** + enums; xử lý **circular FK** `project.active_job_id ↔ provisioning_job.project_id` (tạo bảng trước, `ALTER TABLE … ADD CONSTRAINT` sau / deferrable); tạo **partial unique index** `one_active_job_per_project ON provisioning_job(project_id) WHERE status='running'` — `backend/gateway/src/specdeck_gateway/migrations/` (depends T012)
- [ ] T014 Test reconcile-on-startup (red→green): job `running`/workspace `provisioning` lúc khởi động → `error`/`broken`, không kẹt — `backend/gateway/tests/test_reconcile.py` (SC-006, FR-019)
- [ ] T015 `main.py` lifespan: chạy `alembic upgrade head` (hoặc verify) + reconcile job dở khi startup + include routers (stub) — `backend/gateway/src/specdeck_gateway/main.py` (depends T012, T014)

**Checkpoint**: Foundation sẵn sàng — các US có thể bắt đầu song song.

---

## Phase 3: User Story 1 - Connect GitHub qua OAuth (Priority: P1) 🎯 MVP

**Goal**: Authorize GitHub một lần (OAuth web flow), token mã hoá server-only, list được repo (kể cả private).

**Independent Test**: "Connect GitHub" → authorize → "Connected as <login>" + list repo; DevTools Network/bundle **không** chứa access token.

### Tests (red trước)

- [ ] T016 [P] [US1] Test OAuth callback dùng `respx` mock GitHub (exchange code→token, lưu mã hoá, verify state); deny/state sai → không tạo bản ghi token — `backend/gateway/tests/test_github_oauth.py` (FR-001/FR-002, US1.3)
- [ ] T017 [P] [US1] Test `/api/github/status` + `/api/github/repos` không bao giờ chứa token trong response; repos trả tên/owner/private/default_branch; token 401 → `github_reauth_required` — `backend/gateway/tests/test_github_router.py` (SC-001, FR-004/FR-005)

### Implementation

- [ ] T018 [US1] `github_oauth.py`: build authorize URL (`scope=repo read:user` + `state` CSRF), exchange `code`→token, fetch `github_login`, list repos (httpx, token decrypt server-side) — `backend/gateway/src/specdeck_gateway/github_oauth.py` (depends T009; làm T016 xanh)
- [ ] T019 [US1] `routers/github.py`: `GET /api/github/connect` (302), `GET /api/github/callback`, `GET /api/github/status`, `DELETE /api/github/connection`, `GET /api/github/repos` theo contracts/workspace-api.md — `backend/gateway/src/specdeck_gateway/routers/github.py` (depends T018; làm T017 xanh)
- [ ] T020 [US1] Include `github` router trong `main.py` + state-store CSRF (in-memory/Redis ngắn hạn) — `backend/gateway/src/specdeck_gateway/main.py`
- [ ] T021 [P] [US1] Web API client GitHub (`connect`/`status`/`repos`/`disconnect`) gọi `/api/github/*` — `web/src/lib/api/github.ts`
- [ ] T022 [US1] Web "Connect GitHub" + trạng thái connected/reauth + repo picker (search) trong bước Connect code — `web/src/components/workspace/new-project-dialog.tsx` + component con nếu cần
- [ ] T023 [P] [US1] Vitest cho GitHub API client (mock fetch: status connected, repos shape, reauth 401) — `web/src/lib/api/__tests__/github.test.ts`

**Checkpoint**: US1 chạy độc lập — connect + list repo, token không lộ client.

---

## Phase 4: User Story 2 - Clone repo vào Workspace (Priority: P1) 🎯 MVP

**Goal**: Chọn repo + base branch → clone vào `workspaces/<project-id>` với tiến độ realtime → `ready`.

**Independent Test**: Clone repo (public/private) → thanh tiến độ chạy → `ready`, thư mục là git repo với base branch checked out.

### Tests (red trước)

- [ ] T024 [P] [US2] Test progress-parser: chuỗi stderr `git clone --progress` mẫu (Counting/Compressing/Receiving/Resolving) → `(phase, progress 0–100)` — `backend/gateway/tests/test_git_progress.py` (FR-011, SC-002)
- [ ] T025 [P] [US2] Test GIT_ASKPASS: clone (local bare repo làm remote) không ghi token vào `.git/config`/args; folder đích không rỗng → từ chối; clone xong là git repo hợp lệ có HEAD — `backend/gateway/tests/test_git_ops.py` (SC-001/SC-005, FR-013)
- [ ] T026 [P] [US2] Test provisioning job + Redis publish: job `clone` chuyển `provisioning`→`ready`; fail/cancel → dọn folder dở + `error`/`unlinked` — `backend/gateway/tests/test_provisioning.py` (FR-014, SC-003)

### Implementation

- [ ] T027 [US2] `git_ops.py`: `clone(remote, dest, branch, token)` qua subprocess + GIT_ASKPASS script + parse `--progress` stderr theo dòng/`\r` → callback tiến độ; guard folder không rỗng — `backend/gateway/src/specdeck_gateway/git_ops.py` (depends T010; làm T024/T025 xanh)
- [ ] T028 [US2] `provisioning.py`: orchestrate job (tạo `provisioning_job` + set `project.active_job_id`, chạy git_ops, publish Redis qua helper `channel_for('ws:provision', job_id)`, cập nhật `project.workspace_status`, dọn dẹp khi fail/cancel); concurrency dựa **partial unique index** (insert job `running` thứ 2 cùng project → IntegrityError → 409). Viết `channel_for` + reconcile sweep **generic** (tái dùng agent-execution) — `backend/gateway/src/specdeck_gateway/provisioning.py` (depends T027, T012; làm T026 xanh)
- [ ] T029 [US2] `routers/workspace.py`: `POST /api/projects/{id}/workspace` mode `clone` (202 + job_id; 409 `target_not_empty`; 401 `github_reauth_required`) + `GET …/workspace` + `POST …/cancel` theo contracts — `backend/gateway/src/specdeck_gateway/routers/workspace.py` (depends T028)
- [ ] T030 [US2] SSE `GET /api/projects/{id}/workspace/events` (sse-starlette): snapshot từ Postgres (`project.active_job_id`→job) → relay Redis + heartbeat ~15s, đóng stream khi done/error theo contracts/provisioning-events.md. Tách hàm relay **generic** (`snapshot_loader` thay được) để agent-execution tái dùng — `backend/gateway/src/specdeck_gateway/routers/workspace.py` (depends T028)
- [ ] T031 [US2] Include `workspace` router trong `main.py` — `backend/gateway/src/specdeck_gateway/main.py`
- [ ] T032 [P] [US2] Web workspace API client (`createWorkspace`/`getWorkspace`/`cancel`) + SSE hook `useProvisioningEvents` (EventSource: snapshot+progress+done+error, auto-reconnect) — `web/src/lib/api/workspace.ts`
- [ ] T033 [US2] Web nhánh "Clone repo" trong Connect code: chọn repo+base branch → POST → thanh tiến độ realtime → `ready` — `web/src/components/workspace/new-project-dialog.tsx`
- [ ] T034 [P] [US2] Vitest cho SSE hook (mock EventSource: snapshot→progress→done; reconnect) — `web/src/lib/api/__tests__/workspace.test.ts`

**Checkpoint**: US1+US2 = MVP "đưa code thật lên deck".

---

## Phase 5: User Story 3 - Tạo Project mới không remote (Priority: P2)

**Goal**: "Start empty" → `git init` repo trống trong managed root → `ready`.

**Independent Test**: "Start empty (no repository)" → `workspaces/<id>` là git repo mới, default branch đặt, `ready`.

### Tests (red trước)

- [ ] T035 [P] [US3] Test `git_ops.init(dest, default_branch)`: tạo git repo hợp lệ (`rev-parse --is-inside-work-tree` true), default branch đúng; folder không rỗng lạ → từ chối — `backend/gateway/tests/test_git_init.py` (FR-009, FR-013)

### Implementation

- [ ] T036 [US3] Thêm `init(dest, default_branch)` vào `git_ops.py` — `backend/gateway/src/specdeck_gateway/git_ops.py` (làm T035 xanh)
- [ ] T037 [US3] Nhánh `mode: init` trong `provisioning.py` + `POST …/workspace` (contracts) — `backend/gateway/src/specdeck_gateway/provisioning.py`, `routers/workspace.py`
- [ ] T038 [US3] Web nhánh "Start empty (no repository)" trong Connect code → POST init → `ready` — `web/src/components/workspace/new-project-dialog.tsx`

**Checkpoint**: greenfield không cần GitHub vẫn tạo Workspace `ready`.

---

## Phase 6: User Story 4 - Link / auto-detect folder trong managed root (Priority: P2)

**Goal**: Link folder có sẵn trong managed root; git có remote → auto-detect+prefill; chưa git → `git init`.

**Independent Test**: Đặt folder git (có remote) trong root → Browse thấy → link → remote auto-detect → `ready`; folder non-git → đề nghị `git init`. Traversal `../` → từ chối; folder đã link → 409.

### Tests (red trước)

- [ ] T039 [P] [US4] Test browse: chỉ liệt kê thư mục con trực tiếp trong root, `is_git`/`remote_url` đúng; `path` thoát root → `400 path_outside_root` — `backend/gateway/tests/test_browse.py` (FR-008, SC-004)
- [ ] T040 [P] [US4] Test link: git có remote → đọc `git remote` prefill + `ready`; non-git → init + `ready`; folder đã link cho Project khác → `409 folder_already_linked` — `backend/gateway/tests/test_link.py` (FR-012/FR-015)

### Implementation

- [ ] T041 [US4] `git_ops.detect_remote(path)` (đọc `git remote get-url origin`) + helper kiểm tra is-git — `backend/gateway/src/specdeck_gateway/git_ops.py`
- [ ] T042 [US4] `GET /api/workspaces/browse` (path-safe, liệt kê dir + is_git + remote_url) — `backend/gateway/src/specdeck_gateway/routers/workspace.py` (depends T010; làm T039 xanh)
- [ ] T043 [US4] Nhánh `mode: link` trong `provisioning.py`/`routers/workspace.py`: auto-detect remote hoặc init; chặn collision qua unique `rel_path` → 409 — (depends T041; làm T040 xanh)
- [ ] T044 [US4] Web folder picker (browse managed root) + nhánh "Link existing folder" với prefill remote — `web/src/components/workspace/new-project-dialog.tsx`

**Checkpoint**: uc3+uc4 (link/auto-detect) hoạt động, path-safe.

---

## Phase 7: User Story 5 - Broken-link + reconnect / unlink (Priority: P3)

**Goal**: Folder Workspace mất/di chuyển → `broken` với hành động Reconnect/Unlink rõ ràng.

**Independent Test**: Xoá `workspaces/<id>` → mở Project → `broken` + nút Reconnect (clone/init lại) + Unlink.

### Tests (red trước)

- [ ] T045 [P] [US5] Test lazy health-check: `ready` nhưng folder mất/không phải git → `broken` (lý do cụ thể) — `backend/gateway/tests/test_health_check.py` (FR-017)
- [ ] T046 [P] [US5] Test reconnect (có remote → clone lại; không remote → init lại) + unlink (gỡ liên kết, mặc định không xoá file; `?purge` mới xoá) — `backend/gateway/tests/test_reconnect_unlink.py` (FR-018)

### Implementation

- [ ] T047 [US5] Health-check trong `GET …/workspace` (lazy: `ready` mà path mất → `broken`) — `backend/gateway/src/specdeck_gateway/routers/workspace.py` (làm T045 xanh)
- [ ] T048 [US5] `POST …/workspace/reconnect` + `DELETE …/workspace` (`?purge=true`) trong provisioning/router — (làm T046 xanh)
- [ ] T049 [US5] Web khối Workspace ở Project Settings: hiển thị path/remote/base branch/status + broken state + Reconnect/Unlink (FR-021) — `web/src/components/workspace/` settings form
- [ ] T050 [P] [US5] Web hiển thị trạng thái `broken` + actions trên Project (entry point từ board/sidebar) — `web/src/components/workspace/` (component liên quan)

**Checkpoint**: vòng đời Workspace bền vững trước khi agent thật chạy.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: ADR, docs, validation toàn feature.

- [ ] T051 [P] Viết ADR `docs/design-docs/workspace-provisioning.md` (Context/Decision/Alternatives/Consequences): (a) Gateway sở hữu git provisioning + chia sẻ volume với Agent, (b) SQLAlchemy async + Alembic là persistence layer đầu tiên của backend (Constitution VI)
- [ ] T052 [P] Cập nhật `backend/AGENTS.md` (hoặc `backend/gateway/AGENTS.md`) ghi cấu trúc mới (db/migrations/provisioning/git_ops) — table-of-contents, không encyclopedia
- [ ] T053 Chạy full validation theo `quickstart.md` (migrate, pytest gateway, vitest+tsc+eslint web, scenario US1–US5, audit SC-001 grep `.git/config`, SC-005 worktree, SC-006 restart) và đánh dấu kết quả
- [ ] T054 [P] Cập nhật `docs/glossary.md` (+ DESIGN nếu cần): thuật ngữ Workspace/GitHubConnection/ProvisioningJob, trạng thái

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (P1)**: không phụ thuộc — bắt đầu ngay.
- **Foundational (P2)**: sau Setup — **chặn mọi US**.
- **US1/US2/US3/US4/US5 (P3–P7)**: đều sau Foundational.
  - US1 và US3 độc lập (US3 không cần OAuth).
  - US2 cần US1 (clone private dùng token) — nhưng clone public test được độc lập.
  - US4 cần git_ops từ US2/US3 (clone/init) cho nhánh reconnect/init.
  - US5 cần có Workspace tồn tại (US2 hoặc US3) để health-check/reconnect.
- **Polish (P8)**: sau các US mong muốn.

### Within Each User Story

- Test (red) trước → implement (green).
- models → services (`git_ops`/`provisioning`) → routers/endpoints → web client → web UI.
- Hoàn tất một story trước khi sang priority kế.

### Parallel Opportunities

- Setup: T002/T003/T004 [P] song song (T001 trước cho deps).
- Foundational: test T006/T007 [P]; impl T008/T009/T010 [P] (độc lập file); T011→T012→T013 tuần tự (cùng schema).
- US1: T016/T017 [P]; client T021/T023 [P] song song với backend.
- US2: test T024/T025/T026 [P]; web T032/T034 [P].
- US4/US5: các test [P]; nhiều test file độc lập.

---

## Parallel Example: User Story 1

```bash
# Tests song song (red trước):
Task: "Test OAuth callback (respx) in backend/gateway/tests/test_github_oauth.py"
Task: "Test github router no-token + repos in backend/gateway/tests/test_github_router.py"

# Web client song song với backend impl:
Task: "GitHub API client in web/src/lib/api/github.ts"
Task: "Vitest GitHub client in web/src/lib/api/__tests__/github.test.ts"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1 Setup → Phase 2 Foundational (CRITICAL).
2. Phase 3 US1 (Connect GitHub) → STOP & VALIDATE (token không lộ client).
3. Phase 4 US2 (Clone + progress) → STOP & VALIDATE (worktree-ready).
4. Demo: "đưa code thật lên deck".

### Incremental Delivery

- Setup + Foundational → nền.
- + US1 → connect/list repo.
- + US2 → clone (MVP).
- + US3 → greenfield init.
- + US4 → link/auto-detect.
- + US5 → broken/reconnect/unlink.
- Mỗi story thêm giá trị, không phá story trước.

---

## Notes

- [P] = khác file, không phụ thuộc task chưa xong.
- TDD bắt buộc cho lõi an toàn: verify test FAIL trước khi implement.
- Token GitHub **chỉ** ở backend, mã hoá at-rest — không lọt response/bundle/log client (SC-001).
- Mọi path qua `pathsafe` (SC-004); không browse host fs ngoài managed root.
- Commit theo Conventional Commits sau mỗi task/nhóm logic; không `Co-Authored-By`; không `--no-verify`.
- ADR (T051) là cổng docs-as-code trước khi đóng feature.
