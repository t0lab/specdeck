# Feature Specification: SpecDeck Web — Board + Spec detail (mock-driven)

**Feature Branch**: `002-web-mock`

**Created**: 2026-06-25

**Status**: Draft

**Input**: User description: "SpecDeck web frontend MVP chạy hoàn toàn trên mock data tĩnh — landing + board Kanban + chi tiết Spec đọc được, kéo-thả được; 1 card = 1 Spec Kit feature folder."

> Ghi chú ngôn ngữ: mô tả bằng tiếng Việt; danh từ sản phẩm và tên cột giữ **tiếng Anh** (SpecDeck, Spec, Task, Check, Evidence, Planner/Builder/Checker, Backlog/Plan/Review/Done, Fast lane). Mọi nhãn hiển thị trên UI là tiếng Anh.

## User Scenarios & Testing *(mandatory)*

Bối cảnh: SpecDeck là *control deck* để điều phối coding agent — con người duyệt ở **tầng Spec/Checklist**, không đọc diff. Feature này dựng phần web có-thể-thao-tác đầu tiên, chạy hoàn toàn trên **mock data tĩnh** (chưa có backend). Triết lý khoá: **mỗi card trên board mang theo một Spec, và Spec đó có đúng cấu trúc của một Spec Kit feature folder** (goal + user stories + requirements + success criteria + tasks).

### User Story 1 - Landing giới thiệu sản phẩm (Priority: P1)

Người mới mở SpecDeck lần đầu thấy một trang giới thiệu giải thích sản phẩm làm gì ("review specs, not diffs"), điều phối agent qua 4 cột Board ra sao, và pipeline Planner → Builder → Checker; rồi bấm một nút để vào Board.

**Why this priority**: Là cửa vào và là lời giải thích ngắn gọn cho cả người không rành code — không có nó, người lạ mở app không hiểu đang nhìn gì. Đứng độc lập, demo được ngay.

**Independent Test**: Mở `/`, đọc hiểu được sản phẩm làm gì trong vài giây, bấm CTA và tới Board.

**Acceptance Scenarios**:

1. **Given** lần đầu mở SpecDeck, **When** vào trang gốc, **Then** thấy hero nêu giá trị cốt lõi ("review specs, not diffs"), phần giải thích 4 cột Backlog/Plan/Review/Done và pipeline Planner/Builder/Checker, và một CTA dẫn vào Board.
2. **Given** đang ở landing, **When** bấm CTA, **Then** được đưa tới Board.
3. **Given** mở landing ở chế độ dark hoặc light, **When** trang render, **Then** màu sắc/độ tương phản đúng theme và không "nhấp nháy" sai màu lúc tải.

---

### User Story 2 - Board hiển thị các Spec dưới dạng card (Priority: P1)

Người dùng mở Board và thấy bốn cột cố định Backlog / Plan / Review / Done, mỗi cột chứa các card; mỗi card là một Spec với mã, tiêu đề, tiến độ Check, và các badge trạng thái (Fast lane, agent đang chạy).

**Why this priority**: Board là *bản đồ* trung tâm của sản phẩm — mọi việc khác (đọc, kéo-thả, duyệt) đều bắt đầu từ đây. Đứng độc lập với mock data.

**Independent Test**: Mở `/board`, thấy 4 cột với các card mock phân bố đúng cột; mỗi card hiển thị mã + tiêu đề + (nếu có) tiến độ Check và badge.

**Acceptance Scenarios**:

1. **Given** Board mở ra, **When** trang render, **Then** thấy đúng 4 cột theo thứ tự Backlog → Plan → Review → Done, mỗi cột có nhãn và số lượng card.
2. **Given** một card đang có agent chạy, **When** nhìn card, **Then** thấy badge "đang chạy" (⏳) — không phải một cột riêng.
3. **Given** một card đi Fast lane, **When** nhìn card, **Then** thấy badge **Fast lane** và card nằm ở Review (bỏ qua Plan).
4. **Given** một card ở Review có một Check **fail** và một Check **pass nhưng thiếu Evidence**, **When** nhìn tiến độ card, **Then** Check thiếu Evidence **không** được tính là pass và **không** hiển thị xanh.
5. **Given** mock có ~6–8 card, **When** Board render, **Then** các card phủ đủ cả 4 cột (gồm ít nhất 1 Fast lane và 1 card có agent đang chạy).

---

### User Story 3 - Kéo-thả sắp xếp card (Priority: P2)

