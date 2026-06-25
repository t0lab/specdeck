# Tham chiếu ngoài

> Nguồn ngoài để tham khảo khi thiết kế SpecDeck. Mỗi mục kèm *vì sao liên quan*. Đây là pointer, không phải chân lý — đọc lại với con mắt phản biện (xem ghi chú "đã chín vs tham vọng").
>
> **Last updated:** 2026-06-10

## Tool đối chiếu trực tiếp

### vibe-kanban (Bloop AI)
Kanban điều phối nhiều coding agent song song. Đối thủ gần nhất về *hình dạng*, nhưng review = **đọc diff kiểu PR**, không có tầng spec/check/evidence. Bản OSS đang *sunset*, rebrand sang hướng "Plan/Prompt/Review".

- Repo: <https://github.com/BloopAI/vibe-kanban>
- `TaskStatus` enum (Todo/InProgress/InReview/Done/Cancelled): `crates/db/src/models/task.rs`
- `ActionType` (gồm `plan_presentation`, `ask_user_question`): `shared/types.ts`
- Kiến trúc (executor abstraction, git worktree, PR/merge): <https://deepwiki.com/BloopAI/vibe-kanban>
- Review/diff flow: <https://vibe-kb.com/docs/code-review/>
- Định vị/sunset: <https://www.vibekanban.com/>

**Học được:** git worktree cho song song · executor abstraction (đừng lock 1 model) · multi-attempt so sánh · follow-up prompt giữ context · tạo-PR-hoặc-merge-thẳng.
**Khoảng trống ta lấp:** không cổng spec trước code · review ở tầng dòng-code, không tầng ý định · không Checker độc lập.

## Spec-Driven Development (SDD) — đã chín, đang ship

### GitHub Spec Kit
OSS, mindshare lớn nhất. Workflow `/constitution → /specify → /plan → /tasks → /implement`; **tách spec (cái gì, tech-agnostic) khỏi plan (làm sao)** — pattern nên copy.

- Repo: <https://github.com/github/spec-kit>
- Docs: <https://github.github.com/spec-kit/>
- Giới thiệu: <https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/>

### Amazon Kiro
AI IDE với spec mode 3 pha: Requirements → Design → Tasks. Requirements viết bằng **EARS** ("WHEN [đk] THE SYSTEM SHALL [hành vi]") → acceptance *test được*. Mô hình Check của SpecDeck nên học cú pháp này.

- Docs spec: <https://kiro.dev/docs/specs/feature-specs/>

### Tessl (Guy Podjarny / Snyk founder)
Tham vọng nhất: **spec-as-source**, code regenerate, sync 2 chiều. Cảnh báo: chưa ai làm được tin cậy — coi là hướng tương lai, không build chắc tay.

- Blog: <https://tessl.io/blog/tessl-launches-spec-driven-framework-and-registry/>
- Docs: <https://docs.tessl.io/use/spec-driven-development-with-tessl>

### Phê bình SDD (đọc kỹ — đây là rủi ro sống còn của SpecDeck)
Martin Fowler so sánh 3 tool, đòn chí mạng: *"Tôi thà review code còn hơn đống markdown."* → SpecDeck **phải** làm review-spec rẻ hơn review-diff, nếu không người sẽ bỏ qua tầng trừu tượng.

- <https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html>
- Khảo sát học thuật (phổ độ-chặt Spec-First/Anchored/as-Source, "spec declares intent, code realizes it"): <https://arxiv.org/html/2602.00180v1>

## Định dạng Spec cho người đọc: HTML vs Markdown

Thảo luận từ Claude Code team (5/2026) do **Thariq Shihipar** (eng lead Claude Code) khởi xướng: *markdown cho vòng lặp agent, HTML cho artifact cuối mà con người đọc* — dày thông tin hơn, có tab/diagram/interactive, share bằng link. Use case anh ấy nêu (plan so sánh nhiều phương án, review packet với diff chú thích inline + finding tô màu theo severity) trùng thẳng với màn Review của SpecDeck.

- Bài gốc (claude.com blog): <https://claude.com/blog/using-claude-code-the-unreasonable-effectiveness-of-html>
- Phỏng vấn Lenny's Newsletter: <https://www.lennysnewsletter.com/p/html-is-the-new-markdown-how-anthropic>
- Simon Willison đồng tình (lý do cũ chuộng markdown — giới hạn token — đã hết): <https://simonwillison.net/2026/May/8/unreasonable-effectiveness-of-html/>
- Phản biện/tradeoff (token ×4–8, gen time ×2–4, diff nhiễu, khó sửa tay): <https://theaiarchitects.com/blog/markdown-vs-html-claude-code>

**Học được:** HTML thắng ở *tầng đọc* (deliverable cho người), markdown/structured thắng ở *tầng nguồn* (diff sạch, agent chain, sống trong git). Pattern đồng thuận: **nguồn structured là chân lý, HTML render theo nhu cầu** — đừng để agent sinh HTML làm source of truth.
**Liên hệ SpecDeck:** Spec là hợp đồng 4 bên → bắt buộc machine-readable (Checker phải parse được) → nguồn để structured; tầng HTML/tab là việc của UI SpecDeck (và của Evidence artifact), không phải định dạng lưu Spec. Lưu ý: Spec Kit *không* đề xuất tab — nó tách 3 file `spec.md`/`plan.md`/`tasks.md`; ý "tab" là map cách-tách-file đó lên UI.

## Intent-first / "IDSD" — ⚠️ chưa phải phương pháp chuẩn

"IDSD" **không map tới một framework công nhận nào** — không gian khái niệm rải rác, các nguồn bất đồng về *ai giữ chân lý* (intent? spec? code?). Coi là option tương lai (tầng INTENT trên SPEC), không build chắc tay.

- **Microsoft Research — Lahiri, "Intent Formalization"** (nguồn nghiêm túc duy nhất; "intent formalization gap"): <https://arxiv.org/pdf/2603.17150>
- Massimo Re Ferrè — intent ⊃ spec, "specs, intent, and the source of truth": <https://it20.info/2025/12/specs-intent-and-the-source-of-truth/>
- Jason Stillwell — "maintain intent not code" (intent là chân lý): <https://jason-stillwell.com/blog/2026/03/10/intent-driven-development/>
- Keyhole Software — *phản đề*: code vẫn là chân lý, doc viết sau: <https://keyholesoftware.com/intent-driven-development-build-first-documentation/>
- intent-driven.dev (Hari Krishnan) — "Intent Harness", context engineering: <https://intent-driven.dev/>
