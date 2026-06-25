import { BoardDnd } from "@/components/board/board-dnd";
import { initialBoard } from "@/mock/specs";

// Board (US2 + US3). The app bar lives in the board layout; this page renders
// the interactive board grid (drag-drop, in-memory state) seeded from the mock.
export default function BoardPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      <BoardDnd initialLanes={initialBoard()} />
    </main>
  );
}
