# Feature Specification: SpecDeck Web — Projects (workspace) shell

**Feature Branch**: `003-projects`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Chia workspace cho user — gọi là *project*. User tạo được nhiều project; mỗi project có project info và một tab Kanban board (board đã dựng ở 002). Project nằm ở sidebar trái kiểu vibe-kanban / Notion workspace."

> Ghi chú ngôn ngữ: mô tả bằng tiếng Việt; danh từ sản phẩm và tên cột giữ **tiếng Anh** (SpecDeck, Project, Spec, Task, Check, Evidence, Planner/Builder/Checker, Backlog/Plan/Review/Done, Fast lane, Project Context). Mọi nhãn hiển thị trên UI là tiếng Anh.

## User Scenarios & Testing *(mandatory)*

Bối cảnh: 002 dựng được một Board đơn lẻ chạy trên mock. Thực tế người dùng điều phối agent cho **nhiều codebase / nhiều việc khác nhau** cùng lúc — nên cần tầng **Project (workspace)**: mỗi Project là một không gian riêng, có thông tin nhận dạng (gồm repo + **Project Context** — luật chung mọi Spec kế thừa, theo DESIGN) và sở hữu Board Kanban riêng. Người dùng chuyển qua lại giữa các Project qua **sidebar trái** cố định (mô hình vibe-kanban / Notion). Feature này vẫn **mock-only** — chưa wire backend; tạo Project là thao tác trong phiên.

Quan hệ với 002: Board, drawer/sheet chi tiết Spec, kéo-thả, search/filter — **tái dùng nguyên** `BoardView`; feature này bọc chúng trong một shell có sidebar và gắn dữ liệu Board theo từng Project. Landing `/` giữ nguyên là trang marketing public (không sidebar).

### User Story 1 - Workspace shell + chuyển Project qua sidebar (Priority: P1)

Người dùng vào workspace thấy một **sidebar trái** liệt kê các Project; bấm một Project để mở nó ở vùng nội dung bên phải. Project đang chọn được làm nổi. Sidebar thu gọn được để lấy thêm chỗ cho board.

**Why this priority**: Là khung điều hướng của toàn bộ tầng multi-project — mọi thứ khác (overview, board, settings, tạo mới) đều sống bên trong shell này. Đứng độc lập, demo được ngay với vài Project seed.

**Independent Test**: Mở workspace, thấy sidebar với danh sách Project; bấm một Project khác → vùng phải chuyển sang Project đó, mục đang chọn trong sidebar đổi theo; thu gọn/mở lại sidebar được và trạng thái đó được nhớ.

**Acceptance Scenarios**:

1. **Given** vào workspace, **When** shell render, **Then** thấy sidebar trái cố định gồm: nhận diện SpecDeck trên cùng, danh sách Project, nút "New project", và khu tiện ích cuối: **Notifications** (inbox), **Settings** (chứa theme + tuỳ chọn), và khối **account** người dùng (footer).
2. **Given** có nhiều Project, **When** bấm một Project trong sidebar, **Then** vùng nội dung phải hiển thị Project đó và mục tương ứng trong sidebar được đánh dấu đang chọn.
3. **Given** sidebar đang mở, **When** bấm nút thu gọn, **Then** sidebar co lại dạng icon-rail (chỉ còn biểu tượng), vùng board rộng thêm; trạng thái thu gọn được nhớ qua các lần điều hướng/refresh.
4. **Given** mỗi Project, **When** điều hướng tới nó, **Then** Project có một địa chỉ ổn định, chia sẻ được; mở thẳng/refresh tại địa chỉ đó vào đúng Project (và đúng tab).
5. **Given** đang ở landing `/`, **When** dùng lối "Open" để vào workspace, **Then** sidebar workspace mới xuất hiện (landing không có sidebar).

---

### User Story 2 - Project Overview là tab mặc định (Priority: P1)

