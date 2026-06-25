# Research — 001-branding

Giải quyết các điểm mở của spec/plan. Mỗi mục: **Decision · Rationale · Alternatives**.

## R1. Quản lý theme — dùng `next-themes`

**Decision**: Dùng thư viện **`next-themes`**: `attribute="class"`, `defaultTheme="dark"` (bản sắc), `enableSystem` (cho chọn theo OS), `disableTransitionOnChange`. Bọc app trong `<ThemeProvider>` ở một **client component** (`components/theme-provider.tsx`) vì root layout là server; thêm `suppressHydrationWarning` vào `<html>`. Toggle qua hook `useTheme()` (`theme`/`setTheme`/`resolvedTheme`).

**Rationale**: chuẩn de-facto cho App Router; tự **inject inline script chặn FOUC** (set class `dark`/`light` trước paint từ localStorage), hỗ trợ sẵn `system` + nhớ lựa chọn → giải đúng SC-003 *và* tình huống honor-OS-lần-đầu mà cookie không làm được. Khớp `@custom-variant dark (&:is(.dark *))` (chiến lược class) đã có.

**Trade-off / Alternatives**:
- *Cookie + đọc server-side* (phương án trước): SSR biết theme, không cần script; nhưng tự code đọc/ghi, không có `system`, tự xử anti-FOUC. next-themes gọn + đã kiểm chứng → chọn. Giá: theme ở **localStorage** (client), dựa vào script chặn-paint của lib + `suppressHydrationWarning` (chuẩn, chấp nhận).
- *Tự viết localStorage + script*: trùng việc lib đã làm tốt. Bỏ.

**Cần làm ở implement**: `pnpm add next-themes`.

## R2. Định dạng màu — hex vs oklch

**Decision**: Dùng **hex/sRGB** cho palette control-room (đúng từng giá trị với logo + favicon đã tạo). Giữ cấu trúc `@theme inline` + `:root`/`.dark` sẵn có; thay bộ giá trị shadcn mặc định (đang oklch) bằng hex control-room.

**Rationale**: Logo/favicon đã hardcode chính xác các hex này; một nguồn-sự-thật màu giữa SVG asset và CSS token tránh lệch tông. Tailwind v4 chấp nhận mọi cú pháp màu.

**Alternatives**: *oklch* (đồng nhất với shadcn gốc, gamut tốt) — nhơn về lý thuyết nhưng phải convert và đối chiếu lại với hex của asset; để mở nâng cấp sau, không chặn.

## R3. Self-host IBM Plex + weights

**Decision**: `next/font/local`.
- **IBM Plex Sans**: dùng **variable TTF** (axes wght,wdth) đã tải; khai báo `weight: "100 700"` (dùng 400 body, 500 medium, 600 wordmark/heading), `variable: "--font-sans"`.
- **IBM Plex Mono**: lấy thêm static **400** + **500** (không có trong file variable Sans); `variable: "--font-mono"`.
- Subset **latin + latin-ext** (dấu tiếng Việt). `display: "swap"`. File để ở `web/src/fonts/` kèm **OFL.txt**.

**Rationale**: variable font = 1 file, mọi weight 100–700, hiệu năng tốt (khuyến nghị của Next docs). Mono cần family riêng. OFL cho phép redistribute kèm giấy phép.

**Alternatives**: *next/font/google* (đang dùng Geist) — tiện nhưng phụ thuộc fetch lúc build và không phải bản sắc đã chốt. Bỏ. *Chỉ tải static từng weight* cho Sans — nặng hơn, kém linh hoạt. Bỏ.

**Cần làm ở implement**: tải `IBMPlexMono-Regular/Medium` (cùng nguồn Google Fonts mirror OFL) vào `web/src/fonts/`; xác minh dấu tiếng Việt render đủ.

> **Triển khai thực tế (T003)**: fontTools 4.62 lỗi subset biến-thiên (`gvar` KeyError) trên file variable → đổi sang **instance tĩnh 400/500/600** cho Sans (đúng các weight đang dùng) + Mono 400/500, mỗi file subset latin+latin-ext+vi, ~73–112 KB. Self-host qua `next/font/local` (5 file `.ttf` dưới `/_next/static/media`, 0 CDN). Variable axis bỏ qua vì chỉ dùng 3 weight — không ảnh hưởng UI.

