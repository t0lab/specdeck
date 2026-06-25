import { describe, it, expect } from "vitest";

import { SPECS, getSpec, initialBoard } from "@/mock/specs";
import type { BoardColumn } from "@/mock/types";

describe("mock dataset (FR-007 distribution)", () => {
  it("contains 6–8 SpecCards with unique, stable ids", () => {
    expect(SPECS.length).toBeGreaterThanOrEqual(6);
    expect(SPECS.length).toBeLessThanOrEqual(8);
    const ids = SPECS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers all four columns", () => {
    const cols = new Set(SPECS.map((s) => s.column));
    (["backlog", "plan", "review", "done"] as BoardColumn[]).forEach((c) =>
      expect(cols.has(c)).toBe(true),
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

  it("initialBoard returns lanes in column order, partitioning every card", () => {
    const board = initialBoard();
    expect(board.map((l) => l.column)).toEqual([
      "backlog",
      "plan",
      "review",
      "done",
    ]);
    const total = board.reduce((n, l) => n + l.cards.length, 0);
    expect(total).toBe(SPECS.length);
    board.forEach((lane) =>
      lane.cards.forEach((card) => expect(card.column).toBe(lane.column)),
    );
  });
});
