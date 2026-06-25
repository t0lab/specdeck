# Phase 1 — UI Contracts: 002-web-mock

Feature mock-only, **không có API/HTTP contract**. Bề mặt hợp đồng là: (A) route map, (B) module mock công khai, (C) hành vi tương tác quan sát được, (D) ranh giới component. Đây là cái mọi unit phải tuân theo.

## A. Route contract

| URL | File | Hành vi |
|---|---|---|
| `/` | `app/page.tsx` | Landing: hero + explainer 4 cột + pipeline + CTA→`/board` |
| `/board` | `app/board/page.tsx` | Board 4 cột; drag-drop in-memory |
| `/board/[spec]` *(soft-nav từ board)* | `app/board/@drawer/(.)[spec]/page.tsx` | **Drawer overview** overlay trên board mờ; Esc/back đóng (`router.back()`) |
| `/board/[spec]` *(hard-nav / refresh / share)* | `app/board/[spec]/page.tsx` | **Trang chi tiết đầy đủ** với DetailTabs |
| `/board` (slot không khớp) | `app/board/@drawer/default.tsx` | trả `null` (drawer ẩn) |
| `/board/[spec]` với `id` không có trong mock | `app/board/[spec]/not-found.tsx` | "Spec không tìm thấy" + lối về `/board` |

**Bất biến route (SC-002/005):**
- Mở chi tiết đầy đủ từ Board trong **≤ 2 thao tác** (click card → "Open full ↗", hoặc ⌘/Ctrl-click một thao tác).
- Cùng một địa chỉ `/board/[spec]` luôn deep-link/refresh ra **trang đầy đủ** (không phải drawer).
- Default tab khi vào chi tiết: card `column==="plan"` → tab **Spec**; `column==="review"` → tab **Checks+Evidence**; còn lại → **Spec**. (Hàm `lib/default-tab.ts`.)

## B. Module mock (API nội bộ — `web/src/mock/`)

```ts
// types.ts — export mọi type ở data-model.md (SpecCard, Check, …)
// specs.ts
export const SPECS: SpecCard[];                 // ~6–8 card, thoả ràng buộc FR-007
export function getSpec(id: string): SpecCard | undefined;
export function initialBoard(): BoardColumnLane[]; // seed in-memory cho board
```
- Board, drawer, trang đầy đủ **đều** đọc cùng nguồn `SPECS`/`getSpec` → một sự thật, hai cách trình bày.
- `getSpec` trả `undefined` → trang gọi `notFound()` (Next).

## C. Logic thuần (hợp đồng hàm — TDD)

```ts
// lib/check-progress.ts
export function checkProgress(checks: Check[]): { passed: number; total: number };
//  passed đếm CHỈ khi state==="pass" && evidence != null  (SC-004: 0 false-green)

// lib/board-state.ts  (reducer thuần, không phụ thuộc DOM)
export function moveCard(state, cardId, toColumn, toIndex): BoardState;   // cross-column
export function reorderCard(state, cardId, toIndex): BoardState;          // in-column
//  drop ngoài vùng hợp lệ → trả state cũ nguyên vẹn (FR: card về chỗ cũ)

// lib/default-tab.ts
export function defaultTab(column: BoardColumn): "spec" | "checks" | "diff";
```

## D. Ranh giới component (tái dùng vs mới)

**Tái dùng nguyên (001-branding) — không sửa API:**
- `CheckBadge` (state-coded cả hình lẫn màu), `ColumnTag` (column + count), `EvidenceChip` (prop `missing` → không bao giờ xanh), `Logo`, `ThemeToggle`, `ThemeProvider`.

**Mới (props chính):**
- `board/SpecCardView({ card })` — mã + title + progress (qua `checkProgress`) + badge Fast lane/⏳; click thân → soft-nav; hover/⌘-click → "Open full ↗".
- `board/BoardColumnLane({ column, cards })` — ColumnTag + droppable list.
- `board/BoardDnd` — DndContext (Pointer + Keyboard sensor), DragOverlay, gọi reducer.
- `detail/DetailTabs({ spec, defaultTab })` — 3 tab; điều khiển được bằng bàn phím.
- `detail/DrawerOverview({ spec })` — mã/title/column/badge/goal/progress+Checks + "Open full ↗".
- `spec/SpecView({ spec })` — TOC dính + Goal + US(chip ưu tiên) + GWT block + FR/SC mono + Edge/Assumptions + prose(streamdown) + Tasks gập.
- `checks/ChecksPanel({ checks })` — nhóm theo `kind` (verify-order) + progress bar + Evidence/cảnh-báo-thiếu.
- `diff/DiffView({ diff })` — Monaco read-only; `diff` rỗng → empty state.

**Bất biến a11y/theme áp cho mọi component (FR-027/028/029):**
- Trạng thái phân biệt **cả màu lẫn hình/chữ** (an toàn grayscale — SC-003).
- Mọi thao tác chính keyboard-được, focus thấy được (SC-008).
- Tôn trọng `prefers-reduced-motion` (badge ⏳, hiệu ứng kéo).
- Render đúng dark & light, không nhấp nháy (SC-009).
- Màu chỉ từ token `globals.css`; **không** hardcode hex; **không** xoá biến `--*` hiện có.
