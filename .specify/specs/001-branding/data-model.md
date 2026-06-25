# Data model — Design tokens (001-branding)

"Entities" của feature branding là **các nhóm token**. Đây là nguồn-sự-thật giá trị; `globals.css` hiện thực hoá trong `:root` (light) / `.dark` và phơi qua `@theme inline` thành utility. Component **chỉ tiêu thụ token**, không hardcode.

> Quy ước: cột **Dark** là mặc định (bản sắc). Giá trị là đề xuất chốt; implement có thể tinh ±, nhưng phải giữ AA (xem research R5) và khớp logo asset.

## 1. Surface / nền

| Token | Dark | Light | Vai trò |
|-------|------|-------|---------|
| `--ground` (bg page) | `#0B0D10` | `#F6F7F9` | nền sâu nhất |
| `--background` (shadcn) | `#0E1116` | `#FFFFFF` | nền app chính |
| `--surface` / `--card` | `#14171C` | `#FFFFFF` | card, panel |
| `--surface-2` | `#181C22` | `#F9FAFB` | lớp nổi thứ 2 |
| `--border` | `#242A33` | `#E2E6EB` | viền |
| `--border-strong` | `#2E353F` | `#CDD3DA` | viền nhấn / hover |

## 2. Text (3 cấp)

| Token | Dark | Light | Vai trò |
|-------|------|-------|---------|
| `--foreground` / text | `#E6E8EB` | `#14171C` | chữ chính |
| `--text-dim` / `--muted-foreground` | `#99A1AC` | `#586170` | phụ |
| `--text-mute` | `#7A828D` | `#6B7480` | mờ nhất (ID, caption) |

## 3. Accent (mint)

| Token | Dark | Light | Vai trò |
|-------|------|-------|---------|
| `--accent` (brand) / `--primary` | `#38E8C6` | `#0A8470` | nhấn, primary, link/Evidence |
| `--accent-ink` / `--primary-foreground` | `#04130F` | `#FFFFFF` | mực trên nền accent |
| `--accent-soft` | `rgba(56,232,198,.12)` | `rgba(15,161,136,.12)` | nền nhạt của accent |

> `#38E8C6` KHÔNG dùng làm mực trên nền sáng (rớt AA) — light dùng `#0A8470`.

## 4. Semantic state (TÁCH khỏi accent)

| Token | Dark | Light | Nghĩa |
|-------|------|-------|-------|
| `--good` | `#57DD8B` | `#1F9D5B` | pass / Done |
| `--warn` | `#F2C45A` | `#B47914` | pending / Plan |
| `--crit` / `--destructive` | `#FF6B6B` | `#D2483E` | fail |
| `--running` | `#38E8C6` | `#0A8470` | in-flight (= accent) |

## 5. Board columns (FR-004)

| Token | Map | Nghĩa |
|-------|-----|-------|
| `--col-backlog` | `--text-mute` | ý tưởng thô |
| `--col-plan` | `--warn` | Spec đang soạn |
| `--col-review` | `--running` | in-flight (accent) |
| `--col-done` | `--good` | đóng băng |

## 6. Check / Evidence (FR-004, Nguyên tắc I)

| Token | Map | Hình kèm (a11y) |
|-------|-----|------------------|
| `--check-pass` | `--good` | ✓ tròn đặc |
| `--check-fail` | `--crit` | ✕ tròn đặc |
| `--check-pending` | `--warn` | vòng rỗng |
| `--check-running` | `--running` | dot + pulse |
| `--evidence` | `--accent` | chip có icon; thiếu Evidence → KHÔNG hiển thị pass |
| `--fastlane` | `--accent` (outline) | tag viền |

## 7. Shape & elevation

| Token | Giá trị | Ghi chú |
|-------|---------|---------|
| `--radius` (base) | `0.4rem` (~6.4px) | control-room: bo nhỏ; scale `--radius-sm/md/lg…` derive sẵn trong `@theme` |
| `--shadow-card` | `0 1px 2px rgb(0 0 0 / .25)` (dark) · `0 1px 2px rgb(20 20 24 / .06)` (light) | gần phẳng |
| `--ring` (focus) | `--accent` | focus-visible nhìn thấy được |

## 8. Typography tokens

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `--font-sans` | IBM Plex Sans (var 100–700) | UI, wordmark, heading |
| `--font-mono` | IBM Plex Mono (400/500) | Spec ID, Check, Evidence, số (`tabular-nums`) |
| thang cỡ | dùng thang Tailwind; heading dùng `font-sans` 600, tracking âm nhẹ | |

## Mapping → shadcn slots

Đặt lại các biến shadcn bằng giá trị ở trên để component kế thừa: `--background --foreground --card(-foreground) --popover(-foreground) --primary(-foreground) --secondary(-foreground) --muted(-foreground) --accent(-foreground) --destructive --border --input --ring`. Token MỚI của SpecDeck (mục 1–7, phần không trùng shadcn) khai báo thêm trong cùng `:root`/`.dark` + `@theme inline`.

## Theme entity (next-themes)

| Field | Giá trị |
|-------|---------|
| thư viện | `next-themes` (`attribute="class"`) |
| storage | localStorage key `theme` (lib quản) |
| values | `dark` (mặc định) · `light` · `system` |
| áp dụng | class `dark`/`light` trên `<html>` (khớp `@custom-variant dark (&:is(.dark *))`) |
| anti-FOUC | inline script của next-themes set class trước paint; `<html suppressHydrationWarning>` |
| API | `<ThemeProvider defaultTheme="dark" enableSystem disableTransitionOnChange>` + `useTheme()` |
