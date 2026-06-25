# Feature Specification: Branding & Design System — "Control room"

**Feature Branch**: `001-branding`

**Created**: 2026-06-25

**Status**: Draft

**Input**: Chốt bản sắc hình ảnh đầu tiên của SpecDeck trước khi dựng feature board. Hướng đã chọn qua draft so sánh 3 style: **Control room** (dark-tech tiết chế, kiểu Linear/Vercel). Quyết định kèm theo: **dark + light mode**, mặt chữ **IBM Plex Sans + IBM Plex Mono** (self-host).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Đọc trạng thái review trong một liếc (Priority: P1)

Operator (dev hoặc founder/PM) mở SpecDeck và nhìn board. Họ phải phân biệt ngay **bốn cột** (Backlog / Plan / Review / Done) và **trạng thái từng Check** (pass / fail / pending / running) mà không cần đọc chú thích, không cần đọc code. Bề mặt control-room tối, tĩnh, mật độ vừa phải khiến cái cần chú ý nổi lên trước.

**Why this priority**: Đây là lý do tồn tại của sản phẩm (Nguyên tắc I — review ở tầng ý định). Nếu trạng thái Spec/Check/Evidence không đọc-được-trong-một-liếc thì brand thất bại ở đúng việc quan trọng nhất.

**Independent Test**: Mở shell đã re-skin, giả lập mù màu (grayscale), kiểm tra vẫn phân biệt được 4 cột và 4 trạng thái Check nhờ **hình + nhãn**, không chỉ màu.

**Acceptance Scenarios**:

1. **Given** board ở dark mode, **When** operator liếc qua một card đang chạy, **Then** trạng thái "running" hiện bằng cả màu *và* hình (dot/pulse + nhãn), phân biệt rõ với pass/fail/pending.
2. **Given** một Check thiếu Evidence, **When** card hiển thị, **Then** Check đó KHÔNG hiện màu pass (xanh) — hiện trạng thái "chưa pass" rõ ràng (Nguyên tắc I).
3. **Given** chế độ giả lập grayscale, **When** xem board, **Then** vẫn phân biệt được 4 cột + 4 trạng thái Check.

---

### User Story 2 — Bản sắc thống nhất toàn app (Priority: P2)

Mọi bề mặt SpecDeck (app bar, board, panel chi tiết, nút, chip) chia sẻ **một hệ token** màu/typography/hình. Wordmark + mark "deck xếp lớp" xuất hiện nhất quán. Component mới thêm vào (shadcn) kế thừa brand tự động, không phải override màu thủ công. Shell skeleton hiện tại được re-skin sang control-room, không còn look shadcn mặc định.

**Why this priority**: Token tập trung là điều kiện để mọi feature sau (board thật, side panel Planner, v.v.) nhìn nhất quán mà không phải sơn lại từng chỗ.

**Independent Test**: `grep` toàn `web/src` không còn giá trị màu/spacing hardcode ngoài token; thêm một component shadcn mới và xác nhận nó hiển thị đúng brand mà không cần sửa màu.

**Acceptance Scenarios**:

1. **Given** hệ token đã định nghĩa, **When** render bất kỳ component nào, **Then** màu/typography của nó đến từ token, không hardcode hex.
2. **Given** app bar, **When** tải trang, **Then** wordmark + mark hiển thị bằng accent, kèm favicon khớp.

---

### User Story 3 — Dark + Light mode (Priority: P3)

Operator chuyển giữa dark (mặc định) và light. Cả hai đều đọc tốt, giữ bản sắc control-room, đạt tương phản AA. Lựa chọn được nhớ qua lần truy cập sau.

**Why this priority**: Bản sắc cốt lõi là dark; light phục vụ người dùng/ngữ cảnh sáng. Có giá trị nhưng không phải điều kiện sống còn của P1.

**Independent Test**: Chuyển mode bằng một thao tác, không reload; kiểm tra cả hai mode pass tương phản AA; reload và xác nhận mode được giữ.

**Acceptance Scenarios**:

1. **Given** dark mode, **When** operator bật light, **Then** UI đổi mode tức thì, không nhấp nháy sai màu, không reload.
2. **Given** đã chọn light, **When** reload trang, **Then** vẫn ở light.

---

### Edge Cases

