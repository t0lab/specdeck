// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { fetchEventSourceMock, captured } = vi.hoisted(() => {
  const captured: { opts?: { onmessage: (ev: { event: string; data: string }) => void } } = {};
  const fetchEventSourceMock = vi.fn((_url: string, opts: typeof captured.opts) => {
    captured.opts = opts;
    return new Promise<void>(() => {}); // never resolves; aborted on cleanup
  });
  return { fetchEventSourceMock, captured };
});
vi.mock("@microsoft/fetch-event-source", () => ({ fetchEventSource: fetchEventSourceMock }));

import { useProvisioningEvents } from "@/hooks/use-provisioning-events";

function emit(event: string, data: unknown) {
  captured.opts!.onmessage({ event, data: JSON.stringify(data) });
}

afterEach(() => {
  fetchEventSourceMock.mockClear();
  captured.opts = undefined;
});

describe("useProvisioningEvents", () => {
  it("opens no stream when disabled", () => {
    renderHook(() => useProvisioningEvents("p1", false));
    expect(fetchEventSourceMock).not.toHaveBeenCalled();
  });

  it("applies snapshot → progress → done", () => {
    const { result } = renderHook(() => useProvisioningEvents("p1", true));
    expect(fetchEventSourceMock).toHaveBeenCalledTimes(1);

    act(() =>
      emit("snapshot", {
        status: "provisioning",
        job: { phase: "Receiving objects", progress: 30 },
      }),
    );
    expect(result.current.status).toBe("provisioning");
    expect(result.current.progress).toBe(30);

    act(() => emit("progress", { phase: "Receiving objects", progress: 70, message: null }));
    expect(result.current.progress).toBe(70);

    act(() => emit("done", { workspace_status: "ready" }));
    expect(result.current.status).toBe("ready");
    expect(result.current.progress).toBe(100);
  });

  it("surfaces a terminal error event", () => {
    const { result } = renderHook(() => useProvisioningEvents("p1", true));
    act(() =>
      emit("error", { workspace_status: "error", error: "clone_failed", message: "nope" }),
    );
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("clone_failed");
  });

  it("ignores heartbeat messages with no data", () => {
    const { result } = renderHook(() => useProvisioningEvents("p1", true));
    act(() => captured.opts!.onmessage({ event: "ping", data: "" }));
    expect(result.current).toEqual({
      status: null,
      phase: null,
      progress: null,
      message: null,
      error: null,
      lines: [],
    });
  });

  it("collects log lines; transient lines overwrite the previous transient", () => {
    const { result } = renderHook(() => useProvisioningEvents("p1", true));
    act(() => emit("log", { log: "Cloning into 'demo'...", transient: false }));
    act(() => emit("log", { log: "Receiving objects: 10%", transient: true }));
    act(() => emit("log", { log: "Receiving objects: 80%", transient: true }));
    expect(result.current.lines).toEqual([
      { text: "Cloning into 'demo'...", transient: false },
      { text: "Receiving objects: 80%", transient: true },
    ]);
  });
});
