import { describe, it, expect } from "vitest";

import { moveCard, reorderCard, type BoardState } from "@/lib/board-state";
import type { BoardColumn, SpecCard } from "@/mock/types";

function card(id: string, column: BoardColumn): SpecCard {
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
  };
}

function base(): BoardState {
  return [
    { column: "backlog", cards: [card("a", "backlog"), card("b", "backlog")] },
    { column: "plan", cards: [card("c", "plan")] },
    { column: "review", cards: [] },
    { column: "done", cards: [] },
  ];
}

function lane(state: BoardState, column: BoardColumn) {
  return state.find((l) => l.column === column)!;
}
function ids(state: BoardState, column: BoardColumn) {
  return lane(state, column).cards.map((c) => c.id);
}

describe("moveCard (cross-column)", () => {
  it("removes the card from its source column and inserts at the target index", () => {
    const next = moveCard(base(), "a", "plan", 0);
    expect(ids(next, "plan")).toEqual(["a", "c"]);
    expect(ids(next, "backlog")).toEqual(["b"]);
  });

  it("updates the moved card's column field", () => {
    const next = moveCard(base(), "a", "review", 0);
    const moved = lane(next, "review").cards.find((c) => c.id === "a");
    expect(moved?.column).toBe("review");
  });

  it("clamps an out-of-range index to the end of the target column", () => {
    const next = moveCard(base(), "a", "plan", 99);
    expect(ids(next, "plan")).toEqual(["c", "a"]);
  });

  it("does not mutate the input state", () => {
    const state = base();
    moveCard(state, "a", "plan", 0);
    expect(ids(state, "backlog")).toEqual(["a", "b"]);
    expect(ids(state, "plan")).toEqual(["c"]);
  });

  it("returns the original state unchanged for an unknown card (invalid drop)", () => {
    const state = base();
    const next = moveCard(state, "zzz", "plan", 0);
    expect(next).toBe(state);
  });

  it("returns the original state unchanged for an unknown target column", () => {
    const state = base();
    const next = moveCard(state, "a", "nope" as BoardColumn, 0);
    expect(next).toBe(state);
  });
});

describe("reorderCard (in-column)", () => {
  it("reorders a card within its own column", () => {
    const next = reorderCard(base(), "a", 1);
    expect(ids(next, "backlog")).toEqual(["b", "a"]);
  });

  it("clamps an out-of-range index to the end", () => {
    const next = reorderCard(base(), "a", 99);
    expect(ids(next, "backlog")).toEqual(["b", "a"]);
  });

  it("returns the original state unchanged for an unknown card", () => {
    const state = base();
    expect(reorderCard(state, "zzz", 0)).toBe(state);
  });

  it("does not mutate the input state", () => {
    const state = base();
    reorderCard(state, "a", 1);
    expect(ids(state, "backlog")).toEqual(["a", "b"]);
  });
});
