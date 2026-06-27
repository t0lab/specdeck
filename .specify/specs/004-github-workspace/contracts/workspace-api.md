# Contract: Workspace + GitHub REST API (gateway)

Base: `/api` (same-origin qua Cloudflare Tunnel → gateway). Mọi response JSON. **Token GitHub không bao giờ xuất hiện trong bất kỳ response nào.**

## GitHub OAuth (US1)

### `GET /api/github/connect`
Khởi tạo OAuth web flow. Tạo `state` (CSRF, lưu tạm), 302 redirect tới GitHub authorize (`scope=repo read:user`).
→ `302` Location: `https://github.com/login/oauth/authorize?...`

### `GET /api/github/callback?code=&state=`
Callback từ GitHub. Verify `state`; đổi `code` → access token; mã hoá + lưu `github_connection`; lấy `github_login`.
→ `302` về web (vd `/` hoặc trang đang tạo Project) với cờ thành công. Lỗi (deny/state sai) → `302` kèm thông báo, **không** tạo bản ghi token.

### `GET /api/github/status`
→ `200 { "connected": bool, "github_login": str|null, "scope": str|null, "status": "active|expired|revoked"|null }`

### `DELETE /api/github/connection`
Thu hồi token đã lưu (xoá bản ghi). → `204`.

### `GET /api/github/repos?query=&page=`
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

→ `202 { "workspace": {…}, "job_id": "uuid" }` — bắt đầu provisioning, theo dõi qua SSE.
→ `409 { "error": "target_not_empty" | "folder_already_linked" }` (FR-013/FR-015).
→ `400 { "error": "path_outside_root" }` (FR-007) | `401 github_reauth_required` (clone private mất quyền).

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
→ `200 { "path": "<rel>", "dirs": [ { "name", "rel_path", "is_git": bool, "remote_url": str|null } ] }`
→ `400 path_outside_root` nếu `path` thoát root.

## Quy ước lỗi
`{ "error": "<machine_code>", "message": "<human, actionable>" }`. Mã: `target_not_empty`, `folder_already_linked`, `path_outside_root`, `github_reauth_required`, `repo_access_denied`, `clone_failed`, `not_a_git_repo`.
