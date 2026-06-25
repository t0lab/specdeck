"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { ColumnTag } from "@/components/status/column-tag";
import { SpecCardView } from "@/components/board/spec-card-view";
import { cn } from "@/lib/utils";
import type { BoardColumn, SpecCard } from "@/mock/types";

// A single card made draggable + sortable. The whole card is the drag handle;
// PointerSensor's distance constraint (see BoardDnd) keeps plain clicks working
// for the US4 open-detail interaction. Keyboard drag comes free via the
// KeyboardSensor wired on the context.
function SortableSpecCard({ card }: { card: SpecCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "touch-none cursor-grab active:cursor-grabbing",
        // ghost placeholder showing the origin gap while the overlay is dragged
        isDragging && "opacity-40",
      )}
      {...attributes}
      {...listeners}
    >
      <SpecCardView card={card} />
    </div>
  );
}

// One board column: a droppable area (highlighted while a card hovers over it)
// wrapping a sortable list. Header reuses ColumnTag with the live count.
export function BoardColumnLane({
  column,
  cards,
}: {
  column: BoardColumn;
  cards: SpecCard[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column });
  return (
    <section className="flex flex-col gap-3" aria-label={column}>
      <ColumnTag column={column} count={cards.length} />
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-col gap-3 rounded-lg p-1 ring-1 ring-transparent transition-colors",
          // drop-zone indicator: the hovered column lights up while dragging
          isOver && "bg-accent-soft ring-primary/40",
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
    </section>
  );
}