> **Docs verified 2026-06-25** (T001): khớp Next 16.2.9 — `next/font/local` nhận `src` (string|array `{path,weight,style}`), `variable` cho CSS var, variable font dùng `weight: "100 700"`; Tailwind v4 map qua `@theme inline { --font-sans: var(--font-…) }`; icon file-convention `favicon.ico`/`icon.svg`/`apple-icon.png` trong `app/` (apple-icon là `.png` route, auto `<link rel="apple-touch-icon">`). Không lệch research.

## R4. Map token vào shadcn slots

**Decision**: Đặt lại **đúng các biến shadcn** (`--background --foreground --card --popover --primary --secondary --muted --accent --destructive --border --input --ring …`) bằng giá trị control-room → component shadcn mới **kế thừa brand tự động** (SC-006). **Mở rộng** thêm token riêng SpecDeck (không có trong shadcn): `--surface-2`, `--text-dim`, `--text-mute`, `--accent-ink`, semantic `--good/--warn/--crit/--running`, board `--col-backlog/plan/review/done`, check `--check-pass/fail/pending/running`, `--evidence`, `--fastlane`. Tất cả khai báo trong `@theme inline` để có utility (`bg-surface-2`, `text-good`…).

**Rationale**: Vừa tận dụng shadcn (nút/dialog… không cần sửa), vừa có vốn từ riêng cho board/Check/Evidence (FR-004).

**Alternatives**: *Bỏ shadcn, tự token toàn bộ* — mất lợi thế component có sẵn, trái constitution (stack giữ shadcn). Bỏ.

## R5. Tương phản AA + biến thể accent

**Decision**: Mục tiêu **WCAG AA**: text thường ≥ 4.5:1, UI/large ≥ 3:1.
- Dark: text `#E6E8EB`/nền `#0B0D10` (đậm), accent mint `#38E8C6` dùng cho mảng/icon/ă/ID — KHÔNG dùng mint làm body text dài.
- Light: accent **`#0A8470`** (mint đậm) cho mực/đường nét đạt AA trên trắng; KHÔNG dùng `#38E8C6` làm mực trên nền sáng.
- Semantic (good/warn/crit) có biến thể dark/light riêng để giữ AA.

**Rationale**: mint sáng rất hợp nền tối nhưng rớt contrast trên trắng → tách biến thể (đã áp cho logo-light).

**Verify**: script đo contrast (Phase quality-gate) cho mọi cặp text/nền + control; ghi evidence.

> **Đo thực tế (T022, 2026-06-25)**: ban đầu light accent `#0FA188` chỉ đạt 3.24:1/trắng (rớt 4.5 cho accent **text** nhỏ như Evidence chip + chữ trên nút) → chỉnh sâu thành **`#0A8470`** (4.62:1, qua cả "accent-on-white" lẫn "white-on-accent"). `--text-mute` cũng nâng để đạt 4.5: dark `#5E6671`→**`#7A828D`** (4.87), light `#8A929E`→**`#6B7480`** (4.74). Sau chỉnh: **mọi cặp PASS** ở cả 2 mode (xem evidence quality-gate).

## R6. Mã hoá trạng thái màu + hình (a11y)

**Decision**: Mỗi trạng thái = **màu + hình + nhãn**: running = dot mint + pulse + chữ "running"; pass = ✓ tròn good; fail = ✕ tròn crit; pending = vòng rỗng warn. Cột board = dot màu + tên. Test ở chế độ **grayscale** vẫn phân biệt được (SC-001).

**Rationale**: Nguyên tắc I + a11y mù màu; không dựa duy nhất vào màu.

## R7. Verify deterministic-first (đúng tinh thần Nguyên tắc III/VI)

**Decision**: Quality-gate chạy theo thứ tự: (1) **token-lint** — grep `web/src` không còn hex/oklch literal ngoài `globals.css` + `fonts`; (2) **contrast** — đo AA; (3) **font self-host** — không request CDN; (4) **grayscale-test** — phân biệt cột/trạng thái; (5) build + theme-toggle test pass. Mỗi mục là Evidence của Check tương ứng.
