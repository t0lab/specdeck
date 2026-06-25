# Quickstart — Validate 002-web-mock

Kịch bản chạy-được chứng minh feature đạt spec. Tham chiếu [data-model.md](./data-model.md), [contracts/ui-contracts.md](./contracts/ui-contracts.md). **Không** chứa code hiện thực.

## Prerequisites

```bash
cd web
cp .env.example .env        # F1: env mẫu (không secret)
pnpm install                # nếu chưa
```

## Chạy

```bash
cd web
pnpm dev                    # http://localhost:3000 (hoặc qua tunnel specdeck.timezlab.org)
```

## Gate tự động (deterministic-first — Quality gate Q1)

```bash
cd web
pnpm test                   # vitest: check-progress / board-state / default-tab PASS
pnpm lint                   # eslint sạch
pnpm build                  # build xanh (env validate lúc build — F1)
# Grep bảo chứng:
grep -rnE "#[0-9a-fA-F]{3,6}" src --include=*.tsx | grep -v globals.css   # → rỗng (không hardcode hex)
grep -rn "process.env" src | grep -v "NEXT_PUBLIC_" | grep -v env.ts      # → không lộ secret client
```
*Sửa `.env` thiếu biến bắt buộc → `pnpm build` báo lỗi rõ (chứng minh validate lúc boot).*

## Kịch bản thủ công (theo user story)

### US1 — Landing (SC-001, SC-009)
1. Mở `/` → thấy hero "review specs, not diffs", explainer 4 cột + pipeline Planner/Builder/Checker, CTA.
2. Bấm CTA → tới `/board`.
3. Toggle dark/light → đúng màu, **không** nhấp nháy lúc tải.

### US2 — Board (FR-002..007, SC-004)
4. `/board` → đúng 4 cột Backlog→Plan→Review→Done, mỗi cột có nhãn + count.
5. Tìm card có agent chạy → badge ⏳ (không phải cột riêng).
6. Tìm card Fast lane → badge **Fast lane**, nằm ở Review.
7. Card Review có Check `pass` thiếu Evidence → progress **không** tính nó, **không** hiển thị xanh.

### US3 — Drag-drop (FR-008..011, SC-007)
8. Kéo card Backlog → Plan: xuất hiện ở Plan, mất khỏi Backlog, count 2 cột đổi ngay.
9. Kéo đổi thứ tự trong một cột → thứ tự đổi theo chỗ thả.
10. Trong lúc kéo → có overlay/indicator vùng thả.
11. Chỉ bằng **bàn phím**: nhấc/di chuyển/thả một card.
12. Reload trang → Board về bố cục mock gốc (không persist).

### US4 — Dual-surface detail (FR-012..024, SC-002/003/005/006/008)
13. Click **thân** một card → drawer overview trượt lên, Board mờ phía sau; thấy mã/title/column/badge/goal/progress+Checks + "Open full ↗".
14. Nhấn Esc (và thử nút back trình duyệt) → drawer đóng, về Board nguyên trạng.
15. Copy URL `/board/[spec]` đang ở drawer → mở tab mới/refresh → ra **trang đầy đủ** (không phải drawer).
16. "Open full ↗" (trong drawer + hover trên card) và ⌘/Ctrl-click thân card → vào thẳng trang đầy đủ.
17. Trang đầy đủ: tab **Spec** thấy Goal, US (chip P1/P2/P3), Given/When/Then dạng block, FR-xxx/SC-xxx mã mono, Edge/Assumptions, prose render (Mermaid nếu có), khối Tasks gập-được; TOC dính điều hướng được. (Định vị Goal/Acceptance/Checks **không** đọc markdown thô — SC-006.)
18. Tab **Checks+Evidence**: nhóm deterministic→evidence→held-out→judge, progress bar; mỗi pass có Evidence mở được; Check thiếu Evidence có cảnh báo, **không** xanh.
19. Mở card cột **Plan** → mặc định tab **Spec**; card cột **Review** → mặc định tab **Checks+Evidence**.
20. Mở `/board/SPEC-KHONG-CO` → trang "không tìm thấy" + lối về Board.
21. **Grayscale** (DevTools → Rendering → grayscale, hoặc chụp B&W): 100% trạng thái Check vẫn phân biệt được (SC-003).
22. Mở-card không có Check (Backlog) → tab Checks empty state, không lỗi.

### US5 — Diff (FR-025/026)
23. Mở chi tiết một card có diff → tab **Diff**: danh sách file added/modified/deleted + nội dung diff read-only.
24. Mở tab Diff của card chưa có diff (Backlog/Plan) → empty state rõ ràng, không lỗi.

### Cross-cutting (SC-008, reduced-motion)
25. Hoàn thành **toàn luồng** landing→Board→mở chi tiết→đổi tab **chỉ bằng bàn phím**, focus luôn thấy được.
26. Bật `prefers-reduced-motion` (OS/DevTools) → animation ⏳ và hiệu ứng kéo giảm/tắt.

## Done khi

Mọi gate tự động xanh + 26 bước thủ công đạt kỳ vọng → feature thoả spec 002-web-mock.
