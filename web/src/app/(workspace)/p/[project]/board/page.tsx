import { BoardView } from "@/components/board/board-view";
import { BoardSheetProvider } from "@/components/board/spec-sheet";
import { boardDataFor } from "@/mock/projects";

const COLUMNS = ["backlog", "plan", "review", "done"] as const;

// Board tab — the 002 board, scoped to one Project. boardDataFor() supplies this
// Project's groups + lanes (unknown / session-created id → empty). BoardSheet
// carries the projectId so the Spec peek + deep links resolve within this
// Project. A Project with no specs shows an explicit empty state.
export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  const { groups, lanes } = boardDataFor(project);
  const total = lanes.reduce(
    (n, lane) => n + COLUMNS.reduce((m, c) => m + lane.cells[c].length, 0),
    0,
  );

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Board</h1>
          <p className="text-sm text-dim">
            Every card is one Spec. Drag a card across lanes to move it through
            the pipeline.
          </p>
        </div>
        <span className="shrink-0 font-mono text-xs text-mute tabular-nums">
          {total} Specs
        </span>
      </div>
      {total === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center text-sm text-mute">
          No specs on this board yet.
        </div>
      ) : (
        <BoardSheetProvider projectId={project}>
          <BoardView initialLanes={lanes} groups={groups} />
        </BoardSheetProvider>
      )}
    </main>
  );
}
