# SpecDeck — Logo & brand assets

Mark **Columns** (concept #07): bốn cột Kanban — Backlog · Plan · **Review** · Done — cột Review tô **accent mint** = đang xử lý. Nhịp cột tăng dần, đỉnh ở cột accent.

Wordmark hai màu: **Spec** (màu chữ) + **Deck** (mint). Chữ đã **outline thành path** từ IBM Plex Sans SemiBold → render giống nhau ở mọi nơi, **không cần cài font**, không dư khoảng trống.

## Vị trí

- **`web/public/brand/`** — bộ logo SVG (file này). Dùng trong app/site qua đường dẫn `/brand/<tên>.svg`.
- **`web/src/app/`** — favicon theo chuẩn Next App Router (Next tự sinh `<link>`):
  - `favicon.ico` (16/32/48), `icon.svg` (SVG hiện đại), `apple-icon.png` (180, full-bleed).

## Logo files (`web/public/brand/`)

| File | Dùng cho |
|------|----------|
| `specdeck-mark.svg` | Mark, on-dark (cột sáng + 1 cột mint). |
| `specdeck-mark-light.svg` | Mark, on-light (cột đậm + mint đậm hơn cho AA). |
| `specdeck-mark-mono.svg` | Mark 1 màu — kế thừa `currentColor`. |
| `specdeck-horizontal.svg` | Lockup ngang on-dark (icon + wordmark 2 màu, baseline chữ canh đáy cột). |
| `specdeck-horizontal-light.svg` | Lockup ngang on-light. |
| `specdeck-vertical.svg` | Lockup dọc on-dark. |
| `specdeck-vertical-light.svg` | Lockup dọc on-light. |
| `specdeck-wordmark.svg` | Wordmark on-dark (Spec `#E6E8EB` + Deck `#38E8C6`). |
| `specdeck-wordmark-light.svg` | Wordmark on-light (Spec `#1A1A18` + Deck `#0FA188`). |
| `specdeck-wordmark-mono.svg` | Wordmark 1 màu — kế thừa `currentColor`. |
| `specdeck-app-icon.svg` | App/launcher icon — mark trong tile bo góc. |
| `favicon.svg` | Favicon SVG (= thiết kế app-icon). |
| `icon-192.png` · `icon-512.png` | Icon full-bleed cho PWA manifest (dùng ở plan sau). |

## Colours

| Token | Hex | Ghi chú |
|-------|-----|---------|
| Accent (mint) | `#38E8C6` | Trên nền tối |
| Accent (light bg) | `#0FA188` | Biến thể đậm cho nền sáng (AA) |
| Line on dark | `#E6E8EB` | Cột / chữ "Spec" trên nền tối |
| Line on light | `#1A1A18` | Cột / chữ "Spec" trên nền sáng |
| Ground | `#0B0D10` | Nền control-room |
| Tile | `#0E1116` | Nền app-icon / favicon |

## Typography

- **Wordmark / UI**: IBM Plex Sans SemiBold (600). Trong logo đã **outline → path** (không phụ thuộc font).
- **Spec ID / Check / số**: IBM Plex Mono.
- Web product self-host Plex qua `next/font` (DOM text dùng font thật; file SVG này dùng cho nơi khác / khi cần font-độc-lập).

## Clear space & min size

- **Clear space**: tối thiểu = chiều cao một cột của mark, quanh mọi phía.
- **Min size**: mark ≥ 20px; lockup ngang ≥ 96px rộng; favicon tile rõ ở 16–32px.

## Don't

- Không đổi màu/hue accent · không tô nhiều hơn một cột accent.
- Không kéo méo, xoay, nghiêng, đổ bóng/glow lên mark.
- Không đổi nhịp/độ cao cột (đó là nhận diện).
- Không đặt mint sáng `#38E8C6` lên nền trắng (rớt AA) — dùng `#0FA188`.

## Regenerate

Wordmark được outline từ IBM Plex Sans variable (instance wght=600) bằng `fontTools`; favicon raster bằng `cairosvg` + `Pillow`. Script gen nằm trong scratchpad phiên làm việc (`outline.py`, `generate.py`). Khi self-host Plex trong `web/` (plan), có thể tái dựng từ chính font đó.
