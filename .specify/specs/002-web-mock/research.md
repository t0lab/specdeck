# Phase 0 — Research: 002-web-mock

Mọi quyết định kỹ thuật cho plan. Định dạng: **Decision / Rationale / Alternatives**. Các API Next được **verify trực tiếp** trong `web/node_modules/next/dist/docs/` (Next 16.2.9) theo `web/AGENTS.md`.

## R1 — Dual-surface (drawer overview ↔ trang đầy đủ) cùng một địa chỉ

**Decision:** Dùng **intercepting routes + parallel routes** (pattern nextgram "gallery ↔ photo modal"). Cấu trúc:
```
app/board/layout.tsx          → render {children} + {drawer}
app/board/page.tsx            → Board
app/board/[spec]/page.tsx     → TRANG chi tiết đầy đủ
app/board/@drawer/default.tsx → null
app/board/@drawer/(.)[spec]/page.tsx → drawer overview (intercept)
```
- Click thân card (soft-nav `/board/[spec]`) → `(.)[spec]` intercept, render drawer overlay; board giữ phía sau; URL đổi sang `/board/[spec]` (chia sẻ được).
- Refresh/mở thẳng/share `/board/[spec]` (hard-nav) → slot `@drawer` không khớp → `default.tsx` (null), `children` render `[spec]/page.tsx` = trang đầy đủ.
- Đóng drawer: `router.back()` (Esc + nút back) → quay về `/board`, `@drawer` về `default`.
- "Open full ↗" + ⌘/Ctrl-click: `<Link>` thường tới `/board/[spec]` *không* qua đường intercept (hoặc `window.open`/native modifier) → vào trang đầy đủ.

**Rationale:** Docs Next 16.2.9 (`file-conventions/intercepting-routes.md` + `parallel-routes.md`) mô tả **đúng** use-case này: "opening a photo modal in a gallery while also having a dedicated `/photo/[id]` page", giải đúng 4 thách thức ta cần — shareable URL, preserve-on-refresh, close-on-back, reopen-on-forward. `(.)` match same-segment-level (slot `@drawer` không tính là segment) nên `(.)[spec]` intercept `board/[spec]`. **Đã xác nhận hỗ trợ đầy đủ ở bản đang cài → KHÔNG cần fallback.**

**Alternatives:**
- *Drawer client-state + route `/spec/[id]` riêng* (fallback đã nêu trong spec): bỏ — không cần vì API gốc hoạt động; lại làm overview & full page **lệch địa chỉ**, phá SC-005.
- *Modal thuần client (không đổi URL)*: bỏ — không share/deep-link được, vi phạm FR-014.

**Lưu ý triển khai:** `@drawer` cần `default.tsx` trả `null`; nếu sau này drawer mở trên các route khác `/board`, cần catch-all slot trả null để đóng đúng (docs §Modals). Quyết định này đáng một **ADR** (`docs/design-docs/web-dual-surface-routing.md`).

## R2 — Validate env lúc boot

**Decision:** `web/src/env.ts` dùng `@t3-oss/env-nextjs` (đã cài) + zod 4: khối `server` và `client` tách biệt, `client` chỉ chứa biến `NEXT_PUBLIC_*`; `runtimeEnv` map tường minh. Import `env` trong `app/layout.tsx` để validate fail-fast lúc build/boot. Mock-only nên schema tối thiểu & trung thực: ví dụ `NEXT_PUBLIC_GATEWAY_URL` *optional* (chỗ cắm tương lai) — **không** khai secret nào ở client. Kèm `web/.env.example`.

**Rationale:** Thoả Assumption "cấu hình kiểm tra lúc khởi động" và ràng buộc Constitution (secret chỉ backend). t3-env enforce ranh giới server/client ở compile-time — biến không `NEXT_PUBLIC_` mà dùng ở client sẽ lỗi. `docs/02-guides/environment-variables.md` xác nhận quy ước `NEXT_PUBLIC_` inline vào bundle client.

**Alternatives:** *Đọc `process.env` trực tiếp*: bỏ — không fail-fast, dễ rò biến server ra client. *Tự viết zod parse*: bỏ — t3-env đã chuẩn hoá server/client split.

## R3 — Drag-drop + keyboard a11y

