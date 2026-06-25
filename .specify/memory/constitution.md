<!--
SYNC IMPACT REPORT
- Version change: (template, chưa phê chuẩn) → 1.0.0
- Loại bump: MAJOR (phê chuẩn lần đầu — định nghĩa 6 nguyên tắc + ràng buộc + governance)
- Principles đã định nghĩa:
  I. Review ở tầng ý định, không phải diff
  II. Spec là hợp đồng + hai tầng context
  III. Checker độc lập, verification evidence-gated
  IV. Single-agent mỗi đơn vị; song song chỉ across card
  V. Spec-driven, hard gate
  VI. TDD + Conventional Commits + Docs-as-code
- Sections thêm: "Ràng buộc Stack & Kiến trúc", "Bảo mật & Cô lập", "Governance"
- Sections bỏ: không
- Templates đã rà:
  ✅ plan-template.md — điền Constitution Check gates cụ thể theo 6 nguyên tắc
  ✅ spec-template.md — không cần đổi (không tham chiếu constitution)
  ✅ tasks-template.md — không cần đổi (không tham chiếu constitution)
- Follow-up TODO: không
-->

# SpecDeck Constitution

> Đây là **Project Context** tầng cao nhất của SpecDeck (xem [docs/DESIGN.md](../../docs/DESIGN.md) §Hai tầng). Mọi **Task Spec** *kế thừa* file này; Planner chỉ cần ghi phần *khác biệt* của từng việc. Danh từ sản phẩm/cột giữ tiếng Anh.

## Core Principles

### I. Review ở tầng ý định, không phải diff

Con người duyệt ở tầng **Spec** và **Check**, KHÔNG ở tầng dòng-diff. Non-dev KHÔNG BAO GIỜ bị buộc phải đọc code để nghiệm thu. Mỗi **Check** được chấm pass PHẢI kèm **Evidence** (ảnh/video/test/log); thiếu Evidence = coi như chưa pass.

*Lý do:* nút thắt thật là review, không phải viết code. Nếu review-spec không rẻ hơn review-diff thì cả sản phẩm vô nghĩa (phê bình Fowler). Evidence là thứ tạo niềm tin thay cho việc đọc code.

### II. Spec là hợp đồng + hai tầng context

Mỗi **Task** mang một **Spec** (mục tiêu + **Acceptance** + danh sách **Check**), dùng chung cho cả bốn bên Planner/Builder/Checker/người và **đóng băng khi sang Done**. Context chia hai tầng: **Project Context** (constitution này, kế thừa cho mọi Spec) ≠ **Task Spec** (từng việc). Spec PHẢI machine-readable đủ để Checker parse từng Check; HTML/markdown đẹp là việc *render của UI*, không phải định dạng nguồn.

*Lý do:* một artifact hợp đồng chung khử mơ hồ giữa các bên; tách hai tầng để khử lặp và giữ đúng độ-cao khi duyệt.

### III. Checker độc lập, verification evidence-gated

**Checker** PHẢI là **model khác** với Builder, chạy trong **context riêng chỉ thấy output + Spec** — KHÔNG thấy reasoning/trace của Builder. Thứ tự verify (defense-in-depth): **deterministic trước** (test/build/lint exit code) → **evidence artifact** → **held-out checks** → LLM-judge chỉ cho phần chủ quan. CẤM tự-chấm (Builder chấm chính mình) và CẤM chấm dựa trên self-report thay vì bằng chứng thực thi.

*Lý do:* self-preference bias + "LLM không tự sửa reasoning của chính mình"; agent gian lận đúng những test nó nhìn thấy. Checker đọc-thôi không phải co-writer nên KHÔNG dính phê bình multi-agent.

### IV. Single-agent mỗi đơn vị; song song chỉ across card

Một **Builder** cho một feature, tuyến tính. Nhiều Builder song song CHỈ trên các card độc lập, mỗi card một **git worktree** cô lập. CẤM xé một feature ra nhiều agent cùng ghi vào artifact chung.

*Lý do:* coding là shared mutable state — nhiều writer thì quyết định ngầm xung đột (đồng thuận Cognition + Anthropic). Song song chỉ an toàn khi ghi tách biệt.

