# Research — 003-projects (Next 16.2.9 routing + shadcn sidebar)

Nguồn: `web/node_modules/next/dist/docs/01-app/...` (bản đang cài). Chốt trước khi viết route (T002).

## Route groups `(folder)`
- Tên thư mục bọc ngoặc đơn **không** vào URL path. `(landing)/page.tsx` = `/`; mọi thứ trong `(workspace)/` bắt đầu path từ segment thật (`p/...`).
- **Giữ MỘT root layout** (`app/layout.tsx` với html/body/providers). `(landing)` và `(workspace)` chỉ có *nested* layout (không html/body) → **không** kích hoạt full page reload (caveat full-reload chỉ xảy ra khi có *nhiều root layout*).
- Không để hai group resolve cùng path (ta không có xung đột: landing = `/`, workspace = `/p/...`).

## Dynamic segment `params` là Promise (gotcha lớn Next 15/16)
- Server component: `async function Page({ params }: { params: Promise<{project:string}> }) { const { project } = await params }`.
- Client component: `const { project } = use(params)` (React `use`).
- `params` truyền cho layout/page/route/generateMetadata.

## `redirect()` / `notFound()` (`next/navigation`)
- `redirect(path)` ném `NEXT_REDIRECT`, gọi **ngoài** try/catch; mặc định 307, `replace` ở server component. Dùng cho `p/[project]/page.tsx` → `./overview`.
- `notFound()` ném `NEXT_HTTP_ERROR_FALLBACK;404`, render `not-found.tsx` gần nhất; không cần `return`.

## Quyết định cho feature
- **Project resolve ở CLIENT**: metadata Project sống trong `WorkspaceProvider` (client, mock-mutable). Project mới tạo chỉ tồn tại client-side → `[project]/layout.tsx` là **client component**, đọc `use(params)` + `useProject(id)`; thiếu → render inline NotFound UI (không dựa `notFound()` server để tránh lệch server/client với store client).
- **Tab mặc định**: `p/[project]/page.tsx` (client) `redirect('./overview')` hoặc render thẳng Overview — chọn redirect để URL phản ánh tab (FR-008).
- **`/board` cũ**: Route Handler `app/board/route.ts` `GET` → `redirect('/p/<DEFAULT>/board')` (giữ link landing). Lưu ý redirect gọi ngoài try/catch.
- **shadcn sidebar**: dùng `SidebarProvider` (đọc cookie `sidebar_state` server-side cho `defaultOpen`) + `Sidebar collapsible="icon"` + `SidebarInset` + `SidebarRail`. Collapse persistence + mobile Sheet + `⌘B` + tooltip-icon do block lo sẵn — không tự viết cookie.
- **Token**: thêm `--sidebar*` vào `globals.css` (cả `:root` + dark), map sang `--surface`/`--border`/`--accent-soft`/`--primary`; đăng ký trong `@theme inline` để utility `bg-sidebar`… hoạt động. Chỉ thêm, không xoá `--*` cũ.

→ Pattern chuẩn, **không cần fallback**. (Fallback dự phòng nếu cần: gộp 3 tab thành một segment `[tab]` động.)