- **Accent trên nền sáng**: mint điện rất hợp nền tối nhưng dễ yếu/chói trên trắng → light mode PHẢI dùng biến thể accent đủ tương phản, không tái dùng nguyên giá trị dark.
- **prefers-reduced-motion**: khi tắt motion, pulse "running" dừng — trạng thái vẫn phải rõ bằng nhãn + hình tĩnh.
- **Thiếu Evidence**: Check không Evidence không bao giờ hiển thị như pass.
- **Tiếng Việt có dấu**: mặt chữ PHẢI render dấu tiếng Việt đầy đủ (IBM Plex hỗ trợ Vietnamese) ở mọi cấp heading/body/mono.
- **Nội dung dài**: tiêu đề Spec/Check dài phải wrap gọn, không vỡ layout cột.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Toàn bộ màu, typography, bán kính bo góc, đổ bóng PHẢI lấy từ một tập **design token tập trung**; KHÔNG component nào được hardcode giá trị màu/elevation.
- **FR-002**: Hệ token PHẢI gồm: nền nhiều tầng (bg / surface / surface-2), text 3 cấp (chính / dim / mute), accent + màu-chữ-trên-accent, **semantic state** (good / warn / crit / running) tách bạch khỏi accent, border, thang radius, thang elevation.
- **FR-003**: Trạng thái PHẢI được mã hoá bằng **cả màu lẫn hình** (pill / dot / stripe / icon + nhãn), không chỉ bằng màu — để đọc được khi suy giảm màu.
- **FR-004**: Phải có token màu nhất quán riêng cho: cột board (Backlog / Plan / Review / Done), trạng thái Check (pass / fail / pending / running), Evidence chip, tag Fast lane.
- **FR-005**: Wordmark "SpecDeck" + **mark** (deck xếp lớp, dùng accent, scale được) PHẢI hiện ở app bar; kèm favicon khớp bản sắc.
- **FR-006**: Typography: **IBM Plex Sans** cho UI, **IBM Plex Mono** cho Spec ID / Check / Evidence / số; **self-host** (không phụ thuộc CDN bên thứ ba), có thang cỡ chữ rõ ràng.
- **FR-007**: Hỗ trợ **dark (mặc định) + light**; người dùng chuyển được; lựa chọn được **persist** qua các lần truy cập.
- **FR-008**: Cả hai mode PHẢI đạt tương phản **WCAG AA** cho text thường và UI control; focus bàn phím có trạng thái nhìn thấy được.
- **FR-009**: Shell skeleton hiện có (`web/src/app`) PHẢI được re-skin sang control-room — không còn look shadcn/Tailwind mặc định.
- **FR-010**: Motion tiết chế (chỉ pulse "running" + micro-interaction nhẹ) và PHẢI tôn trọng `prefers-reduced-motion`.

### Key Entities *(token groups — không phải bảng dữ liệu)*

- **Color tokens**: nền/surface, text, border theo mode (dark/light).
- **Semantic state tokens**: good / warn / crit / running + token cột board + Check/Evidence.
- **Typography tokens**: họ chữ (Plex Sans/Mono), thang cỡ, weight, letter-spacing, nhãn uppercase.
- **Shape & elevation tokens**: radius scale, shadow/elevation.
- **Brand assets**: wordmark, mark, favicon.
- **Theme**: cặp dark/light + cơ chế chọn & ghi nhớ.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người chưa từng dùng phân biệt đúng 4 cột + 4 trạng thái Check mà không cần chú thích, kể cả ở chế độ giả lập mù màu (grayscale).
- **SC-002**: 0 giá trị màu/spacing hardcode ngoài token trong `web/src` (kiểm bằng grep).
- **SC-003**: Chuyển dark↔light bằng đúng 1 thao tác, không reload, không nhấp nháy sai màu; lựa chọn giữ nguyên sau reload.
- **SC-004**: Cả hai mode pass kiểm tra tương phản WCAG AA cho text + control.
- **SC-005**: Không có request font tới host bên thứ ba (kiểm bằng network panel) — font self-host.
- **SC-006**: Một component shadcn mới thêm vào kế thừa brand đúng mà không cần override màu.

---

## Assumptions

- **Đã chốt**: aesthetic = Control room (dark-tech, Linear/Vercel-restrained); dials VARIANCE 5 / MOTION 3 / DENSITY 5.
- **Đã chốt**: dark mặc định + light là biến thể đầy đủ (không phải dark-only).
- **Đã chốt**: IBM Plex Sans + IBM Plex Mono, self-host (OFL).
- **Phạm vi 001** = design system (token + theme) + wordmark/mark/favicon + **re-skin shell hiện có**. **CHƯA** build board dữ liệu thật — component board với data layer là feature sau; board trong draft chỉ để minh hoạ token áp lên đúng bề mặt.
- Chưa có logo/brand asset từ trước — tạo mới trong feature này. **Logo đã chốt** (mark "Columns", concept #07) và sống tại `web/public/brand/`; favicon Next App Router (`favicon.ico`/`icon.svg`/`apple-icon.png`) tại `web/src/app/`. Asset KHÔNG để trong `.specify/` (spec chỉ tham chiếu).
- Mock content (Spec/Check/Evidence) chỉ để minh hoạ bản sắc; tầng dữ liệu/persistence ngoài scope.
- Palette gốc đề xuất: near-black `#0B0D10` + accent mint `#38E8C6` (giá trị chính xác + biến thể light sẽ chốt ở `plan.md`).

### Open (chốt ở plan/preview, không chặn spec)

- Giữ accent mint hay dịch sang tông ấm/khác? (minor — quyết ở plan kèm preview)
- Cơ chế persist mode (localStorage vs cookie SSR) — quyết ở plan.

---

## Constitution alignment

- **Nguyên tắc I** (review ở tầng ý định): US1 + FR-003/FR-004 đảm bảo trạng thái Check/Evidence đọc-được-trong-một-liếc; FR Evidence-gated (Check thiếu Evidence ≠ pass) phản ánh trực tiếp trong Acceptance.
- **Nguyên tắc V** (spec-driven, hard gate): feature này đi qua spec → plan → tasks → implement; chưa đụng `web/` source cho tới khi `plan.md` được duyệt.
- **Ràng buộc Stack**: giữ Next.js + Tailwind + shadcn/ui; design thực thi qua skill `design-taste-frontend`. Token = CSS variables/`@theme` trong `globals.css` (cơ chế chi tiết ở plan).
