# Feature Specification: Workspace Provisioning + GitHub OAuth

**Feature Branch**: `004-github-workspace`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Feature 004: Workspace provisioning + GitHub OAuth integration (THẬT, không mock) — cây cầu từ Project identity (003) sang working directory thật nơi Builder chạy git worktree."

## Bối cảnh

Feature 003-projects đã dựng workspace UI: mỗi **Project** có identity + một chuỗi `repo` + Project Context + board riêng — nhưng **chưa có thư mục code thật trên đĩa**. 004 là feature backend-thật **đầu tiên**: biến `repo` (mock string) thành một **Workspace** — một git repo thật nằm trên server, sẵn-sàng để Builder tách `git worktree` sau này.

Mỗi Project tham chiếu tối đa **một** Workspace. Việc cấp phát Workspace có 4 đường vào tuỳ theo user đã có **remote GitHub** chưa và đã có **thư mục code** (trong managed root) chưa.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect GitHub qua Device Flow (Priority: P1)

Là một người tự host SpecDeck, tôi kết nối GitHub của mình **một lần** kiểu `gh login` — bấm Connect, nhập một mã ngắn trên `github.com/login/device` — sau đó SpecDeck liệt kê được các repo của tôi (kể cả private). Token GitHub được giữ **hoàn toàn ở server**, không bao giờ xuống trình duyệt. Không cần đăng ký OAuth App hay cấu hình client secret/callback.

**Why this priority**: Mọi case "có remote" (uc2, uc3) phụ thuộc kết nối này; không có nó thì clone private bất khả thi. Đây là nền tảng auth của toàn feature.

**Independent Test**: Bấm "Connect GitHub" → thấy mã + link → nhập mã trên GitHub → quay lại SpecDeck thấy trạng thái "Connected as <github-login>" và danh sách repo load được. Kiểm tra DevTools Network + JS bundle: **không** thấy access token (và **không** thấy device_code) ở client.

**Acceptance Scenarios**:

1. **Given** chưa kết nối GitHub, **When** user bấm "Connect GitHub", nhập user_code trên `github.com/login/device` và approve, **Then** SpecDeck (đang poll) lưu token server-side, hiển thị github-login đã kết nối, và list được repo của user.
2. **Given** đã kết nối, **When** user mở bước chọn repo, **Then** danh sách repo (tên, owner, private/public, default branch) hiển thị, có tìm kiếm/lọc.
3. **Given** user từ chối trên GitHub (deny) hoặc để mã hết hạn, **When** SpecDeck poll, **Then** trạng thái vẫn "chưa kết nối", báo rõ (denied/expired) và nút thử lại — không tạo bản ghi token rác.
4. **Given** token đã hết hạn hoặc bị revoke trên GitHub, **When** SpecDeck gọi API GitHub thất bại vì auth, **Then** trạng thái chuyển "cần kết nối lại" và mời user re-authorize (không lỗi mơ hồ).

---

### User Story 2 - Clone repo có sẵn vào Workspace (Priority: P1)

Là người tạo Project từ một repo GitHub đã tồn tại, tôi chọn repo + base branch, SpecDeck **clone** repo đó vào managed workspaces root và hiển thị **tiến độ clone realtime**. Khi xong, Workspace ở trạng thái `ready`.

**Why this priority**: Đây là đường vào phổ biến nhất (uc2) — đa số user mang theo codebase có sẵn. Cùng US1 tạo thành MVP "đưa code thật lên deck".

**Independent Test**: Chọn một repo (public hoặc private), bấm Clone → thấy thanh tiến độ chạy → kết thúc, Workspace `ready`, và thư mục `workspaces/<project-id>` chứa git repo đã clone với đúng base branch checked out.

**Acceptance Scenarios**:

1. **Given** đã connect GitHub và chọn một repo + base branch, **When** bấm Clone, **Then** Workspace chuyển `provisioning`, tiến độ clone stream xuống UI, và khi hoàn tất chuyển `ready` với commit HEAD = đầu base branch.
2. **Given** repo private mà token có quyền, **When** clone, **Then** clone thành công dùng token server-side (token không xuất hiện trong UI/log client).
3. **Given** repo private mà token **không** có quyền, **When** clone, **Then** Workspace chuyển `error` với thông báo "không có quyền truy cập repo" + gợi ý kiểm tra OAuth scope, không để lại thư mục nửa vời.
4. **Given** clone đang chạy, **When** user huỷ, **Then** tiến trình dừng, thư mục đang clone dở được dọn sạch, Workspace về trạng thái chưa cấp phát.
5. **Given** đường dẫn `workspaces/<project-id>` đã tồn tại và không rỗng, **When** clone, **Then** hệ thống từ chối ghi đè và báo lỗi rõ (không xoá dữ liệu sẵn có).