Mở một Project, mặc định thấy tab **Overview**: tóm tắt nhận dạng Project (tên, repo, mô tả, Project Context rút gọn) và một ảnh chụp nhanh tình trạng Board (số card theo từng cột, các card đang được agent xử lý). Header của Project có tab bar **Overview · Board · Settings** theo đúng thứ tự đó.

**Why this priority**: Overview là "mặt tiền" của mỗi Project — cho biết đang nhìn gì và board đang ở đâu trước khi lao vào chi tiết. Là tab mặc định nên thuộc luồng cốt lõi.

**Independent Test**: Mở một Project → mặc định ở tab Overview; thấy thông tin nhận dạng + thống kê board theo cột; tab bar hiển thị Overview · Board · Settings với Overview đang active.

**Acceptance Scenarios**:

1. **Given** mở một Project (không chỉ định tab), **When** render, **Then** mặc định mở tab **Overview**, và tab bar hiển thị **Overview · Board · Settings** theo thứ tự đó.
2. **Given** tab Overview, **When** đọc, **Then** thấy tên Project, repo (liên kết), mô tả ngắn, và Project Context ở dạng rút gọn/đọc-được.
3. **Given** tab Overview, **When** đọc phần tình trạng board, **Then** thấy số lượng card theo từng cột Backlog/Plan/Review/Done và chỉ báo số card đang có agent chạy.
4. **Given** một Project chưa có card nào trên board, **When** mở Overview, **Then** phần tình trạng board hiển thị trạng thái trống rõ ràng (không lỗi, không số liệu giả).

---

### User Story 3 - Tab Board theo từng Project (Priority: P1)

Trong một Project, mở tab **Board** thấy Board Kanban đầy đủ (4 cột, swimlane group, kéo-thả, search/filter, mở chi tiết Spec) — đúng như 002 — nhưng dữ liệu là của **riêng Project đó**.

**Why this priority**: Board là lý do tồn tại của Project. Tái dùng toàn bộ 002 nhưng phải gắn đúng dữ liệu theo Project — không rò rỉ card giữa các Project.

**Independent Test**: Ở Project A mở tab Board → thấy board với dữ liệu của A; chuyển sang Project B tab Board → thấy dữ liệu của B (khác A); thao tác board (kéo-thả, search, mở chi tiết) hoạt động trong từng Project.

**Acceptance Scenarios**:

1. **Given** một Project, **When** mở tab Board, **Then** thấy Board Kanban đầy đủ tính năng của 002 (4 cột, group swimlane, kéo-thả, search/filter, mở chi tiết Spec).
2. **Given** hai Project có dữ liệu khác nhau, **When** xem Board của từng cái, **Then** mỗi Board chỉ hiển thị card thuộc Project tương ứng — không lẫn.
3. **Given** đang ở Board của một Project, **When** mở chi tiết một Spec, **Then** địa chỉ chi tiết gắn với Project đó; mở thẳng/refresh tại đó vào đúng Spec trong đúng Project.
4. **Given** kéo-thả trên Board của một Project, **When** tải lại trang, **Then** Board trở về bố cục seed của Project đó (state chỉ trong phiên — kế thừa ràng buộc 002).

---

### User Story 4 - Tạo Project mới qua modal nhanh (Priority: P2)

Người dùng bấm "New project" mở một modal gọn (tên, repo, màu nhận diện), tạo xong vào thẳng Project mới. Thông tin chi tiết chỉnh sau ở Settings.

**Why this priority**: Cho người dùng tự dựng không gian mới — nhưng shell + board demo được trước với Project seed, nên đứng sau US1–US3.

**Independent Test**: Bấm "New project" → điền tên (+ tuỳ chọn repo, màu) → xác nhận → Project mới xuất hiện trong sidebar và vùng phải mở Project đó ở Overview, với board rỗng.

**Acceptance Scenarios**:

