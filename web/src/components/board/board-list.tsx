"use client";

import { useRef, useState, type Dispatch } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import { ColumnTag } from "@/components/board/column-tag";
import { RunningBadge } from "@/components/board/running-badge";
import { OpenFullLink } from "@/components/board/detail/open-full-link";
import { BoardGroupHeader } from "@/components/board/board-group-header";
import { useBoardSheet } from "@/components/board/spec-sheet";
import { Badge } from "@/components/ui/badge";
import { checkProgress } from "@/lib/check-progress";
import type { BoardAction, GroupedBoardState } from "@/lib/board-state";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { BoardColumn, BoardGroup, SpecCard } from "@/mock/types";

const COLUMNS: BoardColumn[] = ["backlog", "plan", "review", "done"];

// Where a card sits in the list model: which group, and its column (status).
function locate(
  state: GroupedBoardState,
  cardId: string,
): { groupId: string; column: BoardColumn } | null {
  for (const lane of state) {
    for (const column of COLUMNS) {
      if (lane.cells[column].some((c) => c.id === cardId))
        return { groupId: lane.groupId, column };
    }
  }
  return null;
}

function columnCount(
  state: GroupedBoardState,
  groupId: string,
  column: BoardColumn,
): number {
  return state.find((l) => l.groupId === groupId)?.cells[column].length ?? 0;
}

function findCard(
  state: GroupedBoardState,
  cardId: string,
): SpecCard | undefined {
  return state
    .flatMap((l) => COLUMNS.flatMap((c) => l.cells[c]))
    .find((c) => c.id === cardId);
}

