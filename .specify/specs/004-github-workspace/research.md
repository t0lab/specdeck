# Research: Workspace Provisioning + GitHub OAuth

Phase 0 — chốt các quyết định kỹ thuật. Mỗi mục: **Decision / Rationale / Alternatives**.

## R1 — GitHub auth: OAuth App **Device Flow** (user-to-server)

- **Decision**: OAuth **Device Authorization Flow** (như `gh login`). `POST https://github.com/login/device/code` (client_id + `scope=repo read:user`) → `user_code` + `verification_uri` + `device_code`; user nhập `user_code` tại `github.com/login/device`; gateway poll `POST https://github.com/login/oauth/access_token` (`grant_type=urn:ietf:params:oauth:grant-type:device_code`) lấy token. Scope `repo` (clone private) + `read:user` (login). Token OAuth App mặc định **không hết hạn**, không refresh trong v1.
- **Rationale**: Device Flow bỏ được **client secret** và **callback URL** (không ghép cứng với hostname tunnel) — đúng pain point self-host. `client_id` không bí mật (nằm công khai trong binary `gh`), nên SpecDeck **ship một `DEFAULT_GITHUB_CLIENT_ID`** (OAuth App của dự án, bật Device Flow) → self-hoster zero-config; override bằng env `GITHUB_CLIENT_ID`. device_code giữ server-side; chỉ user_code/verification_uri xuống client. Không cần `state`/CSRF vì không có redirect callback.
- **Alternatives**: *Web (Authorization Code) flow* — cần secret + callback khớp tunnel (phiền cho self-host); rejected. *PAT paste* — đơn giản nhưng UX thô, token sống lâu, scope rộng tay user. *Đọc `gh auth token`* — phụ thuộc gh cài+login trên host + mount config vào container, kém portable. *GitHub App* — setup nặng, thừa cho 1 user.

## R2 — Clone private không lộ token vào đĩa/args/reflog

- **Decision**: Dùng `GIT_ASKPASS`: một script nhỏ in token đọc từ biến môi trường (`GITHUB_TOKEN`) chỉ truyền cho subprocess `git`. Remote URL giữ **sạch** (`https://github.com/owner/repo.git`, username `x-access-token`). Token KHÔNG nằm trong `.git/config`, command args, hay reflog.
- **Rationale**: Nhúng token vào URL (`https://x-access-token:<tok>@…`) sẽ ghi token vào `.git/config` + xuất hiện trong `ps`/log → vi phạm SC-001. ASKPASS giữ token chỉ trong env của tiến trình con.
- **Alternatives**: URL có token (rejected — leak). `git credential` store (rejected — ghi đĩa). Bind token qua stdin (git không hỗ trợ trực tiếp cho https).

## R3 — Parse tiến độ clone

- **Decision**: `git clone --progress` (+ `git init` nhanh nên không cần). Đọc **stderr** theo dòng, tách trên `\r`, regex lấy phase + `%` (`Counting`, `Compressing`, `Receiving objects: NN%`, `Resolving deltas: NN%`). Map về một `progress` 0–100 thô + nhãn phase. Publish mỗi cập nhật lên Redis.
- **Rationale**: `--progress` ép git phát tiến độ kể cả khi stderr không phải TTY. Đủ để SC-002 (cập nhật ≤2s).
- **Alternatives**: `git clone --filter`/partial — không cần. Thư viện pygit2/dulwich — thêm dep nặng, subprocess đơn giản hơn và khớp môi trường có sẵn `git`.

## R4 — Stream tiến độ: Redis pub/sub → SSE

- **Decision**: Mỗi job có channel Redis `ws:provision:<job_id>`. `provisioning.py` publish event JSON (`phase`, `progress`, `status`, `message`). Endpoint SSE `GET /api/projects/{id}/workspace/events` dùng `sse-starlette`, subscribe channel, **gửi snapshot trạng thái hiện tại từ Postgres trước**, rồi relay live; heartbeat giữ kết nối. Reconnect client → lại snapshot + live (idempotent).
- **Rationale**: Tách tiến trình clone (chạy ở server, không phụ thuộc kết nối UI — edge case "mất SSE giữa chừng") khỏi việc xem. Khớp pattern board realtime đã có (`/api/stream` demo) và Constitution (SSE xuống, REST lên).
- **Alternatives**: WebSocket (thừa, một chiều là đủ). Long-poll (kém realtime). Giữ progress trong memory gateway (mất khi nhiều worker/restart).

## R5 — Mã hoá token at-rest

