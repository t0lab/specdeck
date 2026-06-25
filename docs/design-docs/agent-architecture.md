# Kiến trúc agent: orchestrator Python (LangGraph/DeepAgents), Builder pluggable, Checker độc lập khác-model

**Status:** proposed
**Date:** 2026-06-25
**Deciders:** chủ dự án

## Context

SpecDeck cần chốt *cách xây và điều phối* ba vai agent (Planner / Builder / Checker — xem [spec-contract-model](spec-contract-model.md)). Hướng nghiêng ban đầu: DeepAgents làm orchestrator + Builder = wrap CLI local (claude/codex/gemini) để xài subscription của user. Trước khi viết code, đã research lại tình hình mid-2026 (3 mảng: framework orchestration, harness coding/vibe-coding, pattern + bằng chứng). Bốn forcing fact lật một phần kế hoạch cũ:

1. **Kinh tế "wrap CLI để xài subscription free" chết cho sản phẩm ship.** Anthropic đổi billing 15/6/2026 (programmatic không trừ subscription) + ToS cấm bán lại login claude.ai cho user của bạn. Các tool wrap-CLI-trong-worktree free cũng chết hàng loạt (vibe-kanban sunset 4/2026, Crystal, Terragon). → Khi ship phải dùng API-key auth dù sao; lợi thế lớn nhất của wrap-CLI biến mất.
2. **Single-agent-with-tools là default đúng cho coding.** Cả Cognition ("Don't Build Multi-Agents") lẫn Anthropic (multi-agent research system) đồng thuận: multi-agent kém cho coding vì *shared mutable state* — nhiều agent cùng ghi một artifact thì quyết định ngầm xung đột. Song song chỉ an toàn khi *ghi tách biệt* (các task độc lập).
3. **Checker độc lập khác-model được xác nhận mạnh, có precedent gần-y-hệt.** Phê bình multi-agent KHÔNG chống Checker (Checker chỉ đọc+chấm, không ghi). Khác-model là biện pháp khuyến nghị chống self-preference bias. Anthropic **"Outcomes" (Managed Agents)** = grader riêng, context window riêng, *chỉ thấy output không thấy reasoning* — chính là blueprint cho Checker.
4. **Claude Agent SDK khóa Claude-only** → không thể một mình làm Checker khác-*provider*. Phải dùng framework đa-provider ở tầng orchestrator.

## Decision

**Orchestrator: Python — LangGraph (có thể DeepAgents phía trên), chạy trên một LangGraph Server *riêng*, tách khỏi backend; web frontend TS riêng.** Topology 3 tầng kiểu DeerFlow v2: Next.js → **FastAPI Gateway** (REST + bridge SSE) → **LangGraph Agent Server** (chạy graph, `langgraph.json`, checkpointer). Chi tiết stack: [stack](stack.md). Lý do chọn Python thay vì TS/Mastra: hệ sinh thái agent chín nhất, durability tốt nhất, và native-Builder SDK (Claude Agent SDK, OpenHands SDK) đều mạnh ở Python. DeepAgents map gần 1:1 với Planner/Builder/Checker.

Chi tiết theo vai:

| Vai | Quyết định |
|---|---|
| **Planner** | Node orchestrator; output **Spec có schema** (goal + acceptance + checklist các Check, mỗi Check phát biểu kiểu EARS và *evidence-typed*). Sinh ra **plan gate** — người duyệt trước khi Builder chạy. |
| **Builder** | **Backend cắm-rút sau một "structured event contract"** (`{event stream, status, evidence bundle, branch/worktree ref, structured_output, cost}`). v1: wrap một CLI để validate UX nhanh (`droid exec --output-format json --worktree` sạch nhất, hoặc `claude -p`). Đích: **native SDK** (Claude Agent SDK / OpenHands SDK) cho event stream ổn định. Isolation: git worktree → **container khi scale** (bài học Sculptor). |
| **Checker** | **Khác model, context window riêng, chỉ thấy output + Spec — KHÔNG thấy reasoning của Builder** (pattern Outcomes). Verification **deterministic-first**: test/build/lint exit code → evidence artifact → *held-out checks* → LLM-judge chỉ cho phần chủ quan. Chấm per-Check. Người giữ gate spec/merge cho thay đổi blast-radius lớn. Rework giới hạn ~3 vòng. |

**Durability:** bắt đầu bằng **LangGraph Server + Postgres checkpointer** (resume sau crash, HITL `interrupt()`); leo lên Temporal/Restate nếu nhu cầu fan-out/exactly-once vượt ngưỡng.

**Hai gate tách bạch:** plan gate (*trước*) ≠ evidence gate (*sau*). Comment lên **artifact, không lên diff** (mô hình Antigravity).

