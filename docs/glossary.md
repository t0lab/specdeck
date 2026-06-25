# SpecDeck — Glossary

> Nguồn chuẩn cho thuật ngữ của dự án. Nếu doc/code dùng từ lệch bảng này → sửa cho khớp đây. Danh từ sản phẩm và tên cột viết tiếng Anh; phần giải thích tiếng Việt.

**Status:** canonical · **Last updated:** 2026-06-08

---

## Sản phẩm & board

| Term | Nghĩa |
|---|---|
| **SpecDeck** | Tên sản phẩm. *Control deck* (bàn điều khiển) để điều phối coding agent; mỗi **Task** chạy theo một **Spec**. (spec + deck) |
| **Board** | Bảng 4 cột; chỉ những trạng thái mà *con người bị chặn* mới thành cột. |
| **Task** | Đơn vị công việc trên Board, chạy qua 4 cột. Một Task *mang theo* một Spec (≠ Spec). |
| **Backlog** | Cột 1 — ý tưởng, Task chưa có Spec. |
| **Plan** | Cột 2 🟡 — chờ bạn duyệt *cái sắp làm* (Spec + Acceptance). |
| **Review** | Cột 3 🔴 — chờ bạn duyệt *cái đã làm* (Checks đã được chấm). |
| **Done** | Cột 4 ✅ — đã merge. |

## Vai trò agent

| Term | Nghĩa |
|---|---|
| **Planner** | Agent nhận ý tưởng → soạn **Spec**. Là điểm con người nắn hướng *trước khi* code (control rẻ nhất). |
| **Builder** | Agent viết code để đạt Spec. Có thể nhiều Builder song song, mỗi người một git worktree, không đụng file nhau. |
| **Checker** | Agent chấm — **độc lập với Builder** (khác context, lý tưởng là khác model). Chấm từng **Check** kèm **Evidence**. |

## Artifact & review

| Term | Nghĩa |
|---|---|
| **Spec** | Tài liệu kế hoạch của **một Task**: *mục tiêu + Acceptance + danh sách Check*. Hợp đồng dùng chung cho cả 4 bên. Đóng băng khi Task sang Done. (≠ Project Context — tầng project bên dưới.) |
| **Project Context** | Luật đứng *trên mọi Task*: stack, convention, ràng buộc, ranh giới ("đừng đụng module X"). **Sống theo project**, cập nhật dần. Planner *kế thừa* nó khi sinh mỗi Spec, nên Spec chỉ nói phần khác biệt của việc đó. Tương đương `constitution`/steering trong Spec Kit/Kiro. |
| **Acceptance** | Phần trong Spec mô tả "thế nào là xong" — mức đạt cần thỏa. |
| **Check** | Một mục pass/fail trong Spec. Checker *checks* từng *Check*. |
| **Evidence** | Bằng chứng bắt buộc kèm mỗi Check ✅ (ảnh/video/test/log). Thiếu Evidence = coi như chưa pass. |

## Cơ chế

| Term | Nghĩa |
|---|---|
| **Inbox** | Hàng đợi ưu tiên chỉ gồm thứ đang chờ *bạn* quyết (Spec chờ duyệt, kết quả chờ gật, agent đang hỏi). Board = bản đồ, Inbox = bàn làm việc. |
| **Steer** | Can thiệp agent đang chạy: ⏸ chen một ghi chú rồi cho chạy tiếp (không kill-làm-lại). |
| **Rework** | Vòng làm lại khi Review fail — bật *tại chỗ* trong cột Review, không kéo Task về Plan. |
| **Fast lane** | Đường tắt cho Task vặt (typo, đổi màu): bỏ qua cột Plan, vào thẳng Review. |

---

## Câu test (đọc trôi cả hệ)

> Mỗi **Task** bắt đầu ở **Backlog**. **Planner** soạn **Spec** (mục tiêu + **Acceptance** + các **Check**), bạn duyệt ở **Plan**. **Builder** code để đạt Spec; **Checker** chấm từng Check kèm **Evidence**. Bạn nghiệm thu ở **Review** → **Done**. Fail thì vào **Rework**. Việc gấp & nhỏ đi **Fast lane**. Bất cứ lúc nào bạn cũng **Steer** được agent đang chạy. Việc cần bạn luôn dồn về **Inbox**.

## Quy ước đặt tên

- Danh từ sản phẩm và tên cột: **tiếng Anh** (SpecDeck, Task, Spec, Planner/Builder/Checker, Backlog/Plan/Review/Done).
- Vai agent = chức danh người thật, plain-English — non-dev đọc cũng hiểu.
- Tránh: "Brief" (đã bỏ, dùng **Spec**), "Coder/Reviewer" (dùng **Builder/Checker**), "Ticket".
