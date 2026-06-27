# Quickstart / Validation: Workspace Provisioning + GitHub OAuth

Chứng minh feature chạy end-to-end. Dev stack chạy trong Docker (KHÔNG dựng host dev server). Lệnh chạy trong container tương ứng.

## Prerequisites

- `docker compose up` (postgres, redis, agent, gateway, web) đang chạy.
- Một **OAuth App** GitHub đã đăng ký; đặt env trong `.env`:
  `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_OAUTH_CALLBACK=https://specdeck-api.<domain>/api/github/callback`,
  `TOKEN_ENCRYPTION_KEY` (Fernet key), `WORKSPACE_ROOT=/workspaces`.
- Named volume `workspaces` mount rw vào `gateway` và `agent`.
- Migrations đã chạy: `docker compose exec -T gateway sh -lc "alembic upgrade head"`.

## Setup / migrate

```sh
docker compose exec -T gateway sh -lc "alembic upgrade head"
docker compose exec -T gateway sh -lc "python -c 'import os; print(os.getenv(\"WORKSPACE_ROOT\"))'"
```

## Backend tests (TDD — phải xanh)

```sh
docker compose exec -T gateway sh -lc "pytest -q"
```
Bao phủ: `pathsafe` (chặn `../`/symlink ngoài root), `crypto` (encrypt→decrypt roundtrip), `git_ops` progress-parser (chuỗi stderr mẫu → phase/progress), clone/init vào tmp root, askpass không lộ token vào `.git/config`, OAuth callback (mock GitHub qua `respx`), reconcile job kẹt.

## Web tests

```sh
docker compose exec -T web sh -lc "pnpm exec vitest run && pnpm exec tsc --noEmit && pnpm exec eslint src"
```

## Scenario US1 — Connect GitHub (SC-001)

1. UI → "Connect GitHub" → authorize trên GitHub → quay lại thấy "Connected as <login>".
2. `curl -s $API/api/integrations/github/status` → `{ "connected": true, "github_login": "...", "status": "active" }`.
3. **SC-001 audit**: kiểm tra `/api/integrations/github/status` + bundle web + Network tab → **không** có access token. `curl` mọi response không chứa token.
4. `GET /api/integrations/github/repos?query=spec` → list repo (có private).

## Scenario US2 — Clone (SC-002, SC-005)

1. NewProjectDialog → Connect code → chọn repo + base branch → Clone.
2. UI hiển thị tiến độ **trong ≤2s** và cập nhật liên tục (SC-002).
3. Kết thúc → Workspace `ready`.
4. **SC-005**: `docker compose exec -T gateway sh -lc "cd /workspaces/<project-id> && git worktree add /tmp/wt-test HEAD && echo WORKTREE_OK && git worktree remove /tmp/wt-test"` → in `WORKTREE_OK`.
5. **SC-001**: `docker compose exec -T gateway sh -lc "grep -r x-access-token /workspaces/<project-id>/.git/config || echo NO_TOKEN_IN_CONFIG"` → `NO_TOKEN_IN_CONFIG`.

## Scenario US3 — Init empty

1. New Project → "Start empty (no repository)".
2. Workspace `ready`; `git -C /workspaces/<id> rev-parse --is-inside-work-tree` → `true`.

## Scenario US4 — Link + auto-detect (SC-004)

1. Đặt sẵn folder git trong root: `docker compose exec -T gateway sh -lc "git clone --bare? ..."` (hoặc folder thật) trong `/workspaces/sample`.
2. Browse → thấy `sample`, `is_git: true`, `remote_url` auto-detect.
3. Link → `ready`.
4. **SC-004**: `POST …/workspace {mode:link, rel_path:"../../etc"}` → `400 path_outside_root`.
5. Link `sample` cho Project thứ hai → `409 folder_already_linked` (FR-015).

## Scenario US5 — Broken + reconnect (SC-006)

1. Xoá folder: `docker compose exec -T gateway sh -lc "rm -rf /workspaces/<id>"`.
2. `GET …/workspace` → `broken`.
3. Reconnect → clone/init lại → `ready`.
4. **SC-006**: bắt đầu clone repo lớn → `docker compose restart gateway` giữa chừng → sau khi up, `GET …/workspace` không còn `provisioning` (→ `error`/`broken`); không job nào kẹt `running`.

## Expected outcomes (map Success Criteria)

| SC | Kiểm chứng |
|---|---|
| SC-001 | Audit response/bundle/Network + grep `.git/config` → không token |
| SC-002 | Tiến độ ≤2s + liên tục khi clone |
| SC-003 | Mọi case lỗi → `error/broken` + message hành động được + không thư mục rác |
| SC-004 | `path_outside_root` cho mọi traversal |
| SC-005 | `git worktree add` thành công trên Workspace `ready` |
| SC-006 | Sau restart không job kẹt `provisioning` |
