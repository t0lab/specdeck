# SpecDeck — Design

> Một UI/UX cho **vibe coding bất đồng bộ**: bạn điều phối nhiều coding agent qua một bảng Kanban, nhưng duyệt ở tầng *Spec* và *Check* thay vì đọc từng dòng diff.
> **SpecDeck** = spec + deck: một *control deck* (bàn điều khiển) để điều phối agent; mỗi Task chạy theo một Spec.

**Status:** concept / brainstorm · **Last updated:** 2026-06-08

Thuật ngữ in đậm trong doc này được định nghĩa ở [docs/glossary.md](glossary.md).

---

## Vấn đề

AI agent biến coding từ đồng bộ thành bất đồng bộ. Khi một agent chạy 2–5 phút mỗi Task, và khi chạy nhiều agent song song, nút thắt chuyển từ *viết code* sang **planning + review**:

- **Terminal agents** mạnh nhưng không có giao diện để *nhìn* — khó nắm nhiều luồng, khó cho người không rành terminal.
- **IDE agents** tốt ở cấp độ dòng code nhưng bó vào mô hình "1 dev – 1 file – đồng bộ", khó scale lên nhiều agent.
- **Kanban hiện có** (vibe-kanban, v.v.) quản lý được *trạng thái* nhưng không giải quyết bottleneck thật: **review**. Người vẫn phải đọc 10 cái PR.

→ Mục tiêu: một UI giúp con người ngồi ở tầng *quyết định* (duyệt kế hoạch, duyệt kết quả), không phải tầng *diff*.

## Đối tượng

Cả **dev** và **non-dev**. Giao diện không quá kỹ thuật:
- **Dev** không phải ngồi chờ agent — giao việc, đi làm việc khác, quay lại duyệt nhanh.
- **Non-dev** duyệt ở tầng ngôn ngữ tự nhiên + **Evidence** (ảnh/video/test), không bao giờ phải nhìn code.

## Ý tưởng cốt lõi: Spec là hợp đồng chung

Mỗi **Task** sinh ra một **Spec** (mục tiêu + **Acceptance** + danh sách **Check**). Artifact này là hợp đồng dùng chung cho 4 bên:

| Bên | Spec là gì với họ |
|---|---|
| **Planner** | bản kế hoạch nó tự đề xuất |
| **Builder** | mục tiêu + bài test phải đạt |
| **Checker** | thước đo (rubric) để chấm ✅/❌ |
| **Con người** | thứ cần duyệt (rẻ) — thay vì đọc code (đắt) |

Đây là lời giải cho bottleneck review: **review ở tầng ý định, không phải tầng diff.** Xem [ADR: spec-contract-model](design-docs/spec-contract-model.md).

### Hai tầng: Project Context vs Task Spec

Spec **ứng với từng Task** — không phải một tài liệu sống cập nhật theo project. Cái sống theo project là một tầng riêng đứng *trên* mọi Task:

| Tầng | Là gì | Vòng đời |
|---|---|---|
| **Project Context** | Luật chung: stack, convention, ràng buộc, ranh giới ("đừng đụng module X") | sống theo project, cập nhật dần |
| **Task Spec** | Mục tiêu + Acceptance + Check của *một* việc | theo Task, đóng băng khi Done |

Planner **kế thừa Project Context** khi sinh mỗi Task Spec, nên Spec chỉ cần nói phần *khác biệt* của việc đó. Lý do tách:

- **Khử lặp** — convention viết một lần, không nhắc lại trong từng Spec → Spec gọn → review rẻ (đúng mục tiêu sống còn).
- **Đúng độ-cao** — sửa luật chung = sửa Project Context (hiếm); duyệt một việc = duyệt Task Spec (thường xuyên). Không trộn để mỗi lần duyệt Task khỏi phải đọc lại luật chung.

Tương đương ngoài: Project Context ≈ `constitution` (Spec Kit) / steering files (Kiro); Task Spec ≈ `spec.md` per-feature. Xem [docs/references.md](references.md).

