---
description: "Task list — 003-projects"
---

# Tasks: SpecDeck Web — Projects (workspace) shell

**Input**: Design documents từ `.specify/specs/003-projects/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)

> Ngôn ngữ: tiếng Việt; danh từ sản phẩm/cột giữ tiếng Anh. **Mọi nhãn UI là tiếng Anh.** Toàn bộ đường dẫn dưới đây nằm trong `web/`.
> **Tests**: theo plan, **chỉ** TDD cho logic thuần (`board-summary`, `workspace-reducer`). UI/route verify qua kịch bản thủ công + RTL smoke.
> **RÀNG BUỘC** ([web/AGENTS.md](../../../web/AGENTS.md)): Next 16 — **đọc** `web/node_modules/next/dist/docs/` (route groups, layouts, dynamic params, redirect, not-found) trước khi viết code route ở Phase 2. Không hardcode hex ngoài `globals.css`; **chỉ thêm**, không xoá biến `--*` đang có. **Không** secret ở client.
> **Reuse**: `BoardView` + toàn bộ chi tiết Spec của 002 dùng lại nguyên — feature này bọc shell + gắn dữ liệu theo Project.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: chạy song song được (khác file, không phụ thuộc task chưa xong)
- **[Story]**: US1–US5; Setup/Foundational/Polish không gắn nhãn story

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: baseline xanh + cài shadcn sidebar + token.

- [x] T001 Baseline xanh trên `003-projects`: tsc sạch, eslint sạch, **35 tests pass** trong container `web`.
- [x] T002 Đọc Next 16.2.9 docs (route groups, nested layouts, async `params`, `redirect`, `not-found`) → chốt vào [research.md](./research.md). Gotcha chính: `params` là Promise (`await`/`use`); giữ một root layout (group không tạo full-reload).
- [x] T003 ~~Thêm shadcn sidebar qua CLI~~ — **đã có sẵn**: `ui/sidebar.tsx` (đầy đủ `SidebarProvider`/`Sidebar`/`SidebarInset`/`SidebarRail`/`SidebarMenu*`, cookie `sidebar_state`, `⌘B`) + `sheet`/`tooltip`/`separator`/`skeleton`/`dialog`/`avatar`/`textarea`/`label` do base-nova cài. Không cần thêm.
- [x] T004 ~~Thêm token `--sidebar*`~~ — **đã có sẵn** trong `globals.css` cho cả `:root` + dark, đã đăng ký trong `@theme inline` (mint `#0a8470`/`#38e8c6`). Không cần đụng.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: kiểu dữ liệu Project + mock + store + tách route group + shell khung. ⚠️ **Mọi user story bị chặn tới khi phase này xong.**

**Project model + mock (F1)**
- [x] T005 [P] Tạo `web/src/mock/projects.ts`: type `ProjectMeta { id, name, description, repo, defaultBranch, color, context }`; `PROJECTS` ≥2 Project — một id `specdeck` (dogfood) **tái dùng** `BOARD_GROUPS` + `SPECS` của `mock/specs.ts`, một Project thứ hai dataset board nhẹ riêng (vài card, group khác) để chứng minh cô lập; export `DEFAULT_PROJECT_ID`, `getProject(id)`, `boardDataFor(id) → { groups, lanes }` (id lạ → board rỗng `[]`).
- [x] T006 [P] Dataset board cho Project thứ hai (trong `mock/projects.ts` hoặc `mock/specs-<id>.ts`): vài `SpecCard` + group riêng, khác hẳn dataset `specdeck` (để SC-002 quan sát được).

**Pure logic — TDD (F2)**
- [x] T007 [TDD] Viết test **FAIL trước** `web/src/lib/__tests__/board-summary.test.ts`: `boardSummary(lanes)` trả `{ perColumn: {backlog,plan,review,done}, running }`; board rỗng → tất cả 0, running 0; đếm `runningAgent` đúng. Chạy, xác nhận fail đúng lý do.
- [x] T008 Hiện thực `web/src/lib/board-summary.ts` cho T007 pass (depends T007; nguồn kiểu từ `lib/board-state.ts`).
- [x] T009 [TDD] Viết test **FAIL trước** `web/src/lib/__tests__/workspace-reducer.test.ts`: `workspaceReducer` — `add` thêm Project (id mới sinh từ tên, không trùng id sẵn có), `update` đổi field theo id, action/id lạ → state ổn định (no-op). Chạy, xác nhận fail.
- [x] T010 Hiện thực `web/src/lib/workspace-reducer.ts` (reducer + helper `slugifyToId`) cho T009 pass (depends T009).