---

### User Story 3 - Tạo Project mới không có remote (Priority: P2)

Là người bắt đầu một codebase **mới tinh** (chưa có repo GitHub), tôi tạo Project không remote; SpecDeck `git init` một repo trống trong managed root để Builder có chỗ làm việc ngay.

**Why this priority**: Mở đường cho greenfield (uc1) mà không bắt buộc phải có GitHub trước. Phụ thuộc nền managed-root + git-ops nhưng không cần OAuth.

**Independent Test**: Tạo Project, chọn "Start empty (no repository)" → Workspace `ready`, thư mục `workspaces/<project-id>` là một git repo mới (`git init`) với commit gốc rỗng/initial.

**Acceptance Scenarios**:

1. **Given** không cung cấp remote, **When** tạo Project, **Then** SpecDeck `git init` tại `workspaces/<project-id>`, đặt default branch, Workspace `ready`.
2. **Given** đã `git init`, **When** sau này user muốn gắn remote GitHub, **Then** có đường để thêm remote (qua US1 + đặt remote) — nhưng việc push là ngoài phạm vi 004.

---

### User Story 4 - Link / auto-detect thư mục đã có trong managed root (Priority: P2)

Là người đã có sẵn một thư mục code **bên trong managed root** (ví dụ clone bằng tay vào volume), tôi link nó cho một Project. Nếu thư mục là git repo có remote, SpecDeck **tự đọc remote** và prefill; nếu chưa phải git, SpecDeck `git init`.

**Why this priority**: Phủ uc3 + uc4, gộp nhờ auto-detect. Thấp hơn P1 vì là đường ít dùng hơn clone/khởi tạo.

**Independent Test**: Đặt sẵn một folder git (có remote) trong managed root → "Browse" thấy nó → link → SpecDeck hiển thị remote auto-detect, verify khớp, Workspace `ready`. Lặp lại với folder không-git → SpecDeck đề nghị `git init`.

**Acceptance Scenarios**:

1. **Given** một folder trong managed root là git repo có remote GitHub, **When** user link, **Then** SpecDeck đọc `git remote` để prefill, verify remote hợp lệ, Workspace `ready` (uc3).
2. **Given** một folder trong managed root **chưa** phải git, **When** user link, **Then** SpecDeck `git init` rồi đánh dấu `ready` (uc4).
3. **Given** một folder **ngoài** managed root, **When** user thử trỏ tới (gõ path traversal `../`), **Then** hệ thống từ chối — chỉ chấp nhận đường dẫn nằm trong managed root.
4. **Given** một folder đã được Project khác link, **When** user link lại cho Project thứ hai, **Then** hệ thống cảnh báo collision và từ chối (một folder ↔ một Project).

---

### User Story 5 - Phát hiện link gãy + reconnect / unlink (Priority: P3)

Là người vận hành lâu dài, khi thư mục Workspace bị xoá/di chuyển ngoài luồng, tôi thấy Project ở trạng thái **broken** với hành động sửa rõ ràng (reconnect hoặc unlink), thay vì lỗi im lặng.

**Why this priority**: Độ bền vận hành; không chặn MVP nhưng cần trước khi agent thật chạy trên Workspace.

**Independent Test**: Xoá thủ công `workspaces/<project-id>` → mở Project → trạng thái `broken` + nút Reconnect (clone/init lại) và Unlink.

**Acceptance Scenarios**:

1. **Given** Workspace từng `ready` nhưng thư mục không còn/không phải git, **When** SpecDeck kiểm tra sức khoẻ, **Then** trạng thái `broken` với lý do cụ thể.
2. **Given** Workspace `broken` có remote, **When** user bấm Reconnect, **Then** SpecDeck clone lại (như US2); nếu không remote thì đề nghị `git init` (như US3).
3. **Given** một Workspace bất kỳ, **When** user Unlink, **Then** liên kết Project↔Workspace gỡ bỏ (mặc định **không** xoá file trên đĩa; xoá đĩa là hành động xác nhận riêng).

---

### Edge Cases

