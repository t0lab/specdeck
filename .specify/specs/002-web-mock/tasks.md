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

- [x] T001 Xác nhận baseline xanh trước khi sửa: `cd web && pnpm test && pnpm lint && pnpm build` đều pass (ghi lại kết quả).
- [x] T002 [P] Tạo khung thư mục feature: `web/src/mock/`, `web/src/lib/`, `web/src/components/{board,spec,checks,diff,detail,landing}/` (thêm `.gitkeep` cho thư mục chưa có file).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: env validate lúc boot + app shell + nguồn mock. ⚠️ **Mọi user story bị chặn tới khi phase này xong.**

**env.ts (F1)**
- [x] T003 Tạo `web/src/env.ts` dùng `@t3-oss/env-nextjs` + zod 4: tách khối `server`/`client`, `client` chỉ chứa biến `NEXT_PUBLIC_*`, `runtimeEnv` map tường minh; mock-only nên schema tối thiểu (vd `NEXT_PUBLIC_GATEWAY_URL` optional) — **không** khai secret ở client.
- [x] T004 [P] Tạo `web/.env.example` (không secret) + xác nhận `.env` đã bị `.gitignore` (line `.env*`) bỏ qua.
- [x] T005 Import `env` vào `web/src/app/layout.tsx` để validate fail-fast lúc build/boot (depends T003).

**App shell + QueryClient (F2)**
- [x] T006 [P] Tạo `web/src/app/providers.tsx` (`'use client'`) bọc `QueryClientProvider` với một `QueryClient` singleton.
- [x] T007 Cắm `<Providers>` vào `web/src/app/layout.tsx` bên trong `ThemeProvider` (depends T006; cùng file T005 → tuần tự).

**Mock data + check-progress (F3)**
- [x] T008 [P] Tạo `web/src/mock/types.ts` theo [data-model.md](./data-model.md) (tái dùng `BoardColumn`, `CheckState` từ `components/status/*` — **không** định nghĩa lại).
- [x] T009 [TDD] Viết test **FAIL trước** `web/src/lib/__tests__/check-progress.test.ts`: `checkProgress` chỉ đếm pass khi `state==="pass" && evidence!=null`; toàn pending/running → `passed=0`. Chạy và xác nhận fail đúng lý do.
- [x] T010 Hiện thực `web/src/lib/check-progress.ts` cho T009 pass (depends T008, T009).
- [x] T011 Tạo `web/src/mock/specs.ts`: `SPECS` (~6–8 SpecCard), `getSpec(id)`, `initialBoard()` — thoả ràng buộc FR-007 (phủ 4 cột; ≥1 Fast lane ở Review; ≥1 `runningAgent`; 1 card Review có 1 Check `fail` + 1 Check `pass` thiếu Evidence; ≥1 card Backlog không Check & không diff; ≥1 card đủ sâu US/FR/SC + prose + Mermaid) (depends T008).
- [x] T012 [P] Viết test `web/src/mock/__tests__/specs.test.ts` khẳng định các ràng buộc phân bố ở T011 (depends T011).

**Checkpoint**: env fail-fast, shell render, mock + check-progress sẵn sàng → user story bắt đầu được.

---

## Phase 3: User Story 1 — Landing (Priority: P1) 🎯 MVP

**Goal**: Trang `/` giới thiệu sản phẩm + CTA vào Board.
**Independent Test**: Mở `/`, hiểu "review specs, not diffs" tức thì, bấm CTA tới `/board`; đúng dark & light, không nhấp nháy.

- [x] T013 [US1] Thay `web/src/app/page.tsx` (đang là mock board cũ) bằng Landing: hero "review specs, not diffs", explainer 4 cột Backlog/Plan/Review/Done + pipeline Planner → Builder → Checker, CTA → `/board`; reuse `Logo` + `ThemeToggle`. (Board sẽ dựng lại ở `/board` trong US2.)
- [x] T014 [US1] Verify US1 theo [quickstart.md](./quickstart.md) bước 1–3 (CTA điều hướng; dark/light không flash — SC-001/009).

**Checkpoint**: Landing chạy độc lập; demo được.

---

## Phase 4: User Story 2 — Board hiển thị Spec dưới dạng card (Priority: P1) 🎯 MVP

**Goal**: `/board` render 4 cột cố định từ mock; card có progress + badge.
**Independent Test**: Mở `/board`, thấy 4 cột đúng thứ tự với card mock; card hiện mã+title+progress, badge Fast lane & ⏳; Check thiếu Evidence không xanh.