1. **Given** ở workspace, **When** bấm "New project", **Then** mở modal có ô tên (bắt buộc) và các ô tuỳ chọn repo + màu nhận diện.
2. **Given** modal mở, **When** xác nhận với tên hợp lệ, **Then** Project mới được thêm vào sidebar và vùng phải mở Project đó (tab Overview), board rỗng.
3. **Given** modal mở, **When** để trống tên rồi xác nhận, **Then** hiển thị lỗi inline và không tạo Project.
4. **Given** modal mở, **When** huỷ hoặc Esc, **Then** modal đóng, không tạo gì.
5. **Given** đã tạo Project trong phiên, **When** tải lại trang, **Then** danh sách Project trở về tập seed (không persist — kế thừa ràng buộc mock của 002).

---

### User Story 5 - Tab Settings: sửa Project info + Project Context (Priority: P2)

Trong một Project, mở tab **Settings** để xem/sửa thông tin nhận dạng (tên, repo, default branch, màu) và **Project Context** (luật chung mà mọi Spec trong Project kế thừa).

**Why this priority**: Hoàn thiện vòng đời Project, nhưng không chặn việc xem/điều phối — nên P2.

**Independent Test**: Mở tab Settings của một Project → sửa tên / Project Context → thấy thay đổi phản ánh ở Overview và sidebar (trong phiên).

**Acceptance Scenarios**:

1. **Given** tab Settings, **When** render, **Then** thấy các trường: tên, repo, default branch, màu nhận diện, và một ô soạn **Project Context**.
2. **Given** sửa tên Project rồi lưu, **When** quay lại Overview và nhìn sidebar, **Then** tên mới phản ánh ở cả hai (trong phiên).
3. **Given** sửa Project Context rồi lưu, **When** xem lại Overview, **Then** phần Project Context rút gọn phản ánh nội dung mới.
4. **Given** tab Settings, **When** xem, **Then** ràng buộc bảo mật được tôn trọng — không có ô nhập secret/API-key của agent provider ở client (chỉ identity + Project Context văn bản).

---

### Edge Cases

- **Project không tồn tại**: mở địa chỉ một Project id không có trong mock → hiển thị "không tìm thấy" rõ ràng, có lối quay lại danh sách Project.
- **Tab không hợp lệ**: địa chỉ trỏ tới một tab không tồn tại của Project → quay về tab mặc định (Overview) thay vì lỗi.
- **Project rỗng board**: Overview + Board hiển thị trạng thái trống thay vì số liệu giả/0 gây hiểu nhầm.
- **Sidebar trên màn hẹp**: dưới ngưỡng rộng, sidebar thu lại / mở dạng overlay để board không bị bóp; vẫn điều hướng được.
- **Một Project duy nhất**: shell vẫn hoạt động bình thường (sidebar + tabs) khi chỉ có một Project.
- **Motion**: chuyển tab/sidebar dùng transition shadcn mặc định; nhánh `prefers-reduced-motion` **đã gỡ** product-wide (quyết định người dùng — xem Refinements R2), không còn là yêu cầu.

## Requirements *(mandatory)*

### Functional Requirements

**Workspace shell + điều hướng (US1)**
- **FR-001**: Workspace MUST có một sidebar trái cố định gồm: nhận diện SpecDeck, danh sách Project, nút tạo Project ("New project"), và khu tiện ích cuối: **Notifications** inbox, **Settings** (chứa theme), và khối **account** người dùng (footer).
- **FR-002**: Mỗi mục Project trong sidebar MUST hiển thị màu nhận diện + tên; Project đang xem MUST được đánh dấu đang chọn.
- **FR-003**: Sidebar MUST thu gọn được về dạng icon-rail và mở lại; trạng thái thu gọn MUST được nhớ qua điều hướng/refresh.
- **FR-004**: Mỗi Project MUST có một địa chỉ ổn định, chia sẻ được; mở thẳng/refresh tại địa chỉ đó MUST vào đúng Project và đúng tab.
- **FR-005**: Landing `/` MUST giữ nguyên là trang marketing public, không có sidebar workspace; workspace shell chỉ áp cho các địa chỉ trong Project.