## Vai trò agent

- **Planner** — nhận một ý tưởng, sinh **Spec** + **Acceptance** + các **Check**. Là điểm con người *nắn hướng trước khi code* (control rẻ nhất).
- **Builder** — nhận Spec đã duyệt, viết code để đạt các Check. Có thể nhiều Builder song song (mỗi người một git worktree, không đụng nhau).
- **Checker** — **độc lập với Builder** (khác context, lý tưởng là khác model), chấm từng Check kèm **Evidence** *bắt buộc*. Fail → kích hoạt **Rework**.

## Board: 4 cột

Cột tiếng Anh, theo quy ước Kanban phổ biến. Chỉ những trạng thái mà **con người là người bị chặn** mới thành cột; trạng thái "agent đang chạy" là **badge trên Task**, không phải cột. Xem [ADR: board-columns](design-docs/board-columns.md).

| # | Cột | Bạn duyệt gì | Chuyển cột khi |
|---|---|---|---|
| 1 | **Backlog** | — | ý tưởng, chưa có Spec |
| 2 | **Plan** 🟡 | *cái sắp làm* — Spec + Acceptance | bạn duyệt Spec → sang Review (in-flight) |
| 3 | **Review** 🔴 | *cái đã làm* — Checks đã chấm (+ diff cho dev) | bạn gật → tạo PR → (agent merge hoặc bạn tự merge) → Done |
| 4 | **Done** ✅ | — | đã merge |

## Vòng đời một Task

```
Backlog ──(Planner soạn Spec, badge ⏳)──▶ Plan 🟡 ──(BẠN duyệt)──▶ Review
                                                                     │ ⏳ coding / chấm Checks
                                                                     ▼
                                                            Review 🔴 (sẵn sàng)
                                                              │            │
                                                  ❌ Rework   │            │ ✅ BẠN gật
                                                  (bật tại chỗ)            ▼
                                                              └──────────▶ Done
```

- **Planner soạn Spec**: từ Backlog, mở **side panel Q&A** — Planner hỏi–đáp với bạn để sinh Spec sát ý, bạn có thể yêu cầu sửa Spec; badge ⏳ "đang soạn Spec" → khi bạn gật, Task nhảy sang Plan.
- **Coding/chấm**: sau khi duyệt Spec, Task vào Review với badge ⏳, khi Checker chấm xong mới chuyển 🔴 "đến lượt bạn".
- **Rework**: Review ❌ → bật ngược tại chỗ về trạng thái coding (không kéo về Plan). Sau **3–5 vòng fail liên tục**, agent escalate — đẩy câu hỏi cho bạn qua cửa sổ Q&A thay vì lặp vô hạn.
- **Fast lane**: Task vặt (typo, đổi màu) bỏ qua cổng Plan, vào thẳng Review.

## Màn hình chính

1. **Board** — overview 4 cột. Để *nắm* tình hình.
2. **Review checklist** (màn sống/chết) — **hai tầng xem trên cùng một Task**:
   - *High-level* (mặc định, cho mọi người): từng **Check** pass/fail kèm **Evidence** (ảnh/video/test/log), đọc bằng tiếng người. Mỗi ✅ **bắt buộc có Evidence**.
   - *Code diff* (cho dev): mở rộng để xem diff thật, click thẳng Check ❌.
   Khi thấy ổn, bạn gật → agent **tạo PR**. Merge theo một trong hai cách: **nhờ agent merge**, hoặc **tự kiểm rồi merge tay** (cho CI/review bên ngoài chen vào). Merge xong → Done.
3. **Inbox** — hàng đợi ưu tiên *chỉ* gồm thứ đang cần bạn: Spec chờ duyệt, kết quả chờ gật, agent đang hỏi/kẹt. Board = bản đồ, Inbox = bàn làm việc.

## Nguyên tắc thiết kế

