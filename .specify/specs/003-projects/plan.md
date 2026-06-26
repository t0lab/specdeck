# Implementation Plan: SpecDeck Web — Projects (workspace) shell

**Branch**: `003-projects` | **Date**: 2026-06-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.specify/specs/003-projects/spec.md`

> Ngôn ngữ: plan viết tiếng Việt; danh từ sản phẩm/cột giữ tiếng Anh. **Mọi nhãn hiển thị UI là tiếng Anh.** Không hardcode màu ngoài token trong `web/src/app/globals.css` — chỉ thêm/đổi giá trị token, **không xoá** biến `--*` đang có.

## Summary

Thêm tầng **Project (workspace)** lên trên Board của 002: một **sidebar trái** cố định (kiểu vibe-kanban / Notion) liệt kê các Project; mỗi Project mở ở vùng phải với header **tabs Overview → Board → Settings**. Tab Board **tái dùng nguyên `BoardView` của 002**, gắn dữ liệu riêng từng Project. Landing `/` giữ nguyên là marketing public (không sidebar). Vẫn **mock-only** — Project + Project Context + board data tĩnh trong mã; tạo Project / sửa Settings sống trong phiên qua một client store, không persist.

**Cách tiếp cận kỹ thuật:** Tách app thành hai route group — `(landing)` cho landing và `(workspace)` cho shell có sidebar — để landing không kế thừa sidebar. Sidebar dùng **shadcn sidebar block (sidebar-07, `collapsible="icon"`)** thay vì tự dựng: nó cho sẵn collapse + cookie persist (`sidebar_state`), mobile overlay (Sheet), phím tắt `⌘B`, và tooltip-khi-thu-gọn. Project có địa chỉ `/p/[project]/<tab>`; tab là segment con để chia sẻ/refresh giữ đúng tab. Metadata Project (identity + Project Context) — thứ *sửa được trong phiên* — sống trong một `WorkspaceProvider` (React context, seed từ mock). Dữ liệu Board nặng (groups + specs) ở module mock keyed theo project id; project id lạ (mới tạo) → board rỗng.

## Technical Context

**Language/Version**: TypeScript 5 · React 19.2 · Next.js **16.2.9** (App Router, Turbopack, React Compiler bật)

**Primary Dependencies** (đã cài): như 002 — `next-themes`, dnd-kit, shadcn/ui (**new-york** style trên Radix — đã migrate từ base-nova, xem Refinements R1; thêm `@radix-ui/react-avatar`) + `lucide-react`, Tailwind v4. Feature này thêm **shadcn sidebar block** (`ui/sidebar.tsx` + các primitive nó cần nếu thiếu: `sheet`, `tooltip`, `separator`, `skeleton`) qua shadcn CLI — không thêm npm runtime dep mới ngoài Radix primitive mà shadcn đã kéo sẵn. Dialog (modal tạo Project) + tabs đã có trong `web/src/components/ui/`.

**Storage**: N/A domain data — mock tĩnh + client store trong phiên. Sidebar collapse do shadcn `SidebarProvider` tự lưu cookie `sidebar_state` (đọc server-side → không flash).

**Testing**: Vitest 4 + Testing Library. TDD cho logic thuần: tổng hợp Board summary, workspace store reducer, phân giải project/tab từ params.

**Target Platform**: Trình duyệt modern; self-host sau Cloudflare Tunnel.

**Project Type**: Web frontend (Next.js App Router) trong monorepo — chỉ đụng `web/`.

**Constraints**: Kế thừa a11y/theme của 002 (keyboard-only, dark+light, không flash; **reduced-motion đã gỡ** product-wide — xem Refinements R2). **Không** secret nào ở client — Settings chỉ có identity + Project Context văn bản (FR-021).

**Scale/Scope**: ≥2 Project seed (một tái dùng dataset dogfood 002), 3 tab/Project, 1 modal tạo Project, 1 sidebar collapse được.

## Constitution Check

*GATE: phải pass trước Phase 0. Re-check sau Phase 1.*

- [x] **I. Review tầng ý định** — Không đổi bề mặt review; bọc thêm điều hướng Project. Project Context (luật chung) được surface đúng tinh thần "hai tầng context" (Project Context vs Task Spec). PASS.
- [x] **II. Spec hợp đồng + hai tầng context** — Feature *hiện thực hoá* tầng Project Context của DESIGN ở UI (đọc/sửa mock). Board dataset vẫn là structured → render. PASS.
- [x] **III. Checker độc lập** — Không verification thật → N/A. PASS.
- [x] **IV. Single-agent/đơn vị** — Không agent → N/A; build một luồng. PASS.
- [x] **V. Spec-driven hard gate** — spec.md đã viết; plan này là cổng trước code. Không source nào tới khi plan được duyệt. PASS.
- [x] **VI. TDD + Docs-as-code** — TDD cho logic thuần (board summary, store reducer, param resolve). Quyết định routing (route groups + tab segment + client store cho mock-mutable) không phải kiến trúc gây tranh cãi → ghi trong plan này, **không** ADR mới. PASS.
- [x] **Stack/Security** — Đúng tầng FE; **không** secret ở client (FR-021). PASS.

→ **Không vi phạm.** Complexity Tracking để trống.

## Layout design (cốt lõi feature)

### Anatomy

Dựng trên **shadcn sidebar-07** (`Sidebar collapsible="icon"` + `SidebarProvider` + `SidebarInset` + `SidebarRail`):

```
┌─────────────┬────────────────────────────────────────────────┐
│ Sidebar     │  SidebarInset                                   │
│ (provider,  │  ┌ header: [⌘B toggle] ▣ Project name · repo↗   │
│  cookie,    │  │         [ Overview │ Board │ Settings ]      │
│  ⌘B,        │  ├──────────────────────────────────────────────┤
│  icon-rail) │  │  TAB OUTLET (children của project layout)     │
│ SidebarHdr  │  │   • overview/ → OverviewPanel                 │
│  ◇ SpecDeck │  │   • board/    → BoardView (002, scoped)       │
│ SidebarCnt  │  │   • settings/ → SettingsForm                  │
│  PROJECTS   │  │                                               │
│  ▣ Proj A   │                                                 │
│  ▣ Proj B   │   thu gọn (icon) → mỗi Project = ▣ avatar màu    │
│  ＋ New      │   (monogram) + tooltip tên; SpecDeck mark ở hdr  │
│ SidebarFtr  │                                                 │
│  ☾ theme ⚙  │                                                 │
│ SidebarRail │                                                 │
└─────────────┴────────────────────────────────────────────────┘
```

- **AppSidebar** (adapt từ sidebar-07, client): bỏ phần `NavMain` (cây nav lồng) — nav của ta chỉ là **danh sách Project**.
  - `SidebarHeader` → brand **SpecDeck mark** (nhận diện *workspace*; thay slot `TeamSwitcher`). Single workspace nên không phải team-switcher.
  - `SidebarContent` → `NavProjects`: mỗi Project là `SidebarMenuButton` link `/p/[id]`, leading = **ProjectAvatar** (ô bo góc nền màu Project + chữ cái đầu), trailing label = tên; active theo pathname. Khi `collapsible="icon"` thu gọn → chỉ còn ProjectAvatar + tooltip tên. Cuối list: nút `＋ New project` mở `NewProjectDialog`.
  - `SidebarFooter` → `ThemeToggle` + settings (thay slot `NavUser`).
  - `SidebarRail` để click mép mở lại.
- **ProjectHeader** (trong `SidebarInset`, client): `SidebarTrigger` (⌘B) + ProjectAvatar + tên Project + repo link; tab bar **Overview · Board · Settings** dùng link-tabs (mỗi tab một route segment, active theo pathname). Thay cho `AppBar` ngang trong workspace; AppBar chỉ còn ở landing.
- **ProjectAvatar** (dùng chung sidebar + header): ô màu Project + monogram — một component nhỏ tái dùng.
- **TAB OUTLET**: children của `p/[project]/layout.tsx`.

### Routing (App Router — route groups + tab segments)

```
web/src/app/
  layout.tsx                       # root (giữ): html/body, providers, theme
  globals.css
  (landing)/
    page.tsx                       # ← landing hiện tại (chuyển từ app/page.tsx)
  (workspace)/
    layout.tsx                     # WorkspaceShell: SidebarProvider(defaultOpen từ cookie) > AppSidebar + SidebarInset{children}; bọc WorkspaceProvider
    p/[project]/
      layout.tsx                   # resolve project từ store → ProjectHeader + tabs; project lạ → not-found
      page.tsx                     # redirect → ./overview  (tab mặc định, FR-007)
      overview/page.tsx            # US2
      board/page.tsx               # US3 — BoardView scoped + BoardSheetProvider
      board/[spec]/page.tsx        # US3 — chi tiết Spec trong Project
      settings/page.tsx            # US5
