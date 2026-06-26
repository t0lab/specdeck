"use client";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { SpecCardView } from "@/components/board/spec-card-view";
import { cellId } from "@/components/board/board-ids";
import { cn } from "@/lib/utils";
import type { BoardColumn, SpecCard } from "@/mock/types";

// A single card made draggable + sortable. The whole card is the drag handle;
// PointerSensor's distance constraint (see BoardDnd) keeps plain clicks working
// for the US4 open-detail interaction. Keyboard drag comes free via the
// KeyboardSensor wired on the context.
function SortableSpecCard({ card }: { card: SpecCard }) {
  "use no memo"; // dnd-kit + React Compiler loop — see BoardDnd for the why.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });
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

// One (group, column) cell: a borderless droppable wrapping a sortable list.
// Borderless by design (point 1 — no column boxes); column identity comes solely
// from the shared sticky column header above the swimlanes (no per-group header).
// The cell lights mint (soft fill + ring, no hard border) while it is the live
// drop target. Empty cells keep a min-height so they remain droppable.
export function BoardCell({
  groupId,
  column,
  cards,
  isTarget = false,
}: {
  groupId: string;
  column: BoardColumn;
  cards: SpecCard[];
  // True when the dragged card currently lives in this cell (BoardDnd keeps this
  // live via onDragOver) — drives a steady highlight instead of dnd-kit's flicker.
  isTarget?: boolean;
}) {
  "use no memo"; // dnd-kit + React Compiler loop — see BoardDnd for the why.
  const { setNodeRef, isOver } = useDroppable({ id: cellId(groupId, column) });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-24 flex-col gap-4.5 rounded-lg p-2 ring-1 ring-inset ring-transparent transition-colors",
        (isTarget || isOver) && "bg-accent-soft/60 ring-primary/40",
      )}
    >
      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {cards.map((card) => (
          <SortableSpecCard key={card.id} card={card} />
        ))}
      </SortableContext>
    </div>
  );
}
