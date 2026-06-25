# Contract — Design System & Theme API (001-branding)

Hợp đồng mà mọi code FE sau này PHẢI tuân. Vi phạm = fail quality-gate.

## C1. Token contract (consume, đừng hardcode)

Component **chỉ** dùng utility/biến sinh từ token; **cấm** literal màu (hex/oklch/rgb) trong `web/src` ngoài `globals.css` và `src/fonts`.

Tên utility khả dụng (qua `@theme inline`), ví dụ:

```
bg-background  bg-card  bg-surface-2  text-foreground  text-dim  text-mute
bg-primary text-primary-foreground  text-accent  bg-accent-soft
text-good  text-warn  text-crit  text-running
border-border  border-strong  ring-ring  rounded-md/lg
font-sans  font-mono
```

Board/Check dùng token tương ứng: `--col-{backlog,plan,review,done}`, `--check-{pass,fail,pending,running}`, `--evidence`, `--fastlane` (xem data-model.md).

**Rule**: thêm component shadcn mới ⇒ hiển thị đúng brand **không cần override màu** (SC-006).

## C2. Status encoding contract (Nguyên tắc I + a11y)

Mọi trạng thái PHẢI thể hiện bằng **màu + hình + nhãn**, không chỉ màu:

| Trạng thái | Màu token | Hình | Nhãn |
|-----------|-----------|------|------|
| running | `--running` | dot + pulse (tắt khi reduced-motion) | "running" |
| pass | `--check-pass` | ✓ tròn đặc | — |
| fail | `--check-fail` | ✕ tròn đặc | — |
| pending | `--check-pending` | vòng rỗng | "chờ" |

- **Check thiếu Evidence ⇒ KHÔNG render như pass** (đỏ/cảnh báo).
- Cột board: dot màu `--col-*` + tên cột.
- Phải đạt: ở **grayscale** vẫn phân biệt 4 cột + 4 trạng thái (SC-001).

## C3. Theme API — `next-themes`

- Provider: `components/theme-provider.tsx` (`"use client"`) bọc `next-themes` `ThemeProvider` với
  `attribute="class"`, `defaultTheme="dark"`, `enableSystem`, `disableTransitionOnChange`.
- Root layout: bọc children bằng `<ThemeProvider>`; `<html suppressHydrationWarning>`.
- Toggle: `theme-toggle.tsx` (`"use client"`) dùng `useTheme()` (`theme`/`setTheme`/`resolvedTheme`) — đổi `dark`/`light`/`system`, **không reload**.
- Anti-FOUC: script inline của next-themes set class trước paint (localStorage key `theme`). **KHÔNG** tự viết cookie/script, **KHÔNG** tự nhét `<link>`/class tay.
- Reload giữ nguyên mode; lần đầu = `dark` (hoặc OS nếu chọn `system`) — SC-003.

## C4. Fonts contract

- Nạp qua `next/font/local` từ `web/src/fonts/`; KHÔNG `next/font/google`, KHÔNG link CDN.
- `--font-sans` = IBM Plex Sans (var), `--font-mono` = IBM Plex Mono.
- Network panel khi load: **0** request tới host font ngoài (SC-005).
- Subset có **latin-ext** (render đủ dấu tiếng Việt).

## C5. Accessibility contract

- Dark **và** light đạt **WCAG AA** (text ≥ 4.5:1, UI/large ≥ 3:1) — SC-004.
- `:focus-visible` có ring nhìn thấy (`--ring`).
- Tôn trọng `prefers-reduced-motion` (tắt pulse/animation).
- `#38E8C6` không làm mực trên nền sáng (dùng `#0FA188`).

## C6. Brand asset contract

- Logo dùng từ `web/public/brand/` (hoặc component `src/components/brand`); KHÔNG vẽ lại mark.
- Mark: chỉ **một** cột tô accent (Review). Không đổi nhịp/độ cao cột, không méo/xoay/bóng.
- Favicon: file convention trong `web/src/app/` (đã có) — không tự nhét `<link>` tay.
