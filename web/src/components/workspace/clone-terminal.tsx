"use client";

// Live clone terminal (US2): streams the REAL `git clone` stderr over SSE and
// renders it like a shell session — `cd …/workspaces` then `git clone <url>`,
// followed by git's own output. Same visual chrome as components/ui/terminal.tsx,
// but driven by live data instead of a typing animation. Pure render; the page
// owns the useProvisioningEvents subscription and the navigate-on-ready.

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import type { ProvisioningState } from "@/hooks/use-provisioning-events";

const WORKSPACES_DIR = "~/specdeck/workspaces";

export function CloneTerminal({
  repo,
  url,
  state,
}: {
  repo: string;
  url: string;
  state: ProvisioningState;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const failed = state.status === "error";
  const done = state.status === "ready";
  const running = !failed && !done;

  // Follow the tail as new lines stream in.
  useEffect(() => {
    const el = contentRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.lines, state.status]);

  return (
    <div className="w-full font-mono text-xs">
      <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 shadow-lg">
        {/* title bar */}
        <div className="flex items-center gap-2 bg-neutral-800 px-4 py-2.5">
          <div className="absolute">
            <div className="flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-red-500" />
              <div className="size-1.5 rounded-full bg-yellow-500" />
              <div className="size-1.5 rounded-full bg-green-500" />
            </div>
          </div>
          <div className="w-full truncate text-center text-xs text-neutral-400">
            {repo} — git clone
          </div>
        </div>

        {/* content */}
        <div
          ref={contentRef}
          className="hidden-scrollbar h-72 overflow-y-auto p-4 leading-relaxed"
        >
          {/* the commands, as if just entered: cd into the workspaces dir, then clone */}
          <div className="whitespace-pre-wrap break-all">
            <Prompt />
            <span className="text-emerald-400">cd</span>{" "}
            <span className="text-cyan-300">{WORKSPACES_DIR}</span>
          </div>
          <div className="whitespace-pre-wrap break-all">
            <Prompt cwd={WORKSPACES_DIR} />
            <span className="text-emerald-400">git</span>{" "}
            <span className="text-neutral-300">clone</span>{" "}
            <span className="text-amber-300">{url}</span>
          </div>

          {/* streamed git stderr */}
          {state.lines.map((line, i) => (
            <div
              key={i}
              className={cn(
                "whitespace-pre-wrap break-all",
                line.transient ? "text-neutral-500" : "text-neutral-300",
              )}
            >
              {line.text}
            </div>
          ))}

          {/* terminal status footer */}
          {done && (
            <div className="mt-1 whitespace-pre-wrap text-emerald-400">
              ✓ Workspace ready.
            </div>
          )}
          {failed && (
            <div className="mt-1 whitespace-pre-wrap text-red-400">
              ✗ {state.message ?? state.error ?? "Clone failed."}
            </div>
          )}

          {/* While running, the command hasn't returned — show only a blinking
              cursor under the streaming output, NOT a fresh shell prompt. The new
              prompt appears once git clone exits (done/failed = back to shell). */}
          {running ? (
            <div className="whitespace-pre-wrap">
              <span className="inline-block h-3.5 w-2 animate-pulse bg-neutral-300 align-middle" />
            </div>
          ) : (
            <div className="whitespace-pre-wrap">
              <Prompt cwd={WORKSPACES_DIR} />
              <span className="inline-block h-3.5 w-2 bg-neutral-300 align-middle" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Prompt({ cwd = "~" }: { cwd?: string }) {
  return (
    <span className="select-none">
      <span className="text-sky-500">specdeck</span>
      <span className="text-emerald-600">:</span>
      <span className="text-sky-400">{cwd}</span>
      <span className="text-neutral-500">$ </span>
    </span>
  );
}
