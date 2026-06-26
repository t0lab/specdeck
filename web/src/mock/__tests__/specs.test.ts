import { describe, it, expect } from "vitest";

import { BOARD_GROUPS, SPECS, getSpec, initialBoard } from "@/mock/specs";
import type { BoardColumn } from "@/mock/types";

const COLUMNS: BoardColumn[] = ["backlog", "plan", "review", "done"];

describe("mock dataset (FR-007 distribution)", () => {
  it("contains enough SpecCards (volume to scroll) with unique, stable ids", () => {
    expect(SPECS.length).toBeGreaterThanOrEqual(20);
    const ids = SPECS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers all four columns", () => {
    const cols = new Set(SPECS.map((s) => s.column));
    COLUMNS.forEach((c) => expect(cols.has(c)).toBe(true));
  });

  it("assigns every card to a known group, and every group has ≥1 card", () => {
    const groupIds = new Set(BOARD_GROUPS.map((g) => g.id));
    SPECS.forEach((s) => expect(groupIds.has(s.group!)).toBe(true));
    BOARD_GROUPS.forEach((g) =>
      expect(SPECS.some((s) => s.group === g.id)).toBe(true),
    );
  });

  it("has ≥1 Fast lane card, and every Fast lane card is in Review (FR-005)", () => {
    const fastlane = SPECS.filter((s) => s.fastlane);
    expect(fastlane.length).toBeGreaterThanOrEqual(1);
    fastlane.forEach((s) => expect(s.column).toBe("review"));
  });

  it("has ≥1 card with a running agent (FR-004)", () => {
    expect(SPECS.some((s) => s.runningAgent != null)).toBe(true);
  });

  it("has ≥1 Review card with a fail Check AND a pass-missing-Evidence Check (SC-004)", () => {
    const match = SPECS.some(
      (s) =>
        s.column === "review" &&
        s.checks.some((c) => c.state === "fail") &&
        s.checks.some((c) => c.state === "pass" && c.evidence == null),
    );
    expect(match).toBe(true);
  });

  it("has ≥1 Backlog card with no Checks and no diff (edge)", () => {
    const match = SPECS.some(
      (s) => s.column === "backlog" && s.checks.length === 0 && s.diff == null,
    );
    expect(match).toBe(true);
  });

  it("has ≥1 deep card: many US/FR/SC + prose with a Mermaid block", () => {
    const deep = SPECS.some(
      (s) =>
        s.userStories.length >= 3 &&
        s.requirements.length >= 5 &&
        s.successCriteria.length >= 3 &&
        s.goal.includes("```mermaid"),
    );
    expect(deep).toBe(true);
  });

  it("getSpec resolves a known id and returns undefined otherwise", () => {
    expect(getSpec(SPECS[0].id)?.id).toBe(SPECS[0].id);
    expect(getSpec("SPEC-DOES-NOT-EXIST")).toBeUndefined();
  });

  it("initialBoard returns one lane per group (in order), partitioning every card by group × column", () => {
    const board = initialBoard();
    expect(board.map((l) => l.groupId)).toEqual(BOARD_GROUPS.map((g) => g.id));

    const total = board.reduce(
      (n, l) => n + COLUMNS.reduce((m, c) => m + l.cells[c].length, 0),
      0,
    );
    expect(total).toBe(SPECS.length);

    // Every card sits in the cell matching its own group and column.
    board.forEach((lane) =>
      COLUMNS.forEach((column) =>
        lane.cells[column].forEach((card) => {
          expect(card.group).toBe(lane.groupId);
          expect(card.column).toBe(column);
        }),
      ),
    );
  });
});
