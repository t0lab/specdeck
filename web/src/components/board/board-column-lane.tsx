"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { ColumnTag } from "@/components/board/column-tag";
import { SpecCardView } from "@/components/board/spec-card-view";
import { cn } from "@/lib/utils";
import type { BoardColumn, SpecCard } from "@/mock/types";

// A single card made draggable + sortable. The whole card is the drag handle;
// PointerSensor's distance constraint (see BoardDnd) keeps plain clicks working
// for the US4 open-detail interaction. Keyboard drag comes free via the
// KeyboardSensor wired on the context.
function SortableSpecCard({ card }: { card: SpecCard }) {
  "use no memo"; // dnd-kit + React Compiler loop — see BoardDnd for the why.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "touch-none cursor-grab active:cursor-grabbing",
        // While dragging, this in-place node IS the drop slot: a faded clone of
        // the card inside a dashed mint outline marks exactly where it will land
        // (the lifted clone follows the cursor via DragOverlay).
        isDragging &&
          "rounded-md outline-2 outline-dashed outline-primary/60 outline-offset-2",
      )}
      {...attributes}
      {...listeners}
    >
      <SpecCardView
        card={card}
        interactive
        className={cn(isDragging && "opacity-40")}
      />
    </div>
  );
}

// Per-column top strip — the at-a-glance lane identity, same token as ColumnTag's
// dot (so Done reads blue, apart from Review's mint).
const LANE_STRIP: Record<BoardColumn, string> = {
  backlog: "bg-col-backlog",
  plan: "bg-col-plan",
  review: "bg-col-review",
  done: "bg-col-done",
};

// One board column: a bordered lane (colored top strip + header divider) wrapping
// a droppable sortable list. The whole lane lights mint while a card hovers it.
// Lanes stretch to equal height via the grid, so empty columns still read as lanes.
export function BoardColumnLane({
  column,
  cards,
  isTarget = false,
}: {
  column: BoardColumn;
  cards: SpecCard[];
  // True when the card being dragged currently lives in this lane. Drives the
  // highlight off board state (which onDragOver keeps live) instead of dnd-kit's
  // `isOver`, which only fires over empty lane space and flickers off whenever
  // the pointer is over a card — so the lit lane was inconsistent before.
  isTarget?: boolean;
}) {
  "use no memo"; // dnd-kit + React Compiler loop — see BoardDnd for the why.
  const { setNodeRef, isOver } = useDroppable({ id: column });
  return (
    <section
      aria-label={column}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-surface/40 ring-1 ring-transparent transition-colors",
        // drop-zone indicator: the destination lane stays lit for the whole drag
        (isTarget || isOver) && "bg-accent-soft/60 ring-primary/50",
      )}
    >
      <div className={cn("h-1 shrink-0", LANE_STRIP[column])} aria-hidden />
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <ColumnTag column={column} count={cards.length} />
      </div>
      <div ref={setNodeRef} className="flex min-h-28 flex-1 flex-col gap-3 p-3">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <SortableSpecCard key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}