**Auth:** API-key cho mọi backend agent (không bán lại subscription login).

## Alternatives considered

- **TS end-to-end (Mastra)** — seriously considered (một ngôn ngữ với web app, suspend/resume native). Rejected lần này: native-Builder SDK mỏng hơn (OpenHands Python-only; Claude Agent SDK TS thì khóa Claude), typed-output yếu hơn, ecosystem trẻ. Revisit nếu team thành TS-only.
- **Python: Pydantic AI + Temporal** — mạnh nhất về typed-output + durability cứng. Rejected làm lớp chính vì Temporal nặng vận hành; nhưng giữ làm *durable substrate* để leo lên sau.
- **Claude Agent SDK làm cả orchestrator** — rejected: khóa Claude-only → không làm được Checker khác-provider (yêu cầu cốt lõi).
- **Wrap-CLI làm orchestrator (mô hình vibe-kanban)** — rejected: kinh tế chết cho sản phẩm ship, parsing fragility (vibe-kanban phải nuôi một adapter/CLI + lớp normalize log), tool cùng mô hình đang chết. Vẫn dùng wrap-CLI cho *Builder v1* để validate, không làm xương sống.
- **Xé một feature ra nhiều agent song song (frontend/backend/test)** — rejected: context fragmentation; single-agent default cho coding. Song song chỉ ACROSS card độc lập.
- **Checker tự chấm / cùng model với Builder** — rejected: self-preference bias (~10%) + "LLMs cannot self-correct reasoning" (chấm reasoning của chính mình flat-to-negative).
- **Bare worktree làm isolation cuối cùng** — rejected ở mức scale: worktree chia chung host/env; dùng container khi nhiều Builder song song. Lưu ý infra-collision (port/DB/Docker) là "Layer 3" chưa ai giải sẵn.

## Consequences

**Better:**
- Provider-mixing là one-liner → Checker chạy model khác Builder (đúng yêu cầu độc lập + chống self-preference).
- Durability + HITL native → task async dài, parallel, resume sau crash; spec/merge gate là `interrupt()`.
- Structured output map thẳng vào Spec/checklist/Evidence.
- Parallel across-card an toàn theo evidence SOTA; verification evidence-gated chống reward-hacking.
- Builder cắm-rút: đổi engine (wrap-CLI → native SDK) không đụng tầng Kanban/Checker.

**Worse:**
- **Hai ngôn ngữ** (Python backend + TS frontend) → nhiều ops hơn, một ranh giới service phải định nghĩa.
- DeepAgents/agent-SDK còn pre-1.0 churn → phải pin version.
- **Isolation là việc của ta** — không framework nào cho worktree/container/infra-collision sẵn; phải tự build.
- API-key billing → trả token thật, không có "free dưới subscription".

**Must now be true:**
- Checker là **model khác**, context **chỉ-thấy-output** (không thấy reasoning Builder).
- Verification **deterministic-first + evidence-gated**, không bao giờ chấm self-report; có held-out checks.
- Parallel **chỉ across card độc lập**, không xé một feature ra nhiều writer.
- Builder nằm sau **structured event contract** ổn định (swap engine không vỡ tầng trên).
- Mọi backend agent dùng **API-key auth**.

## Revisit if

- Team chuyển sang TS-only → cân nhắc Mastra (một ngôn ngữ).
- Native-Builder SDK đủ chín để bỏ luôn bước wrap-CLI v1.
- Nhu cầu durability/fan-out vượt LangGraph Server → leo lên Temporal/Restate.
- Một thế hệ model mới khử được self-preference bias đủ để nới yêu cầu "Checker khác model".

## Tham chiếu

- Concept tổng: [docs/DESIGN.md](../DESIGN.md) · thuật ngữ: [docs/glossary.md](../glossary.md) · nguồn ngoài: [docs/references.md](../references.md)
- ADR liên quan: [spec-contract-model](spec-contract-model.md), [board-columns](board-columns.md)
- Bằng chứng chính: Cognition — [Don't Build Multi-Agents](https://cognition.com/blog/dont-build-multi-agents) · Anthropic — [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents), [Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), [Managed Agents / Outcomes](https://platform.claude.com/docs/en/managed-agents/define-outcomes) · [LLMs Cannot Self-Correct Reasoning Yet](https://arxiv.org/abs/2310.01798) · [Self-Preference Bias](https://arxiv.org/abs/2410.21819) · vibe-kanban [shutdown](https://www.vibekanban.com/blog/shutdown) · Imbue Sculptor [containers vs worktrees](https://imbue.com/blog/containers)