- **Decision**: `cryptography` Fernet (AES-128-CBC + HMAC). Key 32-byte urlsafe-base64 từ env `TOKEN_ENCRYPTION_KEY`. Encrypt trước khi lưu, decrypt khi gọi GitHub. Cột lưu ciphertext (bytes/text).
- **Rationale**: Đối xứng, đơn giản, đủ cho 1 token self-host; key tách khỏi DB (env/secret manager) → lộ DB không lộ token.
- **Alternatives**: Lưu plaintext (rejected — vi phạm bảo mật). KMS/Vault (thừa cho self-host v1). pgcrypto (gắn chặt DB, vẫn cần key quản lý ngoài).

## R6 — Chống path traversal trong managed root

- **Decision**: `WORKSPACE_ROOT` cố định. Mọi path = `(Path(WORKSPACE_ROOT) / candidate).resolve(strict=False)`; assert `resolved.is_relative_to(Path(WORKSPACE_ROOT).resolve())`; từ chối nếu không. Browse chỉ liệt kê **thư mục con trực tiếp** đã resolve trong root; bỏ qua/loại symlink trỏ ra ngoài. project-id chỉ nhận `[a-z0-9-]` (slug đã có ở web) → tên thư mục an toàn.
- **Rationale**: `resolve()` chuẩn hoá `..`/symlink trước khi kiểm tra → chặn traversal (SC-004).
- **Alternatives**: So sánh chuỗi prefix (rejected — bị `..`/symlink lừa). chroot/namespace (thừa, container đã cô lập phần nào).

## R7 — Persistence layer (gateway chưa có)

- **Decision**: **SQLAlchemy 2.0 async + asyncpg + Alembic**. Bảng: `project` (tối thiểu: id, name), `github_connection`, `workspace`, `provisioning_job`. Migration chạy qua Alembic (lệnh `alembic upgrade head` trong entrypoint/khởi động).
- **Rationale**: Là persistence đầu tiên của backend; sẽ còn Spec/Check/Evidence sau → cần layer có migration history + typed models. asyncpg khớp FastAPI async.
- **Alternatives**: asyncpg thuần + SQL files (nhẹ hơn nhưng tự quản migration, dễ trôi schema). Tortoise/SQLModel (ít phổ biến/ổn định hơn cho async + Alembic). → Quyết định này **ADR-worthy**: ghi `docs/design-docs/workspace-provisioning.md`.
- **Scope note**: 004 chỉ persist Project ở mức tối thiểu (id, name) làm FK cho Workspace. Việc chuyển toàn bộ Project/board từ mock (003) sang Postgres là feature riêng sau; board/Spec vẫn mock trong 004.

## R8 — Gateway sở hữu git provisioning (không phải Agent)

- **Decision**: **Gateway** chạy `git clone/init` (subprocess) và sở hữu quyền ghi vào volume `workspaces`. Agent Server mount **cùng** volume (rw) để dùng worktree về sau, nhưng KHÔNG lo provisioning.
- **Rationale**: Provisioning là infra REST-driven, cần OAuth token (đã ở gateway); Agent (LangGraph) dành cho graph-run, không phải nơi chạy git tuỳ ý. Giữ Gateway ≠ Agent (chỉ chia sẻ volume). ADR cùng chỗ R7.
- **Alternatives**: Agent chạy clone (rejected — lệch vai trò, token phải sang agent). Service git-ops thứ 4 (thừa cho v1).

## R9 — Hoà giải job kẹt + broken-link

- **Decision**: Khi gateway khởi động: `UPDATE provisioning_job SET status='error', message='interrupted by restart' WHERE status='provisioning'` và set `workspace.status` tương ứng `error/broken`. Health-check (lazy khi mở Project, hoặc lệnh): nếu `workspace.status='ready'` nhưng path không tồn tại / không phải git → `broken`.
- **Rationale**: SC-006 (không kẹt `provisioning`); edge "folder bị xoá".
- **Alternatives**: Heartbeat job + watchdog (thừa cho v1; reconcile-on-startup + lazy check đủ).

## Dependencies thêm (đưa vào tasks)

- gateway pyproject: `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `cryptography`, `pytest`, `pytest-asyncio`, `respx` (mock httpx GitHub).
- compose: named volume `workspaces` (rw cho gateway+agent); env `WORKSPACE_ROOT`, `TOKEN_ENCRYPTION_KEY`, và **tuỳ chọn** `GITHUB_CLIENT_ID` (override default ship sẵn). Device Flow → **không** cần `GITHUB_CLIENT_SECRET`/`GITHUB_OAUTH_CALLBACK`.
- web: API client + `EventSource` SSE hook (không thêm dep nặng).