**Project header + tabs (US2, US3, US5)**
- **FR-006**: Header của Project MUST có tab bar theo đúng thứ tự **Overview → Board → Settings**.
- **FR-007**: Mở một Project không chỉ định tab MUST mặc định vào tab **Overview**.
- **FR-008**: Chuyển tab MUST cập nhật địa chỉ để chia sẻ/refresh giữ đúng tab; tab không hợp lệ MUST lùi về Overview.

**Overview (US2)**
- **FR-009**: Tab Overview MUST hiển thị nhận dạng Project: tên, repo (liên kết), mô tả ngắn, và Project Context dạng rút gọn/đọc-được.
- **FR-010**: Tab Overview MUST hiển thị ảnh chụp nhanh Board: số card theo từng cột Backlog/Plan/Review/Done và số card đang có agent chạy.
- **FR-011**: Khi Board của Project rỗng, Overview MUST hiển thị trạng thái trống rõ ràng, không số liệu giả.

**Board theo Project (US3)**
- **FR-012**: Tab Board MUST tái dùng Board của 002 với đầy đủ tính năng (4 cột, group swimlane, kéo-thả, search/filter, mở chi tiết Spec).
- **FR-013**: Dữ liệu Board MUST tách biệt theo từng Project — card của Project này MUST KHÔNG xuất hiện trên Board Project khác.
- **FR-014**: Địa chỉ chi tiết Spec MUST gắn với Project chứa nó; mở thẳng/refresh vào đúng Spec trong đúng Project.
- **FR-015**: Trạng thái kéo-thả MUST chỉ tồn tại trong phiên theo từng Project; refresh trở về bố cục seed của Project (kế thừa ràng buộc 002).

**Tạo Project (US4)**
- **FR-016**: Hệ thống MUST cho tạo Project qua một modal gọn gồm tên (bắt buộc) và các trường tuỳ chọn repo + màu nhận diện.
- **FR-017**: Tạo Project với tên hợp lệ MUST thêm Project vào sidebar và mở Project mới ở tab Overview với board rỗng; tên trống MUST báo lỗi inline và không tạo.
- **FR-018**: Project tạo trong phiên MUST KHÔNG persist; refresh trở về tập Project seed (kế thừa ràng buộc mock 002).

**Settings (US5)**
- **FR-019**: Tab Settings MUST cho xem/sửa: tên, repo, default branch, màu nhận diện, và Project Context.
- **FR-020**: Sửa trong Settings MUST phản ánh ngay (trong phiên) ở Overview và sidebar (ví dụ đổi tên/màu).
- **FR-021**: Settings MUST KHÔNG chứa ô nhập secret/API-key của agent provider ở client (tôn trọng ràng buộc bảo mật: secret chỉ ở backend).

**Xuyên suốt (a11y / theme — kế thừa 002)**
- **FR-022**: Điều hướng sidebar, chuyển tab, mở/đóng/thu gọn sidebar, và tạo Project MUST dùng được bằng bàn phím với focus nhìn thấy được. *(Mệnh đề `prefers-reduced-motion` trước đây **đã gỡ** — xem Refinements R2.)*
- **FR-023**: Toàn bộ shell MUST render đúng ở cả dark và light theme, không nhấp nháy sai màu khi tải.

**Tiện ích sidebar (Refinement — xem R3)**
- **FR-024**: Sidebar footer MUST có inbox **Notifications** hiển thị số chưa đọc; mở ra danh sách thông báo (agent xong Task / agent cần input / Check fail), mỗi mục deep-link tới Spec tương ứng. Feed là **mock tĩnh**, không realtime/SSE (kế thừa non-goal 002); mark-read chỉ trong phiên.
- **FR-025**: Sidebar footer MUST có khối **account** (NavUser) và **Settings** chứa điều khiển theme (Light/Dark/System) + vài tuỳ chọn (mock, trong phiên). MUST KHÔNG có ô nhập secret/API-key ở client.