### V. Spec-driven, hard gate

KHÔNG sửa source trước khi `spec.md` + `plan.md` tồn tại (hoặc được cập nhật) cho thay đổi đó VÀ người đã duyệt (luồng Spec Kit: constitution → spec → plan → tasks → implement). Thay đổi cơ học đủ nhỏ để bỏ qua spec (**Fast lane**) thì PHẢI nói rõ là đang bỏ qua.

*Lý do:* control rẻ nhất ở cổng Plan — nắn hướng trước khi code, không sửa sau.

### VI. TDD + Conventional Commits + Docs-as-code

Hành vi không tầm thường: **test fail trước → code → pass → commit**. Commit theo **Conventional Commits**. Repo là **system of record**: quyết định kiến trúc đáng tranh luận → **ADR** trong `docs/design-docs/` (Context/Decision/Alternatives/Consequences); plan/task sống trong `.specify/specs/NNN-<name>/`. Sau refactor, doc lệch code là lỗi nghiêm trọng — phải quét đến khi chỉ còn hit cố ý.

*Lý do:* không có test thì "xong" là cảm tính; không có ADR thì lý-do quyết định mất; doc lệch khiến agent tự tin làm sai.

## Ràng buộc Stack & Kiến trúc

Stack là **bất biến** trừ khi sửa qua ADR + bump constitution (xem [ADR: stack](../../docs/design-docs/stack.md), [agent-architecture](../../docs/design-docs/agent-architecture.md)):

- **Monorepo**, **self-host** tất cả trên một server, expose qua **Cloudflare Tunnel**. Mọi service long-running, container-hóa — KHÔNG serverless.
- **Topology 3 tầng kiểu DeerFlow v2:** Next.js (App Router) + Tailwind + shadcn/ui (UI design qua skill `design-taste-frontend`) → **FastAPI Gateway** (REST + bridge SSE) → **LangGraph Agent Server *riêng*** (`langgraph.json`, async checkpointer Postgres). Gateway gọi Agent Server qua LangGraph SDK; KHÔNG chạy graph in-process.
- **Data/realtime:** Postgres (app data + checkpoint) + **Redis pub/sub**; event agent đi **Redis → SSE** ở Gateway; lệnh (duyệt/gật/steer) đi **REST POST**.
- **Builder** PHẢI nằm sau một **"structured event contract"** (`{event stream, status, evidence bundle, branch/worktree ref, structured_output, cost}`) để swap engine (wrap-CLI v1 → native SDK) mà không vỡ Gateway/Checker.
- Deps: `uv` (Python), `pnpm` (Node).

## Bảo mật & Cô lập

- **API-key auth** cho mọi agent provider. Secret/API-key CHỈ ở backend/Agent Server, KHÔNG lộ ra Next.js client.
- Coi output từ CLI/web/agent là **untrusted** cho tới khi được kiểm.
- Cô lập mỗi Builder: **git worktree → container khi scale**. PHẢI xử lý infra-collision (port/DB/Docker/cache) — worktree một mình KHÔNG đủ.
- Thay đổi chạm auth/secret/shell/file/network boundary PHẢI qua security review trước khi tuyên bố an toàn.

## Governance

- Constitution này **thắng** mọi thực hành khác. Khi xung đột, constitution đúng.
- **Sửa đổi** = cập nhật file + bump version (semver: MAJOR bỏ/định-nghĩa-lại nguyên tắc; MINOR thêm nguyên tắc/section; PATCH làm rõ câu chữ) + ghi lý do trong Sync Impact Report.
- Mọi PR/review PHẢI kiểm tra tuân thủ các nguyên tắc trên; vi phạm phải được biện minh trong mục Complexity Tracking của `plan.md` hoặc bị từ chối.
- Hướng dẫn runtime cho agent: `CLAUDE.md` + `.claude/rules/` + skill `spec-driven`/`docs-as-code`.

**Version**: 1.0.0 | **Ratified**: 2026-06-25 | **Last Amended**: 2026-06-25
