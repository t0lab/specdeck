"use client";

// Live provisioning progress over SSE via @microsoft/fetch-event-source:
// snapshot (once) → progress (many) → done|error (terminal → abort). The library
// auto-retries dropped connections; on a terminal event we abort to stop.

import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useEffect, useState } from "react";

import { workspaceApi, type WorkspaceStatus } from "@/lib/api/workspaces";

/** One streamed git stderr line; `transient` lines are `\r` progress updates
 * that overwrite the previous line in a terminal. */
export interface LogLine {
  text: string;
  transient: boolean;
}

export interface ProvisioningState {
  status: WorkspaceStatus | null;
  phase: string | null;
  progress: number | null;
  message: string | null;
  error: string | null;
  lines: LogLine[];
}

const INITIAL: ProvisioningState = {
  status: null,
  phase: null,
  progress: null,
  message: null,
  error: null,
  lines: [],
};

export function useProvisioningEvents(
  projectId: string | null,
  enabled: boolean,
): ProvisioningState {
  const [state, setState] = useState<ProvisioningState>(INITIAL);
  // Reset when the target changes — done in render (the "adjust state on prop
  // change" pattern) rather than in the effect, which the lint rules forbid.
  const [tracked, setTracked] = useState<{ id: string | null; on: boolean }>({
    id: projectId,
    on: enabled,
  });
  if (tracked.id !== projectId || tracked.on !== enabled) {
    setTracked({ id: projectId, on: enabled });
    setState(INITIAL);
  }

  useEffect(() => {
    if (!projectId || !enabled) return;
    const ctrl = new AbortController();

    void fetchEventSource(workspaceApi.eventsUrl(projectId), {
      signal: ctrl.signal,
      openWhenHidden: true,
      onmessage(ev) {
        if (!ev.data) return; // heartbeat / blank
        const d = JSON.parse(ev.data);
        switch (ev.event) {
          case "snapshot":
            setState((s) => ({
              ...s,
              status: d.status ?? s.status,
              phase: d.job?.phase ?? s.phase,
              progress: d.job?.progress ?? s.progress,
            }));
            break;
          case "progress":
            setState((s) => ({ ...s, phase: d.phase, progress: d.progress, message: d.message }));
            break;
          case "log":
            setState((s) => {
              const lines = s.lines.slice();
              const last = lines[lines.length - 1];
              // A transient (`\r`) line overwrites the previous transient line.
              if (d.transient && last?.transient) {
                lines[lines.length - 1] = { text: d.log, transient: true };
              } else {
                lines.push({ text: d.log, transient: !!d.transient });
              }
              return { ...s, lines };
            });
            break;
          case "done":
            setState((s) => ({ ...s, status: d.workspace_status, progress: 100 }));
            ctrl.abort();
            break;
          case "error":
            setState((s) => ({
              ...s,
              status: d.workspace_status,
              error: d.error,
              message: d.message,
            }));
            ctrl.abort();
            break;
        }
      },
    }).catch(() => {
      // aborted or network teardown — nothing to surface beyond current state
    });

    return () => ctrl.abort();
  }, [projectId, enabled]);

  return state;
}
