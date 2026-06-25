# Implementation Plan: SpecDeck Web — Board + Spec detail (mock-driven)

**Branch**: `002-web-mock` | **Date**: 2026-06-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.specify/specs/002-web-mock/spec.md`

> Ngôn ngữ: plan viết tiếng Việt; danh từ sản phẩm/cột giữ tiếng Anh. **Mọi nhãn hiển thị UI là tiếng Anh.** Không hardcode màu ngoài token trong `web/src/app/globals.css` — chỉ thêm/đổi giá trị token, **không xoá** biến `--*` đang có.

## Summary

Dựng phần web thao-tác-được đầu tiên của SpecDeck, **chạy hoàn toàn trên mock tĩnh** (chưa wire backend): Landing (`/`) → Board Kanban 4 cột (`/board`) → chi tiết Spec dual-surface (drawer overview + trang đầy đủ cùng một địa chỉ `/board/[spec]`). Mỗi card = một Spec Kit feature folder ở dạng dữ liệu; render layer biến structured data thành UI dễ quét (Spec | Checks+Evidence | Diff). Tái dùng nguyên design system 001-branding (tokens + CheckBadge/ColumnTag/EvidenceChip/Logo).

**Cách tiếp cận kỹ thuật (đã verify với Next 16.2.9 docs):** dual-surface dùng **intercepting + parallel routes** (pattern nextgram "gallery ↔ photo modal") — đã xác nhận hỗ trợ đầy đủ ở bản đang cài, **không cần fallback**. Drag-drop bằng dnd-kit với state in-memory (reducer thuần, không persist). Diff bằng Monaco read-only. Văn xuôi Spec render qua streamdown. Cấu hình validate lúc boot qua `@t3-oss/env-nextjs` + zod.

## Technical Context

**Language/Version**: TypeScript 5 · React 19.2 · Next.js **16.2.9** (App Router, Turbopack, React Compiler bật)

**Primary Dependencies** (đã cài, xem `web/package.json`): `next-themes`, `@dnd-kit/core|sortable|modifiers|utilities`, `@monaco-editor/react`, `streamdown`, `@t3-oss/env-nextjs` + `zod`, `@tanstack/react-query`, shadcn/ui (base-nova) + `lucide-react`, Tailwind v4 (`@theme inline`).

**Storage**: N/A — mock tĩnh trong mã (`src/mock/`), **không** DB/localStorage/persist.

**Testing**: Vitest 4 + Testing Library (đã cấu hình; jsdom). TDD cho **logic thuần** (xem mục TDD). Render/route verify qua quickstart thủ công + RTL smoke.

**Target Platform**: Trình duyệt modern; self-host sau Cloudflare Tunnel (dev origin `specdeck.timezlab.org` đã allow trong `next.config.ts`).

**Project Type**: Web frontend (Next.js App Router) trong monorepo — chỉ đụng `web/`.

**Performance Goals**: Tương tác mượt; kéo-thả phản hồi tức thì trong cùng tương tác (SC-007); không nhấp nháy theme lúc tải (SC-009).

**Constraints**: A11y bắt buộc (FR-027/028) — trạng thái mã hoá cả màu **lẫn** hình/chữ, keyboard-only toàn luồng (SC-008), tôn trọng `prefers-reduced-motion`. Render đúng dark + light (FR-029). **Không** secret nào trong client (chỉ `NEXT_PUBLIC_*`).

**Scale/Scope**: ~6–8 Spec mock phủ đủ 4 cột; 3 route surface (landing, board, detail) + drawer; 3 tab detail.

## Constitution Check

*GATE: phải pass trước Phase 0. Re-check sau Phase 1.* (`.specify/memory/constitution.md`)

- [x] **I. Review tầng ý định** — Feature **dựng chính** bề mặt review-ở-tầng-Spec. Logic "thiếu Evidence ≠ pass, không bao giờ xanh" (FR-006/024, SC-004) là invariant được test (TDD). PASS — phục vụ trực tiếp nguyên tắc I.
- [x] **II. Spec hợp đồng** — Mock mirror đúng cấu trúc spec-template/tasks-template (Goal/US/FR/SC/Tasks/Check). Nguồn là structured data, UI chỉ *render* (không sinh HTML cho Spec). PASS.
- [x] **III. Checker độc lập** — *Không có verification thật* trong feature mock → N/A cho cơ chế. Nhưng UI **render trung thực** thứ tự verify deterministic → evidence → held-out → judge (FR-023), không bịa trạng thái pass. PASS (N/A phần thực thi).
- [x] **IV. Single-agent/đơn vị** — *Không agent nào chạy* → N/A. Việc build do một người/luồng, một feature folder. PASS.
- [x] **V. Spec-driven hard gate** — spec.md đã duyệt; plan.md này là cổng trước code. **Không** source nào được viết tới khi plan được duyệt. PASS.
- [x] **VI. TDD + Docs-as-code** — TDD cho 3 logic thuần (xem dưới); Conventional Commits; quyết định dual-surface routing → ghi ADR `docs/design-docs/web-dual-surface-routing.md`. PASS.
- [x] **Stack/Security** — Đúng tầng FE của topology; **không** secret ở client (env split server/client qua t3-env; mock không gọi API). PASS.

→ **Không có vi phạm.** Complexity Tracking để trống.

## Project Structure

### Documentation (feature này)

```text
.specify/specs/002-web-mock/
├── plan.md              # File này
├── research.md          # Phase 0 — quyết định kỹ thuật + verify Next docs
├── data-model.md        # Phase 1 — TS types cho mock (SpecCard…)
├── quickstart.md        # Phase 1 — kịch bản verify chạy được
├── contracts/
│   └── ui-contracts.md   # Phase 1 — route map, module mock, component props
└── tasks.md             # Phase 2 (/speckit-tasks — KHÔNG tạo ở bước này)
```

### Source Code (chỉ đụng `web/`)

```text
web/src/
├── env.ts                              # [F1] t3-env + zod, import ở layout (validate lúc boot)
├── app/
│   ├── layout.tsx                      # [F2] thêm <Providers> (đã có fonts + ThemeProvider)
│   ├── providers.tsx                   # [F2] QueryClientProvider (client)
│   ├── page.tsx                        # [US1] Landing (thay mock board hiện tại)
│   └── board/
│       ├── layout.tsx                  # [US4] nhận {children} + {drawer} (parallel slot)
│       ├── page.tsx                    # [US2/US3] Board 4 cột + drag-drop
│       ├── [spec]/
│       │   ├── page.tsx                # [US4] TRANG chi tiết đầy đủ (hard nav / share / refresh)
│       │   └── not-found.tsx           # [US4] Spec không tồn tại (edge case)
│       └── @drawer/
│           ├── default.tsx             # [US4] null (slot không khớp khi hard-load /board)
│           └── (.)[spec]/page.tsx      # [US4] DRAWER overview (intercept soft-nav từ board)
├── components/
│   ├── board/                          # [US2/US3] BoardColumnLane, SpecCard, dnd context, progress
│   ├── spec/                           # [US4] SpecView (tab Spec), TOC, GWT block, FR/SC, Tasks
│   ├── checks/                         # [US4] ChecksPanel (nhóm verify-order, progress, evidence)
│   ├── diff/                           # [US5] DiffView (Monaco read-only) + empty state
│   └── detail/                         # [US4] DetailTabs, DrawerOverview, OpenFullLink
├── mock/
│   ├── specs.ts                        # [F3] NGUỒN mock — ~6–8 SpecCard mirror Spec Kit
│   └── types.ts                        # [F3] types (đồng bộ data-model.md)
└── lib/
    ├── board-state.ts                  # [US3] reducer thuần move/reorder (TDD)
    ├── check-progress.ts               # [F3] tính progress, evidence-gated (TDD)
    └── default-tab.ts                  # [US4] chọn tab theo column (TDD)
