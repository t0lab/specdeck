"use client";

import { useReducer, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { BoardColumnLane } from "@/components/board/board-column-lane";
import { SpecCardView } from "@/components/board/spec-card-view";
import { moveCard, reorderCard, type BoardState } from "@/lib/board-state";
import type { BoardColumn, SpecCard } from "@/mock/types";

const COLUMNS: BoardColumn[] = ["backlog", "plan", "review", "done"];
const isColumnId = (id: string): id is BoardColumn =>
  (COLUMNS as string[]).includes(id);

type Action =
  | { type: "move"; cardId: string; toColumn: BoardColumn; toIndex: number }
  | { type: "reorder"; cardId: string; toIndex: number };

function reducer(state: BoardState, action: Action): BoardState {
  switch (action.type) {
    case "move":
      return moveCard(state, action.cardId, action.toColumn, action.toIndex);
    case "reorder":
      return reorderCard(state, action.cardId, action.toIndex);
  }
}

function columnOf(state: BoardState, cardId: string): BoardColumn | undefined {
  return state.find((l) => l.cards.some((c) => c.id === cardId))?.column;
}
function indexOf(state: BoardState, column: BoardColumn, cardId: string): number {
  const lane = state.find((l) => l.column === column);
  return lane ? lane.cards.findIndex((c) => c.id === cardId) : -1;
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
export function BoardDnd({ initialLanes }: { initialLanes: BoardState }) {
  const [state, dispatch] = useReducer(reducer, initialLanes);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    // Distance constraint: a stationary press is a click (US4 open), not a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return; // dropped outside any droppable → snaps back (no-op)

    const draggedId = String(active.id);
    const overId = String(over.id);
    if (draggedId === overId) return;

    const sourceColumn = columnOf(state, draggedId);
    if (!sourceColumn) return;

    let targetColumn: BoardColumn;
    let targetIndex: number;
    if (isColumnId(overId)) {
      // dropped on the column's empty area → append
      targetColumn = overId;
      targetIndex = state.find((l) => l.column === targetColumn)!.cards.length;
    } else {
      // dropped over another card → take that card's column + slot
      const overColumn = columnOf(state, overId);
      if (!overColumn) return;
      targetColumn = overColumn;
      targetIndex = indexOf(state, targetColumn, overId);
    }

    if (targetColumn === sourceColumn) {
      dispatch({ type: "reorder", cardId: draggedId, toIndex: targetIndex });
    } else {
      dispatch({
        type: "move",
        cardId: draggedId,
        toColumn: targetColumn,
        toIndex: targetIndex,
      });
    }
  }

  const activeCard = activeId ? findCard(state, activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {state.map((lane) => (
          <BoardColumnLane
            key={lane.column}
            column={lane.column}
            cards={lane.cards}
          />
        ))}
      </div>
      {/* Overlay: a lifted clone of the card follows the pointer/keyboard
          focus while dragging — distinct from the dimmed origin placeholder. */}
      <DragOverlay>
        {activeCard ? (
          <SpecCardView
            card={activeCard}
            className="rotate-3 scale-[1.02] cursor-grabbing shadow-xl ring-2 ring-primary/50"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
