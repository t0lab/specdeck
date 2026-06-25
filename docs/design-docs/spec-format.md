# Spec: nguồn structured, UI render, Evidence mới được agent sinh HTML

**Status:** proposed
**Date:** 2026-06-25
**Deciders:** chủ dự án

## Context

Spec phải được đọc bởi *hai loại độc giả*: con người (gồm non-dev) và agent (Checker phải parse từng **Check** để chấm). Có một thảo luận nổi bật (Claude Code team, 5/2026 — xem [references](../references.md) §HTML vs Markdown): *markdown cho vòng lặp agent, HTML cho artifact cuối con người đọc* (dày thông tin, có tab/diagram). Câu hỏi: Spec lưu/hiển thị thế nào — agent sinh HTML, hay nguồn cố định convert sang HTML bằng code? Ràng buộc sống còn: phê bình Fowler ("thà review code hơn đống markdown") → review-spec PHẢI rẻ hơn review-diff.

## Decision

Tách **ba tầng**:

| Tầng | Định dạng | Ai tạo |
|---|---|---|
| **Nguồn Spec** | **Structured machine-readable** (markdown/JSON có schema): goal + acceptance + checklist các Check (evidence-typed, kiểu EARS). Là *chân lý*, đóng băng khi Done. | Planner (output có schema) |
| **Tầng đọc** | UI SpecDeck **render bằng code** thành tab: *Spec ∣ Checks + Evidence ∣ Diff*. Nhất quán mọi Task. | Code FE (renderer), không phải agent |
| **Evidence** | Chỗ **duy nhất** agent được sinh **HTML tự do** (walkthrough, ảnh chú thích, recording), nhúng qua **iframe sandbox**. | Builder/Checker |

Agent **KHÔNG** sinh HTML cho Spec. Phần tự-do của Spec (giải thích, diagram, so sánh phương án) nằm trong các block markdown *bên trong* field có schema → render bằng pipeline md→html chuẩn (kèm Mermaid).

## Alternatives considered

- **Agent sinh HTML cho Spec** — rejected: mỗi lần render là một lần LLM có thể bóp méo (drift người-duyệt ≠ agent-đọc), tốn token/độ-trễ, layout mỗi Task một kiểu (khó quét), bề mặt XSS/injection.
- **Markdown thô không render** — rejected: review không rẻ hơn diff → vỡ luận điểm Fowler, người sẽ bỏ qua tầng trừu tượng.
- **Spec-as-source (Tessl)** — rejected: chưa ai làm tin cậy; coi là hướng tương lai.

## Consequences

**Better:**
- Người duyệt thấy *chính xác* cái nằm trong nguồn (không qua diễn dịch LLM) → trung thực với hợp đồng.
- Render code = tức thì, miễn phí, nhất quán 50 Task như một → quét nhanh, review rẻ (đòn chống Fowler).
- Checker parse thẳng từng Check từ nguồn có schema.
- An toàn: renderer sanitize được; HTML agent-sinh cô lập trong iframe.

**Worse:**
- Phải xây *renderer + schema* (không "để agent lo").
- Sửa schema Spec = việc versioning, cần cẩn thận.

**Must now be true:**
- Nguồn Spec là **structured + có schema**; Checker parse được từng Check.
- Tầng đọc **render bằng code**, không để agent sinh HTML cho Spec.
- Evidence HTML do agent sinh PHẢI nhúng qua **iframe sandbox**.

## Revisit if

- Spec-as-source chín đủ để tin cậy (regenerate code 2 chiều).
- Cần layout linh hoạt per-Task vượt khả năng renderer cố định.

## Tham chiếu

- [docs/references.md](../references.md) §HTML vs Markdown (Thariq/Claude team, Simon Willison, tradeoff).
- [constitution](../../.specify/memory/constitution.md) Principle II (Spec machine-readable; HTML đẹp là render của UI).
- [ADR: spec-contract-model](spec-contract-model.md).
