---
description: "Task list — 001-branding (Control room design system)"
---

# Tasks: Branding & Design System — "Control room"

**Input**: Design documents trong `.specify/specs/001-branding/`
**Prerequisites**: [plan.md](./plan.md) ✔ · [spec.md](./spec.md) ✔ · [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/design-system.md](./contracts/design-system.md) · [quickstart.md](./quickstart.md)

**Tests**: Feature FE, verify chủ yếu deterministic (grep/contrast/build) + thủ công (grayscale). **TDD chỉ áp cho theme-toggle** (logic, US3) theo yêu cầu — các task khác không sinh test.

## Format: `[ID] [P?] [Story] Mô tả + file path`

- **[P]**: chạy song song được (khác file, không phụ thuộc task chưa xong)
- **[Story]**: US1/US2/US3 — chỉ gắn ở phase user story
- Danh từ sản phẩm/cột giữ tiếng Anh (SpecDeck, Spec, Check, Evidence, Backlog/Plan/Review/Done)

> ⚠️ **Ràng buộc file dùng chung**: đây là feature design-system nên 3 file bị nhiều phase chạm tuần tự — `web/src/app/globals.css` (token dark→light), `web/src/app/layout.tsx` (font→theme provider), `web/src/app/page.tsx` (status demo→app bar/chrome). Các task trên cùng file KHÔNG được `[P]` với nhau. Độc lập story vẫn giữ được vì token là nền chung (Foundational), mỗi story *tiêu thụ* token.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: chuẩn bị docs + harness trước khi chạm code Next.

- [ ] T001 [P] Đọc Next 16 docs trong `web/node_modules/next/dist/docs/` (next/font/local, Tailwind v4 `@theme`, metadata file-convention) theo `web/AGENTS.md`; xác nhận API khớp research.md (R3) — nếu lệch, ghi đính chính vào `.specify/specs/001-branding/research.md`. *Done*: note "Docs verified <ngày>" có trong research.md.
- [ ] T002 Xác nhận test harness `web/` cho TDD theme-toggle: nếu chưa có Vitest+RTL thì `pnpm --dir web add -D vitest @testing-library/react @testing-library/jest-dom jsdom` + `web/vitest.config.ts` + script `"test"` trong `web/package.json`. *Done*: `pnpm --dir web test` chạy được (0 test vẫn exit 0). Nếu bỏ qua, nói rõ lý do.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Unit 1 (Fonts) + Unit 2 (Tokens dark) — nền chung cho MỌI story. **⚠️ Không story nào bắt đầu trước khi xong phase này.**

- [ ] T003 [P] Thêm font self-host vào `web/src/fonts/`: IBM Plex Sans variable TTF (đã tải) + IBM Plex Mono Regular/Medium (tải Google Fonts OFL mirror) + `OFL.txt`; subset latin + latin-ext (dấu tiếng Việt). *Done*: đủ file font + giấy phép tồn tại.
- [ ] T004 Khai báo `next/font/local` trong `web/src/app/layout.tsx`: Plex Sans (variable, `weight "100 700"`, `variable "--font-sans"`, `display "swap"`) + Plex Mono (400/500, `variable "--font-mono"`); **gỡ Geist/Geist_Mono**; gắn class vào `<html>/<body>`. (depends T003) *Done*: trang render bằng Plex; DevTools Network 0 request host font ngoài.
- [ ] T005 [P] Thay palette shadcn mặc định (oklch) trong `web/src/app/globals.css` bằng token control-room **dark**: set lại biến shadcn (`--background --foreground --card --popover --primary --secondary --muted --accent --destructive --border --input --ring`) theo cột Dark của [data-model.md](./data-model.md). *Done*: `--color-*` resolve đúng tông near-black + mint `#38E8C6`.
- [ ] T006 Mở rộng `@theme inline` + `:root` trong `web/src/app/globals.css` với token riêng SpecDeck (dark): `--ground --surface-2 --text-dim --text-mute --accent-ink --accent-soft`, semantic `--good/--warn/--crit/--running`, board `--col-backlog/plan/review/done`, check `--check-pass/fail/pending/running`, `--evidence --fastlane`, `--radius 0.4rem`, `--ring`, `--shadow-card`. (same file → depends T005) *Done*: utility `bg-surface-2 text-good text-dim border-strong rounded-md font-mono` khả dụng; 0 hardcode trong component.

**Checkpoint**: app render Plex + nền control-room dark; bộ token (dark) đầy đủ — story có thể bắt đầu.

---

## Phase 3: User Story 1 — Đọc trạng thái review trong một liếc (Priority: P1) 🎯 MVP

**Goal**: board/Check đọc-được-trong-một-liếc, mã hoá **màu + hình + nhãn**, an toàn khi suy giảm màu (Nguyên tắc I).

**Independent Test**: mở shell đã re-skin, bật grayscale → vẫn phân biệt **4 cột** + **4 trạng thái Check**; Check thiếu Evidence không hiện như pass.

