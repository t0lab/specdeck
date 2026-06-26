import { describe, it, expect } from "vitest";

import {
  filterBoard,
  moveCard,
  type BoardFilter,
  type GroupedBoardState,
} from "@/lib/board-state";
import type { BoardColumn, SpecCard } from "@/mock/types";

function card(id: string, column: BoardColumn, group: string): SpecCard {
  return {
    id,
    column,
    group,
    title: id,
    goal: "",
    userStories: [],
    requirements: [],
    successCriteria: [],
    tasks: [],
    checks: [],
  };
}

// Two groups. g1 spans backlog (a, b) + plan (c); g2 holds one review card (d).
function base(): GroupedBoardState {
  return [
    {
      groupId: "g1",
      cells: {
        backlog: [card("a", "backlog", "g1"), card("b", "backlog", "g1")],
        plan: [card("c", "plan", "g1")],
        review: [],
        done: [],
      },
    },
    {
      groupId: "g2",
      cells: {
        backlog: [],
        plan: [],
        review: [card("d", "review", "g2")],
        done: [],
      },
    },
  ];
}

function cell(state: GroupedBoardState, groupId: string, column: BoardColumn) {
  return state.find((g) => g.groupId === groupId)!.cells[column];
}
function ids(state: GroupedBoardState, groupId: string, column: BoardColumn) {
  return cell(state, groupId, column).map((c) => c.id);
}

describe("moveCard — reorder within a cell", () => {
  it("reorders a card inside its own (group, column) cell", () => {
    const next = moveCard(base(), "a", "g1", "backlog", 1);
    expect(ids(next, "g1", "backlog")).toEqual(["b", "a"]);
  });

  it("clamps an out-of-range index to the end of the cell", () => {
    const next = moveCard(base(), "a", "g1", "backlog", 99);
    expect(ids(next, "g1", "backlog")).toEqual(["b", "a"]);
  });
});

describe("moveCard — across columns, same group", () => {
  it("removes from the source cell and inserts at the target index", () => {
    const next = moveCard(base(), "a", "g1", "plan", 0);
    expect(ids(next, "g1", "plan")).toEqual(["a", "c"]);
    expect(ids(next, "g1", "backlog")).toEqual(["b"]);
  });

  it("updates the moved card's column field", () => {
    const next = moveCard(base(), "a", "g1", "review", 0);
    const moved = cell(next, "g1", "review").find((c) => c.id === "a");
    expect(moved?.column).toBe("review");
    expect(moved?.group).toBe("g1");
  });
});

describe("moveCard — across groups", () => {
  it("moves a card into another group's column, setting both group and column", () => {
    const next = moveCard(base(), "a", "g2", "review", 1);
    expect(ids(next, "g2", "review")).toEqual(["d", "a"]);
    expect(ids(next, "g1", "backlog")).toEqual(["b"]);
    const moved = cell(next, "g2", "review").find((c) => c.id === "a");
    expect(moved?.group).toBe("g2");
    expect(moved?.column).toBe("review");
  });

  it("clamps an out-of-range cross-group index to the end of the target cell", () => {
    const next = moveCard(base(), "a", "g2", "review", 99);
    expect(ids(next, "g2", "review")).toEqual(["d", "a"]);
  });
});

describe("moveCard — invariants", () => {
  it("does not mutate the input state", () => {
    const state = base();
    moveCard(state, "a", "g2", "review", 0);
    expect(ids(state, "g1", "backlog")).toEqual(["a", "b"]);
    expect(ids(state, "g2", "review")).toEqual(["d"]);
  });

  it("returns the original state unchanged for an unknown card", () => {
    const state = base();
    expect(moveCard(state, "zzz", "g1", "plan", 0)).toBe(state);
  });

  it("returns the original state unchanged for an unknown target group", () => {
    const state = base();
    expect(moveCard(state, "a", "ghost", "plan", 0)).toBe(state);
  });

  it("returns the original state unchanged for an unknown target column", () => {
    const state = base();
    expect(moveCard(state, "a", "g1", "nope" as BoardColumn, 0)).toBe(state);
  });
});

function filter(partial: Partial<BoardFilter> = {}): BoardFilter {
  return {
    query: partial.query ?? "",
    statuses: partial.statuses ?? new Set(),
    groups: partial.groups ?? new Set(),
  };
}
function allIds(state: GroupedBoardState): string[] {
  return state.flatMap((l) =>
    (["backlog", "plan", "review", "done"] as BoardColumn[]).flatMap(
      (c) => l.cells[c].map((card) => card.id),
    ),
  );
}

describe("filterBoard", () => {
  it("returns every card when the filter is empty", () => {
    const next = filterBoard(base(), filter());
    expect(allIds(next).sort()).toEqual(["a", "b", "c", "d"]);
    expect(next.map((l) => l.groupId)).toEqual(["g1", "g2"]);
  });

  it("matches the query against id/title and prunes empty lanes", () => {
    const next = filterBoard(base(), filter({ query: "a" }));
    // only card "a" matches; g2 (only "d") is pruned
    expect(allIds(next)).toEqual(["a"]);
    expect(next.map((l) => l.groupId)).toEqual(["g1"]);
  });

  it("keeps only the selected status columns", () => {
    const next = filterBoard(base(), filter({ statuses: new Set(["plan"]) }));
    expect(allIds(next)).toEqual(["c"]); // g1 plan only; g2 has no plan → pruned
  });

  it("keeps only the selected groups, with their cells intact", () => {
    const next = filterBoard(base(), filter({ groups: new Set(["g2"]) }));
    expect(next.map((l) => l.groupId)).toEqual(["g2"]);
    expect(allIds(next)).toEqual(["d"]);
  });
});
