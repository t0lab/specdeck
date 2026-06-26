# Data model — 003-projects

Bổ sung tầng **Project (workspace)** lên trên các thực thể board của 002. Mock-only.

## ProjectMeta — `web/src/mock/projects.ts`

Nhận dạng + Project Context của một workspace. **Không** chứa board data (tách riêng để danh sách Project mutable nhẹ).

| Field | Kiểu | Ghi chú |
|---|---|---|
| `id` | `string` | ổn định, dùng trong địa chỉ `/p/[id]`; sinh từ tên qua `slugifyToId` |
| `name` | `string` | tên hiển thị |
| `description` | `string` | mô tả ngắn (Overview) |
| `repo` | `string` | repo URL (vd `github.com/org/repo`), có thể rỗng |
| `defaultBranch` | `string` | nhánh mặc định (vd `main`) |
| `color` | `string` | hex — accent + màu ProjectAvatar |
| `context` | `string` | **Project Context** — luật chung mọi Spec kế thừa (≈ constitution per-project) |

Seed `PROJECTS`: `specdeck` (dogfood, tái dùng `SPECS`+`BOARD_GROUPS` của 002) và `helix` (dataset board nhẹ riêng). `DEFAULT_PROJECT_ID = "specdeck"`.

## Board mapping (per Project)

- `boardDataFor(id) → { groups: BoardGroup[], lanes: GroupedBoardState }` — fresh mỗi lần gọi; id lạ (Project tạo trong phiên) → `{ groups: [], lanes: [] }` (board rỗng).
- `getSpecFor(projectId, specId) → SpecCard | undefined` — resolve Spec trong dataset của Project (cô lập: id của Project này không resolve ở Project khác → SC-002).
- Thực thể board (`SpecCard`, `BoardGroup`, `Check`, `Evidence`, `DiffFile`…) **không đổi** — tái dùng nguyên từ 002 (`mock/types.ts`).

## State runtime

- **`WorkspaceProvider`** (`components/workspace/workspace-context.tsx`) — `useReducer(workspaceReducer, PROJECTS)`; hooks `useProjects` / `useProject(id)` / `useWorkspaceDispatch`. Mutable trong phiên, reset khi refresh.
- **`workspaceReducer`** (`lib/workspace-reducer.ts`, pure, TDD) — `add` (sinh id duy nhất + defaults), `update` (patch theo id, id lạ → no-op). `slugifyToId(name, existingIds)`.
- **`boardSummary`** (`lib/board-summary.ts`, pure, TDD) — `{ perColumn, total, running }` cho Overview snapshot.
- **Sidebar collapse** — cookie `sidebar_state` do shadcn `SidebarProvider` quản (đọc server-side cho `defaultOpen`).

## Routing

```
(landing)/page.tsx                       → /            (landing, không sidebar)
(workspace)/layout.tsx                   → shell: SidebarProvider + AppSidebar + SidebarInset
(workspace)/p/[project]/layout.tsx       → resolve project (client) + ProjectHeader + tabs
            …/page.tsx                   → redirect → overview
            …/overview|board|settings    → 3 tab
            …/board/[spec]               → chi tiết Spec (project-aware)
board/route.ts                           → redirect /board → /p/<default>/board
```
