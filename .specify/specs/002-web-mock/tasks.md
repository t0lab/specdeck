---
description: "Task list — 002-web-mock"
---

# Tasks: SpecDeck Web — Board + Spec detail (mock-driven)

**Input**: Design documents từ `.specify/specs/002-web-mock/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/ui-contracts.md](./contracts/ui-contracts.md), [quickstart.md](./quickstart.md)

> Ngôn ngữ: tiếng Việt; danh từ sản phẩm/cột giữ tiếng Anh. **Mọi nhãn UI là tiếng Anh.** Toàn bộ đường dẫn dưới đây nằm trong `web/`.
> **Tests**: theo plan, **chỉ** TDD cho 3 logic thuần (`check-progress`, `board-state`, `default-tab`) + 1 test khẳng định ràng buộc bộ mock. UI/route verify qua [quickstart.md](./quickstart.md) (không viết integration test cho UI ở feature này).
> **RÀNG BUỘC** ([web/AGENTS.md](../../../web/AGENTS.md)): đây là Next 16 — **đọc** `web/node_modules/next/dist/docs/` (intercepting/parallel routes, next/font, metadata, env) trước khi viết code Next liên quan, đặc biệt Phase US4. Không hardcode hex ngoài `globals.css`; **không xoá** biến `--*` đang có.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: chạy song song được (khác file, không phụ thuộc task chưa xong)
- **[Story]**: US1–US5; Setup/Foundational/Polish không gắn nhãn story

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: chuẩn baseline + khung thư mục.

- [ ] T001 Xác nhận baseline xanh trước khi sửa: `cd web && pnpm test && pnpm lint && pnpm build` đều pass (ghi lại kết quả).
- [ ] T002 [P] Tạo khung thư mục feature: `web/src/mock/`, `web/src/lib/`, `web/src/components/{board,spec,checks,diff,detail,landing}/` (thêm `.gitkeep` cho thư mục chưa có file).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: env validate lúc boot + app shell + nguồn mock. ⚠️ **Mọi user story bị chặn tới khi phase này xong.**

**env.ts (F1)**
- [ ] T003 Tạo `web/src/env.ts` dùng `@t3-oss/env-nextjs` + zod 4: tách khối `server`/`client`, `client` chỉ chứa biến `NEXT_PUBLIC_*`, `runtimeEnv` map tường minh; mock-only nên schema tối thiểu (vd `NEXT_PUBLIC_GATEWAY_URL` optional) — **không** khai secret ở client.
- [ ] T004 [P] Tạo `web/.env.example` (không secret) + xác nhận `.env` đã bị `.gitignore` (line `.env*`) bỏ qua.
- [ ] T005 Import `env` vào `web/src/app/layout.tsx` để validate fail-fast lúc build/boot (depends T003).

**App shell + QueryClient (F2)**
- [ ] T006 [P] Tạo `web/src/app/providers.tsx` (`'use client'`) bọc `QueryClientProvider` với một `QueryClient` singleton.
- [ ] T007 Cắm `<Providers>` vào `web/src/app/layout.tsx` bên trong `ThemeProvider` (depends T006; cùng file T005 → tuần tự).

**Mock data + check-progress (F3)**
- [ ] T008 [P] Tạo `web/src/mock/types.ts` theo [data-model.md](./data-model.md) (tái dùng `BoardColumn`, `CheckState` từ `components/status/*` — **không** định nghĩa lại).
- [ ] T009 [TDD] Viết test **FAIL trước** `web/src/lib/__tests__/check-progress.test.ts`: `checkProgress` chỉ đếm pass khi `state==="pass" && evidence!=null`; toàn pending/running → `passed=0`. Chạy và xác nhận fail đúng lý do.
- [ ] T010 Hiện thực `web/src/lib/check-progress.ts` cho T009 pass (depends T008, T009).
- [ ] T011 Tạo `web/src/mock/specs.ts`: `SPECS` (~6–8 SpecCard), `getSpec(id)`, `initialBoard()` — thoả ràng buộc FR-007 (phủ 4 cột; ≥1 Fast lane ở Review; ≥1 `runningAgent`; 1 card Review có 1 Check `fail` + 1 Check `pass` thiếu Evidence; ≥1 card Backlog không Check & không diff; ≥1 card đủ sâu US/FR/SC + prose + Mermaid) (depends T008).
- [ ] T012 [P] Viết test `web/src/mock/__tests__/specs.test.ts` khẳng định các ràng buộc phân bố ở T011 (depends T011).

**Checkpoint**: env fail-fast, shell render, mock + check-progress sẵn sàng → user story bắt đầu được.

---

## Phase 3: User Story 1 — Landing (Priority: P1) 🎯 MVP

**Goal**: Trang `/` giới thiệu sản phẩm + CTA vào Board.
**Independent Test**: Mở `/`, hiểu "review specs, not diffs" tức thì, bấm CTA tới `/board`; đúng dark & light, không nhấp nháy.

- [ ] T013 [US1] Thay `web/src/app/page.tsx` (đang là mock board cũ) bằng Landing: hero "review specs, not diffs", explainer 4 cột Backlog/Plan/Review/Done + pipeline Planner → Builder → Checker, CTA → `/board`; reuse `Logo` + `ThemeToggle`. (Board sẽ dựng lại ở `/board` trong US2.)
- [ ] T014 [US1] Verify US1 theo [quickstart.md](./quickstart.md) bước 1–3 (CTA điều hướng; dark/light không flash — SC-001/009).

**Checkpoint**: Landing chạy độc lập; demo được.

---

## Phase 4: User Story 2 — Board hiển thị Spec dưới dạng card (Priority: P1) 🎯 MVP

**Goal**: `/board` render 4 cột cố định từ mock; card có progress + badge.
**Independent Test**: Mở `/board`, thấy 4 cột đúng thứ tự với card mock; card hiện mã+title+progress, badge Fast lane & ⏳; Check thiếu Evidence không xanh.

- [ ] T015 [P] [US2] `web/src/components/board/spec-card-view.tsx`: mã + title + progress (qua `checkProgress`) + badge Fast lane + badge ⏳ khi `runningAgent`; reuse `CheckBadge`/`EvidenceChip`/`ColumnTag`. (Click-mở-detail thêm ở US4.)
- [ ] T016 [P] [US2] `web/src/components/board/board-column-lane.tsx`: `ColumnTag` + count + danh sách card.
- [ ] T017 [US2] `web/src/app/board/page.tsx`: render 4 cột theo thứ tự Backlog→Plan→Review→Done từ `initialBoard()` (depends T011, T015, T016).
- [ ] T018 [US2] Verify US2 theo [quickstart.md](./quickstart.md) bước 4–7 (4 cột + count; ⏳ là badge không phải cột; Fast lane ở Review; missing-evidence không tính/không xanh — FR-006, SC-004).

**Checkpoint**: US1 + US2 chạy độc lập (MVP đọc-tĩnh).

---

## Phase 5: User Story 3 — Kéo-thả sắp xếp card (Priority: P2)

**Goal**: Kéo card giữa cột + đổi thứ tự trong cột, state in-memory.
**Independent Test**: Kéo card sang cột khác/đổi thứ tự (chuột & bàn phím); Board cập nhật ngay; reload về mock gốc.

- [ ] T019 [TDD] [US3] Viết test **FAIL trước** `web/src/lib/__tests__/board-state.test.ts`: `moveCard` (cross-column), `reorderCard` (in-column), drop ngoài vùng hợp lệ → trả state cũ nguyên vẹn. Xác nhận fail đúng lý do.
- [ ] T020 [US3] Hiện thực reducer thuần `web/src/lib/board-state.ts` cho T019 pass (depends T019).
- [ ] T021 [US3] `web/src/components/board/board-dnd.tsx`: `DndContext` với `PointerSensor` + `KeyboardSensor` (`sortableKeyboardCoordinates`), `DragOverlay` + chỉ báo vùng thả; gọi reducer (depends T020).
- [ ] T022 [US3] Wire `BoardDnd` vào `web/src/app/board/page.tsx`: state `useReducer` seed từ `initialBoard()`, không persist; giảm hiệu ứng kéo khi `prefers-reduced-motion` (depends T017, T021).
- [ ] T023 [US3] Verify US3 theo [quickstart.md](./quickstart.md) bước 8–12 (move/reorder; overlay; keyboard DnD; reload reset — FR-008..011, SC-007).

**Checkpoint**: Board tương tác được; US1–US3 độc lập.

---

## Phase 6: User Story 4 — Chi tiết Spec: overview + trang đầy đủ (Priority: P2)

**Goal**: Dual-surface cùng địa chỉ `/board/[spec]` — drawer overview (intercept) + trang đầy đủ (hard-nav), tab **Spec** + **Checks+Evidence**.
**Independent Test**: Click thân card → drawer overlay (Esc/back đóng); mở thẳng/refresh `/board/[spec]` → trang đầy đủ; "Open full ↗" & ⌘/Ctrl-click → thẳng trang đầy đủ; card Plan→tab Spec, Review→tab Checks.

> ⚠️ **Đọc Next docs trước** (`intercepting-routes.md`, `parallel-routes.md`) — đã verify trong [research.md](./research.md) R1.

- [ ] T024 [TDD] [US4] Viết test **FAIL trước** `web/src/lib/__tests__/default-tab.test.ts`: `defaultTab("plan")==="spec"`, `defaultTab("review")==="checks"`, còn lại `"spec"`. Xác nhận fail.
- [ ] T025 [US4] Hiện thực `web/src/lib/default-tab.ts` cho T024 pass (depends T024).
- [ ] T026 [US4] `web/src/app/board/layout.tsx`: nhận `{children}` + `{drawer}` (parallel slot) và render cả hai.
- [ ] T027 [P] [US4] `web/src/app/board/@drawer/default.tsx`: trả `null`.
- [ ] T028 [P] [US4] `web/src/components/detail/drawer-overview.tsx`: mã/title/column/badge/goal/progress + danh sách Checks + "Open full ↗".
- [ ] T029 [P] [US4] `web/src/components/detail/open-full-link.tsx`: `<Link>` tới `/board/[spec]` đi thẳng trang đầy đủ, hỗ trợ ⌘/Ctrl-click + affordance hover.
- [ ] T030 [P] [US4] `web/src/components/spec/spec-view.tsx` (tab Spec): TOC dính; Goal; US + chip P1/P2/P3; Given/When/Then thành block có nhãn; FR-xxx/SC-xxx mã mono; Edge/Assumptions; văn xuôi qua **streamdown** (+ Mermaid); khối Tasks gập-được kèm tiến độ.
- [ ] T031 [P] [US4] `web/src/components/checks/checks-panel.tsx` (tab Checks): nhóm theo verify-order (deterministic→evidence→held-out→judge), progress bar, Evidence mở được, thiếu Evidence → cảnh báo **không bao giờ xanh**, empty state khi không Check; trạng thái phân biệt cả hình lẫn màu.
- [ ] T032 [US4] `web/src/components/detail/detail-tabs.tsx`: 3 tab Spec | Checks+Evidence | Diff (Diff là slot rỗng tới US5), điều khiển bằng bàn phím, nhận `defaultTab` (depends T025, T030, T031).
- [ ] T033 [US4] `web/src/app/board/[spec]/page.tsx` (trang đầy đủ): `getSpec(id)` → `notFound()` nếu thiếu; render `DetailTabs` với `defaultTab(card.column)` (depends T011, T032).
- [ ] T034 [P] [US4] `web/src/app/board/[spec]/not-found.tsx`: "Spec not found" + lối về `/board`.
- [ ] T035 [US4] `web/src/app/board/@drawer/(.)[spec]/page.tsx`: intercept soft-nav, render `DrawerOverview` trong overlay (board mờ sau); Esc + nút back đóng qua `router.back()` (depends T026, T028).
- [ ] T036 [US4] Wire click-thân-card (soft-nav `/board/[spec]`) + `OpenFullLink` vào `web/src/components/board/spec-card-view.tsx` (depends T015, T029).
- [ ] T037 [P] [US4] Viết ADR `docs/design-docs/web-dual-surface-routing.md` (Context/Decision/Alternatives/Consequences) cho quyết định intercepting+parallel routes.
- [ ] T038 [US4] Verify US4 theo [quickstart.md](./quickstart.md) bước 13–22 (drawer/Esc/back; deep-link & refresh ra trang đầy đủ; Open full & ⌘-click; tab Spec quét-được + TOC; tab Checks evidence-gated + grayscale; default tab theo cột; not-found; card không-Check empty — FR-012..024, SC-002/003/005/006).

**Checkpoint**: Hành vi cốt lõi (review tầng ý định) hoạt động đầy đủ.

---

## Phase 7: User Story 5 — Tab Diff (Priority: P3)

**Goal**: Tab Diff Monaco read-only render diff mock; empty state khi chưa có diff.
**Independent Test**: Mở chi tiết card có diff → tab Diff thấy file added/modified/deleted + nội dung read-only; card chưa có diff → empty state, không lỗi.

- [ ] T039 [P] [US5] `web/src/components/diff/diff-view.tsx`: `@monaco-editor/react` read-only (lazy-load), render danh sách file + patch mock; `diff` rỗng → empty state.
- [ ] T040 [US5] Tích hợp `DiffView` vào tab Diff trong `web/src/components/detail/detail-tabs.tsx` (depends T032, T039).
- [ ] T041 [US5] Verify US5 theo [quickstart.md](./quickstart.md) bước 23–24 (diff read-only; empty state — FR-025/026).

**Checkpoint**: Toàn bộ user story hoàn chỉnh.

---

## Phase 8: Polish & Cross-Cutting (Quality gate Q1)

**Purpose**: a11y/theme/reduced-motion + cổng deterministic-first đóng feature.

- [ ] T042 A11y sweep: hoàn thành **toàn luồng chỉ bằng bàn phím** (landing→Board→mở chi tiết→đổi tab→drag-drop), focus luôn thấy được — [quickstart.md](./quickstart.md) bước 25 (SC-008).
- [ ] T043 Reduced-motion: gate animation ⏳ + hiệu ứng kéo sau `prefers-reduced-motion` (touch `board-dnd.tsx`, badge ⏳) — bước 26.
- [ ] T044 Theme sweep: dark & light đúng trên mọi màn, không nhấp nháy (SC-009).
- [ ] T045 [P] Grep gates: `grep` 0 hardcode hex ngoài `globals.css`; 0 `process.env` lộ secret ngoài `NEXT_PUBLIC_*`/`env.ts` (lệnh trong [quickstart.md](./quickstart.md)).
- [ ] T046 Cổng deterministic: `cd web && pnpm test && pnpm lint && pnpm build` đều xanh (env validate lúc build).
- [ ] T047 Chạy [quickstart.md](./quickstart.md) end-to-end (26 bước) — đánh dấu đạt/không đạt.
- [ ] T048 [P] Docs freshness: `grep` tham chiếu cũ tới board-mock-ở-`/` trong `docs/`; cập nhật nếu lệch (theo `.claude/rules/docs-as-code.md`).

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (P1)**: không phụ thuộc — bắt đầu ngay.
- **Foundational (P2)**: sau Setup — **chặn mọi user story**.
- **US1 (P3)**: sau Foundational. Độc lập.
- **US2 (P4)**: sau Foundational. Độc lập với US1.
- **US3 (P5)**: sau Foundational; cần `board/page.tsx` của US2 (T017) để wire DnD.
- **US4 (P6)**: sau Foundational; T036 sửa `spec-card-view.tsx` (tạo ở US2/T015) — coupling nhẹ, US2 vẫn test độc lập không cần click-mở.
- **US5 (P7)**: sau US4 (cần `DetailTabs` T032).
- **Polish (P8)**: sau các story mong muốn.

### Within Each Story
- TDD: test (T009/T019/T024) **fail trước** → impl → pass.
- Logic thuần trước component; component trước page; page trước wire/verify.

### Parallel Opportunities
- Setup: T002.
- Foundational: T004, T006, T008 song song; T012 sau T011.
- US2: T015 + T016 song song trước T017.
- US4: T027, T028, T029, T030, T031, T034, T037 song song (khác file); T032 sau T030/T031; T033 sau T032; T035 sau T026/T028.
- Polish: T045, T048 song song.

---

## Parallel Example: User Story 4

```bash
# Sau khi default-tab (T024→T025) và layout (T026) xong, chạy song song:
Task: "drawer-overview.tsx"        # T028
Task: "open-full-link.tsx"         # T029
Task: "spec-view.tsx (tab Spec)"   # T030
Task: "checks-panel.tsx"           # T031
Task: "not-found.tsx"              # T034
Task: "ADR web-dual-surface-routing.md"  # T037
```

---

## Implementation Strategy

### MVP (US1 + US2)
1. Setup → Foundational (env + shell + mock + check-progress).
2. US1 Landing → STOP & validate (quickstart 1–3).
3. US2 Board → STOP & validate (quickstart 4–7). **MVP đọc-tĩnh demo được.**

### Incremental
US3 (drag-drop) → US4 (dual-surface detail, hành vi cốt lõi) → US5 (Diff). Mỗi story validate độc lập rồi mới sang priority kế.

### Notes
- `[P]` = khác file, không phụ thuộc; commit theo Conventional Commits sau mỗi nhóm logic.
- Verify test fail trước khi impl (T009/T019/T024).
- Không hardcode hex ngoài `globals.css`; không xoá biến `--*`; secret chỉ backend.
- Dừng ở mỗi Checkpoint để validate story độc lập.
