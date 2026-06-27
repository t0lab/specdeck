# Contract: Workspace + GitHub REST API (gateway)

Base: `/api` (same-origin qua Cloudflare Tunnel → gateway). Mọi response JSON. **Token GitHub không bao giờ xuất hiện trong bất kỳ response nào.**

## GitHub auth — OAuth **Device Flow** (US1)

> Base path `**/api/integrations/github**` — provider-namespaced. Future providers
> slot in as `/api/integrations/gitlab/*` (matches the provider-generic
> `git_connection` table).
>
> **Device Flow** (như `gh login`): KHÔNG client secret, KHÔNG callback URL. Chỉ cần
> một `client_id` (không bí mật) — SpecDeck ship sẵn một `DEFAULT_GITHUB_CLIENT_ID`
> (OAuth App của dự án, đã bật Device Flow); self-hoster để trống env là chạy được,
> hoặc set `GITHUB_CLIENT_ID` để dùng app riêng. device_code **không bao giờ** xuống
> client — chỉ `user_code` + `verification_uri` được trả về để user nhập.

### `POST /api/integrations/github/device/start`
Bắt đầu device flow: gateway gọi GitHub `POST /login/device/code` (client_id + `scope=repo read:user`), lưu `device_code` server-side, trả mã cho user nhập.
→ `200 { "user_code": "WDJB-MJHT", "verification_uri": "https://github.com/login/device", "expires_in": 900, "interval": 5 }`

### `POST /api/integrations/github/device/poll`
Client gọi lặp lại mỗi `interval` giây. Gateway poll GitHub một lần bằng `device_code` đã lưu. Khi có token → fetch login, mã hoá + lưu `git_connection`, xoá pending.
→ `200 { "state": "pending" }` — user chưa nhập xong (GitHub `authorization_pending`/`slow_down`; có thể kèm `interval` mới).
→ `200 { "state": "connected", "github_login": "octocat" }` — đã lưu connection.
→ `200 { "state": "expired" }` — mã hết hạn (user phải `device/start` lại).
→ `200 { "state": "denied" }` — user từ chối trên GitHub.
→ `409 { "error": "no_pending_device_flow" }` — chưa gọi `device/start`.

### `GET /api/integrations/github/status`
→ `200 { "connected": bool, "github_login": str|null, "scope": str|null, "status": "active|expired|revoked"|null }`

### `DELETE /api/integrations/github/connection`
Thu hồi token đã lưu (xoá bản ghi). → `204`.

### `GET /api/integrations/github/repos?query=&page=`
List repo của user đã kết nối (gọi GitHub live, dùng token decrypt server-side).
→ `200 { "repos": [ { "full_name": "owner/repo", "private": bool, "default_branch": str } ], "next_page": int|null }`
→ `401 { "error": "github_reauth_required" }` nếu token expired/revoked (FR-005).

## Workspace provisioning (US2/US3/US4/US5)

### `POST /api/projects/{projectId}/workspace`
Tạo Workspace cho Project. Một trong các `mode`:

```jsonc
// clone (US2)
{ "mode": "clone", "remote_url": "https://github.com/owner/repo.git", "base_branch": "main" }
// init (US3)
{ "mode": "init", "default_branch": "main" }
// link folder có sẵn trong managed root (US4)
{ "mode": "link", "rel_path": "<project-id>" }   // auto-detect remote nếu là git; git init nếu chưa
```

→ `202 { "workspace": {…}, "job_id": "uuid" }` — `clone`/`init` bắt đầu provisioning, theo dõi qua SSE.
→ `200 { "workspace": {…ready}, "job_id": null }` — `link` là **đồng bộ** (detect remote / `git init` tức thời), trả ngay `ready`, không cần job/SSE.
→ `409 { "error": "target_not_empty" | "folder_already_linked" }` (FR-013/FR-015).
→ `400 { "error": "path_outside_root" | "folder_inside_repo" | "folder_has_repos" }` (FR-007/FR-012) | `401 github_reauth_required` (clone private mất quyền).
  - `folder_inside_repo`: `rel_path` nằm **trong** một repo khác (tổ tiên có `.git`) → link gốc repo thay vì thư mục con.
  - `folder_has_repos`: folder plain nhưng **chứa** repo con (container) → mở vào trong rồi link từng repo.

### `GET /api/projects/{projectId}/workspace`
→ `200 { "status": "unlinked|provisioning|ready|broken|error", "source", "remote_url", "base_branch", "rel_path", "latest_job": {…}|null }`
Lazy health-check: nếu `ready` nhưng folder mất → trả `broken` (FR-017).

### `POST /api/projects/{projectId}/workspace/reconnect`
Clone lại (nếu có remote) hoặc init lại (US5.2). → `202 { "job_id" }`.

### `POST /api/projects/{projectId}/workspace/cancel`
Huỷ job đang chạy + dọn thư mục dở (FR-014). → `200`.

### `DELETE /api/projects/{projectId}/workspace`
Unlink (gỡ liên kết, mặc định **không** xoá file). Query `?purge=true` để xoá đĩa (xác nhận riêng). → `204`.

### `GET /api/workspaces/browse?path=`
List thư mục con **trong** managed root cho folder picker (FR-008). `path` rỗng = root.
→ `200 { "path": "<rel>", "dirs": [ { "name", "rel_path", "is_git": bool, "remote_url": str|null, "selectable": bool, "can_enter": bool } ] }`
  - **git repo** (`is_git`): `selectable=true`, `can_enter=false` — link as-is, là **leaf** (không drill vào trong repo).
  - **plain leaf** (không git, không chứa repo): `selectable=true`, `can_enter=true` — `git init` khi link.
  - **container** (plain nhưng chứa repo con): `selectable=false`, `can_enter=true` — chỉ để mở vào.
→ `400 path_outside_root` nếu `path` thoát root.

## Quy ước lỗi
`{ "error": "<machine_code>", "message": "<human, actionable>" }`. Mã: `target_not_empty`, `folder_already_linked`, `folder_inside_repo`, `folder_has_repos`, `path_outside_root`, `github_reauth_required`, `repo_access_denied`, `clone_failed`, `not_a_git_repo`.
