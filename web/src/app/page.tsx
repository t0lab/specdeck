import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import {
  CheckBadge,
  type CheckState,
} from "@/components/status/check-badge";
import {
  ColumnTag,
  type BoardColumn,
} from "@/components/status/column-tag";
import { EvidenceChip } from "@/components/status/evidence-chip";

// Mock content only — illustrates the design system on the surfaces it will skin.
// The real board + data layer is a later feature (see spec Assumptions).
type Check = {
  label: string;
  state: CheckState;
  evidence?: string;
  missingEvidence?: boolean;
};
type SpecCard = {
  id: string;
  title: string;
  checks: Check[];
  fastlane?: boolean;
};
type Column = { column: BoardColumn; cards: SpecCard[] };

const BOARD: Column[] = [
  {
    column: "backlog",
    cards: [
      { id: "SPEC-021", title: "Export board as weekly digest", checks: [] },
      { id: "SPEC-022", title: "Keyboard-only navigation", checks: [] },
    ],
  },
  {
    column: "plan",
    cards: [
      {
        id: "SPEC-018",
        title: "Magic-link login",
        fastlane: true,
        checks: [
          { label: "Acceptance soạn xong", state: "pass", evidence: "#" },
          { label: "Rate-limit policy", state: "pending" },
        ],
      },
    ],
  },
  {
    column: "review",
    cards: [
      {
        id: "SPEC-014",
        title: "Realtime SSE xuống board",
        checks: [
          { label: "Build + typecheck", state: "pass", evidence: "#" },
          { label: "E2E reconnect flow", state: "running" },
          { label: "Load test 1k clients", state: "pass", missingEvidence: true },
        ],
      },
      {
        id: "SPEC-016",
        title: "Checker chạy độc lập model",
        checks: [
          { label: "Held-out checks", state: "fail", evidence: "#" },
          { label: "Prompt-injection guard", state: "pending" },
        ],
      },
    ],
  },
  {
    column: "done",
    cards: [
      {
        id: "SPEC-009",
        title: "Spec contract schema",
        checks: [
          { label: "Unit + contract tests", state: "pass", evidence: "#" },
          { label: "Migration applied", state: "pass", evidence: "#" },
        ],
      },
    ],
  },
];

function CheckRow({ check }: { check: Check }) {
  // Principle I: a pass-worthy Check missing Evidence must not read as pass.
  const showMissing = check.state === "pass" && check.missingEvidence;
  return (
    <li className="flex items-center justify-between gap-3 py-1">
      <CheckBadge
        state={showMissing ? "pending" : check.state}
        className="min-w-0"
      />
      <span className="min-w-0 flex-1 truncate text-xs text-dim">
        {check.label}
      </span>
      {showMissing ? (
        <EvidenceChip missing />
      ) : (
        check.state === "pass" &&
        check.evidence && <EvidenceChip href={check.evidence} label="xem" />
      )}
    </li>
  );
}

function Card({ card }: { card: SpecCard }) {
  return (
    <article className="rounded-md border border-border bg-surface p-3 shadow-(--shadow-card) transition-colors hover:border-strong">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs text-mute tabular-nums">
          {card.id}
        </span>
        {card.checks.length > 0 && (
          <span className="font-mono text-xs text-mute tabular-nums">
            {card.checks.filter((c) => c.state === "pass" && !c.missingEvidence)
              .length}
            /{card.checks.length}
          </span>
        )}
      </div>
      <h3 className="mt-1 text-sm font-medium leading-snug tracking-tight">
        {card.title}
      </h3>
      {card.fastlane && (
        <Badge variant="outline" className="mt-2 border-fastlane/40 text-fastlane">
          Fast lane
        </Badge>
      )}
      {card.checks.length > 0 && (
        <ul className="mt-2 border-t border-border/60 pt-1.5">
          {card.checks.map((check) => (
            <CheckRow key={check.label} check={check} />
          ))}
        </ul>
      )}
    </article>
  );
}

export default function Home() {
  return (
    <div className="min-h-full bg-ground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Logo />
          <span className="font-mono text-xs text-mute">
            review specs, not diffs
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {BOARD.map(({ column, cards }) => (
            <section key={column} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <ColumnTag column={column} count={cards.length} />
              </div>
              <div className="flex flex-col gap-3">
                {cards.map((card) => (
                  <Card key={card.id} card={card} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