Người dùng kéo một card sang cột khác, hoặc đổi thứ tự trong cùng cột, và Board cập nhật ngay tại chỗ.

**Why this priority**: Cho cảm giác "điều khiển" trực tiếp và xác nhận mô hình tương tác của Board. Phụ thuộc US2 (cần có card để kéo) nhưng tự kiểm chứng được.

**Independent Test**: Kéo một card từ cột này sang cột khác và thả vào một vị trí cụ thể; Board phản ánh vị trí mới ngay.

**Acceptance Scenarios**:

1. **Given** một card ở Backlog, **When** kéo và thả nó vào Plan, **Then** card xuất hiện ở Plan và biến mất khỏi Backlog, số đếm hai cột cập nhật.
2. **Given** nhiều card trong một cột, **When** kéo một card lên/xuống trong cùng cột, **Then** thứ tự đổi theo vị trí thả.
3. **Given** đang kéo một card, **When** trong lúc kéo, **Then** có chỉ báo thị giác rõ ràng cho card đang kéo và vùng sẽ thả vào.
4. **Given** đã kéo-thả vài card, **When** tải lại trang, **Then** Board trở về bố cục mock ban đầu (state chỉ giữ trong phiên, không lưu).
5. **Given** thao tác bằng bàn phím, **When** dùng phím để nhấc/di chuyển/thả card, **Then** kéo-thả vẫn thực hiện được mà không cần chuột.

---

### User Story 4 - Đọc chi tiết một Spec: overview nhanh + trang đầy đủ (Priority: P2)

Người dùng mở một card để xem Spec. Có hai nhu cầu: **xem nhanh overview** ngay trên Board, và **vào thẳng trang chi tiết đầy đủ** (đọc kỹ / chia sẻ link). Chi tiết đầy đủ trình bày Spec theo cấu trúc Spec Kit ở dạng dễ quét, kèm danh sách Checks + Evidence.

**Why this priority**: Đây là *hành vi cốt lõi* của SpecDeck — review ở tầng ý định. Overview phục vụ quyết định nhanh tại cổng; trang đầy đủ phục vụ đọc sâu và chia sẻ.

**Independent Test**: Click thân card → mở panel overview chồng lên Board (Board còn thấy phía sau), đóng được bằng Esc/back. Mở thẳng địa chỉ chi tiết của một Spec (hoặc tải lại ở địa chỉ đó) → ra trang chi tiết đầy đủ với các tab.

**Acceptance Scenarios**:

1. **Given** đang ở Board, **When** click thân một card, **Then** mở **overview** dạng panel trượt chồng lên Board (Board mờ phía sau), gồm mã, tiêu đề, cột, badge, goal tóm tắt, tiến độ + danh sách Checks, và một lối "Open full ↗".
2. **Given** overview đang mở, **When** bấm Esc hoặc back của trình duyệt, **Then** overview đóng và quay lại Board ở nguyên trạng.
3. **Given** một địa chỉ chi tiết của một Spec, **When** mở thẳng địa chỉ đó hoặc tải lại trang tại đó, **Then** hiển thị **trang chi tiết đầy đủ** (không phải overview) — cùng một địa chỉ, chia sẻ được.
4. **Given** đang xem overview hoặc đang hover trên card, **When** dùng lối "Open full ↗" hoặc mở-trong-ngữ-cảnh-mới (giữ phím bổ trợ rồi click), **Then** tới thẳng trang chi tiết đầy đủ.
5. **Given** trang chi tiết đầy đủ, **When** render, **Then** thấy các tab **Spec** và **Checks + Evidence** (tab **Diff** thuộc US5).
6. **Given** tab **Spec**, **When** đọc, **Then** thấy nội dung Spec có cấu trúc Spec Kit — Goal, User Stories (kèm mức ưu tiên P1/P2/P3 và Acceptance dạng Given/When/Then), Functional Requirements (có mã FR-xxx), Success Criteria (có mã SC-xxx), Edge Cases, Assumptions — trình bày dạng quét nhanh (mục lục điều hướng, các block có nhãn) chứ không phải markdown thô; kèm khối Tasks (gập được) thể hiện tiến độ.
7. **Given** tab **Checks + Evidence**, **When** đọc, **Then** mỗi Check hiển thị trạng thái pass/fail/pending/running phân biệt được **cả bằng hình lẫn màu**, nhóm theo thứ tự verify (deterministic → evidence → held-out → judge), có thanh tiến độ; mỗi Check pass có Evidence truy cập được; Check thiếu Evidence không bao giờ hiển thị xanh.
8. **Given** một card ở cột **Plan**, **When** mở chi tiết, **Then** mặc định mở vào tab **Spec** (duyệt *cái sắp làm*); **Given** một card ở cột **Review**, **Then** mặc định mở vào tab **Checks + Evidence** (duyệt *cái đã làm*).

