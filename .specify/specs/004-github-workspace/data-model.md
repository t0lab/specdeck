# Data Model: Workspace Provisioning + GitHub OAuth

Bảng Postgres do **gateway** sở hữu (SQLAlchemy 2.0 + Alembic). **3 bảng**: `project` (gộp identity + workspace), `git_connection` (provider-generic), `provisioning_job` (mẫu streamed-run). Tên cột minh hoạ; kiểu cuối ở migration.

## Quyết định mô hình (chốt)

- **Gộp workspace vào `project`** — 1 Project ↔ 1 Workspace là bất biến cấu trúc (cùng 1 row), không cần bảng/`FK unique` riêng.
- **`git_connection` provider-generic** — cột `provider` (github nay, gitlab/bitbucket sau), `UNIQUE(provider)` cho self-host 1 user.
- **`provisioning_job` tách riêng** — 1 Project → **nhiều job theo thời gian** (clone → cancel → reconnect…), nhưng **≤1 job `running`** tại một thời điểm (provisioning độc quyền). Partial unique index ép ràng buộc này ở tầng DB.
- **`provisioning_job` là instance #1 của hạ tầng streamed-run** dùng chung (xem mục cuối). Agent-execution sau này là **conversation model riêng** (LangGraph checkpointer + conversation/message + interrupt/steering), chỉ **kế thừa hạ tầng streaming**, KHÔNG dùng lại bảng này.

## Enums (Postgres native enum)

```text
workspace_status  : unlinked | provisioning | ready | broken | error
workspace_source  : clone | init | linked
job_kind          : clone | init | reconnect
job_status        : running | success | error | cancelled
git_provider      : github                       -- gitlab | bitbucket thêm sau
connection_status : active | expired | revoked
```

## Entities

### `project` (gộp identity + workspace)

| Field | Type | Null | Notes |
|---|---|:--:|---|
| `id` | text **PK** | ✗ | slug `[a-z0-9-]` (khớp web `slugifyToId`) |
| `name` | text | ✗ | hiển thị |
| `created_at` | timestamptz | ✗ | `now()` |
| `updated_at` | timestamptz | ✗ | `now()` onupdate |
| `rel_path` | text **UNIQUE** | ✓ | đường dẫn tương đối trong managed root; unique ⇒ chống collision (FR-015) |
| `source` | `workspace_source` | ✓ | clone / init / linked |
| `remote_url` | text | ✓ | github https URL (null khi init không remote) |
| `base_branch` | text | ✓ | branch checkout (clone) / default (init) |
| `workspace_status` | `workspace_status` | ✗ | default `unlinked` |
| `active_job_id` | uuid **FK→provisioning_job** | ✓ | job đang chạy → SSE snapshot khỏi `ORDER BY` |

- **Validation**: `rel_path` phải resolve trong `WORKSPACE_ROOT` (FR-007); `remote_url` (nếu có) host github.com. App-level: `workspace_status != unlinked` ⇒ `rel_path`/`source` non-null.
- **State machine**:

```text
unlinked ──provision(clone|init|link)──▶ provisioning ──success──▶ ready
   ▲                                          │                     │
   │                                          ├──fail/cancel──▶ error/unlinked (dọn dẹp)
   └──────unlink──────────────────────────────┘                     │
ready ──folder mất/không phải git (health-check)──▶ broken           │
broken ──reconnect──▶ provisioning ───────────────────────────────────┘
(error|broken) ──unlink──▶ unlinked
```

### `git_connection` (provider-generic, singleton/provider)

| Field | Type | Null | Notes |
|---|---|:--:|---|
| `id` | int **PK** | ✗ | identity |
| `provider` | `git_provider` **UNIQUE** | ✗ | 1 connection / provider (self-host 1 user) |
| `account_login` | text | ✗ | hiển thị "Connected as …" |
| `token_ciphertext` | bytea | ✗ | **Fernet-encrypted** OAuth token — server-only (FR-002) |
| `scope` | text | ✗ | vd `repo,read:user` |
| `status` | `connection_status` | ✗ | default `active` |
| `connected_at` | timestamptz | ✗ | `now()` |