- [ ] T007 [P] [US1] `ColumnTag` trong `web/src/components/status/column-tag.tsx` — dot màu `--col-{backlog,plan,review,done}` + tên cột; chỉ Review tô accent (running). (C2)
- [ ] T008 [P] [US1] `CheckBadge` trong `web/src/components/status/check-badge.tsx` — pass `✓` tròn đặc / fail `✕` tròn đặc / pending vòng rỗng / running dot+pulse; mỗi state = **màu + hình + nhãn**; pulse tắt khi `prefers-reduced-motion`. (FR-003, C2, FR-010)
- [ ] T009 [P] [US1] `EvidenceChip` trong `web/src/components/status/evidence-chip.tsx` — chip icon `--evidence`; **Check thiếu Evidence ⇒ KHÔNG render như pass**, hiện "chưa pass". (Nguyên tắc I, AC US1-2)
- [ ] T010 [US1] Re-skin demo board trong `web/src/app/page.tsx`: 4 cột + vài card minh hoạ dùng `ColumnTag`/`CheckBadge`/`EvidenceChip`; thay skeleton ping/SSE sang surface control-room. (depends T007–T009; shared page.tsx) *Done*: shell hiện board demo control-room.
- [ ] T011 [US1] Verify US1 (thủ công): `filter: grayscale(1)` vẫn phân biệt 4 cột + 4 check; `prefers-reduced-motion` dừng pulse mà trạng thái vẫn rõ (quickstart V5). *Done*: SC-001 pass; đính Evidence.

**Checkpoint**: MVP — status đọc được trong một liếc, kể cả grayscale.

---

## Phase 4: User Story 2 — Bản sắc thống nhất toàn app (Priority: P2)

**Goal**: một hệ token, brand nhất quán, component shadcn kế thừa brand không override màu.

**Independent Test**: `grep` `web/src` không còn hardcode màu; thêm shadcn component mới → đúng brand không sửa màu; app bar có wordmark+mark+favicon.

- [ ] T012 [P] [US2] Brand component `<Logo>`/`<Wordmark>` trong `web/src/components/brand/` dùng asset `web/public/brand/` (hoặc inline mark Columns, accent token); **KHÔNG vẽ lại mark**, không méo/xoay/bóng. (C6, FR-005)
- [ ] T013 [US2] App bar: gắn wordmark + mark (accent) vào shell `web/src/app/page.tsx`; xác nhận favicon tab khớp (file-convention `web/src/app/` đã có, không nhét `<link>` tay). (depends T010, T012; shared page.tsx)
- [ ] T014 [US2] Hoàn tất chrome control-room toàn shell trong `web/src/app/page.tsx` (surface/border/spacing/typography Plex) — **loại bỏ hẳn look shadcn/Tailwind mặc định** (FR-009). (shared page.tsx → sau T013)
- [ ] T015 [US2] Token-consume audit: thêm thử 1 component shadcn mới (vd `badge` trong `web/src/components/ui/`) → hiển thị đúng brand **không override màu** (SC-006). *Done*: ảnh/note Evidence.

**Checkpoint**: brand thống nhất; shadcn kế thừa token.

---

## Phase 5: User Story 3 — Dark + Light mode (Priority: P3)

**Goal**: dark (mặc định) + light đầy đủ, persist, AA cả 2 mode, anti-FOUC qua `next-themes`.

**Independent Test**: đổi mode 1 thao tác không reload; AA cả 2 mode; reload giữ mode; tab ẩn danh lần đầu = dark.

- [ ] T016 [US3] **(TDD — viết test FAIL trước)** `web/src/components/__tests__/theme-toggle.test.tsx`: render toggle, click → `setTheme` gọi đúng giá trị / phản ánh `resolvedTheme`. Chạy `pnpm --dir web test` → **FAIL** (chưa có component) trước khi qua T019. (Nguyên tắc VI)
- [ ] T017 [US3] `pnpm --dir web add next-themes`; `web/src/components/theme-provider.tsx` (`"use client"`) bọc `ThemeProvider` `attribute="class"` `defaultTheme="dark"` `enableSystem` `disableTransitionOnChange`. (C3, R1)
- [ ] T018 [US3] Bọc children bằng `<ThemeProvider>` + thêm `suppressHydrationWarning` vào `<html>` trong `web/src/app/layout.tsx`. (depends T004, T017; shared layout.tsx)
- [ ] T019 [US3] `web/src/components/theme-toggle.tsx` (`"use client"`) dùng `useTheme()` đổi dark/light/system; gắn vào app bar. (depends T016, T017) *Done*: T016 **PASS**; đổi mode không reload, reload giữ, không FOUC (anti-FOUC do lib).
- [ ] T020 [US3] Token **light** + biến thể mint AA trong `web/src/app/globals.css` (`:root` light đảo đúng theo data-model.md; mint nền sáng = `#0FA188`, **không** `#38E8C6`). (depends T006; shared globals.css) *Done*: light đọc tốt, giữ bản sắc control-room.