```

**Structure Decision**: Web app đơn (Next App Router) trong monorepo; toàn bộ thay đổi nằm trong `web/`. Board chuyển từ `/` (mock cũ trong `page.tsx`) sang `/board`; `/` thành Landing. Dual-surface dùng **một** dynamic segment `[spec]` + một parallel slot `@drawer` intercept nó — đúng một địa chỉ, hai cách trình bày.

## Phasing — committable units (done-condition quan sát được)

> Mỗi unit là một commit logic, verify được độc lập. Thứ tự: Foundational → US1 → US2 → US3 → US4 → US5 → Quality gate. `/speckit-tasks` sẽ phân rã từng unit thành task.

### Foundational (blocking — phải xong trước user stories)

- **F1 — env.ts validate lúc boot.** `web/src/env.ts` dùng `@t3-oss/env-nextjs` + zod, tách `server`/`client` (chỉ `NEXT_PUBLIC_*` lộ client); import trong `layout.tsx` để fail-fast. Thêm `web/.env.example` (không secret). *Done:* sửa env thiếu/sai biến bắt buộc → build/boot báo lỗi rõ; `grep` xác nhận không secret ngoài `NEXT_PUBLIC_*`; `.env` vẫn gitignored.
- **F2 — App shell + QueryClient provider.** `providers.tsx` (`'use client'`) bọc `QueryClientProvider` (một client singleton); cắm vào `layout.tsx` trong `ThemeProvider`. *Done:* app render, devtools/React Query hoạt động; chưa có query nào chạy (mock đọc đồng bộ — ghi rõ đây là scaffold cho data layer sau).
- **F3 — Mock data module (nguồn sự thật).** `mock/types.ts` + `mock/specs.ts`: ~6–8 SpecCard mirror Spec Kit (Goal, US P1/P2/P3 + GWT, FR-xxx, SC-xxx, Edge, Assumptions, Tasks T0xx, Checks theo verify-order, Diff tuỳ). Bắt buộc gồm: ≥1 Fast lane (ở Review), ≥1 card có agent chạy, 1 card Review có 1 Check fail + 1 Check pass-thiếu-Evidence. `lib/check-progress.ts` (**TDD**) tính "đã-pass/tổng" loại Check thiếu Evidence. *Done:* `check-progress` có test fail-trước rồi pass; mock thoả các ràng buộc phân bố (kiểm bằng test/inspection).

### US1 — Landing (P1)

- **U1 — Trang `/`.** Hero "review specs, not diffs", explainer 4 cột Backlog/Plan/Review/Done + pipeline Planner/Builder/Checker, CTA → `/board`. Reuse Logo/ThemeToggle. *Done:* mở `/` thấy đủ 3 khối + CTA điều hướng tới `/board`; đúng dark & light, không nhấp nháy (SC-001/009).

### US2 — Board (P1)

- **U2 — Board `/board` từ mock.** 4 cột cố định đúng thứ tự, mỗi cột có nhãn + count; card hiện mã + title + progress Check (nếu có) + badge Fast lane + badge ⏳ agent đang chạy. Dùng ColumnTag/CheckBadge/EvidenceChip + `check-progress`. *Done:* render đúng phân bố mock; Check thiếu Evidence không xanh, không tính pass (FR-006, SC-004 ở tầng card).

### US3 — Drag-drop (P2)

- **U3 — Kéo-thả in-memory.** `lib/board-state.ts` reducer thuần (**TDD**): move giữa cột + reorder trong cột, drop ngoài vùng hợp lệ → giữ nguyên. Wire dnd-kit (PointerSensor + **KeyboardSensor** cho keyboard DnD), overlay/indicator khi kéo, tôn trọng reduced-motion. State chỉ trong phiên. *Done:* reducer có test fail-trước→pass cho move/reorder/invalid-drop; UI kéo bằng chuột & bàn phím; reload trở về mock gốc (FR-008..011, SC-007).

### US4 — Dual-surface detail (P2)

- **U4a — Route skeleton (đọc Next docs trước).** Tạo `board/layout.tsx` (`{children}` + `{drawer}`), `board/[spec]/page.tsx` (full), `@drawer/default.tsx` (null), `@drawer/(.)[spec]/page.tsx` (drawer), `not-found.tsx`. *Done:* click thân card → drawer overlay trên board mờ (Esc/back đóng); mở thẳng/refresh `/board/[spec]` → trang đầy đủ; "Open full ↗" (hover card + header drawer) và ⌘/Ctrl-click → thẳng trang đầy đủ; mã Spec sai → not-found có lối về Board (FR-012..015, SC-002/005). Ghi ADR `web-dual-surface-routing.md`.
- **U4b — DetailTabs + default tab.** Tab Spec | Checks+Evidence | Diff; `lib/default-tab.ts` (**TDD**) chọn tab theo cột (Plan→Spec, Review→Checks). *Done:* default-tab có test; mở card Plan vào Spec, card Review vào Checks (FR-016/017).
- **U4c — Tab Spec (render layer).** TOC dính; Goal; US với chip P1/P2/P3; GWT thành block có nhãn; FR-xxx/SC-xxx mã mono nổi bật; Edge/Assumptions; văn xuôi qua **streamdown** (+ Mermaid khi có); khối Tasks gập được kèm tiến độ. *Done:* định vị Goal/Acceptance/Checks không cần đọc markdown thô (SC-006); spec dài vẫn quét được qua TOC, không vỡ layout (FR-018..021).
- **U4d — Tab Checks + Evidence.** Reuse CheckBadge/EvidenceChip; nhóm theo verify-order (deterministic→evidence→held-out→judge); progress bar; mỗi pass có Evidence truy cập được; thiếu Evidence → cảnh báo, **không bao giờ xanh**; trạng thái phân biệt cả hình lẫn màu. *Done:* xem grayscale phân biệt 100% trạng thái (SC-003); 0 false-green (SC-004); empty state khi card không có Check (FR-022..024 + edge).

### US5 — Diff (P3)

- **U5 — Tab Diff (Monaco read-only).** Danh sách file added/modified/deleted + nội dung diff mock, chỉ-đọc; Spec chưa có diff → empty state rõ ràng, không lỗi. *Done:* mở tab Diff thấy diff mock read-only; card Backlog/Plan không có diff → empty state (FR-025/026).

### Quality gate (cross-cutting — đóng feature)

- **Q1 — A11y + theme + reduced-motion sweep.** Keyboard-only toàn luồng (landing→board→detail→đổi tab→drag-drop), focus thấy được; reduced-motion tắt animation ⏳ + hiệu ứng kéo; dark & light mọi màn. *Done:* SC-003/008/009 verify theo quickstart; deterministic-first: `pnpm lint` + `pnpm test` + `pnpm build` xanh; grep 0 hardcode hex ngoài `globals.css`; grep 0 secret ngoài `NEXT_PUBLIC_*`.

## TDD (logic thuần — test fail trước → code → pass)

1. **`check-progress.ts`** (F3): "đã-pass/tổng" loại Check `pass` nhưng thiếu Evidence; trả 0-pass khi toàn pending/running. Bảo chứng SC-004.
2. **`board-state.ts`** (U3): move cross-column, reorder in-column, invalid-drop giữ nguyên — reducer thuần, không phụ thuộc DOM.
3. **`default-tab.ts`** (U4b): Plan→`spec`, Review→`checks`, mặc định khác→`spec`.

Render/route/Monaco/streamdown là integration → verify qua quickstart thủ công (+ RTL smoke nếu rẻ). Nêu rõ khi bỏ qua test vì lý do harness, theo `.claude/rules/tdd.md`.

## Complexity Tracking

*Không có vi phạm Constitution → để trống.*
