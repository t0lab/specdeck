# Phase 1 — Data Model: 002-web-mock

Mock-only: đây là hình dạng **dữ liệu tĩnh trong `web/src/mock/`**, không phải schema DB. Mỗi `SpecCard` mirror đúng một Spec Kit feature folder (spec-template + tasks-template) để render layer dùng lại được cho Spec thật về sau. Types sống ở `mock/types.ts`; dữ liệu ở `mock/specs.ts`.

## Enums / unions (đồng bộ component đã có)

- `BoardColumn = "backlog" | "plan" | "review" | "done"` — đã định nghĩa ở `components/status/column-tag.tsx` (tái dùng, **không** định nghĩa lại).
- `CheckState = "pass" | "fail" | "pending" | "running"` — đã định nghĩa ở `components/status/check-badge.tsx` (tái dùng).
- `Priority = "P1" | "P2" | "P3"`
- `CheckKind = "deterministic" | "evidence" | "held-out" | "judge"` — thứ tự verify (FR-023).
- `EvidenceType = "test" | "log" | "image" | "video" | "html"`
- `AgentRole = "planner" | "builder" | "checker"`
- `DiffStatus = "added" | "modified" | "deleted"`
- `ReqLevel = "MUST" | "SHOULD"`

## Entities

### SpecCard (gốc — 1 card = 1 feature folder)
| Field | Type | Ghi chú |
|---|---|---|
| `id` | `string` | mã Spec hiển thị (vd `SPEC-014`); **ổn định**, làm route param `/board/[spec]` |
| `column` | `BoardColumn` | cột hiện tại |
| `title` | `string` | tiêu đề |
| `fastlane?` | `boolean` | true → badge Fast lane, **phải** ở `review` (FR-005) |
| `runningAgent?` | `AgentRole` | có → badge ⏳ "đang chạy" (FR-004) |
| `goal` | `string` | mục tiêu (1 đoạn, có thể markdown) |
| `userStories` | `UserStory[]` | |
| `requirements` | `Requirement[]` | FR-xxx |
| `successCriteria` | `SuccessCriterion[]` | SC-xxx |
| `edgeCases?` | `string[]` | |
| `assumptions?` | `string[]` | |
| `tasks` | `Task[]` | mirror tasks.md |
| `checks` | `Check[]` | có thể rỗng (Backlog) |
| `diff?` | `DiffFile[]` | vắng → tab Diff empty state (FR-026) |

### UserStory
`id` (`US1`…), `title`, `priority: Priority`, `narrative: string`, `whyPriority?: string`, `scenarios: Scenario[]`
- **Scenario**: `{ given: string; when: string; then: string }` — render thành block có nhãn (FR-019).

### Requirement
`id` (`FR-001`…), `level: ReqLevel`, `text: string`

### SuccessCriterion
`id` (`SC-001`…), `text: string`

### Task (mirror tasks.md)
`id` (`T001`…), `phase: string`, `story?: string` (US ref), `parallel?: boolean`, `label: string`, `done: boolean`

### Check
| Field | Type | Ghi chú |
|---|---|---|
| `id` | `string` | |
| `label` | `string` | |
| `state` | `CheckState` | |
| `kind` | `CheckKind` | nhóm theo verify-order |
| `evidence?` | `Evidence` | |
| `refs?` | `string[]` | mã SC/US/FR mà Check verify |

**Invariant (FR-006/024, SC-004):** một Check `state==="pass"` **mà thiếu `evidence`** → **không** tính vào "đã-pass" và **không bao giờ** hiển thị xanh. Thực thi tập trung trong `lib/check-progress.ts`:
```
passCount = checks.filter(c => c.state === "pass" && c.evidence != null).length
total     = checks.length
// Check pass-thiếu-evidence hiển thị như cảnh báo (không-pass), không xanh.
```

### Evidence
`type: EvidenceType`, `href?: string`, `summary?: string` — bắt buộc-có cho mỗi Check được coi là pass.

### DiffFile
`path: string`, `status: DiffStatus`, `patch: string` (nội dung unified diff mock)

## Ràng buộc bộ dữ liệu mock (FR-007)

`mock/specs.ts` phải chứa **~6–8 SpecCard** thoả:
1. Phủ đủ 4 cột Backlog/Plan/Review/Done.
2. ≥1 card `fastlane: true` và nằm ở `review`.
3. ≥1 card có `runningAgent`.
4. ≥1 card ở `review` có **đồng thời**: một Check `state:"fail"` **và** một Check `state:"pass"` **thiếu** `evidence` (minh hoạ "thiếu Evidence = chưa pass").
5. ≥1 card ở `backlog` **không** có Check (edge: card không Check) và **không** có diff (edge: tab Diff empty).
6. ≥1 card có đủ chiều sâu Spec (nhiều US/FR/SC + prose + Mermaid) để test TOC/quét-nhanh và spec-dài-không-vỡ-layout.

> Có thể tái dùng/đổi tên các card mock hiện có trong `page.tsx` (SPEC-009/014/016/018/021/022) làm điểm xuất phát, mở rộng thành cấu trúc đầy đủ ở trên.

## State runtime (không persist)

Board giữ thứ tự/cột trong **một** cấu trúc in-memory seed từ `mock/specs.ts`, biến đổi qua `lib/board-state.ts` (reducer thuần). Reload → seed lại từ mock (FR-010). Không có entity nào ghi xuống storage.
