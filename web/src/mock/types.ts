// Mock data shape for the SpecDeck web frontend. This is the static, in-memory
// representation of "1 board card = 1 Spec Kit feature folder" — it mirrors the
// structure of spec-template.md / tasks-template.md so the render layer can be
// reused for real Specs later. See data-model.md.
//
// Reuse the unions already owned by the status components — do NOT redefine.
import type { BoardColumn } from "@/components/board/column-tag";
import type { CheckState } from "@/components/board/detail/check-badge";

export type { BoardColumn, CheckState };

export type Priority = "P1" | "P2" | "P3";

// Verify order (FR-023): deterministic → evidence → held-out → judge.
export type CheckKind = "deterministic" | "evidence" | "held-out" | "judge";

export type EvidenceType = "test" | "log" | "image" | "video" | "html";

export type AgentRole = "planner" | "builder" | "checker";

export type DiffStatus = "added" | "modified" | "deleted";

export type ReqLevel = "MUST" | "SHOULD";

// A single Given/When/Then acceptance scenario, rendered as a labelled block.
export interface Scenario {
  given: string;
  when: string;
  then: string;
}

export interface UserStory {
  id: string; // "US1"…
  title: string;
  priority: Priority;
  narrative: string;
  whyPriority?: string;
  scenarios: Scenario[];
}

export interface Requirement {
  id: string; // "FR-001"…
  level: ReqLevel;
  text: string;
}

export interface SuccessCriterion {
  id: string; // "SC-001"…
  text: string;
}

// Mirrors a row of tasks.md.
export interface Task {
  id: string; // "T001"…
  phase: string;
  story?: string; // US ref
  parallel?: boolean;
  label: string;
  done: boolean;
}

// Evidence is the gate for a "pass" (Principle I). A Check counted as passed
// MUST carry Evidence; see the invariant enforced in lib/check-progress.ts.
export interface Evidence {
  type: EvidenceType;
  href?: string;
  summary?: string;
}

export interface Check {
  id: string;
  label: string;
  state: CheckState;
  kind: CheckKind;
  evidence?: Evidence;
  refs?: string[]; // SC/US/FR ids this Check verifies
}

export interface DiffFile {
  path: string;
  status: DiffStatus;
  patch: string; // unified-diff text (mock)
}

// Root entity — one card on the board, mirroring one feature folder.
export interface SpecCard {
  id: string; // display code, e.g. "SPEC-014" — stable; route param /board/[spec]
  column: BoardColumn;
  title: string;
  fastlane?: boolean; // → Fast lane badge; MUST sit in `review` (FR-005)
  runningAgent?: AgentRole; // → ⏳ "running" badge (FR-004)
  goal: string;
  userStories: UserStory[];
  requirements: Requirement[];
  successCriteria: SuccessCriterion[];
  edgeCases?: string[];
  assumptions?: string[];
  tasks: Task[];
  checks: Check[]; // may be empty (Backlog)
  diff?: DiffFile[]; // absent → Diff tab empty state (FR-026)
}

// One column's worth of cards, in display order (seed for the board).
export interface BoardColumnLane {
  column: BoardColumn;
  cards: SpecCard[];
}