**Route group split + shell khung (F3)**
- [x] T011 Tách route group: tạo `web/src/app/(landing)/` và **chuyển** `web/src/app/page.tsx` → `web/src/app/(landing)/page.tsx` (giữ nguyên nội dung landing). Root `layout.tsx` không đổi.
- [x] T012 Tạo `web/src/components/workspace/workspace-context.tsx` (`'use client'`): `WorkspaceProvider` bọc `useReducer(workspaceReducer, PROJECTS)` + hooks `useProjects()`/`useProject(id)`/`useWorkspaceDispatch()` (depends T010, T005).
- [x] T013 Tạo `web/src/app/(workspace)/layout.tsx`: đọc cookie `sidebar_state` (server) → `<SidebarProvider defaultOpen>` > `<WorkspaceProvider>` > `<AppSidebar/>` + `<SidebarInset>{children}</SidebarInset>`. AppSidebar khung tối thiểu trước (placeholder), hoàn thiện ở US1 (depends T003, T012).
- [x] T014 Tạo `web/src/app/board/route.ts`: `GET` redirect `/board` → `/p/${DEFAULT_PROJECT_ID}/board`; **xoá** `web/src/app/board/layout.tsx` + `web/src/app/board/page.tsx` cũ (board thật chuyển vào `(workspace)` ở US3). Cập nhật CTA landing trỏ `/p/${DEFAULT_PROJECT_ID}/board`.

**Checkpoint**: `/` (landing) render qua group mới; `/board` redirect; store + summary sẵn sàng → user story bắt đầu được.

---

## Phase 3: User Story 1 — Workspace shell + sidebar (Priority: P1) 🎯 MVP

**Goal**: sidebar liệt kê Project, chuyển Project, thu gọn về avatar, nhớ trạng thái.
**Independent Test**: mở workspace → sidebar có list Project; bấm Project khác → vùng phải đổi + active đổi; thu gọn → mỗi Project là avatar màu + tooltip; refresh giữ trạng thái collapse.

- [x] T015 [P] [US1] Tạo `web/src/components/workspace/project-avatar.tsx`: ô bo góc nền `color` Project + chữ cái đầu (monogram), props `{ project, size? }`; dùng chung sidebar + header.
- [x] T016 [US1] Hoàn thiện `web/src/components/workspace/app-sidebar.tsx` (adapt sidebar-07, `collapsible="icon"`): `SidebarHeader` = SpecDeck `Mark`/`Logo` (workspace brand); `SidebarContent` = `NavProjects` (mỗi Project `SidebarMenuButton asChild` → `Link /p/[id]`, leading `ProjectAvatar`, label tên; `isActive` theo pathname; thu gọn → chỉ avatar + `tooltip` tên); `SidebarFooter` = `ThemeToggle` + nút settings; `SidebarRail`. Bỏ `NavMain`. (depends T013, T015)
- [x] T017 [US1] Active state: dùng `usePathname()` đánh dấu Project đang xem; điều hướng giữ trạng thái sidebar (cookie do SidebarProvider lo).
- [x] T018 [US1] Verify `⌘B`/`SidebarTrigger` thu gọn↔mở, cookie `sidebar_state` giữ qua refresh (không flash), mobile < `md` mở overlay (Sheet) — qua hot-reload trình duyệt; ghi vào checkpoint.

**Checkpoint**: chuyển Project + collapse hoạt động (vùng phải tạm là placeholder cho tới US2).

---

## Phase 4: User Story 2 — Project Overview (tab mặc định) (Priority: P1)

**Goal**: project header + tabs Overview·Board·Settings; Overview mặc định, hiện identity + board snapshot.
**Independent Test**: mở Project → mặc định Overview; thấy tên/repo/mô tả/Project Context rút gọn + số card theo cột + running; tab bar đúng thứ tự, Overview active.

