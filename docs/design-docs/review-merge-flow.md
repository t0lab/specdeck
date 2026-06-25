# Review hai tầng → tạo PR → agent-merge hoặc tự merge

**Status:** proposed
**Date:** 2026-06-25
**Deciders:** chủ dự án

## Context

Review là bottleneck thật của vibe coding. SpecDeck phục vụ *hai loại người duyệt*: non-dev (cần tầng ngôn ngữ tự nhiên + bằng chứng) và dev (muốn soi diff). Sau khi gật, code phải vào repo theo cách vừa nhanh (async) vừa cho phép kiểm soát/CI ngoài chen vào. vibe-kanban chỉ review ở tầng diff → loại non-dev và không có tầng ý định.

## Decision

**Review hai tầng trên cùng một Task** (màn Review 🔴):

1. **High-level** (mặc định, cho *mọi người*): từng **Check** pass/fail kèm **Evidence** (ảnh/video/test/log), đọc bằng tiếng người. Mỗi ✅ **bắt buộc** có Evidence.
2. **Code diff** (cho *dev*): mở rộng xem diff thật, click thẳng từ một Check ❌ tới chỗ liên quan.

Khi người thấy ổn → gật → **agent tạo PR**. **Merge theo một trong hai cách:**
- **Nhờ agent merge** (nhanh, async), hoặc
- **Tự kiểm rồi merge tay** — để CI/review bên ngoài chen vào.

Merge xong → **Done**. Nếu fail → **Rework** bật *tại chỗ* trong Review (không kéo về Plan). Thay đổi blast-radius lớn: người giữ gate merge (không auto-merge).

## Alternatives considered

- **Chỉ diff review (kiểu vibe-kanban)** — rejected: non-dev không dùng được; không có tầng ý định; không tận dụng Checker + Evidence.
- **Auto-merge không gate người** — rejected: "borrowed confidence" (model review + model judge tự tin sai); nguy hiểm với blast-radius lớn. Người phải ở cổng merge.
- **Chỉ merge tay** — rejected: mất tốc độ async — điểm bán hàng cốt lõi của SpecDeck.
- **Hai tầng = hai màn riêng** — rejected: cùng một Task, chỉ là mức xem; tách màn gây lạc context.

## Consequences

**Better:**
- Non-dev nghiệm thu ở Check+Evidence; dev vẫn soi được diff — cùng một chỗ.
- Tạo-PR giữ pipeline git chuẩn; hai lối merge cho cả tốc độ lẫn kiểm soát.
- Người ở cổng merge cho thay đổi rủi ro cao → chặn lỗi correlated của agent.

**Worse:**
- Phải dựng hai bề mặt review (high-level + diff) + tích hợp PR/merge (GitHub API...).
- "Nhờ agent merge" cần ràng buộc an toàn (chỉ khi mọi Check pass + có Evidence).

**Must now be true:**
- Mỗi Check ✅ ở tầng high-level PHẢI có Evidence trước khi cho merge.
- Agent chỉ được merge khi mọi Check pass; còn lại người tự merge.
- Rework bật tại chỗ trong Review, không tạo chuyển-cột-ngược.

## Revisit if

- Cần phê duyệt nhiều người / quy trình review tổ chức (hiện nhắm 1 người điều phối).
- Tích hợp CI ngoài đổi cách (vd merge queue) làm lối "agent merge" cần điều kiện khác.

## Tham chiếu

- [docs/DESIGN.md](../DESIGN.md) §Màn hình chính (#2) + bảng board.
- [ADR: board-columns](board-columns.md) — Review là cổng-người; Rework tại chỗ.
- [constitution](../../.specify/memory/constitution.md) Principle I (review tầng ý định) + III (Checker/Evidence).