- **Validation**: token không bao giờ trả ra API client (chỉ `account_login`, `scope`, `status`, `provider`).
- **Transitions**: `active` → `revoked` (user disconnect) / `expired` (GitHub 401) → re-auth → `active`.
- **Mở rộng provider**: thêm GitLab = thêm value enum + dòng `provider='gitlab'`; không đổi schema.

### `provisioning_job` (1 project → nhiều job; nguồn stream tiến độ)

| Field | Type | Null | Notes |
|---|---|:--:|---|
| `id` | uuid **PK** | ✗ | dùng làm Redis channel `ws:provision:<id>` |
| `project_id` | text **FK→project** | ✗ | |
| `kind` | `job_kind` | ✗ | clone / init / reconnect |
| `status` | `job_status` | ✗ | default `running` |
| `phase` | text | ✓ | vd `Receiving objects` |
| `progress` | smallint | ✓ | 0–100 (snapshot thô; Redis tải tick mịn) |
| `message` | text | ✓ | lỗi/ghi chú hành động được |
| `started_at` | timestamptz | ✗ | `now()` |
| `ended_at` | timestamptz | ✓ | |

- **Partial unique index** (concurrency-guard ở DB, mạnh hơn check app-level):

```sql
CREATE UNIQUE INDEX one_active_job_per_project
    ON provisioning_job (project_id) WHERE status = 'running';
```

- **Reconcile (FR-019/SC-006)**: startup → `UPDATE provisioning_job SET status='error', ended_at=now() WHERE status='running'`; workspace tương ứng → `error/broken`.

## Relationships

```text
project (1) ──< (n) provisioning_job            -- 1 project nhiều job theo thời gian, ≤1 'running'
project.active_job_id ──> provisioning_job.id   -- trỏ job đang chạy (nullable)
git_connection (singleton/provider)             -- dùng cho mọi clone private + list repo
```

> **Circular FK** (`project.active_job_id` ↔ `provisioning_job.project_id`): migration tạo 2 bảng trước, thêm constraint `active_job_id` sau (hoặc deferrable). Xem tasks T013.

## Đại lượng phái sinh / không lưu

- Danh sách repo GitHub: **không** lưu, gọi live qua API (cache ngắn nếu cần rate-limit).
- Tiến độ realtime mịn: nguồn ngắn hạn là Redis; `provisioning_job.{phase,progress}` là snapshot bền để client reconnect lấy lại.
- FK `project → git_connection`: **không** (self-host 1 user, mọi clone dùng chung connection).

## Hạ tầng streaming dùng chung (provisioning = instance #1)

Viết generic, tái dùng cho **agent-execution** sau này (Constitution: Gateway bridge SSE; Agent Server riêng → publisher & SSE endpoint **khác container** ⇒ **Redis bắt buộc**, in-memory broker bất khả thi):

1. **Redis channel convention** — `channel_for(domain, id)`: provisioning `ws:provision:<job_id>`; tương lai agent `agent:thread:<thread_id>`.
2. **SSE snapshot-then-relay** — snapshot từ DB → relay Redis → heartbeat ~15s. Provisioning snapshot = job row; agent snapshot = replay message/timeline persisted. Cùng hàm relay, khác `snapshot_loader`.
3. **REST-command-lên** — provisioning `cancel` (1 lệnh lên job đang chạy) = phiên bản tối giản của **steering** (chèn message lên run đang chạy) ở agent-execution.
4. **Reconcile-on-startup** — sweep mọi run `running` → `error`; dùng chung cho `provisioning_job` và `agent_run` sau này.

**Phân kỳ (flag, KHÔNG build ở 004):** agent-execution là conversation model — `conversation(task_id, thread_id, status)` + `message(role, content, metadata)` + steering qua LangGraph interrupt/resume; timeline/Evidence/Check persist để review bất đồng bộ. Thuộc spec agent-execution riêng.
