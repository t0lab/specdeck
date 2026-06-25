import type { BoardColumn, BoardColumnLane, SpecCard } from "@/mock/types";

// Static mock dataset. SpecDeck dogfoods itself: each card is a SpecDeck
// feature folder, spread across the four columns. This is the single source of
// truth the board, the drawer overview, and the full detail page all read from
// (one truth, two presentations). No persistence — see initialBoard().
//
// Distribution constraints (FR-007), all satisfied below:
//  1. all four columns covered;
//  2. ≥1 Fast lane card, in Review (SPEC-009);
//  3. ≥1 card with a running agent (SPEC-018);
//  4. ≥1 Review card with a `fail` Check AND a `pass` Check missing Evidence
//     (SPEC-016 — demonstrates "missing Evidence = not passed");
//  5. ≥1 Backlog card with no Checks and no diff (SPEC-021);
//  6. ≥1 deep card (many US/FR/SC + prose + Mermaid) (SPEC-014).

export const SPECS: SpecCard[] = [
  // ── Backlog ──────────────────────────────────────────────────────────────
  {
    id: "SPEC-021",
    column: "backlog",
    title: "Keyboard-first command palette",
    goal: "Give power users a `⌘K` palette to jump to any Spec, column, or action without leaving the keyboard. Not yet planned — sitting in Backlog awaiting prioritisation.",
    userStories: [
      {
        id: "US1",
        title: "Jump to a Spec by code",
        priority: "P2",
        narrative:
          "As a reviewer, I want to press a shortcut and type a Spec code so that I land on its detail page instantly.",
        scenarios: [
          {
            given: "the board is focused",
            when: "I press ⌘K and type a known Spec code",
            then: "the matching Spec is highlighted and Enter opens it",
          },
        ],
      },
    ],
    requirements: [
      { id: "FR-001", level: "MUST", text: "Palette opens on ⌘K / Ctrl+K from anywhere in the app." },
      { id: "FR-002", level: "SHOULD", text: "Fuzzy-match Spec code and title." },
    ],
    successCriteria: [
      { id: "SC-001", text: "A reviewer reaches any Spec in ≤3 keystrokes from the board." },
    ],
    edgeCases: ["No match found → palette shows an empty state, never a blank list."],
    assumptions: ["Reuses the existing shadcn `command` primitive."],
    tasks: [
      { id: "T001", phase: "Setup", label: "Spike cmdk integration", done: false },
      { id: "T002", phase: "US1", story: "US1", label: "Wire palette to Spec index", done: false },
    ],
    checks: [],
    // no diff — nothing built yet (Backlog edge case)
  },

  // ── Plan ─────────────────────────────────────────────────────────────────
  {
    id: "SPEC-014",
    column: "plan",
    title: "Async review pipeline",
    goal: [
      "Coordinate Planner → Builder → Checker so a human reviews at the **spec/checklist** layer instead of reading diffs. Each Check that passes MUST carry Evidence; a pass without Evidence is treated as *not passed*.",
      "",
      "```mermaid",
      "flowchart LR",
      "  Planner -->|spec + checks| Builder",
      "  Builder -->|output + evidence| Checker",
      "  Checker -->|verdict| Review[Human review]",
      "  Review -->|approve| Done",
      "  Review -->|reject| Builder",
      "```",
      "",
      "The pipeline is the spine of SpecDeck — every other feature plugs into it.",
    ].join("\n"),
    userStories: [
      {
        id: "US1",
        title: "Review at the intent layer",
        priority: "P1",
        narrative:
          "As a non-developer approver, I want to review a Spec and its Checks so that I can approve work without reading code.",
        whyPriority: "This is the core value proposition — without it the product is just another Kanban board.",
        scenarios: [
          {
            given: "a card sits in Review with all Checks passed and evidenced",
            when: "I open its detail and read the Checks tab",
            then: "I can approve based on Evidence alone, never opening a diff",
          },
          {
            given: "a Check passed but has no Evidence attached",
            when: "I view the Checks tab",
            then: "that Check is flagged as not-passed and never shows green",
          },
        ],
      },
      {
        id: "US2",
        title: "Independent Checker",
        priority: "P2",
        narrative:
          "As a maintainer, I want the Checker to be a different model with its own context so that verification is not self-graded.",
        scenarios: [
          {
            given: "the Builder has produced output",
            when: "the Checker runs",
            then: "it sees only the Spec and output, never the Builder's reasoning",
          },
        ],
      },
      {
        id: "US3",
        title: "Deterministic-first verification",
        priority: "P3",
        narrative:
          "As a maintainer, I want deterministic checks (test/build/lint) to run before any LLM judgement so that cheap signals gate expensive ones.",
        scenarios: [
          {
            given: "a Check set with deterministic and judge checks",
            when: "verification runs",
            then: "deterministic checks run first and short-circuit on failure",
          },
        ],
      },
    ],
    requirements: [
      { id: "FR-001", level: "MUST", text: "Every passed Check carries Evidence (test/log/image/video/html)." },
      { id: "FR-002", level: "MUST", text: "Checker model differs from Builder model and shares no reasoning context." },
      { id: "FR-003", level: "MUST", text: "Verification order is deterministic → evidence → held-out → judge." },
      { id: "FR-004", level: "SHOULD", text: "A rejected card returns to the Builder with the failing Check highlighted." },
      { id: "FR-005", level: "SHOULD", text: "Pipeline emits a structured event contract so the engine can be swapped." },
    ],
    successCriteria: [
      { id: "SC-001", text: "A non-developer approves a real change reviewing only Spec + Evidence." },
      { id: "SC-002", text: "0 Checks ever show green without Evidence (no false-green)." },
      { id: "SC-003", text: "Deterministic failures stop the pipeline before any judge call." },
      { id: "SC-004", text: "Swapping the Builder engine requires no Gateway change." },
    ],
    edgeCases: [
      "Builder and Checker disagree → card stays in Review, surfaced as conflict.",
      "Evidence link is dead → Check is treated as missing Evidence.",
      "All Checks deterministic → no judge call is made at all.",
    ],
    assumptions: [
      "Checkpointer is Postgres-backed (async).",
      "Each Builder runs in its own git worktree.",
    ],
    tasks: [
      { id: "T001", phase: "Setup", label: "Define structured event contract", done: true },
      { id: "T002", phase: "Foundational", label: "Planner node + spec freeze", done: true },
      { id: "T003", phase: "US1", story: "US1", parallel: true, label: "Checks tab evidence-gating", done: false },
      { id: "T004", phase: "US2", story: "US2", label: "Checker context isolation", done: false },
      { id: "T005", phase: "US3", story: "US3", label: "Deterministic-first ordering", done: false },
    ],
    checks: [
      { id: "CHK-1", label: "Event contract schema validates", state: "pass", kind: "deterministic", evidence: { type: "test", summary: "12 schema tests pass", href: "#" }, refs: ["FR-005"] },
      { id: "CHK-2", label: "Planner freezes spec on Done", state: "pending", kind: "deterministic", refs: ["FR-001"] },
      { id: "CHK-3", label: "Checker sees no Builder reasoning", state: "pending", kind: "held-out", refs: ["FR-002"] },
    ],
    // no diff yet — still in Plan
  },
  {
    id: "SPEC-022",
    column: "plan",
    title: "Evidence gallery",
    goal: "A per-Spec gallery that collects every Evidence artifact (screenshots, videos, logs, test reports) so a reviewer can scan proof in one place.",
    userStories: [
      {
        id: "US1",
        title: "Scan all Evidence at once",
        priority: "P2",
        narrative:
          "As a reviewer, I want every Evidence artifact for a Spec in one grid so that I can verify quickly.",
        scenarios: [
          {
            given: "a Spec with image and log Evidence",
            when: "I open its Evidence gallery",
            then: "thumbnails render and each opens its source",
          },
        ],
      },
      {
        id: "US2",
        title: "Filter by Check kind",
        priority: "P3",
        narrative:
          "As a reviewer, I want to filter Evidence by Check kind so that I can focus on held-out results.",
        scenarios: [
          {
            given: "a gallery with mixed Evidence",
            when: "I filter to held-out",
            then: "only held-out Evidence remains",
          },
        ],
      },
    ],
    requirements: [
      { id: "FR-001", level: "MUST", text: "Gallery groups Evidence by its Check." },
      { id: "FR-002", level: "SHOULD", text: "Images and videos render inline; logs open in a viewer." },
      { id: "FR-003", level: "SHOULD", text: "Missing Evidence is shown as a gap, not hidden." },
    ],
    successCriteria: [
      { id: "SC-001", text: "A reviewer locates a specific artifact in under 10 seconds." },
      { id: "SC-002", text: "Missing Evidence is visually obvious." },
    ],
    edgeCases: ["A Spec with zero Evidence → gallery shows an explicit empty state."],
    assumptions: ["Evidence is served by the Gateway; mock uses placeholder links."],
    tasks: [
      { id: "T001", phase: "US1", story: "US1", label: "Gallery grid layout", done: false },
      { id: "T002", phase: "US2", story: "US2", label: "Kind filter", done: false },
    ],
    checks: [
      { id: "CHK-1", label: "Grid renders mixed Evidence types", state: "pending", kind: "deterministic", refs: ["FR-001"] },
    ],
  },

  // ── Review ─────────────────────────────────────────────────────────────────
  {
    id: "SPEC-009",
    column: "review",
    title: "Fix board column drag offset",
    fastlane: true,
    goal: "Cards dropped near a column edge snapped to the wrong index. A small, mechanical fix — routed through the **Fast lane** (spec abbreviated, change is obvious).",
    userStories: [
      {
        id: "US1",
        title: "Drop lands where I aim",
        priority: "P1",
        narrative:
          "As a user, I want a dropped card to land at the position I aimed at so that ordering is predictable.",
        scenarios: [
          {
            given: "I drag a card to the gap between two cards",
            when: "I drop it",
            then: "it lands in that exact gap, not at the column end",
          },
        ],
      },
    ],
    requirements: [
      { id: "FR-001", level: "MUST", text: "Drop index is computed from pointer position, not column length." },
      { id: "FR-002", level: "SHOULD", text: "Keyboard reordering uses the same index logic." },
    ],
    successCriteria: [
      { id: "SC-001", text: "Drop lands at the aimed index in 100% of manual trials." },
    ],
    tasks: [
      { id: "T001", phase: "Fast lane", label: "Correct collision detection origin", done: true },
      { id: "T002", phase: "Fast lane", label: "Regression test for edge drop", done: true },
    ],
    checks: [
      { id: "CHK-1", label: "Edge-drop regression test", state: "pass", kind: "deterministic", evidence: { type: "test", summary: "drag offset test passes", href: "#" }, refs: ["SC-001"] },
      { id: "CHK-2", label: "Build is green", state: "pass", kind: "deterministic", evidence: { type: "log", summary: "next build ok", href: "#" } },
      { id: "CHK-3", label: "Manual drop trial recording", state: "pass", kind: "evidence", evidence: { type: "video", summary: "10/10 drops correct", href: "#" }, refs: ["SC-001"] },
    ],
    diff: [
      {
        path: "web/src/lib/board-state.ts",
        status: "modified",
        patch: [
          "@@ -42,7 +42,7 @@ export function reorderCard(state, cardId, toIndex) {",
          "-  const target = column.cards.length;",
          "+  const target = clampIndex(toIndex, column.cards.length);",
          "   return moveWithin(column, cardId, target);",
        ].join("\n"),
      },
    ],
  },
  {
    id: "SPEC-016",
    column: "review",
    title: "SSE board live updates",
    goal: "Push board changes to every viewer over Server-Sent Events so the deck stays live without refresh. **Currently in Review with a failing Check and an unevidenced pass** — not approvable yet.",
    userStories: [
      {
        id: "US1",
        title: "See changes without refresh",
        priority: "P1",
        narrative:
          "As a viewer, I want card moves to appear live so that the board reflects reality without a manual refresh.",
        scenarios: [
          {
            given: "two viewers on the board",
            when: "one moves a card",
            then: "the other sees the move within a second",
          },
        ],
      },
      {
        id: "US2",
        title: "Survive a dropped connection",
        priority: "P2",
        narrative:
          "As a viewer, I want the stream to reconnect after a network drop so that I don't miss updates.",
        scenarios: [
          {
            given: "an open SSE stream",
            when: "the connection drops and returns",
            then: "the client reconnects and catches up on missed events",
          },
        ],
      },
    ],
    requirements: [
      { id: "FR-001", level: "MUST", text: "Board subscribes to an SSE stream of card events." },
      { id: "FR-002", level: "MUST", text: "Client reconnects automatically after a drop." },
      { id: "FR-003", level: "SHOULD", text: "Missed events are replayed on reconnect." },
    ],
    successCriteria: [
      { id: "SC-001", text: "A move propagates to other viewers in <1s (p95)." },
      { id: "SC-002", text: "No update is lost across a reconnect." },
    ],
    edgeCases: ["Server restart mid-stream → clients reconnect with backoff."],
    assumptions: ["Redis pub/sub fans out events; Gateway bridges to SSE."],
    tasks: [
      { id: "T001", phase: "US1", story: "US1", label: "SSE subscription on board", done: true },
      { id: "T002", phase: "US2", story: "US2", label: "Reconnect with backoff", done: true },
      { id: "T003", phase: "US2", story: "US2", label: "Replay missed events", done: false },
    ],
    checks: [
      { id: "CHK-1", label: "Unit tests for event reducer", state: "pass", kind: "deterministic", evidence: { type: "test", summary: "18 tests pass", href: "#" }, refs: ["FR-001"] },
      // pass WITHOUT evidence — MUST render as not-passed / never green (SC-004)
      { id: "CHK-2", label: "Live propagation under 1s", state: "pass", kind: "evidence", refs: ["SC-001"] },
      // held-out failure with evidence
      { id: "CHK-3", label: "Reconnect catches up missed events", state: "fail", kind: "held-out", evidence: { type: "log", summary: "3 events dropped on reconnect", href: "#" }, refs: ["SC-002", "FR-003"] },
      { id: "CHK-4", label: "Reviewer judges UX of live cursor", state: "pending", kind: "judge" },
    ],
    diff: [
      {
        path: "gateway/sse.py",
        status: "added",
        patch: [
          "@@ -0,0 +1,9 @@",
          "+async def board_stream(request):",
          "+    async def gen():",
          "+        async for ev in redis_sub('board'):",
          "+            yield f'data: {ev}\\n\\n'",
          "+    return EventSourceResponse(gen())",
        ].join("\n"),
      },
      {
        path: "web/src/hooks/use-board-stream.ts",
        status: "added",
        patch: [
          "@@ -0,0 +1,6 @@",
          "+export function useBoardStream(onEvent) {",
          "+  // EventSource + backoff reconnect",
          "+  // TODO: replay missed events (CHK-3 failing)",
          "+}",
        ].join("\n"),
      },
    ],
  },
  {
    id: "SPEC-018",
    column: "review",
    title: "Spec diff Monaco viewer",
    runningAgent: "checker",
    goal: "Render a Spec's diff read-only in a Monaco viewer. The **Checker is currently running** its verification pass on this card (⏳).",
    userStories: [
      {
        id: "US1",
        title: "Read a diff without an editor",
        priority: "P2",
        narrative:
          "As a reviewer who does open diffs occasionally, I want a clean read-only diff so that I can spot-check a change.",
        scenarios: [
          {
            given: "a Spec with a diff",
            when: "I open the Diff tab",
            then: "I see added/modified/deleted files with read-only content",
          },
        ],
      },
      {
        id: "US2",
        title: "No diff yet, no error",
        priority: "P3",
        narrative:
          "As a reviewer, I want a clear empty state when a Spec has no diff so that the tab never looks broken.",
        scenarios: [
          {
            given: "a Spec with no diff",
            when: "I open the Diff tab",
            then: "an explicit empty state is shown",
          },
        ],
      },
    ],
    requirements: [
      { id: "FR-001", level: "MUST", text: "Diff renders read-only (no editing affordances)." },
      { id: "FR-002", level: "MUST", text: "Empty diff shows an explicit empty state." },
      { id: "FR-003", level: "SHOULD", text: "Monaco loads lazily so it never blocks the board." },
    ],
    successCriteria: [
      { id: "SC-001", text: "Diff tab is read-only with no edit cursor." },
      { id: "SC-002", text: "Board first paint is unaffected by Monaco weight." },
    ],
    tasks: [
      { id: "T001", phase: "US1", story: "US1", label: "Lazy Monaco diff view", done: true },
      { id: "T002", phase: "US2", story: "US2", label: "Empty state", done: false },
    ],
    checks: [
      { id: "CHK-1", label: "Diff view is read-only", state: "pass", kind: "deterministic", evidence: { type: "test", summary: "no editable region", href: "#" }, refs: ["SC-001"] },
      { id: "CHK-2", label: "Bundle weight unchanged on board route", state: "running", kind: "deterministic", refs: ["SC-002"] },
      { id: "CHK-3", label: "Checker reviews empty-state copy", state: "running", kind: "judge" },
    ],
    diff: [
      {
        path: "web/src/components/diff/diff-view.tsx",
        status: "added",
        patch: [
          "@@ -0,0 +1,5 @@",
          "+const DiffEditor = dynamic(() => import('@monaco-editor/react').then(m => m.DiffEditor), { ssr: false });",
          "+export function DiffView({ diff }) {",
          "+  if (!diff?.length) return <Empty />;",
          "+}",
        ].join("\n"),
      },
    ],
  },

  // ── Done ───────────────────────────────────────────────────────────────────
  {
    id: "SPEC-007",
    column: "done",
    title: "Brand identity + theming",
    goal: "Establish the SpecDeck mark, colour tokens, and dark/light theming with no flash. Shipped — every Check passed with Evidence and the Spec is frozen.",
    userStories: [
      {
        id: "US1",
        title: "Consistent brand surface",
        priority: "P1",
        narrative:
          "As a user, I want a coherent brand and colour system so that the product feels trustworthy.",
        scenarios: [
          {
            given: "any page",
            when: "I view it in dark or light",
            then: "colours come from tokens and read correctly in both modes",
          },
        ],
      },
      {
        id: "US2",
        title: "No theme flash",
        priority: "P2",
        narrative:
          "As a user, I want no flash of the wrong theme on load so that the experience feels polished.",
        scenarios: [
          {
            given: "a saved theme preference",
            when: "I load any page",
            then: "the correct theme paints immediately, no flash",
          },
        ],
      },
    ],
    requirements: [
      { id: "FR-001", level: "MUST", text: "All colours come from CSS tokens; no hardcoded hex outside globals.css." },
      { id: "FR-002", level: "MUST", text: "Theme is applied before first paint (no FOUC)." },
      { id: "FR-003", level: "SHOULD", text: "Check/Column states are distinguishable in grayscale." },
    ],
    successCriteria: [
      { id: "SC-001", text: "Dark and light both pass AA contrast on text." },
      { id: "SC-002", text: "No theme flash on hard refresh." },
      { id: "SC-003", text: "All status states distinguishable without colour." },
    ],
    tasks: [
      { id: "T001", phase: "Foundational", label: "Token system in globals.css", done: true },
      { id: "T002", phase: "US1", story: "US1", label: "Mark + logo lockup", done: true },
      { id: "T003", phase: "US2", story: "US2", label: "next-themes no-flash", done: true },
    ],
    checks: [
      { id: "CHK-1", label: "Contrast audit AA", state: "pass", kind: "deterministic", evidence: { type: "html", summary: "axe report clean", href: "#" }, refs: ["SC-001"] },
      { id: "CHK-2", label: "No-flash on refresh", state: "pass", kind: "evidence", evidence: { type: "video", summary: "10 refreshes, no flash", href: "#" }, refs: ["SC-002"] },
      { id: "CHK-3", label: "Grayscale legibility", state: "pass", kind: "evidence", evidence: { type: "image", summary: "B&W screenshot, states distinct", href: "#" }, refs: ["SC-003"] },
      { id: "CHK-4", label: "Theme toggle unit test", state: "pass", kind: "deterministic", evidence: { type: "test", summary: "3 tests pass", href: "#" } },
    ],
    diff: [
      {
        path: "web/src/app/globals.css",
        status: "modified",
        patch: [
          "@@ -1,3 +1,7 @@",
          "+:root { --primary: #0a8470; }",
          "+.dark { --primary: #38e8c6; }",
        ].join("\n"),
      },
    ],
  },
];

const COLUMN_ORDER: BoardColumn[] = ["backlog", "plan", "review", "done"];

export function getSpec(id: string): SpecCard | undefined {
  return SPECS.find((s) => s.id === id);
}

// Seed for the in-memory board: cards grouped by column in display order.
// Reload re-derives from SPECS (no persistence — FR-010).
export function initialBoard(): BoardColumnLane[] {
  return COLUMN_ORDER.map((column) => ({
    column,
    cards: SPECS.filter((s) => s.column === column),
  }));
}
