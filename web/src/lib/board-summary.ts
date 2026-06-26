import type { GroupedBoardState } from "@/lib/board-state";
import type { BoardColumn } from "@/mock/types";

// Pure roll-up of a grouped board for the Project Overview snapshot (FR-010):
// how many cards sit in each column, the total, and how many have an agent
// running. No DOM, no React — unit-tested apart from the views.
const COLUMNS: BoardColumn[] = ["backlog", "plan", "review", "done"];

export interface BoardSummary {
  perColumn: Record<BoardColumn, number>;
  total: number;
  running: number;
}

export function boardSummary(lanes: GroupedBoardState): BoardSummary {
  const perColumn: Record<BoardColumn, number> = {
    backlog: 0,
    plan: 0,
    review: 0,
    done: 0,
  };
  let total = 0;
  let running = 0;

  for (const lane of lanes) {
    for (const column of COLUMNS) {
      const cards = lane.cells[column];
      perColumn[column] += cards.length;
      total += cards.length;
      for (const card of cards) {
        if (card.runningAgent) running++;
      }
    }
  }

  return { perColumn, total, running };
}