- [x] T015 [P] [US2] `web/src/components/board/spec-card-view.tsx`: mã + title + progress (qua `checkProgress`) + badge Fast lane + badge ⏳ khi `runningAgent`; reuse `CheckBadge`/`EvidenceChip`/`ColumnTag`. (Click-mở-detail thêm ở US4.)
- [x] T016 [P] [US2] `web/src/components/board/board-column-lane.tsx`: `ColumnTag` + count + danh sách card.
- [x] T017 [US2] `web/src/app/board/page.tsx`: render 4 cột theo thứ tự Backlog→Plan→Review→Done từ `initialBoard()` (depends T011, T015, T016).
- [x] T018 [US2] Verify US2 theo [quickstart.md](./quickstart.md) bước 4–7 (4 cột + count; ⏳ là badge không phải cột; Fast lane ở Review; missing-evidence không tính/không xanh — FR-006, SC-004).

**Checkpoint**: US1 + US2 chạy độc lập (MVP đọc-tĩnh).

---

## Phase 5: User Story 3 — Kéo-thả sắp xếp card (Priority: P2)

**Goal**: Kéo card giữa cột + đổi thứ tự trong cột, state in-memory.
**Independent Test**: Kéo card sang cột khác/đổi thứ tự (chuột & bàn phím); Board cập nhật ngay; reload về mock gốc.

- [x] T019 [TDD] [US3] Viết test **FAIL trước** `web/src/lib/__tests__/board-state.test.ts`: `moveCard` (cross-column), `reorderCard` (in-column), drop ngoài vùng hợp lệ → trả state cũ nguyên vẹn. Xác nhận fail đúng lý do.
- [x] T020 [US3] Hiện thực reducer thuần `web/src/lib/board-state.ts` cho T019 pass (depends T019).
- [x] T021 [US3] `web/src/components/board/board-dnd.tsx`: `DndContext` với `PointerSensor` + `KeyboardSensor` (`sortableKeyboardCoordinates`), `DragOverlay` + chỉ báo vùng thả; gọi reducer (depends T020).
- [x] T022 [US3] Wire `BoardDnd` vào `web/src/app/board/page.tsx`: state `useReducer` seed từ `initialBoard()`, không persist; giảm hiệu ứng kéo khi `prefers-reduced-motion` (depends T017, T021).
- [x] T023 [US3] Verify US3 theo [quickstart.md](./quickstart.md) bước 8–12 (move/reorder; overlay; keyboard DnD; reload reset — FR-008..011, SC-007).

**Checkpoint**: Board tương tác được; US1–US3 độc lập.

---

## Phase 6: User Story 4 — Chi tiết Spec: overview + trang đầy đủ (Priority: P2)

**Goal**: Dual-surface cùng địa chỉ `/board/[spec]` — drawer overview (intercept) + trang đầy đủ (hard-nav), tab **Spec** + **Checks+Evidence**.
**Independent Test**: Click thân card → drawer overlay (Esc/back đóng); mở thẳng/refresh `/board/[spec]` → trang đầy đủ; "Open full ↗" & ⌘/Ctrl-click → thẳng trang đầy đủ; card Plan→tab Spec, Review→tab Checks.

> ⚠️ **Đọc Next docs trước** (`intercepting-routes.md`, `parallel-routes.md`) — đã verify trong [research.md](./research.md) R1.