- **Path traversal**: mọi đường dẫn folder PHẢI được giải quyết và xác nhận nằm trong managed root; `../`, symlink ra ngoài, đường dẫn tuyệt đối ngoài root → từ chối.
- **Token hết hạn/revoke** giữa lúc clone → clone fail với lỗi auth rõ; mời re-auth (US1.4).
- **Repo rất lớn / clone lâu** → tiến độ vẫn stream; có giới hạn timeout cấu hình được; timeout → `error` + dọn dẹp.
- **Mất kết nối SSE giữa chừng** → client tự reconnect và lấy lại trạng thái hiện tại; tiến trình clone ở server không phụ thuộc kết nối UI.
- **Folder đích không rỗng** khi clone (US2.5) hoặc khi `git init` lên folder đã có nội dung lạ → từ chối/cảnh báo, không phá dữ liệu.
- **Trùng project-id** (tạo lại Project cùng id sau khi xoá) → quyết định bằng kiểm tra tồn tại folder (US2.5).
- **Server restart** giữa lúc `provisioning` → khi khởi động lại, job dở phải được đánh dấu `error`/`broken` thay vì kẹt `provisioning` vĩnh viễn.
- **GitHub rate limit** khi list repo → thông báo nhẹ nhàng + thử lại sau.

## Requirements *(mandatory)*

### Functional Requirements

**Kết nối GitHub (US1)**

- **FR-001**: Hệ thống MUST cho user kết nối tài khoản GitHub qua OAuth **Device Flow** (hiện user_code + verification_uri → poll lấy token), không yêu cầu dán token thủ công, không cần client secret/callback. client_id có default ship sẵn, override được qua env.
- **FR-002**: Hệ thống MUST lưu GitHub access/refresh token **chỉ ở phía server**, mã hoá at-rest; token MUST KHÔNG bao giờ xuất hiện trong response gửi tới trình duyệt, JS bundle, hay log phía client.
- **FR-003**: Hệ thống MUST hiển thị trạng thái kết nối (github-login đã connect / chưa connect / cần reconnect) và cho phép disconnect (thu hồi token đã lưu).
- **FR-004**: Hệ thống MUST liệt kê repo của user đã kết nối (tên, owner, public/private, default branch) với khả năng tìm kiếm; quyền truy cập đủ để clone private (OAuth scope phù hợp).
- **FR-005**: Khi gọi GitHub thất bại do token hết hạn/revoke, hệ thống MUST chuyển sang trạng thái "cần kết nối lại" và mời re-authorize thay vì báo lỗi chung chung.

**Managed workspaces root (mọi US)**

- **FR-006**: Hệ thống MUST đặt mọi Workspace dưới một **managed root** cố định trong triển khai SpecDeck (`workspaces/<project-id>`), không cho phép cấp phát ra ngoài root này trong v1.
- **FR-007**: Mọi đường dẫn folder do user cung cấp/chọn MUST được giải quyết và **xác nhận nằm trong managed root**; đường dẫn thoát ra ngoài (traversal/symlink/tuyệt đối) MUST bị từ chối.
- **FR-008**: Tính năng "Browse folder" MUST chỉ liệt kê các thư mục con bên trong managed root.

**Cấp phát Workspace — git (US2/US3/US4)**

- **FR-009**: Mỗi Workspace MUST là một git repo: hoặc clone từ remote, hoặc `git init` khi không remote.
- **FR-010**: Với remote, hệ thống MUST clone repo vào `workspaces/<project-id>` và checkout **base branch** do user chọn (mặc định = default branch của repo).
- **FR-011**: Hệ thống MUST stream **tiến độ cấp phát realtime** (đang clone/khởi tạo, %/giai đoạn, thành công/lỗi) xuống UI.
- **FR-012**: Khi link một folder có sẵn trong managed root, nếu là git repo hệ thống MUST đọc remote để prefill và verify; nếu chưa phải git MUST đề nghị/thực hiện `git init`.
- **FR-013**: Hệ thống MUST từ chối clone/khởi tạo đè lên thư mục đã tồn tại và không rỗng (bảo vệ dữ liệu).
- **FR-014**: Hệ thống MUST hỗ trợ **huỷ** tác vụ cấp phát đang chạy và **dọn sạch** thư mục dở dang sau khi huỷ/lỗi.
- **FR-015**: Một folder MUST chỉ được link tới **một** Project; thử link trùng MUST bị từ chối với cảnh báo collision.

**Trạng thái & vòng đời (US5)**

- **FR-016**: Mỗi Workspace MUST có trạng thái quan sát được: `unlinked` → `provisioning` → `ready` → (`broken` | `error`).
- **FR-017**: Hệ thống MUST phát hiện link gãy (folder mất/không còn là git) và đặt `broken` với lý do cụ thể.
- **FR-018**: Hệ thống MUST cho **Reconnect** (clone/init lại) và **Unlink** (gỡ liên kết, mặc định không xoá file trên đĩa).
- **FR-019**: Khi server khởi động lại, mọi job cấp phát còn dở MUST được hoà giải về `error`/`broken`, không kẹt `provisioning`.

**Tích hợp với Project (003)**

