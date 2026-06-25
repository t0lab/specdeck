import type { Check } from "@/mock/types";

// Evidence-gating invariant (Principle I, FR-006/024, SC-004): a Check is
// counted as passed ONLY when it is `pass` AND carries Evidence. A pass that is
// missing Evidence is NOT counted — and per the UI contract it must NEVER show
// green. Centralising the rule here keeps "0 false-green" enforced in one place.
export function checkProgress(checks: Check[]): {
  passed: number;
  total: number;
} {
  const passed = checks.filter(
    (c) => c.state === "pass" && c.evidence != null,
  ).length;
  return { passed, total: checks.length };
}
