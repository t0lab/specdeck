"use client";

import { useRef, useState, type Dispatch } from "react";
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

import { BoardColumnHeader } from "@/components/board/board-column-header";
import { BoardGroupLane } from "@/components/board/board-group-lane";
import { SpecCardView } from "@/components/board/spec-card-view";
import { isCellId, parseCellId } from "@/components/board/board-ids";
import type { BoardAction, GroupedBoardState } from "@/lib/board-state";
import type { BoardColumn, BoardGroup, SpecCard } from "@/mock/types";

const COLUMNS: BoardColumn[] = ["backlog", "plan", "review", "done"];

// Where a card currently sits: its group, column, and index within that cell.
function locate(
  state: GroupedBoardState,
  cardId: string,
): { groupId: string; column: BoardColumn; index: number } | null {
  for (const lane of state) {
    for (const column of COLUMNS) {
      const index = lane.cells[column].findIndex((c) => c.id === cardId);
      if (index !== -1) return { groupId: lane.groupId, column, index };
    }
  }
  return null;
}

function cellCards(
  state: GroupedBoardState,
  groupId: string,
  column: BoardColumn,
): SpecCard[] {
  return state.find((l) => l.groupId === groupId)?.cells[column] ?? [];
}

function findCard(
  state: GroupedBoardState,
  cardId: string,
): SpecCard | undefined {
  return locate(state, cardId)
    ? state
        .flatMap((l) => COLUMNS.flatMap((c) => l.cells[c]))
        .find((c) => c.id === cardId)
    : undefined;
}

// Resolve the drop target cell from whatever the pointer is over: a cell's empty
// droppable (its id encodes group+column) or another card (use that card's cell).
function targetCell(
  state: GroupedBoardState,
  overId: string,
): { groupId: string; column: BoardColumn } | null {
  if (isCellId(overId)) return parseCellId(overId);
  const at = locate(state, overId);
  return at ? { groupId: at.groupId, column: at.column } : null;
}

// Grouped Kanban surface (US2/US3 + grouping). It is CONTROLLED: state + dispatch
// + collapse live in BoardView, so the List view shares the exact same state —
// a move here shows there, and the same collapsed set drives both. Reload
// re-derives from the mock (no persistence, FR-010).
//
// The board is a list of group swimlanes; each (group × column) is a "cell".
// Live drop preview: while a card hovers a *different* cell, onDragOver moves it
// into that cell at the hovered slot, so the dimmed origin card (the "ghost")
// shows exactly where the drop lands and neighbours shift to open the gap. A card
// can cross columns AND groups this way. Same-cell reordering is previewed by
// SortableContext and committed on release. A snapshot at drag start lets Esc /
// drop-outside restore the original order.
export function BoardDnd({
  state,
  dispatch,
  groups,
  collapsed,
  onToggleGroup,
}: {
  state: GroupedBoardState;
  dispatch: Dispatch<BoardAction>;
  groups: BoardGroup[];
  collapsed: Set<string>;
  onToggleGroup: (groupId: string) => void;
}) {
  // React Compiler escape hatch (next.config reactCompiler: true). dnd-kit's
  // useUniqueId() memoises an id that MUST stay stable across renders; under the
  // compiler that memo destabilises and DndContext's `aria-describedby` id flips
  // every render → "Maximum update depth exceeded". Opt this subtree out so it
  // renders with standard React semantics. Keep on every dnd-kit component below.
  "use no memo";
  const [activeId, setActiveId] = useState<string | null>(null);
  const beforeDrag = useRef<GroupedBoardState | null>(null);

  const sensors = useSensors(
    // Distance constraint: a stationary press is a click (US4 open), not a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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

    const source = locate(state, draggedId);
    const target = targetCell(state, overId);
    if (!source || !target) return;
    // Same cell (same group + column) → leave it to the sortable's own preview.
    if (source.groupId === target.groupId && source.column === target.column)
      return;

    let toIndex: number;
    if (isCellId(overId)) {
      // hovering the cell body → append to the end of that cell
      toIndex = cellCards(state, target.groupId, target.column).length;
    } else {
      const overIndex = cellCards(
        state,
        target.groupId,
        target.column,
      ).findIndex((c) => c.id === overId);
      // Drop after the hovered card once the pointer passes its midpoint.
      const activeRect = active.rect.current.translated;
      const below =
        activeRect != null &&
        activeRect.top > over.rect.top + over.rect.height / 2;
      toIndex = overIndex + (below ? 1 : 0);
    }
    dispatch({
      type: "move",
      cardId: draggedId,
      toGroup: target.groupId,
      toColumn: target.column,
      toIndex,
    });
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
    const target = targetCell(state, overId);
    if (!target) return;

    // Cross-cell placement already happened live in onDragOver; this settles the
    // final index within the destination cell (and handles same-cell reorder).
    let toIndex: number;
    if (isCellId(overId)) {
      toIndex = cellCards(state, target.groupId, target.column).length;
    } else {
      if (draggedId === overId) return;
      toIndex = cellCards(state, target.groupId, target.column).findIndex(
        (c) => c.id === overId,
      );
    }
    dispatch({
      type: "move",
      cardId: draggedId,
      toGroup: target.groupId,
      toColumn: target.column,
      toIndex,
    });
  }

  function onDragCancel() {
    setActiveId(null);
    const snapshot = beforeDrag.current;
    beforeDrag.current = null;
    if (snapshot) dispatch({ type: "set", next: snapshot });
  }

  const activeCard = activeId ? findCard(state, activeId) : undefined;
  // The cell holding the dragged card == the live drop target (onDragOver keeps
  // it current). Used to light that cell steadily, see BoardCell.
  const at = activeId ? locate(state, activeId) : null;
  const activeCell = at ? { groupId: at.groupId, column: at.column } : null;

  // Per-column totals across all groups, for the shared sticky header.
  const columnTotals = COLUMNS.reduce(
    (acc, column) => {
      acc[column] = state.reduce((n, l) => n + l.cells[column].length, 0);
      return acc;
    },
    { backlog: 0, plan: 0, review: 0, done: 0 } as Record<BoardColumn, number>,
  );

  const labelOf = (groupId: string) =>
    groups.find((g) => g.id === groupId)?.label ?? groupId;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <BoardColumnHeader counts={columnTotals} />
      <div className="flex flex-col gap-3.5">
        {state.map((lane) => (
          <BoardGroupLane
            key={lane.groupId}
            groupId={lane.groupId}
            label={labelOf(lane.groupId)}
            cells={lane.cells}
            collapsed={collapsed.has(lane.groupId)}
            onToggle={() => onToggleGroup(lane.groupId)}
            activeCell={activeCell}
          />
        ))}
      </div>
      {/* Overlay: a lifted clone of the card follows the pointer/keyboard focus
          while dragging — distinct from the dimmed ghost left at the drop slot. */}
      <DragOverlay>
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
