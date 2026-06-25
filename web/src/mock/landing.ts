import type { BoardColumn, BoardColumnLane, SpecCard } from "@/mock/types";

// Landing-only mock. The board (specs.ts) dogfoods SpecDeck with its OWN
// feature folders — great for the product, but opaque to a first-time visitor
// ("SSE board live updates"? "Monaco diff viewer"?). The landing instead shows
// the kind of everyday work a team actually hands to agents, so the value reads
// at a glance: agents do the work, you approve it from the Checks + Evidence.
//
// These are illustrative SpecCards: only the fields the landing renders (title,
// badges, checks) carry real content; the spec-detail fields stay empty since
// the landing never opens a detail page. Kept entirely separate from specs.ts.

export const LANDING_SPECS: SpecCard[] = [
  // ── Backlog: ideas waiting to be picked up ────────────────────────────────
  {
    id: "SPEC-101",
    column: "backlog",
    title: "Add a dark mode",
    goal: "Let people switch the app to a dark theme.",
    userStories: [],
    requirements: [],
    successCriteria: [],
    tasks: [],
    checks: [],
  },
  {
    id: "SPEC-102",
    column: "backlog",
    title: "Export my data to a spreadsheet",
    goal: "Download a CSV of my records so I can open it in Excel.",
    userStories: [],
    requirements: [],
    successCriteria: [],
    tasks: [],
    checks: [],
  },

  // ── Plan: an agent is drafting the Spec ───────────────────────────────────
  {
    id: "SPEC-103",
    column: "plan",
    title: "Redesign the signup form",
    runningAgent: "planner",
    goal: "Make signing up shorter and clearer.",
    userStories: [],
    requirements: [],
    successCriteria: [],
    tasks: [],
    checks: [],
  },

  // ── Review: finished work, waiting for your approval ──────────────────────
  // The rich example used by the evidence panel: two real green checks, one
  // pass with NO evidence (must read as not-green), one still pending.
  {
    id: "SPEC-104",
    column: "review",
    title: "Add “Sign in with Google”",
    goal: "Let people sign in with their Google account instead of a password.",
    userStories: [],
    requirements: [],
    successCriteria: [],
    tasks: [],
    checks: [
      {
        id: "CHK-1",
        label: "Signing in with Google works, start to finish",
        state: "pass",
        kind: "evidence",
        evidence: { type: "video", summary: "screen recording of a full sign-in", href: "#" },
      },
      {
        id: "CHK-2",
        label: "Passwords are never written to the logs",
        state: "pass",
        kind: "deterministic",
        evidence: { type: "test", summary: "log-scrub test passes", href: "#" },
      },
      {
        // pass WITHOUT evidence → the panel keeps it not-green on purpose
        id: "CHK-3",
        label: "Looks right on a phone",
        state: "pass",
        kind: "evidence",
      },
      {
        id: "CHK-4",
        label: "The error message is friendly when sign-in fails",
        state: "pending",
        kind: "judge",
      },
    ],
  },
  {
    id: "SPEC-105",
    column: "review",
    title: "Update the pricing page copy",
    fastlane: true,
    goal: "Small wording fix on the pricing page — routed through the Fast lane.",
    userStories: [],
    requirements: [],
    successCriteria: [],
    tasks: [],
    checks: [
      {
        id: "CHK-1",
        label: "New copy reads correctly on the page",
        state: "pass",
        kind: "evidence",
        evidence: { type: "image", summary: "before / after screenshot", href: "#" },
      },
      {
        id: "CHK-2",
        label: "The site still builds",
        state: "pass",
        kind: "deterministic",
        evidence: { type: "log", summary: "build is green", href: "#" },
      },
    ],
  },

  // ── Done: shipped, every check passed with evidence ───────────────────────
  {
    id: "SPEC-106",
    column: "done",
    title: "Email a receipt after each purchase",
    goal: "Send a clear receipt by email as soon as someone pays.",
    userStories: [],
    requirements: [],
    successCriteria: [],
    tasks: [],
    checks: [
      {
        id: "CHK-1",
        label: "A receipt email arrives within a minute",
        state: "pass",
        kind: "evidence",
        evidence: { type: "video", summary: "purchase → inbox in 12s", href: "#" },
      },
      {
        id: "CHK-2",
        label: "The total on the receipt matches the order",
        state: "pass",
        kind: "deterministic",
        evidence: { type: "test", summary: "8 amount-matching tests pass", href: "#" },
      },
      {
        id: "CHK-3",
        label: "The email looks right in Gmail and Outlook",
        state: "pass",
        kind: "evidence",
        evidence: { type: "image", summary: "rendered in both clients", href: "#" },
      },
    ],
  },
];

const COLUMN_ORDER: BoardColumn[] = ["backlog", "plan", "review", "done"];

export function getLandingSpec(id: string): SpecCard | undefined {
  return LANDING_SPECS.find((s) => s.id === id);
}

// Cards grouped by column in display order — the shape the landing preview wants.
export function landingLanes(): BoardColumnLane[] {
  return COLUMN_ORDER.map((column) => ({
    column,
    cards: LANDING_SPECS.filter((s) => s.column === column),
  }));
}
