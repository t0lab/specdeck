# Board dùng 4 cột cố định, đặt theo "cổng con người"

**Status:** proposed
**Date:** 2026-06-08
**Deciders:** chủ dự án

## Context

Kanban cổ điển có 5–6 cột (Backlog → To Do → In Progress → Review → Testing → Done). Phê bình lặp đi lặp lại với kanban-cho-agent: agent chạy nhanh đến mức thẻ bay qua "In Progress"/"Testing" trong vài phút, khiến ~50% cột vô nghĩa và board nhấp nháy loạn. Nguyên nhân gốc: Kanban cổ điển trộn hai thứ khác bản chất — trạng thái *"máy đang làm"* (thoáng qua) và trạng thái *"đến lượt người"* (nơi thẻ thật sự dừng). Cần một bộ cột phản ánh đúng nhịp bất đồng bộ của agent.

## Decision

Dùng **4 cột tiếng Anh cố định**, đặt theo nguyên tắc *chỉ trạng thái mà con người bị chặn mới thành cột*:

| Cột | Ý nghĩa |
|---|---|
| **Backlog** | ý tưởng, chưa có spec |
| **Plan** 🟡 | Spec + Acceptance do Planner đề xuất, chờ người duyệt *kế hoạch* |
| **Review** 🔴 | các Check đã được Checker chấm, chờ người duyệt *kết quả* |
| **Done** ✅ | đã merge |

Mọi trạng thái "agent đang chạy" (Planner soạn spec, Builder code, recode) là **badge ⏳ trên thẻ**, không phải cột. Recode loop bật **tại chỗ** trong Review, không kéo thẻ về cột trước.

## Alternatives considered

- **6 cột Kanban cổ điển** (thêm To Do, In Progress/Running, Testing) — rejected. To Do/In Progress/Testing là trạng thái máy-đang-làm, thoáng qua với agent → cột thừa, board nhiễu.
- **Tách "Running" thành cột riêng** — seriously considered (cho người thấy agent đang chạy). Rejected: làm thành badge giữ được tính minh bạch mà không tốn một cột nghỉ. Revisit nếu user test thấy thiếu cảm giác "đang chạy".
- **Tên cột tiếng Việt ("Duyệt Kế hoạch" / "Duyệt Kết quả")** — rejected. Chốt tiếng Anh theo quy ước Kanban phổ biến (`Backlog … Review … Done`).
- **"Spec Review" + "Review"** — rejected. Hai tên cùng chữ "Review" gây lẫn dù khác tầng (ý định vs kết quả). Đổi thành `Plan` / `Review` cho tương phản rõ.

## Consequences

**Better:**
- Board chỉ "sáng đèn" đúng chỗ cần người (Plan, Review) → giết cảm giác thẻ bay loạn.
- Hai cổng người rõ ràng: duyệt *cái sắp làm* và *cái đã làm*.
- Tên ngắn, quen, không lặp từ.

**Worse:**
- Mất tính minh bạch "đang chạy" ở mức cột — phải dựa vào badge, cần thiết kế badge tốt.
- 4 cột cứng → quy trình hơi opinionated, không hợp người thích freeform.

**Must now be true:**
- Không tạo cột cho bất kỳ trạng thái "agent đang chạy" nào; dùng badge trên thẻ.
- Recode khi Review fail phải bật tại chỗ, không tạo chuyển-cột-ngược.
- Task fast-lane bỏ qua cột `Plan`, vào thẳng `Review`.

## Revisit if

- User test cho thấy thiếu một cột "đang chạy" rõ ràng (cảm giác mất kiểm soát).
- Mô hình agent đổi (vd bỏ vai Planner) khiến cổng `Plan` không còn cần.

(Thuật ngữ: xem [docs/glossary.md](../glossary.md).)
