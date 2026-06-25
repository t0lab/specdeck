"use client";

import { useReducer, useRef, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { BoardColumnLane } from "@/components/board/board-column-lane";
import { SpecCardView } from "@/components/board/spec-card-view";
import { moveCard, reorderCard, type BoardState } from "@/lib/board-state";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { BoardColumn, SpecCard } from "@/mock/types";

const COLUMNS: BoardColumn[] = ["backlog", "plan", "review", "done"];
const isColumnId = (id: string): id is BoardColumn =>
  (COLUMNS as string[]).includes(id);

type Action =
  | { type: "move"; cardId: string; toColumn: BoardColumn; toIndex: number }
  | { type: "reorder"; cardId: string; toIndex: number }
  | { type: "set"; next: BoardState };

function reducer(state: BoardState, action: Action): BoardState {
  switch (action.type) {
    case "move":
      return moveCard(state, action.cardId, action.toColumn, action.toIndex);
    case "reorder":
      return reorderCard(state, action.cardId, action.toIndex);
    case "set":
      return action.next;
  }
}

function columnOf(state: BoardState, cardId: string): BoardColumn | undefined {
  return state.find((l) => l.cards.some((c) => c.id === cardId))?.column;
}
function indexOf(state: BoardState, column: BoardColumn, cardId: string): number {
  const lane = state.find((l) => l.column === column);
  return lane ? lane.cards.findIndex((c) => c.id === cardId) : -1;
}
function laneLength(state: BoardState, column: BoardColumn): number {
  return state.find((l) => l.column === column)?.cards.length ?? 0;
}
function findCard(state: BoardState, cardId: string): SpecCard | undefined {
  for (const lane of state) {
    const card = lane.cards.find((c) => c.id === cardId);
    if (card) return card;
  }
  return undefined;
}

// Drag-drop board (US3). State is in-memory via useReducer seeded from the mock;
// reload re-derives from the mock (no persistence — FR-010). Reduced-motion is
// honoured globally (the prefers-reduced-motion block in globals.css stills the
// transform transitions and the running-badge pulse).
//
// Live drop preview: while a card hovers a *different* column, onDragOver moves
// it into that column at the hovered slot, so the dimmed origin card (the faded
// "ghost") shows exactly where the drop will land and neighbours shift to open
// the gap. Same-column reordering is previewed by SortableContext's own gap and
// committed on release — doing it live too causes mid-drag jitter. A snapshot
// taken at drag start lets Esc or a drop-outside restore the original order.
export function BoardDnd({ initialLanes }: { initialLanes: BoardState }) {
  // React Compiler escape hatch (next.config reactCompiler: true). dnd-kit's
  // useUniqueId() memoises an id that MUST stay stable across renders; under the
  // compiler that memo destabilises and DndContext's `aria-describedby` id flips
  // every render → "Maximum update depth exceeded". Opt this subtree out so it
  // renders with standard React semantics. Keep on every dnd-kit component below.
  "use no memo";
  const [state, dispatch] = useReducer(reducer, initialLanes);
  const [activeId, setActiveId] = useState<string | null>(null);
  const beforeDrag = useRef<BoardState | null>(null);
  const reducedMotion = useReducedMotion();

  const sensors = useSensors(
    // Distance constraint: a stationary press is a click (US4 open), not a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragStart(event: DragStartEvent) {
    beforeDrag.current = state;
    setActiveId(String(event.active.id));
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const draggedId = String(active.id);
    const overId = String(over.id);
    if (draggedId === overId) return;

    const sourceColumn = columnOf(state, draggedId);
    const overColumn = isColumnId(overId) ? overId : columnOf(state, overId);
    // Only cross-column moves are applied live; same-column is the sortable's job.
    if (!sourceColumn || !overColumn || sourceColumn === overColumn) return;

    let toIndex: number;
    if (isColumnId(overId)) {
      toIndex = laneLength(state, overColumn); // hovering the column body → append
    } else {
      const overIndex = indexOf(state, overColumn, overId);
      // Drop after the hovered card once the pointer passes its midpoint.
      const activeRect = active.rect.current.translated;
      const below =
        activeRect != null &&
        activeRect.top > over.rect.top + over.rect.height / 2;
      toIndex = overIndex + (below ? 1 : 0);
    }
    dispatch({ type: "move", cardId: draggedId, toColumn: overColumn, toIndex });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    const snapshot = beforeDrag.current;
    beforeDrag.current = null;

    if (!over) {
      if (snapshot) dispatch({ type: "set", next: snapshot }); // dropped nowhere → revert
      return;
    }

    const draggedId = String(active.id);
    const overId = String(over.id);
    const sourceColumn = columnOf(state, draggedId);
    if (!sourceColumn) return;

    // Cross-column placement already happened in onDragOver; settle the final
    // index within the destination column.
    if (isColumnId(overId)) {
      if (overId === sourceColumn) {
        dispatch({ type: "reorder", cardId: draggedId, toIndex: laneLength(state, sourceColumn) });
      }
      return;
    }
    if (draggedId === overId) return;

    const overColumn = columnOf(state, overId);
    if (!overColumn) return;
    const overIndex = indexOf(state, overColumn, overId);
    if (overColumn === sourceColumn) {
      dispatch({ type: "reorder", cardId: draggedId, toIndex: overIndex });
    } else {
      dispatch({ type: "move", cardId: draggedId, toColumn: overColumn, toIndex: overIndex });
    }
  }

  function onDragCancel() {
    setActiveId(null);
    const snapshot = beforeDrag.current;
    beforeDrag.current = null;
    if (snapshot) dispatch({ type: "set", next: snapshot });
  }

  const activeCard = activeId ? findCard(state, activeId) : undefined;
  // The lane holding the dragged card == the live drop target (onDragOver keeps
  // it current). Used to light that lane steadily, see BoardColumnLane.
  const activeColumn = activeId ? columnOf(state, activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {state.map((lane) => (
          <BoardColumnLane
            key={lane.column}
            column={lane.column}
            cards={lane.cards}
            isTarget={lane.column === activeColumn}
          />
        ))}
      </div>
      {/* Overlay: a lifted clone of the card follows the pointer/keyboard focus
          while dragging — distinct from the dimmed ghost left at the drop slot. */}
      <DragOverlay dropAnimation={reducedMotion ? null : undefined}>
        {activeCard ? (
          <SpecCardView
            card={activeCard}
            className="-rotate-2 scale-105 cursor-grabbing shadow-2xl shadow-primary/30 ring-2 ring-primary"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