```

> Route group `()` không thêm vào path: `(landing)/page.tsx` = `/`, mọi thứ trong `(workspace)/` có path bắt đầu từ segment thật (`p/...`). Lối vào workspace qua redirect bên dưới.

- **Default project / lối vào workspace**: thêm `web/src/app/board/route.ts` (hoặc giữ `/board`) **redirect** `/board → /p/<DEFAULT_PROJECT_ID>/board` để link landing "Open the board" không vỡ. Landing CTA trỏ thẳng `/p/<DEFAULT_PROJECT_ID>/board`. Click một Project ở sidebar → `/p/[id]` → redirect Overview.
- **Tab segment** giữ chia sẻ/refresh đúng tab (FR-008); tab lạ = segment không tồn tại → `not-found` của `[project]` lùi về Overview qua redirect.
- **Spec detail** chuyển từ `/board/[spec]` sang `/p/[project]/board/[spec]`; cập nhật mọi link trong `spec-sheet.tsx` / `spec-card-view` / `OpenFullLink` để gắn project id. Cơ chế Sheet (BoardSheetProvider) giữ nguyên, chỉ đổi base path.

> **Phase 0 verify**: đọc `node_modules/next/dist/docs/` về *route groups*, *nested layouts*, *dynamic segments & params*, *redirect()*, *not-found* trên 16.2.9 trước khi code (web/AGENTS.md). Pattern chuẩn, kỳ vọng không cần fallback; nếu API lệch, fallback = một segment `[tab]` động thay cho ba segment tab riêng.

### State model

- **`WorkspaceProvider`** (`components/workspace/workspace-context.tsx`, client) bọc trong `(workspace)/layout.tsx`:
  - giữ `projects: ProjectMeta[]` seed từ `mock/projects.ts`; reducer thuần `workspaceReducer` với action `add` (tạo mới) + `update` (sửa Settings).
  - hooks: `useProjects()`, `useProject(id)`, `useWorkspaceDispatch()`.
  - **mock-mutable** sống ở đây (sửa được trong phiên, mất khi refresh — FR-018/020).
- **`ProjectMeta`** = identity + Project Context (KHÔNG chứa board data).
- **Board data** từ `mock/projects.ts`: `boardDataFor(projectId) → { groups, lanes }`; id lạ (Project vừa tạo) → board rỗng (FR-013/017). BoardView vẫn tự giữ reducer kéo-thả per-instance (reset khi refresh — FR-015).
- **`boardSummary(lanes) → { perColumn: Record<col,number>, running: number }`** (pure, `lib/board-summary.ts`) cho Overview (FR-010) — TDD.
- **Sidebar collapse**: do shadcn `SidebarProvider` lo — `(workspace)/layout.tsx` (server) đọc cookie `sidebar_state` → truyền `defaultOpen`, không flash; toggle client (`SidebarTrigger`/`⌘B`) tự ghi cookie. Ta không viết logic cookie riêng.

### Mock restructure

- `mock/projects.ts` (mới): type `ProjectMeta` + `PROJECTS` (≥2). Project "SpecDeck" (dogfood) **tái dùng** `SPECS` + `BOARD_GROUPS` hiện có; thêm 1 Project nữa với dataset board nhẹ riêng (vài card) để chứng minh cô lập (SC-002). `DEFAULT_PROJECT_ID`, `getProject(id)`, `boardDataFor(id)`.
- `mock/specs.ts`: giữ; có thể tách dataset Project thứ hai thành `mock/specs-<proj>.ts` hoặc thêm vào cùng file. Không phá `initialBoard()` mà 002 dùng — bọc theo project.

## Files

**Routing / shell**
- `web/src/app/(landing)/page.tsx` — chuyển landing (giữ nội dung; chỉ đổi path nhóm).
- `web/src/app/(workspace)/layout.tsx` — WorkspaceShell: đọc cookie `sidebar_state` → `SidebarProvider defaultOpen` > `AppSidebar` + `SidebarInset`; bọc `WorkspaceProvider`.
- `web/src/app/(workspace)/p/[project]/layout.tsx` — resolve project, ProjectHeader + tabs.
- `web/src/app/(workspace)/p/[project]/page.tsx` — redirect → overview.
- `.../overview/page.tsx`, `.../board/page.tsx`, `.../board/[spec]/page.tsx`, `.../settings/page.tsx`.
- `web/src/app/board/route.ts` — redirect `/board` → default project (giữ link cũ).

**UI primitives (shadcn, qua CLI)**
- `components/ui/sidebar.tsx` (+ `sheet`, `tooltip`, `separator`, `skeleton` nếu thiếu) — thêm bằng `pnpm dlx shadcn@latest add sidebar` trong container; fallback vendor tay nếu CLI không chạy.
- Thêm token `--sidebar*` vào `globals.css` map sang token SpecDeck hiện có (chỉ **thêm**, không xoá `--*` cũ; đúng cả dark + light).

**Components (mới, `components/workspace/`)**
- `workspace-context.tsx` — Provider + reducer + hooks.
- `app-sidebar.tsx` — adapt sidebar-07: `SidebarHeader`(brand) + `NavProjects` + `SidebarFooter`(theme/settings) + `SidebarRail`.
- `project-avatar.tsx` — ô màu Project + monogram (dùng chung sidebar + header).
- `new-project-dialog.tsx` — modal tạo Project (US4).
- `project-header.tsx` — `SidebarTrigger` + tên + repo + link-tabs.
- `overview-panel.tsx` — identity + board snapshot (US2).
- `settings-form.tsx` — sửa identity + Project Context (US5).

**Lib / mock**
- `web/src/lib/board-summary.ts` (+ test) — đếm theo cột + running.
- `web/src/lib/workspace-reducer.ts` (+ test) — add/update Project (hoặc nằm trong context file, test riêng phần pure).
- `web/src/mock/projects.ts` — Project seed + board mapping.

**Sửa nhẹ (002 reuse)**
- `spec-sheet.tsx` / `spec-card-view` / OpenFullLink: base path Spec detail thành project-aware.
- `app/page.tsx` cũ: xoá sau khi chuyển vào `(landing)`; `board/layout.tsx` + `board/page.tsx` cũ: thay bằng route mới (giữ git history sạch).

## Phasing (theo user story)

- **Phase 0 — Research**: verify Next 16 routing APIs (route groups / nested layout / params / redirect / not-found) trên local docs; thêm shadcn `sidebar` (CLI) + chốt token `--sidebar*` map sang token SpecDeck. Output: `research.md`.
- **Phase 1 — Foundational** (blocking): `ProjectMeta` + `mock/projects.ts` + `WorkspaceProvider` + tách route group `(landing)`/`(workspace)` + shell layout (SidebarProvider + Sidebar khung) chạy được. Board cũ vẫn chạy qua redirect.
- **Phase 2 — US1**: AppSidebar (list + active + collapse + overlay + footer) + điều hướng Project + persist collapse.
- **Phase 3 — US2**: ProjectHeader + link-tabs + OverviewPanel (identity + board summary, empty state).
- **Phase 4 — US3**: tab Board gắn `boardDataFor(project)` vào BoardView; spec detail project-aware; xác minh cô lập dữ liệu.
- **Phase 5 — US4**: NewProjectDialog + action `add`; tên trống → lỗi inline; vào Overview project mới (board rỗng).
- **Phase 6 — US5**: SettingsForm + action `update`; phản ánh ở Overview/sidebar; không có ô secret.
- **Polish**: a11y (keyboard cho sidebar/tabs/dialog, focus, reduced-motion), dark+light, dọn route cũ, cập nhật docs.

## TDD (logic thuần)

1. `board-summary.test.ts` — đếm card theo cột + running từ `GroupedBoardState`; board rỗng → tất cả 0.
2. `workspace-reducer.test.ts` — `add` thêm Project (id mới, không trùng); `update` đổi field; input lạ → no-op/ổn định.
3. (nếu tách) `resolve-tab` — params → tab hợp lệ; tab lạ → Overview.

Render/route verify qua quickstart thủ công + RTL smoke (sidebar render, chuyển tab). Kéo-thả không tự động hoá (như 002).

## Verification

Dev stack chạy trong Docker (không host dev server). Trong container `web`:

```sh
docker compose exec -T web sh -lc "pnpm exec vitest run src/lib/__tests__/board-summary.test.ts src/lib/__tests__/workspace-reducer.test.ts"
docker compose exec -T web sh -lc "pnpm exec tsc --noEmit && pnpm exec eslint src"
docker compose exec -T web node -e "fetch('http://localhost:3000/p/'+process.env.P+'/overview').then(r=>console.log('overview',r.status))"
docker compose exec -T web node -e "fetch('http://localhost:3000/board').then(r=>console.log('redirect',r.status,r.redirected))"
```

- vitest: logic thuần pass.
- tsc + eslint sạch.
- `/p/<default>/overview`, `/p/<default>/board`, `/p/<default>/settings` render 200; `/board` redirect tới default project.
- Cô lập dữ liệu (SC-002), chuyển Project, tạo Project, sửa Settings verify qua hot-reload trong trình duyệt.

## Docs-as-code

- Ghi tasks vào `.specify/specs/003-projects/tasks.md` (sau khi plan được duyệt).
- Cập nhật `data-model.md` (003) với `ProjectMeta` + board mapping.
- **Không** ADR mới (UI/điều hướng trong feature web mock; client store cho mock-mutable là chi tiết hiện thực, không phải quyết định kiến trúc gây tranh cãi). Nếu sau này Project nối backend thật → lúc đó mới cần ADR.
- Commit theo Conventional Commits, không `Co-Authored-By`, không `--no-verify`.