**Checkpoint**: dark↔light hoạt động, persist, AA.

---

## Phase 6: Polish & Quality Gate (Unit 7 — deterministic-first)

**Purpose**: cross-cutting; chạy theo thứ tự **deterministic trước** (R7), mỗi mục là Evidence.

- [ ] T021 [P] **(1) Token-lint** quickstart V2: grep `web/src` không còn `#hex`/`oklch(`/`rgb(` ngoài `globals.css` + `src/fonts/`. *Done*: `PASS` rỗng (SC-002). Evidence.
- [ ] T022 [P] **(2) Contrast AA** quickstart V4: đo các cặp text/nền + control ở **cả** dark và light (axe/script). *Done*: text ≥ 4.5:1, UI/large ≥ 3:1 (SC-004). Evidence.
- [ ] T023 [P] **(3) Font self-host** quickstart V1: Network 0 request host font ngoài; dấu tiếng Việt (ă â đ ê ô ơ ư) render đủ. *Done*: SC-005. Evidence.
- [ ] T024 [P] **(4) Grayscale + reduced-motion + focus-visible** quickstart V5/V7 toàn shell (cả 2 mode). *Done*: phân biệt cột/trạng thái không nhờ màu; focus ring nhìn thấy. Evidence.
- [ ] T025 **(5) Build sạch** quickstart V8: `pnpm --dir web exec next build` (đọc web/AGENTS.md nếu cần). *Done*: build pass, 0 lỗi font/type.
- [ ] T026 **(6) Tổng hợp**: chạy lại `pnpm --dir web test` (theme-toggle PASS) + đối chiếu full quickstart V1–V8; gom Evidence cho các Check tương ứng. *Done*: V1–V8 pass.

---

## Dependencies & Execution Order

### Phase
- **Setup (P1)**: không phụ thuộc — bắt đầu ngay.
- **Foundational (P2)**: sau Setup — **BLOCKS** mọi story.
- **US1 → US2 → US3 (P3–P5)**: đều sau Foundational. Độc lập về *token*, nhưng chạm file shell chung nên thực thi tuần tự theo ưu tiên (xem ràng buộc file dùng chung ở đầu).
- **Polish (P6)**: sau các story muốn ship.

### Trong từng story
- US1: T007/T008/T009 `[P]` (khác file) → T010 (page.tsx) → T011 (verify).
- US2: T012 `[P]` → T013 → T014 (đều page.tsx, tuần tự) ; T015 độc lập.
- US3: **T016 (test FAIL) trước** → T017 → T018 → T019 (PASS) ; T020 (globals.css, sau T006).

### Song song
- Setup: T001 `[P]`.
- Foundational: T003 `[P]` ‖ T005 `[P]` (khác file); T004 sau T003; T006 sau T005 (cùng globals.css).
- US1: T007/T008/T009 cùng lúc.
- US2: T012 song song khởi tạo trong khi T010 đang chốt.
- Polish: T021–T024 `[P]` (4 check read-only độc lập) → T025 → T026.

---

## Parallel Example: Foundational + US1

```bash
# Foundational — fonts ‖ token base (khác file):
Task T003: "Thêm font self-host web/src/fonts/ (Plex Sans var + Mono 400/500 + OFL.txt)"
Task T005: "Thay palette shadcn → token control-room dark trong web/src/app/globals.css"

# US1 — 3 status primitive cùng lúc (khác file):
Task T007: "ColumnTag web/src/components/status/column-tag.tsx"
Task T008: "CheckBadge web/src/components/status/check-badge.tsx"
Task T009: "EvidenceChip web/src/components/status/evidence-chip.tsx"
```

---

## Implementation Strategy

### MVP (US1)
1. Phase 1 Setup → 2. Phase 2 Foundational (fonts + token dark) → 3. Phase 3 US1 → **STOP & VALIDATE** grayscale (SC-001) → demo.

### Incremental
US1 (đọc-được-trong-một-liếc) → US2 (bản sắc thống nhất) → US3 (dark+light) → Quality gate. Mỗi story thêm giá trị, không phá story trước.

### Commit
Conventional Commits, một logical change mỗi commit (invoke `git-conventional`); commit sau mỗi task hoặc nhóm logic. Quality-gate Evidence đính kèm khi mở PR.

---

## Notes
- `[P]` = khác file, không phụ thuộc.
- TDD chỉ ở theme-toggle (T016 fail → T019 pass) — phần còn lại verify deterministic/thủ công.
- Quality gate (T021–T026) theo thứ tự deterministic-first: token-lint → contrast → font → grayscale → build → test.
- KHÔNG sửa `web/` source ngoài phạm vi token-consume; KHÔNG hardcode màu ngoài `globals.css`.