---

### User Story 5 - Xem thay đổi code ở tab Diff (Priority: P3)

Người dùng — khi muốn soi điểm đỏ — mở tab Diff trong chi tiết Spec để xem các thay đổi code (mock), chỉ-đọc.

**Why this priority**: Diff là đường *drill-down*, không phải bề mặt review chính (đúng triết lý "review spec, không review diff"). Có sau cùng, cắt sạch khỏi MVP nếu cần.

**Independent Test**: Mở chi tiết một Spec, chuyển sang tab Diff, thấy các file thay đổi với nội dung diff mock ở chế độ chỉ-đọc.

**Acceptance Scenarios**:

1. **Given** chi tiết một Spec có dữ liệu diff mock, **When** mở tab Diff, **Then** thấy danh sách file thay đổi (added/modified/deleted) và nội dung diff hiển thị chỉ-đọc.
2. **Given** một Spec chưa có diff (ví dụ còn ở Backlog/Plan), **When** mở tab Diff, **Then** thấy trạng thái trống rõ ràng thay vì lỗi.

---

### Edge Cases

- **Card không có Check** (ví dụ ở Backlog): card không hiển thị tiến độ Check; chi tiết vẫn mở được, tab Checks hiển thị trạng thái trống.
- **Spec không tồn tại**: mở địa chỉ chi tiết của một mã Spec không có trong mock → hiển thị "không tìm thấy" rõ ràng, có lối quay lại Board.
- **Tất cả Check pending/running**: tiến độ hiển thị 0 đã-pass; không gợi ý sai là "đã xong".
- **Reduced motion**: animation "đang chạy" và hiệu ứng kéo-thả phải giảm/tắt khi người dùng bật prefers-reduced-motion.
- **Nội dung Spec dài** (nhiều user story / requirement): trang chi tiết vẫn quét được nhờ điều hướng mục lục; không vỡ layout.
- **Thả card ra ngoài vùng hợp lệ**: card trở về vị trí cũ, không mất.

## Requirements *(mandatory)*

### Functional Requirements

**Landing (US1)**
- **FR-001**: Trang landing MUST nêu giá trị cốt lõi của SpecDeck ("review specs, not diffs"), giải thích 4 cột Board và pipeline Planner/Builder/Checker, và cung cấp một CTA dẫn vào Board.

**Board (US2)**
- **FR-002**: Board MUST hiển thị đúng 4 cột cố định theo thứ tự Backlog → Plan → Review → Done, mỗi cột có nhãn và số đếm card.
- **FR-003**: Mỗi card MUST hiển thị mã Spec, tiêu đề, và — nếu có Check — tiến độ "đã-pass / tổng".
- **FR-004**: Card MUST thể hiện trạng thái "agent đang chạy" bằng **badge** trên card, không bằng một cột riêng.
- **FR-005**: Card đi Fast lane MUST mang badge **Fast lane** và nằm ở cột Review (bỏ qua Plan).
- **FR-006**: Tiến độ Check MUST loại trừ các Check "pass nhưng thiếu Evidence" khỏi số đã-pass; các Check đó MUST KHÔNG bao giờ hiển thị như đã pass (màu xanh).
- **FR-007**: Dữ liệu Board MUST đến từ một nguồn mock tĩnh gồm ~6–8 Spec phủ đủ 4 cột, trong đó có ít nhất một Fast lane, một card có agent đang chạy, và một card Review chứa một Check fail và một Check pass-thiếu-Evidence.

**Drag-drop (US3)**
- **FR-008**: Người dùng MUST kéo được một card sang cột khác và đổi thứ tự trong cùng cột; Board cập nhật ngay tại chỗ.
- **FR-009**: Trong lúc kéo, hệ thống MUST hiển thị chỉ báo thị giác cho card đang kéo và vùng sẽ thả.
- **FR-010**: Trạng thái sắp xếp do kéo-thả MUST chỉ tồn tại trong phiên; tải lại trang trở về bố cục mock ban đầu (không persist).
- **FR-011**: Kéo-thả MUST thao tác được bằng bàn phím (nhấc/di chuyển/thả) ngoài chuột.

