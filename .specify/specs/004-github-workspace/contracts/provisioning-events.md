# Contract: Provisioning SSE events (gateway → web)

### `GET /api/projects/{projectId}/workspace/events`

`text/event-stream` (sse-starlette). Khi mở: gửi **snapshot** trạng thái hiện tại (từ Postgres — đọc `project.active_job_id` → `provisioning_job`) trước, rồi relay live từ Redis channel `ws:provision:<job_id>`. Heartbeat comment mỗi ~15s. Client tự reconnect (EventSource) → lại snapshot + live (idempotent — FR-011, edge "mất SSE giữa chừng").

> **Hạ tầng streamed-run dùng chung**: endpoint này là instance #1 của pattern *snapshot-from-DB → relay-Redis → heartbeat*. Viết hàm relay generic (`snapshot_loader` thay được) để agent-execution tái dùng với channel `agent:thread:<thread_id>`. Redis bắt buộc: provisioning publish ở Gateway, agent-run publish ở Agent Server (khác container) — in-memory broker không vượt được ranh giới container.

## Event types

```text
event: snapshot            # gửi đúng 1 lần khi kết nối
data: { "status": "provisioning|ready|broken|error|unlinked",
        "job": { "id", "kind", "status", "phase", "progress", "message" } | null }

event: progress            # nhiều lần trong khi clone/init
data: { "job_id", "kind": "clone|init|reconnect",
        "phase": "Counting|Compressing|Receiving objects|Resolving deltas|init",
        "progress": 0..100, "message": null }

event: done                # job kết thúc thành công
data: { "job_id", "workspace_status": "ready" }

event: error               # job lỗi/huỷ
data: { "job_id", "workspace_status": "error|broken",
        "error": "<machine_code>", "message": "<human, actionable>" }
```

## Quy tắc

- `progress` là số 0–100 thô (gộp các phase); UI hiển thị phase + thanh tiến độ.
- Stream **không** điều khiển tiến trình clone — clone chạy độc lập ở server; đóng tab không huỷ job (muốn huỷ phải gọi `POST …/cancel`). `cancel` = **REST-command-lên** một job đang chạy, là tiền thân tối giản của *steering* (chèn message lên agent-run) ở agent-execution.
- Mỗi event là JSON một dòng (SSE `data:`); không kèm token hay đường dẫn tuyệt đối host.
- Kết thúc (`done`/`error`) → server đóng stream; client dừng EventSource.
