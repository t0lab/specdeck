"use client";

import { ExternalLink } from "lucide-react";

import { ColumnTag, type BoardColumn } from "@/components/board/column-tag";
import { boardSummary } from "@/lib/board-summary";
import { boardDataFor } from "@/mock/projects";
import { useProject } from "./workspace-context";

// Project Overview (US2): the default tab. Identity (name, repo, description,
// Project Context) + a board snapshot (per-column counts + running agents). The
// snapshot reads boardSummary(boardDataFor(id)) so it always matches the Board
// tab; an empty board shows an explicit empty state (FR-011), never fake zeros.
const COLUMNS: BoardColumn[] = ["backlog", "plan", "review", "done"];

export function OverviewPanel({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  if (!project) return null;

  const { lanes } = boardDataFor(projectId);
  const summary = boardSummary(lanes);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <div className="flex flex-col gap-8">
        {/* identity */}
        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h2>
          {project.repo && (
            <a
              href={`https://${project.repo.replace(/^https?:\/\//, "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-1.5 font-mono text-sm text-mute transition-colors hover:text-foreground"
            >
              {project.repo}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
          {project.description && (
            <p className="max-w-prose text-sm leading-relaxed text-dim">
              {project.description}
            </p>
          )}
        </section>

        {/* board snapshot */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium tracking-tight">Board</h3>
            {summary.running > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-running/40 px-2.5 py-0.5 text-xs font-medium text-running">
                {/* gentle pulsing dot (matches RunningBadge, live status) */}
                <span
                  className="size-1 animate-pulse rounded-full bg-running"
                  aria-hidden
                />
                {summary.running} running
              </span>
            )}
          </div>
          {summary.total === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-10 text-center text-sm text-mute">
              No specs on this board yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {COLUMNS.map((column) => (
                <div
                  key={column}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4"
                >
                  <ColumnTag
                    column={column}
                    className={column === "review" ? "text-primary" : undefined}
                  />
                  <span className="font-mono text-2xl tabular-nums">
                    {summary.perColumn[column]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Project Context */}
        {project.context && (
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium tracking-tight">
              Project Context
            </h3>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-dim">
                {project.context}
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