**Chi tiết Spec — dual surface (US4)**
- **FR-012**: Click thân một card MUST mở **overview** dạng panel trượt chồng lên Board (Board còn nhìn thấy), đóng được bằng Esc và nút back trình duyệt.
- **FR-013**: Overview MUST gồm: mã, tiêu đề, cột, badge, goal tóm tắt, tiến độ + danh sách Checks, và lối "Open full ↗".
- **FR-014**: Mỗi Spec MUST có một địa chỉ chi tiết ổn định, chia sẻ được; mở thẳng/tải lại tại địa chỉ đó MUST hiển thị **trang chi tiết đầy đủ** (không phải overview).
- **FR-015**: Hệ thống MUST cung cấp lối đi thẳng tới trang chi tiết đầy đủ (nút "Open full ↗" và mở-trong-ngữ-cảnh-mới qua phím bổ trợ) tách biệt khỏi hành vi click-mở-overview.
- **FR-016**: Trang chi tiết đầy đủ MUST trình bày nội dung dưới dạng các tab: **Spec**, **Checks + Evidence**, **Diff**.
- **FR-017**: Mở chi tiết MUST chọn tab mặc định theo cột: card ở **Plan** → tab **Spec**; card ở **Review** → tab **Checks + Evidence**.

**Tab Spec — render layer (US4)**
- **FR-018**: Tab Spec MUST render nội dung Spec từ nguồn structured (không để agent sinh HTML) gồm: Goal, User Stories với mức ưu tiên P1/P2/P3 và Acceptance dạng Given/When/Then, Functional Requirements có mã FR-xxx, Success Criteria có mã SC-xxx, Edge Cases, Assumptions.
- **FR-019**: Tab Spec MUST trình bày để **dễ quét**: có điều hướng mục lục theo phần; Given/When/Then hiển thị thành block có nhãn (không phải dòng markdown thô); mã FR/SC hiển thị nổi bật; chip ưu tiên trên mỗi user story.
- **FR-020**: Phần văn xuôi tự do trong Spec MUST render được markdown (gồm sơ đồ dạng diagram khi có).
- **FR-021**: Tab Spec MUST có khối Tasks (gập/mở được) thể hiện danh sách task theo phase và tiến độ hoàn thành.

**Tab Checks + Evidence (US4)**
- **FR-022**: Tab Checks MUST hiển thị mỗi Check với trạng thái pass/fail/pending/running phân biệt được **cả bằng hình lẫn màu** (an toàn với grayscale/mù màu).
- **FR-023**: Tab Checks MUST nhóm các Check theo thứ tự verify: deterministic → evidence → held-out → judge, và hiển thị thanh tiến độ tổng.
- **FR-024**: Mỗi Check pass MUST có Evidence truy cập được; Check thiếu Evidence MUST hiển thị cảnh báo và không bao giờ hiển thị như pass.

**Tab Diff (US5)**
- **FR-025**: Tab Diff MUST hiển thị danh sách file thay đổi (added/modified/deleted) và nội dung diff mock ở chế độ **chỉ-đọc**.
- **FR-026**: Khi Spec chưa có dữ liệu diff, tab Diff MUST hiển thị trạng thái trống rõ ràng, không lỗi.

**Xuyên suốt (a11y / theme)**
- **FR-027**: Mọi trạng thái (cột, Check, badge) MUST mã hoá bằng **cả màu lẫn hình/chữ** để phân biệt khi mất màu.
- **FR-028**: Toàn bộ thao tác chính (điều hướng, mở chi tiết, kéo-thả, chuyển tab) MUST dùng được bằng bàn phím với focus nhìn thấy được, và MUST tôn trọng prefers-reduced-motion.
- **FR-029**: Mọi màn (landing, board, chi tiết) MUST render đúng ở cả dark và light theme, không nhấp nháy sai màu khi tải.

### Key Entities *(include if feature involves data)*

