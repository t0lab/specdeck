# Quickstart — Validation (001-branding)

Cách nghiệm thu feature đạt spec. Chạy từ `web/`. Mỗi mục gắn Success Criteria / Acceptance tương ứng — output là **Evidence**.

## Prerequisites

```bash
cd web
pnpm install
pnpm exec next dev -H 0.0.0.0 -p 3000   # hoặc qua docker-compose đã có
```

## V1 — Font self-host, 0 CDN (SC-005, C4)

1. Mở trang, DevTools → **Network → Font**.
2. **Expected**: chỉ tải font từ origin của app (`/_next/...`); **không** request tới `fonts.googleapis.com`/`fonts.gstatic.com`/CDN nào.
3. Chữ hiển thị **IBM Plex Sans**; ID/Check hiển thị **IBM Plex Mono**; dấu tiếng Việt (ă â đ ê ô ơ ư) render đúng.

## V2 — Token-lint: 0 hardcode màu (SC-002, C1)

```bash
# không còn literal màu ngoài globals.css + fonts
grep -rnE '#[0-9a-fA-F]{3,8}\b|oklch\(|\brgb[a]?\(' src \
  --include='*.tsx' --include='*.ts' --include='*.css' \
  | grep -vE 'src/app/globals.css|src/fonts/' || echo "PASS: no hardcoded colours"
```
**Expected**: `PASS` (rỗng).

## V3 — Dark/Light toggle + persist (SC-003, AC US3)

1. Mặc định mở ra **dark**.
2. Bấm toggle → đổi sang light **tức thì, không reload, không nhấp nháy sai màu**.
3. **Reload** → vẫn ở light (cookie `sd-theme`).
4. Tải lần đầu ở tab ẩn danh (chưa cookie) → **dark**.

## V4 — Tương phản AA cả 2 mode (SC-004, C5)

- Dùng DevTools (Lighthouse/axe) hoặc script đo contrast cho: text/nền, text-dim/nền, primary/primary-foreground, các semantic trên nền tương ứng — ở **cả** dark và light.
- **Expected**: text ≥ 4.5:1, UI/large ≥ 3:1. Light dùng accent `#0A8470` (không `#38E8C6`).

## V5 — Grayscale: trạng thái đọc được không nhờ màu (SC-001, C2)

1. DevTools → Rendering → **Emulate vision deficiencies → Achromatopsia** (hoặc CSS `filter: grayscale(1)`).
2. **Expected**: vẫn phân biệt được **4 cột** (Backlog/Plan/Review/Done) và **4 trạng thái Check** (pass/fail/pending/running) nhờ **hình + nhãn**.
3. Một Check thiếu Evidence **không** hiển thị như pass.

## V6 — Re-skin + brand (US2)

- App bar có **wordmark + mark** (cột Review tô accent); favicon tab đúng (tile).
- Không còn look shadcn/Tailwind mặc định (nền tối control-room, mint accent, Plex).
- Thêm thử 1 component shadcn mới (vd `badge`) → hiển thị đúng brand **không sửa màu** (SC-006).

## V7 — Reduced-motion + focus (C5)

- Bật `prefers-reduced-motion: reduce` → pulse "running" dừng, trạng thái vẫn rõ.
- Tab bằng bàn phím → mọi control có **focus ring** nhìn thấy.

## V8 — Build sạch (Quality gate)

```bash
pnpm exec next build      # đọc web/AGENTS.md trước nếu cần
```
**Expected**: build pass, không lỗi font/type.

---

Hoàn tất khi V1–V8 pass; đính kèm output làm Evidence cho các Check tương ứng trong tasks.md.
