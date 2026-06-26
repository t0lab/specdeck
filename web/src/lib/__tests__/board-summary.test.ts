import { describe, it, expect } from "vitest";

import { boardSummary } from "@/lib/board-summary";
import type { GroupedBoardState } from "@/lib/board-state";
import type { AgentRole, BoardColumn, SpecCard } from "@/mock/types";

function card(
  id: string,
  column: BoardColumn,
  runningAgent?: AgentRole,
): SpecCard {
  return {
    id,
    column,
    title: id,
    goal: "",
    userStories: [],
    requirements: [],
    successCriteria: [],
    tasks: [],
    checks: [],
    ...(runningAgent ? { runningAgent } : {}),
  };
}

// g1: backlog[a,b] + plan[c (builder running)]; g2: review[d], done[e (checker running)]
function base(): GroupedBoardState {
  return [
    {
      groupId: "g1",
      cells: {
        backlog: [card("a", "backlog"), card("b", "backlog")],
        plan: [card("c", "plan", "builder")],
        review: [],
        done: [],
      },
    },
    {
      groupId: "g2",
      cells: {
        backlog: [],
        plan: [],
        review: [card("d", "review")],
        done: [card("e", "done", "checker")],
      },
    },
  ];
}

const emptyBoard: GroupedBoardState = [];

describe("boardSummary", () => {
  it("counts cards per column across all lanes", () => {
    const s = boardSummary(base());
    expect(s.perColumn).toEqual({ backlog: 2, plan: 1, review: 1, done: 1 });
  });

  it("totals every card on the board", () => {
    expect(boardSummary(base()).total).toBe(5);
  });

  it("counts cards with a running agent", () => {
    expect(boardSummary(base()).running).toBe(2);
  });

  it("returns all-zero for an empty board", () => {
    const s = boardSummary(emptyBoard);
    expect(s.perColumn).toEqual({ backlog: 0, plan: 0, review: 0, done: 0 });
    expect(s.total).toBe(0);
    expect(s.running).toBe(0);
  });

  it("returns all-zero when lanes exist but hold no cards", () => {
    const s = boardSummary([
      {
        groupId: "g1",
        cells: { backlog: [], plan: [], review: [], done: [] },
      },
    ]);
    expect(s.total).toBe(0);
    expect(s.running).toBe(0);
  });
});