- [x] T024 [TDD] [US4] Viết test **FAIL trước** `web/src/lib/__tests__/default-tab.test.ts`: `defaultTab("plan")==="spec"`, `defaultTab("review")==="checks"`, còn lại `"spec"`. Xác nhận fail.
- [x] T025 [US4] Hiện thực `web/src/lib/default-tab.ts` cho T024 pass (depends T024).
- [x] T026 [US4] `web/src/app/board/layout.tsx`: nhận `{children}` + `{drawer}` (parallel slot) và render cả hai.
- [x] T027 [P] [US4] `web/src/app/board/@drawer/default.tsx`: trả `null`.
- [x] T028 [P] [US4] `web/src/components/detail/drawer-overview.tsx`: mã/title/column/badge/goal/progress + danh sách Checks + "Open full ↗".
- [x] T029 [P] [US4] `web/src/components/detail/open-full-link.tsx`: `<Link>` tới `/board/[spec]` đi thẳng trang đầy đủ, hỗ trợ ⌘/Ctrl-click + affordance hover.
- [x] T030 [P] [US4] `web/src/components/spec/spec-view.tsx` (tab Spec): TOC dính; Goal; US + chip P1/P2/P3; Given/When/Then thành block có nhãn; FR-xxx/SC-xxx mã mono; Edge/Assumptions; văn xuôi qua **streamdown** (+ Mermaid); khối Tasks gập-được kèm tiến độ.
- [x] T031 [P] [US4] `web/src/components/checks/checks-panel.tsx` (tab Checks): nhóm theo verify-order (deterministic→evidence→held-out→judge), progress bar, Evidence mở được, thiếu Evidence → cảnh báo **không bao giờ xanh**, empty state khi không Check; trạng thái phân biệt cả hình lẫn màu.
- [x] T032 [US4] `web/src/components/detail/detail-tabs.tsx`: 3 tab Spec | Checks+Evidence | Diff (Diff là slot rỗng tới US5), điều khiển bằng bàn phím, nhận `defaultTab` (depends T025, T030, T031).
- [x] T033 [US4] `web/src/app/board/[spec]/page.tsx` (trang đầy đủ): `getSpec(id)` → `notFound()` nếu thiếu; render `DetailTabs` với `defaultTab(card.column)` (depends T011, T032).
- [x] T034 [P] [US4] `web/src/app/board/[spec]/not-found.tsx`: "Spec not found" + lối về `/board`.
- [x] T035 [US4] `web/src/app/board/@drawer/(.)[spec]/page.tsx`: intercept soft-nav, render `DrawerOverview` trong overlay (board mờ sau); Esc + nút back đóng qua `router.back()` (depends T026, T028).
- [x] T036 [US4] Wire click-thân-card (soft-nav `/board/[spec]`) + `OpenFullLink` vào `web/src/components/board/spec-card-view.tsx` (depends T015, T029).
- [x] T037 [P] [US4] Viết ADR `docs/design-docs/web-dual-surface-routing.md` (Context/Decision/Alternatives/Consequences) cho quyết định intercepting+parallel routes.
- [x] T038 [US4] Verify US4 theo [quickstart.md](./quickstart.md) bước 13–22 (drawer/Esc/back; deep-link & refresh ra trang đầy đủ; Open full & ⌘-click; tab Spec quét-được + TOC; tab Checks evidence-gated + grayscale; default tab theo cột; not-found; card không-Check empty — FR-012..024, SC-002/003/005/006).

**Checkpoint**: Hành vi cốt lõi (review tầng ý định) hoạt động đầy đủ.

---

## Phase 7: User Story 5 — Tab Diff (Priority: P3)

**Goal**: Tab Diff Monaco read-only render diff mock; empty state khi chưa có diff.
**Independent Test**: Mở chi tiết card có diff → tab Diff thấy file added/modified/deleted + nội dung read-only; card chưa có diff → empty state, không lỗi.

- [x] T039 [P] [US5] `web/src/components/diff/diff-view.tsx`: `@monaco-editor/react` read-only (lazy-load), render danh sách file + patch mock; `diff` rỗng → empty state.
- [x] T040 [US5] Tích hợp `DiffView` vào tab Diff trong `web/src/components/detail/detail-tabs.tsx` (depends T032, T039).
- [x] T041 [US5] Verify US5 theo [quickstart.md](./quickstart.md) bước 23–24 (diff read-only; empty state — FR-025/026).

**Checkpoint**: Toàn bộ user story hoàn chỉnh.

---

## Phase 8: Polish & Cross-Cutting (Quality gate Q1)

**Purpose**: a11y/theme/reduced-motion + cổng deterministic-first đóng feature.

- [x] T042 A11y sweep: hoàn thành **toàn luồng chỉ bằng bàn phím** (landing→Board→mở chi tiết→đổi tab→drag-drop), focus luôn thấy được — [quickstart.md](./quickstart.md) bước 25 (SC-008).
- [x] T043 Reduced-motion: gate animation ⏳ + hiệu ứng kéo sau `prefers-reduced-motion` (touch `board-dnd.tsx`, badge ⏳) — bước 26.
- [x] T044 Theme sweep: dark & light đúng trên mọi màn, không nhấp nháy (SC-009).
- [x] T045 [P] Grep gates: `grep` 0 hardcode hex ngoài `globals.css`; 0 `process.env` lộ secret ngoài `NEXT_PUBLIC_*`/`env.ts` (lệnh trong [quickstart.md](./quickstart.md)).
- [x] T046 Cổng deterministic: `cd web && pnpm test && pnpm lint && pnpm build` đều xanh (env validate lúc build).
- [ ] T047 Chạy [quickstart.md](./quickstart.md) end-to-end (26 bước) — đánh dấu đạt/không đạt.
- [x] T048 [P] Docs freshness: `grep` tham chiếu cũ tới board-mock-ở-`/` trong `docs/`; cập nhật nếu lệch (theo `.claude/rules/docs-as-code.md`).

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

