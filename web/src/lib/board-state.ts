import type { BoardColumn, SpecCard } from "@/mock/types";

// In-memory board state for the grouped (swimlane) board. The board is modelled
// as a list of group lanes; each lane holds an ordered card array PER column —
// a "cell" = one (group, column) pair. Storing cells (rather than one array per
// column with an interleaved `group` field) keeps every index local: a drop
// target is always a single cell, so move/reorder math never has to reason about
// other groups' cards sharing the column. Pure transforms only (no DOM, no
// persistence) so the drag-drop logic stays unit-testable apart from dnd-kit.
//
// An invalid drop (unknown card, group, or column) returns the SAME state
// reference unchanged — the card snaps back to where it was.
export type ColumnCells = Record<BoardColumn, SpecCard[]>;

export interface GroupLane {
  groupId: string;
  cells: ColumnCells;
}

export type GroupedBoardState = GroupLane[];

const COLUMNS: BoardColumn[] = ["backlog", "plan", "review", "done"];
const isColumn = (c: string): c is BoardColumn =>
  (COLUMNS as string[]).includes(c);

function clamp(index: number, max: number): number {
  if (index < 0) return 0;
  if (index > max) return max;
  return index;
}

// Find a card anywhere on the board → which group lane, column, and cell index.
function locate(
  state: GroupedBoardState,
  cardId: string,
): { laneIndex: number; column: BoardColumn; cardIndex: number } | null {
  for (let laneIndex = 0; laneIndex < state.length; laneIndex++) {
    const cells = state[laneIndex].cells;
    for (const column of COLUMNS) {
      const cardIndex = cells[column].findIndex((c) => c.id === cardId);
      if (cardIndex !== -1) return { laneIndex, column, cardIndex };
    }
  }
  return null;
}

// Deep-enough clone: every lane, its cells record, and each column array, so
// callers never mutate the input.
function cloneState(state: GroupedBoardState): GroupedBoardState {
  return state.map((lane) => ({
    groupId: lane.groupId,
    cells: {
      backlog: [...lane.cells.backlog],
      plan: [...lane.cells.plan],
      review: [...lane.cells.review],
      done: [...lane.cells.done],
    },
  }));
}

// Move a card to a target cell at a given index. Covers every drag outcome:
//  - same group + same column      → reorder within the cell
//  - same group + different column → move across columns
//  - different group               → move across swimlanes (sets group + column)
// The moved card's `column` and `group` fields are updated to match its new home.
export function moveCard(
  state: GroupedBoardState,
  cardId: string,
  toGroup: string,
  toColumn: BoardColumn,
  toIndex: number,
): GroupedBoardState {
  if (!isColumn(toColumn)) return state;
  const targetLaneIndex = state.findIndex((l) => l.groupId === toGroup);
  if (targetLaneIndex === -1) return state;

  const found = locate(state, cardId);
  if (!found) return state;

  const card = state[found.laneIndex].cells[found.column][found.cardIndex];
  const next = cloneState(state);
  next[found.laneIndex].cells[found.column].splice(found.cardIndex, 1);

  const target = next[targetLaneIndex].cells[toColumn];
  const insertAt = clamp(toIndex, target.length);
  target.splice(insertAt, 0, { ...card, column: toColumn, group: toGroup });
  return next;
}

// Reducer over the board state. Lives here (pure) so the state can be lifted
// above the views — the Kanban and List surfaces share one reducer instance, so
// a move in either reflects in both. `set` is used to revert a cancelled drag.
export type BoardAction =
  | {
      type: "move";
      cardId: string;
      toGroup: string;
      toColumn: BoardColumn;
      toIndex: number;
    }
  | { type: "set"; next: GroupedBoardState };

export function boardReducer(
  state: GroupedBoardState,
  action: BoardAction,
): GroupedBoardState {
  switch (action.type) {
    case "move":
      return moveCard(
        state,
        action.cardId,
        action.toGroup,
        action.toColumn,
        action.toIndex,
      );
    case "set":
      return action.next;
  }
}

// Shared filter/search applied to the board before rendering. Lives here (pure)
// so the same filtered view feeds both the Kanban and List surfaces, and the
// filter state can sit above them (so it survives switching views). Empty
// `statuses`/`groups` mean "all"; an empty `query` matches everything.
export interface BoardFilter {
  query: string;
  statuses: Set<BoardColumn>;
  groups: Set<string>;
}

export function isFilterActive(f: BoardFilter): boolean {
  return f.query.trim() !== "" || f.statuses.size > 0 || f.groups.size > 0;
}

// Derive a filtered board: drop groups outside `groups`, blank out columns
// outside `statuses`, and keep only cards whose id/title match `query`. When the
// filter narrows cards (query or status set), lanes that end up empty are pruned
// so the board doesn't show hollow swimlanes.
export function filterBoard(
  state: GroupedBoardState,
  f: BoardFilter,
): GroupedBoardState {
  const q = f.query.trim().toLowerCase();
  const narrowing = q !== "" || f.statuses.size > 0;
  const matches = (card: SpecCard) =>
    q === "" ||
    card.id.toLowerCase().includes(q) ||
    card.title.toLowerCase().includes(q);

  const result: GroupedBoardState = [];
  for (const lane of state) {
    if (f.groups.size > 0 && !f.groups.has(lane.groupId)) continue;
    const cells: ColumnCells = { backlog: [], plan: [], review: [], done: [] };
    let count = 0;
    for (const column of COLUMNS) {
      if (f.statuses.size > 0 && !f.statuses.has(column)) continue;
      const kept = lane.cells[column].filter(matches);
      cells[column] = kept;
      count += kept.length;
    }
    if (count === 0 && narrowing) continue;
    result.push({ groupId: lane.groupId, cells });
  }
  return result;
}
