"use client";

// Live clone progress (US2), driven by the SSE provisioning state. Pure render —
// the dialog owns the `useProvisioningEvents` subscription and the navigate-on-ready.

import { CircleCheck, CircleX, GitBranch, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProvisioningState } from "@/hooks/use-provisioning-events";

export function CloneProgress({
  repo,
  state,
}: {
  repo: string;
  state: ProvisioningState;
}) {
  const failed = state.status === "error";
  const done = state.status === "ready";
  const pct = failed ? 100 : (state.progress ?? 0);
  const label = failed
    ? "Clone failed"
    : done
      ? "Workspace ready"
      : (state.phase ?? "Starting…");

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center",
            failed ? "text-destructive" : done ? "text-emerald-500" : "text-muted-foreground",
          )}
        >
          {failed ? (
            <CircleX className="size-5" />
          ) : done ? (
            <CircleCheck className="size-5" />
          ) : (
            <Loader2 className="size-5 animate-spin" />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1.5 truncate text-sm font-medium">
            <GitBranch className="size-3.5 shrink-0 text-muted-foreground" />
            {repo}
          </span>
          <span
            className={cn(
              "text-xs",
              failed ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {label}
          </span>
        </div>
        {!failed && !done && (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{pct}%</span>
        )}
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            failed ? "bg-destructive" : done ? "bg-emerald-500" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {failed && (
        <p className="text-xs text-destructive">
          {state.message ?? state.error ?? "Clone failed."}
        </p>
      )}
    </div>
  );
}
