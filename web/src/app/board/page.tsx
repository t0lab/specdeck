import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BoardColumnLane } from "@/components/board/board-column-lane";
import { initialBoard } from "@/mock/specs";

// Board (US2). Renders the four columns Backlog → Plan → Review → Done from the
// static mock. Drag-drop arrives in US3 (this becomes a client component then).
export default function BoardPage() {
  const board = initialBoard();
  return (
    <div className="flex min-h-full flex-col bg-ground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" aria-label="SpecDeck home">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {board.map((lane) => (
            <BoardColumnLane
              key={lane.column}
              column={lane.column}
              cards={lane.cards}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