**Decision:** dnd-kit (`@dnd-kit/core` + `sortable` + `modifiers`). Tách **reducer thuần** `lib/board-state.ts` (move/reorder/invalid-drop) khỏi UI để TDD. `DndContext` với **PointerSensor** + **KeyboardSensor** (`sortableKeyboardCoordinates`) → kéo-thả bằng bàn phím (FR-011, SC-008). `DragOverlay` + chỉ báo vùng thả (FR-009). State `useState`/`useReducer` in-memory, seed từ mock; reload → mock gốc (FR-010). Hiệu ứng kéo giảm khi `prefers-reduced-motion`.

**Rationale:** dnd-kit có keyboard sensor sẵn (đáp ứng a11y bắt buộc) và overlay tách khỏi DOM thật. Reducer thuần → test không cần jsdom drag simulation.

**Alternatives:** *HTML5 DnD gốc*: bỏ — keyboard a11y kém, API thô. *Persist localStorage*: bỏ — spec chốt không persist.

## R4 — Render layer cho Spec (tab Spec)

**Decision:** Render **từ structured data** (không markdown thô, không agent sinh HTML — ADR spec-format). Các trường có cấu trúc (Goal/US/GWT/FR/SC/Edge/Tasks) render bằng component chuyên (chip P1/P2/P3, block GWT có nhãn, mã FR/SC mono). Chỉ phần **văn xuôi tự do** đi qua **streamdown** (đã cài) để render markdown + Mermaid. TOC dính sinh từ danh sách phần.

**Rationale:** Thoả FR-018..020 + SC-006 (đọc không cần markdown thô) và nguyên tắc II (nguồn structured, UI render). streamdown lo phần prose/diagram, phần còn lại là layout có chủ đích.

**Alternatives:** *Render toàn bộ spec.md như markdown*: bỏ — mất cấu trúc quét nhanh, vi phạm FR-019. *Tự parse Mermaid*: bỏ — streamdown đã hỗ trợ.

## R5 — Diff viewer

**Decision:** `@monaco-editor/react` (đã cài) ở chế độ **read-only** (`DiffEditor` hoặc editor read-only render patch mock). Empty state khi Spec chưa có diff. Lazy-load (Monaco nặng) để không ảnh hưởng tải Board/landing.

**Rationale:** Monaco có diff view chất lượng cao, đã có trong deps. US5 là P3/drill-down → lazy-load hợp lý.

**Alternatives:** *react-diff-viewer*: bỏ — thêm dep, Monaco đã sẵn. *<pre> tô màu tay*: bỏ — kém cho diff dài.

## R6 — Theme / no-flash

**Decision:** Giữ nguyên `next-themes` (`attribute="class"`, `defaultTheme="dark"`, `disableTransitionOnChange`) đã wire ở `layout.tsx`. Mọi màu qua token `globals.css`; chỉ **thêm/đổi giá trị** token, **không xoá** biến `--*` hiện có.

**Rationale:** 001-branding đã giải xong no-flash + dark/light (FR-029, SC-009). Tái dùng, không phát minh lại; tránh phá CSS-var hiện hữu (ràng buộc bộ nhớ dự án).

**Alternatives:** *Cookie SSR theme tự viết*: bỏ — next-themes đã đủ và đang chạy.

## R7 — QueryClient provider (forward-looking)

**Decision:** Thêm `providers.tsx` (`'use client'`) bọc `QueryClientProvider` (singleton), cắm trong `layout.tsx`. Mock đọc **đồng bộ** (import tĩnh) nên **chưa có query nào chạy** trong feature này — đây là scaffold cho data layer khi wire Gateway.

**Rationale:** User chốt QueryClient provider thuộc Foundational setup. Cắm sớm để US sau (real data) không phải refactor shell. Ghi rõ trạng thái "chưa dùng" để không gây hiểu lầm là đã có fetching.

**Alternatives:** *Hoãn tới khi có backend*: chấp nhận được, nhưng user đã yêu cầu đưa vào setup → giữ, kèm ghi chú trung thực.

## Tổng hợp NEEDS CLARIFICATION

Không còn — spec đã chốt toàn bộ quyết định scope/UX; các lựa chọn kỹ thuật ở trên đều có default hợp lý và đã verify với docs bản cài.
