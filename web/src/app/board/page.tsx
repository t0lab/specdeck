import { BoardDnd } from "@/components/board/board-dnd";
import { BoardSheetProvider } from "@/components/board/spec-sheet";
import { initialBoard } from "@/mock/specs";

// Board (US2 + US3 + US4). The app bar lives in the board layout; this page
// renders a page header + the interactive board grid (drag-drop, in-memory state)
// seeded from the mock. BoardSheetProvider supplies the in-page Spec peek (a card
// click opens a Sheet, no route change). `flex-1` lets the board fill the
// min-h-svh layout even when the lanes are short.
export default function BoardPage() {
  const lanes = initialBoard();
  const total = lanes.reduce((n, lane) => n + lane.cards.length, 0);

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
      <BoardSheetProvider>
        <BoardDnd initialLanes={lanes} />
      </BoardSheetProvider>
    </main>
  );
}