---

## Refinements (2026-06-25)

Cải tiến sau-MVP từ review trực quan. Mỗi mục là một đơn vị commit với điều kiện done quan sát được. Các đường dẫn component ở T002/T028–T032/T039–T040 là **lịch sử**; R1 dưới đây *supersedes* (file vẫn tồn tại, chỉ đổi chỗ).

- [x] R1 **Tái cấu trúc thư mục component theo feature** — gộp các thư mục một-file rời rạc: `components/{detail,spec,checks,diff}/*` → `components/board/detail/*`; dissolve `components/status/*` (`column-tag`+`running-badge` → `components/board/`, `check-badge`+`evidence-chip` → `components/board/detail/`). Done: `tsc`/`eslint`/`vitest` xanh; `grep` không còn ref `@/components/{detail,spec,checks,diff,status}/` trong code + docs.
- [x] R2 **Mock landing riêng cho end-user** — `web/src/mock/landing.ts`: card công việc đời thực (dark mode, “Sign in with Google”, slow checkout, email receipt…) thay dataset dogfood khó hiểu. Landing preview + evidence panel đọc từ đây; `mock/specs.ts` (board) giữ nguyên ràng buộc FR-007. Done: ví dụ evidence “Looks right on a phone” pass-nhưng-thiếu-Evidence vẫn **không xanh**.
- [x] R3 **Ghost placeholder khi kéo-thả board** — `onDragOver` chuyển card sang cột đang hover ngay khi kéo: bản mờ (card + viền đứt mint) hiện đúng vị trí sẽ thả, card lân cận dịch ra mở khe; clone nâng theo con trỏ qua `DragOverlay`; Esc/thả-ngoài khôi phục thứ tự (snapshot lúc dragStart). Done: kéo cross-column thấy ô thả mờ ở cột đích.
- [x] R4 **Slogan hero** — chốt **"Your spec is the source code now."** (accent *spec* mint) thay "Review specs, not diffs."; cập nhật hero H1 + subtext + footer tại `web/src/app/page.tsx`. Cơ sở: nghiên cứu vai-trò coder→conductor/orchestrator (Karpathy, O'Reilly, latent.space, GitHub agent-PR). Done: `/` render hero mới.

## Refinements vòng 2 (2026-06-25) — visual polish

Từ review trực quan board + landing. Batch A (R5–R8) chỉ sửa source (hot-reload, không thêm dep); Batch B (R9–R10) thêm dependency → rebuild riêng service `web`. Lựa chọn visual đã chốt với người dùng: Done→blue, drag=nghiêng+quầng mint, highlighter=khoanh/khung.

- [ ] R5 **Done → blue, tách khỏi Review mint** — `web/src/app/globals.css`: thêm raw token `--shipped` (#2f6fd0 / dark #5b9bf0) vào `:root`+`.dark`, repoint `--col-done: var(--shipped)` (trước = `var(--good)`). `--good`/`--check-pass` giữ xanh lá. KHÔNG xoá var nào. Done: dot/label cột Done là xanh dương, khác hẳn mint của Review; check-pass vẫn xanh lá; `tsc`/`eslint` xanh.
- [ ] R6 **Drag treatment nghiêng + quầng mint** — `web/src/components/board/board-dnd.tsx`: `DragOverlay` card đổi sang `-rotate-2 scale-105 shadow-2xl shadow-primary/30 ring-2 ring-primary`. Ghost mờ tại chỗ giữ outline mint đứt nét. Done: kéo card thấy bản nâng nghiêng + quầng mint thay vì bóng xám mặc định.
- [~] R7 **Lanes có border** — `web/src/components/board/board-column-lane.tsx`: bọc mỗi lane trong khung `rounded-xl border bg-surface/40`, header có divider + viền-trên 2px theo màu cột (`border-col-*`), droppable `isOver` làm sáng viền mint, `min-h` cho lane rỗng. Done: 4 cột hiện thành 4 làn có viền phân tách rõ. **SUPERSEDED bởi R19** (vòng 4): bỏ viền cột — chuyển sang board nhóm swimlane không-viền; `board-column-lane.tsx` đã xoá.
- [ ] R8 **Board page polish** — `web/src/app/board/page.tsx`: thêm page-header ("Board" + tổng số Spec), canh nhịp gap/padding, polish hover card. Done: `/board` có header + nhịp gọn hơn; `tsc`/`eslint`/`vitest` xanh.
- [x] R9 **Terminal install-demo (open source)** — `shadcn add` Aceternity Terminal qua URL trực tiếp → `ui/terminal.tsx` (component thuần React, không kéo dep). `landing/install-terminal.tsx` gõ lệnh self-host **mock** SpecDeck (`git clone` → `cd` → `cp .env.example .env` → `docker compose up -d`) + output canned, `enableSound={false}` (tránh fetch asset âm thanh không có). Section "Open source — Self-host the whole deck" (text + bullets + Terminal) đặt trước CTA cuối. Done: `/` 200, section render, terminal gõ lệnh; `tsc`/`eslint`/`vitest` xanh.
- [x] R10 **Highlighter cho "Checks"** — `shadcn add` MagicUI Highlighter qua URL → `ui/highlighter.tsx` (kéo `motion` + `rough-notation`). `landing/highlight-word.tsx` annotate từ "Checks" trong "Read the Checks, not the code.", **mint theo theme** (#0a8470 light / #38e8c6 dark vì rough-notation vẽ màu tĩnh), `isView` (vẽ khi cuộn tới). Người dùng chốt `action="underline"` (gạch chân) thay `circle` vì vòng tròn đè chữ rộng. Cần **rebuild container** (`docker compose build web && rm -fsv web && up -d web`) để `motion`/`rough-notation` vào node_modules anon-volume. Done: `/` render gạch chân vẽ-tay dưới "Checks"; container có dep; lỗi "Module not found" lúc khởi động chỉ là race Turbopack (modules xác nhận có mặt).

## Refinements vòng 3 (2026-06-25) — board interaction + blocker fix

Từ review trực quan board (sau khi mở thật trên browser). R11 là blocker phát hiện khi render thật.

- [x] R11 **Fix dnd-kit × React Compiler infinite loop** — `"use no memo"` trên `BoardDnd`, `SortableSpecCard`, `BoardColumnLane`. Root cause: `reactCompiler: true` làm `useUniqueId` của dnd-kit mất ổn định → id `DndDescribedBy` đổi mỗi render → "Maximum update depth exceeded" ngay khi mount. Latent từ trước (board chưa từng mở trên browser với compiler bật; vitest dùng `@vitejs/plugin-react` KHÔNG có compiler nên không bắt được). Done: `/board` hết loop; `tsc`/`eslint` xanh. *Ops note:* Turbopack dev persistent-cache trong container tự corrupt giữa chừng (panic "Failed to restore task data") — phục hồi bằng `docker compose rm -fsv web && docker compose up -d web` (pgdata named-volume an toàn).
- [x] R12 **Board spacing + min-h-svh** — bỏ `space-y-6` (không ăn do dnd-kit chèn DOM sibling) ở `board/page.tsx`; dùng `mb-6` ở header + `flex-1`; layout `min-h-full`→`min-h-svh` để cả trang board cao tối thiểu 1 viewport; grid lanes `gap-4`. Done: `/board` cao ≥ 100svh, khoảng cách header→board ổn định.
- [x] R13 **Drop-lane highlight ổn định khi kéo** — `board-dnd` truyền `isTarget` (lane đang chứa card kéo, `onDragOver` giữ live) cho `BoardColumnLane`; highlight dùng `isTarget || isOver` thay vì chỉ `isOver` (tắt khi trỏ trên card → nhấp nháy). Done: cột đích sáng liên tục suốt thao tác kéo.
- [x] R14 **Drawer → Sheet trong trang (bỏ intercepting route)** — thay `@drawer` parallel/intercepting route (`(.)[spec]`, gây "Invalid interception route" trên Next 16) bằng Sheet client-state `components/board/spec-sheet.tsx` (`BoardSheetProvider`): click card → mở Sheet bên phải, KHÔNG đổi URL. Giữ trang đầy đủ `/board/[spec]` cho "Open full"/share/refresh. `drawer-overview`→`spec-overview`, xoá `drawer-shell`; Sheet trượt full-width (`ui/sheet.tsx`: `2.5rem`→`full`) + `pt-12` tránh nút close. **Supersedes** phần dual-surface intercepting của US4 (T028–T032). Done: click card mở sheet không đổi URL; hết lỗi interception; `tsc`/`eslint`/`vitest` xanh.
- [x] R15 **Sheet animation + width 40%** — base-ui transition kiểu `[data-starting-style]` KHÔNG fire trong stack Next16+React19+reactCompiler (CSS đúng, verified, nhưng không chạy hình ảnh). Chuyển `ui/sheet.tsx` sang keyframe tw-animate-css: `animate-in fade-in slide-in-from-<side>` (enter on mount — cùng cơ chế landing đã chạy) + `data-ending-style:animate-out fade-out slide-out-to-<side>` (exit). Đăng ký `@custom-variant data-starting-style/data-ending-style` trong globals.css (trước đó thiếu → mọi class animation overlay compile rỗng). Width Sheet: `sm:w-2/5` (≈40%), min `28rem`, max `2xl`. Done (verified ở tầng CSS): served CSS có `@keyframes enter` + `[data-side=right] --tw-enter-translate-x:100%` + `animate-in`; `prefers-reduced-motion` vẫn được tôn trọng (nếu user bật Reduce Motion ở OS thì animation tắt theo thiết kế).

## Refinements vòng 4 (2026-06-26) — grouped swimlane board (GitHub-Projects-style)

Từ review trực quan `/board`. Quyết định đã chốt với người dùng: layout **swimlane** (cột header chung sticky, mỗi group là 1 băng ngang gập được cắt qua 4 cột), kéo-thả **qua cột + qua group**, thiết kế kiểu GitHub Projects "group by" nhưng đẹp hơn. Chỉ sửa source (hot-reload, không thêm dep). Toàn bộ thuộc `/board`; landing demo (`mock/landing.ts`) KHÔNG đụng.

- [x] R16 **Bỏ viền phân tách cột** — board không còn khung/viền quanh từng cột (point 1). Cột là vùng mở; phân tách bằng grid-gap + băng group + header chung. Drop-target tô mềm không-viền (`bg-accent-soft/60 ring-primary/40 ring-inset`) ở `board-cell.tsx`. **Supersedes R7.** Done: `/board` 4 cột không còn viền hộp.
- [x] R17 **Column header chung sticky + restyle** — `board-column-header.tsx` (mới): 1 hàng header cột duy nhất, `sticky top-16` (dưới app bar) nên đứng yên khi cuộn các group. Bỏ header cột riêng từng group + bỏ nhãn cột trong cell. Style: nhãn IN HOA `tracking-wider`, dot màu cột, count pill viền, gạch chân accent `h-0.75` theo `--col-*` (Review mint, Done blue), `border-b` tách khỏi board. Done: header cột pin khi cuộn; canh thẳng grid 4 cột.
- [x] R18 **Group swimlane + gập/mở** — `board-group-lane.tsx` (mới): mỗi group 1 băng ngang = header (chevron + label + count) trên lưới 4 cell; **mọi** group có 1 line phân cách phía trên (`border-t border-border/50`, kể cả group đầu). Collapse (`useState<Set>` trong `board-dnd`) ẩn cả lưới → gập toàn bộ card của group qua 4 cột; count vẫn hiện. `grid-cols-4` cố định để canh với header. Chevron lucide. Done: click chevron gập/mở băng group; line trước mọi group.
- [x] R19 **State model theo cell + kéo qua cột & qua group** — `lib/board-state.ts` viết lại: `GroupedBoardState = GroupLane[]` với `cells: Record<column, SpecCard[]>` (cell = group×column) thay `BoardColumnLane[]`; 1 transform `moveCard(state, cardId, toGroup, toColumn, toIndex)` lo cả reorder/đổi-cột/đổi-group (set lại `card.column`+`card.group`); drop sai → trả state nguyên si. `board-dnd.tsx` droppable id `"${group}::${column}"` (`board-ids.ts`), `onDragOver` di chuyển live qua cell khác (cross-column + cross-group), snapshot revert giữ nguyên. TDD: `board-state.test.ts` viết lại (10 test: reorder/cross-column/cross-group/clamp/no-op). `SpecCard` thêm `group?` (types.ts), `mock/specs.ts` gán group cho 7 card + `BOARD_GROUPS` (3 nhóm) + `initialBoard()` trả grouped state. Done: kéo card đổi cột trong group và sang group khác; `tsc`/`eslint`/`vitest` (31 test) xanh.
- [x] R20 **Mock thêm volume để scroll** — `mock/specs.ts`: tách `RICH_SPECS` (7 card chi tiết, giữ FR-007) + `FILLER_SPECS` (20 card nhẹ qua helper `mk()`/`ev()`/`pend()`/`run()`/`fl()`: title + goal, một số có Checks/fastlane/runningAgent, các field spec-detail để rỗng) rải đủ 3 group × 4 cột; `SPECS = [...RICH, ...FILLER]` (27 card). Done: `/board` đủ cao để cuộn, header cột pin lại; render 200 với SPEC-030…SPEC-049.
- [x] R21 **List view + Tab chuyển Kanban/List (state dùng chung)** — nâng state board lên `board-view.tsx` (mới): `useReducer(boardReducer, …)` + `collapsed` Set, chuyển 2 dạng bằng `ui/tabs` (Kanban | List, icon lucide). `boardReducer`+`BoardAction` chuyển vào `lib/board-state.ts` (thuần). `board-dnd.tsx` thành **controlled** (nhận `state/dispatch/collapsed/onToggleGroup`). `board-list.tsx` (mới): cùng swimlane/collapse, mỗi group là list phẳng theo cột — tái dùng `ColumnTag`(status)/`checkProgress`/Fast lane+Running badge/`OpenFullLink`/`useBoardSheet`. Tách `board-group-header.tsx` (mới) dùng chung cả 2 dạng. Vì cả 2 surface đọc CÙNG state+collapsed → move ở Kanban hiện ở List và ngược lại, collapse đồng bộ. Tăng khoảng cách giữa các group (`gap-6` + `pt-3`). Done: `/board` có tab Kanban/List; đổi tab giữ nguyên state; `tsc`/`eslint`/`vitest` (31) xanh, render 200 có `role="tab"`.
- [x] R22 **Search + Filter dùng chung 2 mode** — `board-toolbar.tsx` (mới): ô search (id/title) + dropdown Filter (checkbox Status × 4, Group × 3, `closeOnClick={false}` để chọn nhiều; "Clear filters"). State search/filter nâng lên `board-view.tsx` (đặt cạnh `TabsList`, NGOÀI `TabsContent`) nên áp cho cả Kanban lẫn List và GIỮ NGUYÊN khi đổi mode. Logic thuần `filterBoard(state, {query, statuses, groups})` ở `lib/board-state.ts` (prune lane rỗng khi narrow) — feed `filtered` vào cả 2 surface; drag vẫn dispatch lên state thật nên card ẩn không mất. TDD: +4 test `filterBoard` (empty/query/status/group). Fixes lúc làm: (a) `DropdownMenuLabel` phải nằm trong `DropdownMenuGroup` (base-ui `GroupLabel` cần `Menu.Group`); (b) `Input type="search"` đẻ thêm nút X native → đổi `type="text"` (chỉ dùng nút clear tự vẽ). Done: search/filter chạy ở cả 2 mode, không reset khi switch; `tsc`/`eslint`/`vitest` (35) xanh, render 200.
- [x] R23 **DnD cho List view (chỉ đổi group)** — `board-list.tsx`: thêm `DndContext` riêng, mỗi group section là `useDroppable` (id = groupId), mỗi row là `useDraggable`. Hiệu ứng y hệt Kanban: clone nâng nghiêng + `ring-2 ring-primary` qua `DragOverlay`, ghost mờ `opacity-40` + viền đứt mint tại chỗ, group đích sáng `bg-accent-soft/50 ring-primary/40`, `PointerSensor` distance 6 (click vẫn mở Sheet), tôn trọng reduced-motion. Khác Kanban: List **chỉ đổi group**, KHÔNG đổi column — `onDragOver` dispatch `moveCard(card, toGroup, source.column, end-of-column-cell)`; thả ngoài → revert snapshot. Nhận `dispatch` từ `BoardView` (cùng reducer/state thật) nên move ở List hiện ở Kanban và ngược lại. Done: kéo row sang group khác trong List → đổi group giữ nguyên status; `tsc`/`eslint`/`vitest` (35) xanh, render 200.