// One Spec as a list row. Reuses the same atoms as the Kanban card — ColumnTag
// (showing the card's status), checkProgress (evidence-gated), the Fast lane /
// running badges, and the same click-to-open-Sheet behaviour. A plain click
// opens the Sheet; ⌘/Ctrl-click opens the full page.
function SpecListRow({ card }: { card: SpecCard }) {
  const { openSpec } = useBoardSheet();
  const { passed, total } = checkProgress(card.checks);

  function handleClick(e: React.MouseEvent) {
    if (e.metaKey || e.ctrlKey) {
      window.open(`/board/${card.id}`, "_blank", "noopener,noreferrer");
    } else {
      openSpec(card.id);
    }
  }

  return (
    <article
      onClick={handleClick}
      className="group/row flex items-center gap-3 bg-surface px-2 py-2.5 transition-colors hover:bg-surface-2"
    >
      <div className="w-28 shrink-0">
        <ColumnTag column={card.column} />
      </div>
      <span className="w-20 shrink-0 font-mono text-xs text-mute tabular-nums">
        {card.id}
      </span>
      <h3 className="min-w-0 flex-1 truncate text-sm font-medium tracking-tight">
        {card.title}
      </h3>
      <div className="flex shrink-0 items-center gap-1.5">
        {card.fastlane && (
          <Badge variant="outline" className="border-fastlane/40 text-fastlane">
            Fast lane
          </Badge>
        )}
        {card.runningAgent && <RunningBadge role={card.runningAgent} />}
      </div>
      {total > 0 && (
        <div className="flex shrink-0 items-center gap-2">
          <div
            className="h-1 w-16 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuenow={passed}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${passed} of ${total} checks passed`}
          >
            <div
              className="h-full rounded-full bg-check-pass"
              style={{ width: `${(passed / total) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right font-mono text-xs text-mute tabular-nums">
            {passed}/{total}
          </span>
        </div>
      )}
      <OpenFullLink
        specId={card.id}
        className="shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100"
        onClick={(e) => e.stopPropagation()}
      />
    </article>
  );
}

// A draggable row. The whole row is the handle; PointerSensor's distance
// constraint keeps a stationary press a click (open Sheet), not a drag. While
// dragging it fades + shows the dashed mint outline (the same ghost treatment as
// the Kanban card); the lifted clone follows the cursor via DragOverlay.
function DraggableRow({ card }: { card: SpecCard }) {
  "use no memo"; // dnd-kit + React Compiler loop — see BoardDnd for the why.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "touch-none cursor-grab active:cursor-grabbing",
        isDragging &&
          "rounded-md opacity-40 outline-2 outline-dashed outline-primary/60 outline-offset-2",
      )}
      {...attributes}
      {...listeners}
    >
      <SpecListRow card={card} />
    </div>
  );
}

// A group's row container = the drop zone. Dropping a card here moves it into
// this group (keeping its status). Lights mint while it is the drop target —
// the same highlight a Kanban cell shows.
function GroupDropZone({
  groupId,
  isTarget,
  children,
}: {
  groupId: string;
  isTarget: boolean;
  children: React.ReactNode;
}) {
  "use no memo"; // dnd-kit + React Compiler loop — see BoardDnd for the why.
  const { setNodeRef, isOver } = useDroppable({ id: groupId });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mt-1 divide-y divide-border/50 rounded-lg ring-1 ring-inset ring-transparent transition-colors",
        (isTarget || isOver) && "bg-accent-soft/50 ring-primary/40",
      )}
    >
      {children}
    </div>
  );
}

// List view: the same swimlanes as Kanban (same order, same shared collapse),
// but each group's cards are a flat, status-tagged list. Drag-drop here only
// moves a card BETWEEN groups (its column/status is preserved) — the column
// lanes that Kanban drags across don't exist in this view. Reads/mutates the
// same shared GroupedBoardState, so a move here shows in Kanban and vice-versa.
export function BoardList({
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
  "use no memo"; // dnd-kit + React Compiler loop — see BoardDnd for the why.
  const [activeId, setActiveId] = useState<string | null>(null);
  const beforeDrag = useRef<GroupedBoardState | null>(null);
  const reducedMotion = useReducedMotion();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const isGroupId = (id: string) => state.some((l) => l.groupId === id);

  function onDragStart(event: DragStartEvent) {
    beforeDrag.current = state;
    setActiveId(String(event.active.id));
  }

  // Live move: as the card hovers a different group, place it at the end of its
  // own column inside that group (status unchanged). Same-group hover is a no-op.
  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const draggedId = String(active.id);
    const toGroup = String(over.id);
    if (!isGroupId(toGroup)) return;

    const source = locate(state, draggedId);
    if (!source || source.groupId === toGroup) return;

    dispatch({
      type: "move",
      cardId: draggedId,
      toGroup,
      toColumn: source.column, // list never changes the column
      toIndex: columnCount(state, toGroup, source.column),
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { over } = event;
    setActiveId(null);
    const snapshot = beforeDrag.current;
    beforeDrag.current = null;
    // Cross-group placement already happened live in onDragOver; a drop outside
    // any group reverts to the pre-drag snapshot.
    if (!over && snapshot) dispatch({ type: "set", next: snapshot });
  }

  function onDragCancel() {
    setActiveId(null);
    const snapshot = beforeDrag.current;
    beforeDrag.current = null;
    if (snapshot) dispatch({ type: "set", next: snapshot });
  }

  const activeCard = activeId ? findCard(state, activeId) : undefined;
  // The group holding the dragged card == the live drop target — light it.
  const activeGroup = activeId
    ? (locate(state, activeId)?.groupId ?? null)
    : null;

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
      <div className="flex flex-col gap-3.5">
        {state.map((lane) => {
          const cards = COLUMNS.flatMap((column) => lane.cells[column]);
          const isCollapsed = collapsed.has(lane.groupId);
          return (
            <section
              key={lane.groupId}
              aria-label={labelOf(lane.groupId)}
              className="flex flex-col border-t border-border/50 pt-3"
            >
              <BoardGroupHeader
                label={labelOf(lane.groupId)}
                count={cards.length}
                collapsed={isCollapsed}
                onToggle={() => onToggleGroup(lane.groupId)}
              />
              {!isCollapsed && (
                <GroupDropZone
                  groupId={lane.groupId}
                  isTarget={lane.groupId === activeGroup}
                >
                  {cards.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-mute">
                      No Specs in this group.
                    </p>
                  ) : (
                    cards.map((card) => (
                      <DraggableRow key={card.id} card={card} />
                    ))
                  )}
                </GroupDropZone>
              )}
            </section>
          );
        })}
      </div>
      {/* Lifted clone — same treatment as the Kanban overlay. */}
      <DragOverlay dropAnimation={reducedMotion ? null : undefined}>
        {activeCard ? (
          <div className="w-[40rem] max-w-[85vw] -rotate-1 cursor-grabbing rounded-md bg-surface shadow-2xl shadow-primary/30 ring-2 ring-primary">
            <SpecListRow card={activeCard} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
