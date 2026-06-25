# Implementation Plan: Branding & Design System — "Control room"

**Branch**: `001-branding` | **Date**: 2026-06-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.specify/specs/001-branding/spec.md`

## Summary

Biến skeleton (look shadcn mặc định) thành bản sắc **Control room**: một hệ **design token** tập trung trong `web/src/app/globals.css` (Tailwind v4 `@theme inline` + `.dark` variant đã có sẵn), **dark mặc định + light đầy đủ**, self-host **IBM Plex Sans + Mono** qua `next/font/local`, và re-skin shell hiện có (`layout.tsx` + `page.tsx`). Logo/favicon **đã xong** (`web/public/brand/`, `web/src/app/`); feature này chỉ *wire* + dựng token. Mục tiêu cao nhất (Nguyên tắc I): trạng thái board/Check/Evidence đọc-được-trong-một-liếc, mã hoá bằng **màu + hình**, đạt **WCAG AA** ở cả hai mode.

## Technical Context

**Language/Version**: TypeScript 5 / React 19.2 / Next.js 16 (App Router, Turbopack).

**Primary Dependencies**: Tailwind CSS v4 (`@import "tailwindcss"`, `@theme inline`, `@custom-variant dark`), shadcn/ui, `next/font/local`, `tw-animate-css`, **`next-themes`** (quản theme). Font: IBM Plex Sans (variable TTF, đã có) + IBM Plex Mono (cần lấy) — OFL.

**Storage**: Theme → **next-themes** (localStorage, chiến lược `class`); không cookie, không DB.

**Testing**: Vitest/RTL cho logic theme-toggle (đọc/ghi cookie, đổi class); script kiểm token-lint (grep 0 hardcode hex) + contrast (AA) chạy trong quality-gate. (Harness test trong `web/` sẽ xác nhận ở task setup; nếu chưa có, khai báo rõ.)

**Target Platform**: Trình duyệt hiện đại (desktop-first, responsive). Phục vụ qua Cloudflare Tunnel (đã có).

**Project Type**: Web (monorepo — chỉ tầng `web/` bị chạm trong feature này).

**Performance Goals**: Không FOUC khi load (theme set server-side); font self-host (0 request CDN), `display: swap`, subset latin + latin-ext (dấu tiếng Việt).

**Constraints**: WCAG AA cho text + control ở dark *và* light; tôn trọng `prefers-reduced-motion`; focus nhìn thấy được; mint sáng `#38E8C6` KHÔNG dùng làm mực trên nền trắng (dùng `#0FA188`).

**Scale/Scope**: 1 hệ token (dark+light), 2 họ chữ, re-skin 1 shell (layout + 1 trang). CHƯA build board dữ liệu thật.

> ⚠️ **web/AGENTS.md**: Next.js bản này có thể khác training data. Trước khi viết code Next, **đọc** `web/node_modules/next/dist/docs/` — đặc biệt `01-app/.../components/font.md` (next/font/local), `13-fonts.md`, và file-convention metadata. Đã xác nhận: next/font/local nhận `src` (variable TTF + `variable`), icon conventions `favicon.ico|icon.svg|apple-icon.png` trong `app/`.

## Constitution Check

*GATE: pass trước Phase 0; re-check sau Phase 1.*

- [x] **I. Review tầng ý định** — feature này *phục vụ trực tiếp* nguyên tắc: token trạng thái Check/Evidence + mã hoá màu-LẪN-hình + AA + grayscale-test (SC-001). PASS.
- [x] **II. Spec hợp đồng** — token = "contract" cho mọi component sau (contracts/design-system.md); không hardcode. PASS.
- [x] **III. Checker độc lập** — N/A (feature FE, không chạm agent pipeline). Verify ở đây là deterministic-first (grep token-lint + contrast script) đúng tinh thần. PASS.
- [x] **IV. Single-agent/đơn vị** — một workstream, tuyến tính, một writer. PASS.
- [x] **V. Spec-driven hard gate** — spec.md ✔ + plan.md (file này) ✔; chưa sửa `web/` source cho design-system tới khi plan được duyệt. (Logo/favicon asset tĩnh đã tạo trước theo yêu cầu — không phải code.) PASS.
- [x] **VI. TDD + Docs-as-code** — theme-toggle có test fail trước; quyết định "cookie vs localStorage" + "oklch vs hex" ghi ở research.md (ADR-lite). PASS.
- [x] **Stack/Security** — giữ Next + Tailwind v4 + shadcn (đúng constitution); FE-only, không secret. PASS.

