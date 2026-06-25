import { describe, it, expect } from "vitest";

import { checkProgress } from "@/lib/check-progress";
import type { Check } from "@/mock/types";

// Helper: build a Check with sane defaults, overridable per case.
function check(partial: Partial<Check>): Check {
  return {
    id: "c",
    label: "check",
    state: "pending",
    kind: "deterministic",
    ...partial,
  };
}

describe("checkProgress", () => {
  it("counts a pass ONLY when it carries Evidence (SC-004: 0 false-green)", () => {
    const checks: Check[] = [
      check({ id: "a", state: "pass", evidence: { type: "test" } }),
      // pass WITHOUT evidence → must NOT be counted as passed
      check({ id: "b", state: "pass" }),
    ];
    expect(checkProgress(checks)).toEqual({ passed: 1, total: 2 });
  });

  it("returns passed=0 when all checks are pending/running", () => {
    const checks: Check[] = [
      check({ id: "a", state: "pending" }),
      check({ id: "b", state: "running" }),
    ];
    expect(checkProgress(checks)).toEqual({ passed: 0, total: 2 });
  });

  it("does not count fail or non-pass states even with evidence present", () => {
    const checks: Check[] = [
      check({ id: "a", state: "fail", evidence: { type: "log" } }),
      check({ id: "b", state: "pending", evidence: { type: "log" } }),
    ];
    expect(checkProgress(checks)).toEqual({ passed: 0, total: 2 });
  });

  it("handles an empty check list", () => {
    expect(checkProgress([])).toEqual({ passed: 0, total: 0 });
  });

  it("counts multiple evidence-backed passes", () => {
    const checks: Check[] = [
      check({ id: "a", state: "pass", evidence: { type: "test" } }),
      check({ id: "b", state: "pass", evidence: { type: "image" } }),
      check({ id: "c", state: "pass" }), // no evidence → excluded
      check({ id: "d", state: "fail" }),
    ];
    expect(checkProgress(checks)).toEqual({ passed: 2, total: 4 });
  });
});
