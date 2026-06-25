import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BoardDnd } from "@/components/board/board-dnd";
import { initialBoard } from "@/mock/specs";

// Board (US2 + US3). Server shell holds the app bar; the interactive board
// (drag-drop, in-memory state) lives in the BoardDnd client component, seeded
// from the static mock.
export default function BoardPage() {
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
        <BoardDnd initialLanes={initialBoard()} />
      </main>
    </div>
  );
}