→ **Không có vi phạm** → Complexity Tracking để trống.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/001-branding/
├── spec.md
├── plan.md              # file này
├── research.md          # Phase 0 — quyết định + lý do
├── data-model.md        # Phase 1 — token taxonomy + giá trị dark/light
├── contracts/
│   └── design-system.md # contract: tên CSS variable + theme API
├── quickstart.md        # Phase 1 — validation guide (cách nghiệm thu)
├── nextcloud-deck-svgrepo-com.svg / card-two-svgrepo-com.svg  # refs
└── tasks.md             # Phase 2 — /speckit-tasks (CHƯA tạo ở đây)
```

### Source Code (chỉ tầng `web/`)

```text
web/
├── src/
│   ├── app/
│   │   ├── globals.css      # ★ token control-room (dark+light) trong @theme + :root/.dark
│   │   ├── layout.tsx       # ★ next/font/local Plex Sans+Mono; theme từ cookie → <html class>
│   │   ├── page.tsx         # ★ re-skin shell ping/SSE sang control-room
│   │   └── favicon.ico / icon.svg / apple-icon.png   # ĐÃ XONG
│   ├── fonts/               # ★ MỚI — IBMPlexSans var + IBMPlexMono + OFL.txt
│   └── components/
│       ├── ui/                 # shadcn (button…) — kế thừa token, không override màu
│       ├── brand/              # ★ MỚI — <Logo>/<Wordmark> (dùng /brand hoặc inline mark)
│       ├── theme-provider.tsx  # ★ MỚI — "use client" bọc next-themes ThemeProvider
│       └── theme-toggle.tsx    # ★ MỚI — đổi mode qua useTheme()
└── public/brand/            # ĐÃ XONG — logo SVG set + README
```

**Structure Decision**: Monorepo; feature gói gọn trong `web/`. Token là nguồn sự thật màu/typography (FR-001); component (shadcn + brand) chỉ tiêu thụ token. Theme do **cookie** điều khiển, set `<html class="dark">` ngay trên server → không FOUC.

## Phasing (committable units — chi tiết hoá ở tasks.md)

Mỗi đơn vị có done-condition quan sát được; thứ tự có phụ thuộc:

1. **Fonts**: thêm Plex Sans/Mono vào `web/src/fonts/` + OFL.txt; `layout.tsx` dùng `next/font/local`, set `--font-sans`/`--font-mono`; gỡ Geist. *Done*: trang render bằng Plex; DevTools Network 0 request tới host font ngoài.
2. **Tokens (dark)**: viết palette control-room dark trong `globals.css` (`:root`/`@theme`) theo data-model.md (nền/text/accent/semantic/board/check/radius/elevation). *Done*: `--color-*` resolve đúng; không hardcode hex trong component.
3. **Tokens (light)** + biến thể mint AA: bộ `.dark` ↔ light đảo đúng; mint nền sáng = `#0FA188`. *Done*: contrast script báo AA pass cả 2 mode.
4. **Theme (next-themes)**: `pnpm add next-themes`; `theme-provider.tsx` (bọc `ThemeProvider`, `defaultTheme="dark"` `enableSystem` `disableTransitionOnChange`) + `theme-toggle.tsx` (`useTheme`); layout bọc provider + `<html suppressHydrationWarning>`. *Done*: đổi mode 1 thao tác, không reload, reload vẫn giữ, không nhấp nháy (anti-FOUC do lib).
5. **Brand components**: `<Logo>`/`<Wordmark>` (mark Columns, accent token). *Done*: hiện ở app bar; favicon đã auto.
6. **Re-skin shell**: `page.tsx` (+ app bar) sang control-room; trạng thái demo mã hoá màu+hình; focus-visible; `prefers-reduced-motion`. *Done*: không còn look shadcn mặc định; grayscale vẫn phân biệt trạng thái.
7. **Quality gate**: token-lint (grep hex), contrast (AA), grayscale-test, font-network-check theo quickstart.md. *Done*: tất cả pass; ghi evidence.

## Complexity Tracking

*Không có vi phạm Constitution → bỏ trống.*