- **Spec (card)**: đơn vị trên Board, mang một mã, tiêu đề, cột hiện tại, cờ Fast lane, vai agent đang chạy (nếu có). Là *một Spec Kit feature folder* ở dạng dữ liệu: chứa Goal, các User Story, Functional Requirements, Success Criteria, Edge Cases, Assumptions, danh sách Task, danh sách Check, và (tuỳ) tập thay đổi Diff.
- **User Story**: mã (US1…), tiêu đề, mức ưu tiên (P1/P2/P3), mô tả, lý do ưu tiên, và các Acceptance Scenario dạng Given/When/Then.
- **Functional Requirement**: mã (FR-xxx), mức (MUST/SHOULD), nội dung.
- **Success Criterion**: mã (SC-xxx), nội dung đo được.
- **Task**: mã (T0xx), phase, (tuỳ) gắn user story, có thể chạy song song, nhãn, trạng thái hoàn thành — phản ánh tasks.md.
- **Check**: mã, nhãn, trạng thái (pass/fail/pending/running), loại theo thứ tự verify (deterministic/evidence/held-out/judge), Evidence (nếu có), và tham chiếu tới SC/US/FR mà nó verify.
- **Evidence**: loại (test/log/image/video/html), liên kết hoặc tóm tắt — bắt buộc cho mỗi Check pass.
- **Diff file**: đường dẫn, trạng thái (added/modified/deleted), nội dung diff.
- **Board column**: một trong Backlog / Plan / Review / Done.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người mới mở landing có thể nói lại được sản phẩm làm gì (ý "review specs, not diffs") chỉ sau khi đọc màn đầu, không cần cuộn tìm.
- **SC-002**: Từ Board, người dùng mở được chi tiết đầy đủ của bất kỳ Spec nào trong **≤ 2 thao tác**.
- **SC-003**: 100% trạng thái Check phân biệt được khi xem ở **grayscale** (không dựa vào màu).
- **SC-004**: **0** trường hợp một Check thiếu Evidence bị hiển thị như đã pass (không có "false green").
- **SC-005**: Chia sẻ địa chỉ chi tiết của một Spec rồi mở ở phiên/khung mới luôn dẫn thẳng tới đúng trang chi tiết đầy đủ của Spec đó.
- **SC-006**: Trong chi tiết Spec, người dùng định vị được Goal, Acceptance, và danh sách Checks mà **không phải đọc markdown thô** (nhờ cấu trúc render + mục lục).
- **SC-007**: Kéo một card sang cột khác phản ánh ngay trên Board (cập nhật vị trí và số đếm cột) trong cùng tương tác, không cần tải lại.
- **SC-008**: Toàn bộ luồng chính (vào landing → Board → mở chi tiết → chuyển tab) hoàn thành được **chỉ bằng bàn phím**.
- **SC-009**: Mọi màn render đúng ở cả dark và light theme, không có nhấp nháy sai màu lúc tải đầu tiên.

## Assumptions

- **Mock-only**: toàn bộ dữ liệu (Spec, Check, Evidence, Diff, Task) là **tĩnh trong mã nguồn web**; không có backend, API thật, SSE/realtime, auth, hay database trong feature này.
- **Không persist**: kết quả kéo-thả chỉ sống trong phiên; tải lại trở về bố cục mock ban đầu (theo quyết định đã chốt).
- **Evidence là mock**: liên kết/log/ảnh tượng trưng; không có pipeline sinh Evidence thật. Khi sau này có Evidence HTML do agent sinh, nó sẽ được nhúng cô lập — ngoài phạm vi feature này.
- **Cấu hình kiểm tra lúc khởi động**: ứng dụng đọc cấu hình môi trường qua một lớp validate, báo lỗi rõ ràng nếu thiếu/sai (chi tiết cơ chế thuộc plan).
- **Design system sẵn có**: tokens màu/typography, theme dark/light, và các component trạng thái (CheckBadge, ColumnTag, EvidenceChip, Logo) đã có từ feature 001-branding và được tái dùng; không hardcode màu ngoài token.
- **Nội dung Spec mock mirror Spec Kit**: cấu trúc các trường bám đúng spec-template.md / tasks-template.md để render layer dùng lại được cho Spec thật sau này.
- **Một địa chỉ chi tiết / hai cách trình bày**: overview và trang đầy đủ chia sẻ cùng một địa chỉ Spec; cách render tuỳ ngữ cảnh điều hướng (cơ chế kỹ thuật thuộc plan; có phương án dự phòng nếu nền tảng không hỗ trợ).

## Out of Scope (Non-Goals)

- Backend / Gateway / Agent Server thật, API thật, SSE/realtime, hàng đợi.
- Xác thực người dùng, phân quyền, multi-tenant.
- Lưu trạng thái Board (DB hoặc localStorage).
- Sinh Spec/Check/Evidence bằng agent; chấm Check thật.
- Chỉnh sửa Spec/Check trong UI (chỉ đọc/di chuyển card).
