import type { BoardColumn, BoardColumnLane, SpecCard } from "@/mock/types";

// In-memory board state = the column lanes in display order. Pure transforms
// only (no DOM, no persistence) so the drag-drop logic is unit-testable apart
// from dnd-kit. An invalid drop (unknown card or unknown target column) returns
// the SAME state reference unchanged — the card snaps back to where it was.
export type BoardState = BoardColumnLane[];

function clamp(index: number, max: number): number {
  if (index < 0) return 0;
  if (index > max) return max;
  return index;
}

function locate(
  state: BoardState,
  cardId: string,
): { laneIndex: number; cardIndex: number } | null {
  for (let laneIndex = 0; laneIndex < state.length; laneIndex++) {
    const cardIndex = state[laneIndex].cards.findIndex((c) => c.id === cardId);
    if (cardIndex !== -1) return { laneIndex, cardIndex };
  }
  return null;
}

// Shallow-clone every lane and its card array so callers never mutate input.
function cloneLanes(state: BoardState): BoardState {
  return state.map((lane) => ({ ...lane, cards: [...lane.cards] }));
}

// Move a card to another column at a given index (cross-column drop).
export function moveCard(
  state: BoardState,
  cardId: string,
  toColumn: BoardColumn,
  toIndex: number,
): BoardState {
  const found = locate(state, cardId);
  if (!found) return state;
  const targetLaneIndex = state.findIndex((l) => l.column === toColumn);
  if (targetLaneIndex === -1) return state;

  const card: SpecCard = state[found.laneIndex].cards[found.cardIndex];
  const next = cloneLanes(state);
  next[found.laneIndex].cards.splice(found.cardIndex, 1);
  const insertAt = clamp(toIndex, next[targetLaneIndex].cards.length);
  next[targetLaneIndex].cards.splice(insertAt, 0, { ...card, column: toColumn });
  return next;
}

// Reorder a card within its own column (in-column drop).
export function reorderCard(
  state: BoardState,
  cardId: string,
  toIndex: number,
): BoardState {
  const found = locate(state, cardId);
  if (!found) return state;

  const next = cloneLanes(state);
  const [card] = next[found.laneIndex].cards.splice(found.cardIndex, 1);
  const insertAt = clamp(toIndex, next[found.laneIndex].cards.length);
  next[found.laneIndex].cards.splice(insertAt, 0, card);
  return next;
}
