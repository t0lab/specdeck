import { afterEach, describe, expect, it, vi } from "vitest";

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));
vi.mock("axios", () => ({
  default: {
    create: () => ({ request: requestMock }),
    isAxiosError: (e: unknown) => Boolean((e as { isAxiosError?: boolean })?.isAxiosError),
  },
}));

import { workspaceApi } from "@/lib/api/workspaces";

afterEach(() => requestMock.mockReset());

describe("workspaceApi", () => {
  it("createWorkspace posts the clone body and returns the job id", async () => {
    requestMock.mockResolvedValueOnce({
      data: { workspace: { status: "provisioning" }, job_id: "job-1" },
    });
    const res = await workspaceApi.createWorkspace("demo", {
      mode: "clone",
      remote_url: "https://github.com/o/r.git",
      base_branch: "main",
    });
    expect(res.job_id).toBe("job-1");
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "/demo/workspace",
        data: expect.objectContaining({ mode: "clone" }),
      }),
    );
  });

  it("getWorkspace returns the workspace state", async () => {
    requestMock.mockResolvedValueOnce({ data: { status: "ready", rel_path: "demo" } });
    const ws = await workspaceApi.getWorkspace("demo");
    expect(ws.status).toBe("ready");
  });

  it("eventsUrl points at the SSE endpoint", () => {
    expect(workspaceApi.eventsUrl("demo")).toContain("/api/projects/demo/workspace/events");
  });
});