- [x] T019 [US2] Tạo `web/src/app/(workspace)/p/[project]/layout.tsx` (`'use client'` hoặc resolve qua context): lấy `params.project` → `useProject(id)`; không có → `notFound()`. Render `<ProjectHeader project/>` + `{children}`.
- [x] T020 [US2] Tạo `web/src/components/workspace/project-header.tsx`: `SidebarTrigger` + `ProjectAvatar` + tên + repo link; tab bar **Overview · Board · Settings** link-tabs (`Link` tới `/p/[id]/<tab>`, active theo `usePathname()`); reduced-motion an toàn (depends T015).
- [x] T021 [US2] Tạo `web/src/app/(workspace)/p/[project]/page.tsx`: `redirect()` → `./overview` (tab mặc định, FR-007).
- [x] T022 [US2] Tạo `web/src/app/(workspace)/p/[project]/overview/page.tsx` + `web/src/components/workspace/overview-panel.tsx`: khối identity (tên, repo↗, mô tả, Project Context rút gọn/đọc-được) + khối board snapshot dùng `boardSummary(boardDataFor(id).lanes)` (số/cột + running); board rỗng → empty state rõ ràng (FR-011) (depends T008, T005).

**Checkpoint**: Overview là mặt mặc định của mỗi Project; tab bar điều hướng được (Board/Settings tạm trống).

---

## Phase 5: User Story 3 — Tab Board theo Project (Priority: P1)

**Goal**: tab Board = BoardView 002 gắn dữ liệu riêng Project; chi tiết Spec project-aware; cô lập dữ liệu.
**Independent Test**: Project A board ≠ Project B board; thao tác board OK; mở chi tiết Spec → URL gắn project; refresh về seed.

- [x] T023 [US3] Tạo `web/src/app/(workspace)/p/[project]/board/page.tsx`: lấy `boardDataFor(id)` → render `<BoardView initialLanes groups/>` (002) trong `BoardSheetProvider`; board rỗng → empty state của BoardView (depends T005).
- [x] T024 [US3] Project-aware Spec detail: tạo `web/src/app/(workspace)/p/[project]/board/[spec]/page.tsx` resolve Spec trong dataset của Project (`boardDataFor(id)`), Spec không thuộc Project → `notFound()`.
- [x] T025 [US3] Cập nhật base path Spec detail thành project-aware trong `web/src/components/board/spec-sheet.tsx`, `spec-card-view.tsx`, và `OpenFullLink` (nhận `projectId` qua context hoặc prop) — link `/p/[project]/board/[spec]` thay cho `/board/[spec]`.
- [x] T026 [US3] Verify cô lập (SC-002): A không hiện card của B; kéo-thả + search/filter + mở chi tiết hoạt động trong từng Project; refresh về seed (FR-013/014/015) — qua hot-reload; ghi checkpoint.

**Checkpoint**: mỗi Project có Board đầy đủ tính năng 002, dữ liệu tách bạch.

---

## Phase 6: User Story 4 — Tạo Project qua modal (Priority: P2)

**Goal**: New project → modal nhanh → vào Project mới (board rỗng).
**Independent Test**: "New project" → tên (+repo/màu) → tạo → Project trong sidebar + mở Overview; tên trống → lỗi inline.

- [x] T027 [US4] Tạo `web/src/components/workspace/new-project-dialog.tsx` dùng `Dialog` (ui có sẵn / shadcn): ô tên (bắt buộc) + repo (tuỳ chọn) + chọn màu nhận diện; validate tên trống → lỗi inline (FR-017); Esc/huỷ đóng không tạo.
- [x] T028 [US4] Nối nút `＋ New project` ở sidebar mở dialog; submit → `dispatch({type:'add',...})` rồi `router.push('/p/<newId>/overview')` (depends T027, T016, T012).
- [x] T029 [US4] Verify: Project mới xuất hiện sidebar + Overview board rỗng; refresh → về tập seed (FR-018, không persist).

---

## Phase 7: User Story 5 — Tab Settings (Priority: P2)

**Goal**: sửa identity + Project Context; phản ánh ngay ở Overview/sidebar; không ô secret.
**Independent Test**: Settings → đổi tên/Project Context → lưu → Overview + sidebar cập nhật trong phiên.

- [x] T030 [US5] Tạo `web/src/app/(workspace)/p/[project]/settings/page.tsx` + `web/src/components/workspace/settings-form.tsx`: trường tên, repo, default branch, màu, ô soạn Project Context; **không** ô secret/API-key (FR-021).
- [x] T031 [US5] Lưu → `dispatch({type:'update', id, patch})`; verify đổi tên/màu phản ánh ngay ở sidebar + Overview (FR-020, SC-005) (depends T012, T030).

---

## Phase 8: Polish & Cross-Cutting