- **FR-020**: Luồng tạo Project (NewProjectDialog) MUST có bước "Connect code" với 3 nhánh: clone repo GitHub (US2) · link folder có sẵn (US4) · start empty / `git init` (US3).
- **FR-021**: Thông tin Workspace (đường dẫn, remote, base branch, trạng thái) MUST hiển thị ở Project Settings và sửa/huỷ được ở đó.

### Key Entities *(include if feature involves data)*

- **Workspace**: thư mục code thật của một Project trên server. Thuộc tính: project-id (1–1 với Project), đường dẫn tương đối trong managed root, nguồn (`clone` | `init` | `linked`), remote URL (optional), base branch, trạng thái (`unlinked`/`provisioning`/`ready`/`broken`/`error`), thời điểm cấp phát.
- **GitHubConnection**: kết nối OAuth của người dùng tới GitHub. Thuộc tính: github-login, token (mã hoá, **server-only**), scope, trạng thái (active/expired/revoked). Một kết nối cho self-host 1 user.
- **ProvisioningJob**: một lần clone/init/reconnect đang chạy hoặc đã xong. Thuộc tính: workspace tham chiếu, loại (clone/init/reconnect), tiến độ, kết quả (success/error/cancelled), thông điệp lỗi. Là nguồn của stream tiến độ.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Token GitHub **không bao giờ** lộ ra client — kiểm tra 100% response/bundle/network phía trình duyệt không chứa access token (xác minh bằng audit thủ công + test).
- **SC-002**: Từ lúc chọn repo tới khi Workspace `ready`, user thấy tiến độ cập nhật **trong vòng 2 giây** kể từ khi clone bắt đầu, và liên tục cho tới khi xong (không "đứng hình").
- **SC-003**: 100% trường hợp cấp phát **thất bại** (mất quyền, folder không rỗng, timeout, huỷ) kết thúc ở trạng thái rõ ràng (`error`/`broken`) **kèm thông điệp hành động được** và **không để lại thư mục rác**.
- **SC-004**: 100% nỗ lực trỏ đường dẫn ra ngoài managed root bị từ chối (không tạo/đọc/ghi ngoài root).
- **SC-005**: Một Workspace `ready` sẵn sàng cho `git worktree` (là git repo hợp lệ, có HEAD) — xác minh bằng việc tạo thử một worktree thành công.
- **SC-006**: Sau khi server restart giữa lúc provisioning, **không** có Workspace nào kẹt `provisioning`; tất cả về `error`/`broken` trong vòng một lần health-check.

## Assumptions

- **Self-host, 1 user**: một GitHubConnection cho cả deployment; chưa hỗ trợ nhiều user/team/org auth.
- **Chỉ GitHub** trong v1: không GitLab/Bitbucket/SSH-thuần; remote không phải GitHub nằm ngoài phạm vi.
- **Managed root là volume bền** trong triển khai (Docker named volume) tách khỏi source SpecDeck và được gitignore; không browse host fs tuỳ ý (vì Agent Server chạy trong container, không mount runtime được — xem Non-goals).
- **OAuth scope** đủ để đọc danh sách repo và clone private (mức `repo read:user`). Dùng **Device Flow** → chỉ cần một `client_id` (không bí mật, không secret, không callback). SpecDeck ship một `DEFAULT_GITHUB_CLIENT_ID` (OAuth App của dự án đã bật Device Flow) → self-host zero-config; có thể override bằng env `GITHUB_CLIENT_ID` để dùng app riêng.
- **Khoá mã hoá token** lấy từ cấu hình server (env/secret manager), không nằm trong repo.
- **004 chỉ chuẩn bị repo sẵn-sàng-worktree**; việc tạo/điều phối worktree per-Builder và chạy agent là feature sau (agent-execution), không thuộc 004.
- **Stack** theo Constitution: Next.js FE → FastAPI Gateway (REST + bridge SSE) → Agent Server/git-ops; Postgres lưu Workspace/GitHubConnection/ProvisioningJob + token mã hoá; Redis pub/sub cho tiến độ. (Chi tiết kỹ thuật thuộc plan.md.)

## Non-goals (v1)

- Bring-your-own host path tuỳ ý (cần khai báo bind-mount thủ công + restart container) — **defer**.
- GitLab/Bitbucket/SSH-thuần; monorepo/subdirectory mapping (Project = repo root).
- Team/org auth, nhiều người dùng, phân quyền repo theo vai trò.
- Webhook GitHub, đồng bộ hai chiều, push/PR tự động (push ngoài phạm vi 004).
- Điều phối `git worktree` per-Builder và thực thi agent (feature riêng sau).