- **Cột = nơi con người bị chặn.** Agent chạy = badge, không phải cột.
- **Evidence là bắt buộc.** Không Evidence = coi như chưa pass. Đây là thứ tạo niềm tin.
- **Checker độc lập với Builder.** Nếu chung não thì mù chung điểm mù → ✅ giả.
- **Control rẻ nhất ở cổng Plan.** Nắn hướng trước khi code, không sửa sau.
- **Steer:** mỗi agent đang chạy có nút ⏸ để chen ghi chú rồi chạy tiếp.

## Non-goals (chưa làm trong giai đoạn này)

- Không thay thế IDE/terminal cho việc sửa code chi tiết bằng tay.
- Chưa làm collaboration nhiều người (giai đoạn đầu nhắm 1 người điều phối).
- Chưa làm canvas/node-based — để mở cho tương lai, không phải bây giờ.

## Quyết định đã chốt

1. **Chi phí token → hai luồng.** Task vặt (đổi text, logo, màu) đi **Fast lane**: bỏ qua cổng Plan + Planner/Checker pipeline, vào thẳng Review. Chỉ Task lớn mới chạy full-pipeline (Planner + Builder + Checker).
2. **Thời điểm review → người tự chọn.** Người dùng xem được **realtime** (theo dõi agent chạy) hoặc **đợi khi xong** (Checker chấm hết Checks mới vào duyệt). Cả hai chế độ cùng tồn tại; người chọn theo Task.
3. **Khởi xướng Spec → pingpong qua side panel.** User tạo Task ở **Backlog**. Khi muốn đẩy sang Plan, mở một **side panel Q&A**: Planner hỏi–đáp để sinh Spec sát ý nhất, user có thể yêu cầu Planner sửa Spec trước khi duyệt. Chỉ khi user gật Spec, Task mới chuyển sang **Review** (in-flight, agent bắt đầu chạy).
4. **Rework escalate sau 3–5 vòng fail.** Khi Rework fail liên tục 3–5 lần, agent đẩy câu hỏi cho người qua **cửa sổ Q&A** thay vì lặp vô hạn.
5. **Stack → web app.** Chạy trên web (chi tiết framework/runner chưa chốt).

## Còn mở

- **Ngưỡng spot-check tay:** Checker chấm ✅ — bao lâu/bao nhiêu Task thì người vẫn nên spot-check code tay một lần để giữ niềm tin?
- *(Stack đã chốt)* — Next.js+shadcn (FE) · FastAPI Gateway + LangGraph Agent Server riêng (BE) · Postgres+Redis · SSE pub/sub · self-host qua Cloudflare Tunnel. Xem [ADR: stack](design-docs/stack.md) và [ADR: agent-architecture](design-docs/agent-architecture.md).

## Tham chiếu

- [docs/glossary.md](glossary.md) — thuật ngữ chuẩn.
- [docs/references.md](references.md) — nguồn ngoài (vibe-kanban, Spec Kit, Kiro, SDD, intent-first) kèm vì-sao-liên-quan.
- [ADR: spec-contract-model](design-docs/spec-contract-model.md) — vì sao Spec làm hợp đồng + chia vai Planner/Builder/Checker.
- [ADR: board-columns](design-docs/board-columns.md) — vì sao 4 cột theo cổng-người.
- [ADR: agent-architecture](design-docs/agent-architecture.md) — orchestrator Python (LangGraph/DeepAgents), Builder pluggable (wrap-CLI v1 → native SDK), Checker độc lập khác-model + evidence-gated.
- [ADR: stack](design-docs/stack.md) — Next.js+shadcn / FastAPI Gateway + LangGraph Agent Server riêng / Postgres+Redis / SSE pub/sub / self-host qua Cloudflare Tunnel (topology kiểu DeerFlow v2).
- [ADR: spec-format](design-docs/spec-format.md) — Spec nguồn structured (Checker parse được), UI render tab bằng code, Evidence mới được agent sinh HTML.
- [ADR: review-merge-flow](design-docs/review-merge-flow.md) — review hai tầng (Check+Evidence / diff) → tạo PR → agent-merge hoặc tự merge.
