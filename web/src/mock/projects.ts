// Mock workspace: the list of Projects and their per-Project board data. A
// Project is a workspace (identity + Project Context) that OWNS a board dataset.
// 002's single board becomes the dogfood Project "specdeck"; a second Project
// ("helix") carries a different, lighter dataset so data isolation (SC-002) and
// project-switching are observable. Mock-only — no persistence; new Projects
// created in-session live in WorkspaceProvider, not here.
import type { GroupedBoardState } from "@/lib/board-state";
import type { BoardColumn, BoardGroup, SpecCard } from "@/mock/types";
import { BOARD_GROUPS, initialBoard } from "@/mock/specs";

// Identity + Project Context. Does NOT carry board data (that lives in the
// per-Project dataset below, keyed by id) — keeps the mutable workspace list
// light and separate from the heavy seed board content.
export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  repo: string;
  defaultBranch: string;
  color: string; // accent / avatar color (hex)
  context: string; // Project Context — luật chung mọi Spec kế thừa
}

export const DEFAULT_PROJECT_ID = "specdeck";

export const PROJECTS: ProjectMeta[] = [
  {
    id: "specdeck",
    name: "SpecDeck",
    description: "The control deck itself — dogfooding the board on its own specs.",
    repo: "github.com/t0lab/specdeck",
    defaultBranch: "main",
    color: "#38e8c6",
    context:
      "Review at the Spec & Evidence layer, never raw diffs. Every passing Check needs Evidence. Conventional Commits; spec-driven (Spec Kit) before code. UI labels in English.",
  },
  {
    id: "helix",
    name: "Helix Gateway",
    description: "Event ingest + delivery service. A separate codebase on the same deck.",
    repo: "github.com/t0lab/helix",
    defaultBranch: "develop",
    color: "#f5a524",
    context:
      "Backend-only. All secrets stay server-side. Deterministic checks (build/test/lint) gate every Check before evidence review.",
  },
];

const COLUMN_ORDER: BoardColumn[] = ["backlog", "plan", "review", "done"];

function buildLanes(
  groups: BoardGroup[],
  specs: SpecCard[],
): GroupedBoardState {
  return groups.map((group) => {
    const cells: Record<BoardColumn, SpecCard[]> = {
      backlog: [],
      plan: [],
      review: [],
      done: [],
    };
    for (const column of COLUMN_ORDER) {
      cells[column] = specs.filter(
        (s) => s.group === group.id && s.column === column,
      );
    }
    return { groupId: group.id, cells };
  });
}

// ── Project "helix" — a deliberately different, lighter dataset ──────────────
const HELIX_GROUPS: BoardGroup[] = [
  { id: "ingest", label: "Event ingest" },
  { id: "delivery", label: "Delivery & webhooks" },
];

function mk(
  id: string,
  group: string,
  column: BoardColumn,
  title: string,
  extra: Partial<SpecCard> = {},
): SpecCard {
  return {
    id,
    group,
    column,
    title,
    goal: "",
    userStories: [],
    requirements: [],
    successCriteria: [],
    tasks: [],
    checks: [],
    ...extra,
  };
}

const HELIX_SPECS: SpecCard[] = [
  mk("HX-01", "ingest", "backlog", "Batch ingest endpoint"),
  mk("HX-02", "ingest", "plan", "Idempotency keys for replays"),
  mk("HX-03", "ingest", "review", "Dead-letter queue for poison events", {
    checks: [
      {
        id: "c1",
        label: "DLQ retains failed payloads",
        state: "pass",
        kind: "deterministic",
        evidence: { type: "test", summary: "dlq_spec.rb green" },
      },
      {
        id: "c2",
        label: "Alert fires on DLQ growth",
        state: "pending",
        kind: "evidence",
      },
    ],
  }),
  mk("HX-04", "ingest", "done", "Schema registry validation"),
  mk("HX-05", "delivery", "plan", "Signed webhook delivery", {
    runningAgent: "builder",
  }),
  mk("HX-06", "delivery", "review", "Exponential backoff on 5xx", {
    fastlane: true,
    checks: [
      {
        id: "c1",
        label: "Backoff caps at 1h",
        state: "pass",
        kind: "deterministic",
        evidence: { type: "log", summary: "retry trace" },
      },
    ],
  }),
];

interface BoardData {
  groups: BoardGroup[];
  lanes: GroupedBoardState;
}

export function getProject(id: string): ProjectMeta | undefined {
  return PROJECTS.find((p) => p.id === id);
}

// Resolve one Spec within a Project's dataset (project-aware detail / sheet).
// Unknown project or spec → undefined.
export function getSpecFor(
  projectId: string,
  specId: string,
): SpecCard | undefined {
  const { lanes } = boardDataFor(projectId);
  for (const lane of lanes) {
    for (const column of COLUMN_ORDER) {
      const hit = lane.cells[column].find((s) => s.id === specId);
      if (hit) return hit;
    }
  }
  return undefined;
}

// Per-Project board data, fresh on each call. Unknown id (a Project created
// in-session, or a typo) → empty board (FR-013/017).
export function boardDataFor(id: string): BoardData {
  if (id === "specdeck") {
    return { groups: BOARD_GROUPS, lanes: initialBoard() };
  }
  if (id === "helix") {
    return { groups: HELIX_GROUPS, lanes: buildLanes(HELIX_GROUPS, HELIX_SPECS) };
  }
  return { groups: [], lanes: [] };
}
