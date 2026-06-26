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
  {
    id: "SPEC-107",
    column: "backlog",
    title: "Speed up the dashboard load",
    goal: "Make the dashboard open in under a second.",
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
  {
    id: "SPEC-108",
    column: "plan",
    title: "Bulk-edit the contacts list",
    goal: "Let people select many contacts and edit them at once.",
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
    title: "Let customers check out with a saved card",
    goal: "Let people pay with a card they have already saved, in one step.",
    userStories: [],
    requirements: [],
    successCriteria: [],
    tasks: [],
    checks: [
      {
        id: "CHK-1",
        label: "The amount charged matches the cart",
        state: "pass",
        kind: "deterministic",
        evidence: { type: "test", summary: "12 amount-matching tests pass", href: "#" },
      },
      {
        id: "CHK-2",
        label: "A customer completes a purchase, start to finish",
        state: "pass",
        kind: "evidence",
        evidence: { type: "video", summary: "screen recording of a full checkout", href: "#" },
      },
      {
        // pass WITHOUT evidence → the panel keeps it not-green on purpose
        id: "CHK-3",
        label: "The receipt shows the right total",
        state: "pass",
        kind: "evidence",
      },
      {
        id: "CHK-4",
        label: "The decline message is clear and helpful",
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
  {
    // a review that is NOT all-green — a failing Check reads red, so the demo
    // board shows real variety (not every card is a happy path).
    id: "SPEC-109",
    column: "review",
    title: "Fix the broken avatar upload",
    goal: "Uploading a profile photo should just work.",
    userStories: [],
    requirements: [],
    successCriteria: [],
    tasks: [],
    checks: [
      {
        id: "CHK-1",
        label: "Uploading a JPG or PNG works",
        state: "pass",
        kind: "evidence",
        evidence: { type: "image", summary: "before / after avatar", href: "#" },
      },
      {
        id: "CHK-2",
        label: "Oversized files are rejected with a clear message",
        state: "fail",
        kind: "deterministic",
        evidence: { type: "log", summary: "rejection test failing", href: "#" },
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
  {
    id: "SPEC-110",
    column: "done",
    title: "Add two-factor authentication",
    goal: "Let people protect their account with a second factor.",
    userStories: [],
    requirements: [],
    successCriteria: [],
    tasks: [],
    checks: [
      {
        id: "CHK-1",
        label: "Signing in asks for the second factor",
        state: "pass",
        kind: "evidence",
        evidence: { type: "video", summary: "full 2FA sign-in", href: "#" },
      },
      {
        id: "CHK-2",
        label: "Backup codes are generated and valid",
        state: "pass",
        kind: "deterministic",
        evidence: { type: "test", summary: "backup-code tests pass", href: "#" },
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
