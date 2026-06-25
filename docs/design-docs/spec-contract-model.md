# Spec làm hợp đồng chung; agent chia vai Planner / Builder / Checker

**Status:** proposed
**Date:** 2026-06-08
**Deciders:** chủ dự án

## Context

Vibe coding với AI agent biến công việc thành bất đồng bộ và song song. Khi nhiều agent cùng chạy, nút thắt không còn là tốc độ viết code mà là **review**: con người phải xác minh từng kết quả. Các công cụ hiện tại (chatbot tuyến tính, kanban quản-lý-trạng-thái như vibe-kanban) bắt người đọc từng diff/PR — review không scale theo số agent, và người không rành code bị loại khỏi vòng lặp. Cần một mô hình mà *cùng một artifact* vừa định hướng agent vừa giúp con người duyệt nhanh, ở tầng ý định.

(Thuật ngữ: xem [docs/glossary.md](../glossary.md).)

## Decision

Mỗi **Task** sinh một **Spec** (mục tiêu + **Acceptance** + danh sách **Check**) làm **hợp đồng dùng chung**. Pipeline 3 vai:

- **Planner** sinh Spec từ ý tưởng (điểm con người nắn hướng *trước* khi code).
- **Builder** (một hoặc nhiều, mỗi người một git worktree) viết code để đạt các Check.
- **Checker** — *độc lập với Builder* — chấm từng Check ✅/❌ kèm **Evidence** bắt buộc (ảnh/video/test/log). Fail → kích hoạt **Rework**.

Con người duyệt ở hai điểm: duyệt *kế hoạch* (Spec) và duyệt *kết quả* (Checks đã chấm). Không đọc diff trừ khi muốn soi điểm đỏ.

## Alternatives considered

- **Single-agent chat (kiểu ChatGPT/Cursor)** — rejected. Tuyến tính, mất overview, không quản lý được nhiều luồng song song — chính cái mô hình này muốn thoát.
- **Flat pool agent không phân vai** — rejected. Không có Spec làm mục tiêu → Builder trôi dạt, Checker không có rubric, con người vẫn phải đọc diff.
- **Review dựa trên diff (PR review truyền thống)** — rejected làm *giao diện chính*. Không scale theo số agent và loại non-dev khỏi vòng lặp. Vẫn giữ làm đường drill-down khi cần soi.
- **Checker dùng chung agent/context với Builder** — rejected. Chung não → mù chung điểm mù → sinh ✅ giả.

## Consequences

**Better:**
- Review chuyển từ "đọc hết mọi thứ" → "quét Checks + soi điểm đỏ" — scale theo số agent.
- Non-dev tham gia được: duyệt Spec + Evidence bằng ngôn ngữ tự nhiên.
- Builder có mục tiêu rõ + tự test → chất lượng code tăng.
- Control rẻ: nắn hướng ở cổng Plan trước khi tốn token code.

**Worse:**
- Tốn token: Planner + (nhiều) Builder + Checker cho mỗi Task.
- Overhead viết Spec cho Task nhỏ → cần Fast lane để không giết trải nghiệm.
- Chất lượng phụ thuộc nặng vào chất lượng Spec/Checks do Planner sinh.

**Must now be true:**
- Checker **không** dùng chung context/agent với Builder của cùng Task đó.
- Mỗi Check ✅ phải đính kèm Evidence; không Evidence = chưa pass.
- Mọi Task (trừ Fast lane) phải có Spec đã-duyệt trước khi Builder bắt đầu.
- Mỗi Builder chạy trong git worktree riêng để không xung đột file.

## Revisit if

- Token cost của pipeline 3 vai vượt giá trị review tiết kiệm được trên đa số Task.
- Model đủ tin cậy để chạy unsupervised, khiến cổng duyệt của con người thành thừa.