- [x] T032 [P] A11y: keyboard-only toàn luồng (điều hướng sidebar, `SidebarTrigger`, link-tabs, dialog focus-trap), focus nhìn thấy, ~~`prefers-reduced-motion` cho chuyển tab + sidebar~~ *(đã gỡ — xem Refinements R2)* (FR-022, SC-006).
- [x] T033 [P] Theme: kiểm dark + light cho sidebar/header/overview/settings, không flash (FR-023, SC-007); xác nhận token `--sidebar*` đúng cả hai theme.
- [x] T034 [P] Dọn dẹp: grep và xoá tham chiếu `/board/[spec]` cũ còn sót, đảm bảo không còn route board cũ; landing CTA/footer trỏ đúng workspace.
- [x] T035 Docs-as-code: tạo `data-model.md` (003) với `ProjectMeta` + board mapping; cập nhật `README.md` mục trạng thái (multi-project shell); annotate trạng thái hoàn thành trong tasks này.
- [x] T036 Quality gate cuối: container `web` chạy `pnpm exec tsc --noEmit && pnpm exec eslint src && pnpm exec vitest run` xanh; verify route `/p/<default>/{overview,board,settings}` = 200 và `/board` redirect; ghi lại kết quả.

---

## Dependencies & thứ tự

- **Setup (T001–T004)** → **Foundational (T005–T014)** chặn mọi US.
- **US1 (T015–T018)** mở khoá điều hướng; **US2 (T019–T022)** cần header/tabs; **US3 (T023–T026)** cần `boardDataFor` + reuse 002; **US4/US5** cần store (T012) + sidebar (T016).
- MVP = Setup + Foundational + **US1 + US2 + US3** (shell + Overview + Board theo Project trên dữ liệu seed). US4 (tạo) + US5 (settings) là tăng dần.
- TDD: T007/T009 (fail) **trước** T008/T010.

## Parallel opportunities

- T005 ∥ T006 (mock); T015 ∥ (T032/T033/T034 ở Polish khác file).
- Trong Foundational: T007/T009 (test) có thể viết song song trước khi hiện thực.

---

## Refinements (vòng R — 2026-06-26)

Thay đổi sau khi T001–T036 đã xanh; ghi lại như đơn vị committable với điều kiện done quan sát được. spec.md (FR-001, FR-022..025, edge "Motion") + plan.md đã cập nhật khớp.

- [x] **R1 — Migrate shadcn base-nova → new-york (Radix).** `components.json` `style: "new-york"`, `iconLibrary: "lucide"`; `ui/*` chạy trên `@radix-ui/*`; gỡ các component thừa base-nova không dùng. **Done**: `tsc + eslint + vitest` (49) xanh; các surface (sidebar/dialog/dropdown/sheet/tabs/tooltip) render đúng.
- [x] **R2 — Gỡ hẳn reduced-motion** product-wide (quyết định người dùng). Xoá block `@media (prefers-reduced-motion)` trong `globals.css`, xoá hook `use-reduced-motion.ts`, bỏ class `.motion-essential` + nhánh `dropAnimation` reduced-motion trong dnd (`board-dnd`, `board-list`). **Done**: `grep -r "reduced-motion" web/src` = 0; animation luôn bật. **Supersedes**: FR-022 (mệnh đề reduced-motion), edge "Motion", T032.
- [x] **R3 — Sidebar footer/utilities.** `nav-user.tsx` (account block NavUser, mock user; chỉ Account + Log out), `nav-notifications.tsx` (inbox + badge số chưa đọc, feed mock `mock/notifications.ts` gồm `task-done`/`needs-input`/`check-failed`, mỗi mục deep-link `/p/<id>/board/<specId>`, mark-read trong phiên), `nav-settings.tsx` (theme Light/Dark/System + tuỳ chọn mock: notify-on-done / notify-on-needs-input / compact cards). Re-add `ui/avatar.tsx` (`@radix-ui/react-avatar`). **Done**: route `/p/specdeck/{overview,board}` + `/p/specdeck/board/SPEC-018` = 200; tsc/eslint/vitest xanh. (FR-001, FR-024, FR-025)
- [x] **R4 — Board polish.** Badge số ở `board-column-header` → chip tròn (`h-4.5 min-w-4.5`, nền `bg-foreground/6`, `text-[10px]`) thay vì pill xám thô; gap card Kanban trong `board-cell` `gap-4 → gap-4.5`. **Done**: header + board render đúng, eslint xanh (canonical Tailwind classes).
