import type { AgentRole } from "@/mock/types";

// The two human-facing triggers SpecDeck cares about: an agent finishing a Task
// ("task-done") and an agent pausing because it needs a human decision
// ("needs-input"); "check-failed" surfaces a red Check on a Spec under Review.
export type NotificationKind = "task-done" | "needs-input" | "check-failed";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  projectId: string;
  /** The Spec this notification is about — links to its detail page. */
  specId: string;
  specTitle: string;
  agent: AgentRole;
  /** One-line, human-facing summary. */
  message: string;
  /** Static relative time (mock — no realtime/SSE per 002 non-goals). */
  ago: string;
  unread: boolean;
}

// Mock notification feed. Static seed (no backend/SSE): refresh re-derives from
// here, nothing persists. All entries point at real Specs on the `specdeck`
// board so clicking through lands on an existing detail page.
export const NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    kind: "needs-input",
    projectId: "specdeck",
    specId: "SPEC-018",
    specTitle: "Spec diff Monaco viewer",
    agent: "checker",
    message: "Checker is blocked — needs your call on the diff viewer scope.",
    ago: "2m",
    unread: true,
  },
  {
    id: "n2",
    kind: "task-done",
    projectId: "specdeck",
    specId: "SPEC-007",
    specTitle: "Brand identity + theming",
    agent: "builder",
    message: "Builder finished — all Checks passed, ready for Review.",
    ago: "18m",
    unread: true,
  },
  {
    id: "n3",
    kind: "check-failed",
    projectId: "specdeck",
    specId: "SPEC-009",
    specTitle: "Fix board column drag offset",
    agent: "checker",
    message: "A Check failed: drop lands one column off on touch devices.",
    ago: "1h",
    unread: true,
  },
  {
    id: "n4",
    kind: "task-done",
    projectId: "specdeck",
    specId: "SPEC-014",
    specTitle: "Async review pipeline",
    agent: "planner",
    message: "Planner drafted the plan — waiting for your approval.",
    ago: "3h",
    unread: false,
  },
];