### Key Entities *(include if feature involves data)*

- **Project (workspace)**: đơn vị không gian làm việc. Mang: id ổn định (dùng trong địa chỉ), tên, mô tả ngắn, repo URL, default branch, màu/biểu tượng nhận diện, **Project Context** (văn bản luật chung kế thừa cho mọi Spec — tương đương constitution per-project trong DESIGN), và **sở hữu một tập dữ liệu Board** (các group + các Spec card của 002). Một workspace chứa nhiều Project.
- **Project Context**: phần văn bản đứng *trên* mọi Task Spec trong Project — luật/ràng buộc/ranh giới chung. Hiện là mock văn bản; sau này nối với constitution thật.
- **Board dataset (per Project)**: tái dùng các thực thể của 002 (Spec card, BoardGroup, Check, Evidence, Diff…), nhưng gom theo từng Project.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Từ workspace, người dùng chuyển sang Board của một Project khác trong **≤ 2 thao tác** (chọn Project → tab Board, hoặc ít hơn nếu Board là tab vừa xem).
- **SC-002**: **0** trường hợp card của một Project xuất hiện trên Board của Project khác (cô lập dữ liệu tuyệt đối).
- **SC-003**: Mở thẳng/chia sẻ địa chỉ của một Project (và một tab cụ thể) luôn dẫn đúng Project + đúng tab; địa chỉ chi tiết Spec luôn dẫn đúng Spec trong đúng Project.
- **SC-004**: Tạo một Project mới và bắt đầu thấy Overview của nó trong **≤ 3 thao tác** kể từ khi bấm "New project".
- **SC-005**: Đổi tên/màu một Project ở Settings phản ánh ở sidebar và Overview ngay trong phiên, không cần refresh.
- **SC-006**: Toàn bộ luồng chính (chọn Project → chuyển tab → mở chi tiết Spec → tạo Project) hoàn thành được **chỉ bằng bàn phím**.
- **SC-007**: Mọi màn của shell render đúng ở cả dark và light theme, không nhấp nháy sai màu lúc tải đầu.

## Assumptions

- **Mock-only**: Project, Project Context, và dữ liệu Board đều **tĩnh trong mã nguồn web**; không backend/API/DB/auth trong feature này. Kế thừa toàn bộ ràng buộc mock của 002.
- **Không persist**: tạo Project và mọi sửa đổi (Settings, kéo-thả) chỉ sống trong phiên; refresh trở về tập seed.
- **Tái dùng 002**: `BoardView` và toàn bộ chi tiết Spec dùng lại nguyên; feature này chỉ thêm tầng Project + shell + gắn dữ liệu theo Project.
- **Một workspace**: hiện chỉ một workspace ngầm định (chưa multi-tenant / chưa nhiều người dùng); "chia cho user" hiểu là chia theo Project trong cùng một không gian.
- **Project Context là mock văn bản**: chưa nối constitution/steering thật; chỉ là trường text hiển thị/sửa được.
- **Seed nhiều Project**: mock có ≥2 Project với dữ liệu Board khác nhau (một cái tái dùng dataset dogfood của 002), để chứng minh cô lập dữ liệu và việc chuyển Project.

## Out of Scope (Non-Goals)

- Backend / Gateway / Agent Server thật, API thật, SSE/realtime.
- Xác thực người dùng, phân quyền, nhiều người dùng thật, multi-tenant.
- Persist Project / Board (DB hoặc localStorage).
- Nối Project Context với constitution thật; nhập secret/API-key provider trong UI.
- Xoá/lưu trữ Project, di chuyển card giữa các Project, mời thành viên.
- Tạo/sửa Spec, chấm Check thật (kế thừa non-goals của 002).
