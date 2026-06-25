import Link from "next/link";
import { ArrowRight, ClipboardList, Hammer, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ColumnTag, type BoardColumn } from "@/components/status/column-tag";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Landing (US1). Explains the product — "review specs, not diffs" — the four
// board columns, and the Planner → Builder → Checker pipeline, then sends the
// visitor to /board. Static server component; only ThemeToggle is client.

const COLUMNS: { column: BoardColumn; blurb: string }[] = [
  { column: "backlog", blurb: "Specs waiting to be planned." },
  { column: "plan", blurb: "An agent is drafting the spec — review what's about to be built." },
  { column: "review", blurb: "An agent has finished — approve at the Check + Evidence layer." },
  { column: "done", blurb: "Shipped and frozen. The spec is the contract." },
];

const PIPELINE = [
  {
    role: "Planner",
    Icon: ClipboardList,
    blurb: "Turns intent into a Spec — Goal, Acceptance, and Checks.",
  },
  {
    role: "Builder",
    Icon: Hammer,
    blurb: "Executes one Spec in isolation. One agent per unit of work.",
  },
  {
    role: "Checker",
    Icon: ShieldCheck,
    blurb: "An independent model verifies the Evidence. Never self-grades.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-ground">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-24 px-6 pb-24 pt-12">
        {/* Hero */}
        <section className="flex flex-col items-start gap-6">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-mute">
            Async coding agents, on one deck
          </span>
          <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Review <span className="text-primary">specs</span>,
            <br />
            not{" "}
            <span className="text-mute line-through decoration-mute/40">
              diffs
            </span>
            .
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-dim">
            SpecDeck is a control deck for orchestrating async coding agents.
            You approve work at the spec and checklist layer — read the Goal,
            the Checks, and their Evidence. You never have to read a diff.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/board"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 gap-2 px-6 text-sm",
              )}
            >
              Open the board
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "h-11 px-4 text-sm text-dim",
              )}
            >
              How it works
            </Link>
          </div>
        </section>

        {/* Four columns */}
        <section id="how-it-works" className="flex scroll-mt-20 flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Four columns, left to right
            </h2>
            <p className="text-dim">
              Each card is one Spec. Work flows across the deck as agents pick
              it up.
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COLUMNS.map(({ column, blurb }) => (
              <li
                key={column}
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-(--shadow-card)"
              >
                <ColumnTag column={column} />
                <p className="text-sm leading-relaxed text-dim">{blurb}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Pipeline */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Planner → Builder → Checker
            </h2>
            <p className="text-dim">
              A pipeline of specialized agents. Verification is independent and
              evidence-gated.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center">
            {PIPELINE.map(({ role, Icon, blurb }, i) => (
              <div key={role} className="flex flex-1 items-center gap-4">
                <div className="flex flex-1 flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-(--shadow-card)">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-lg bg-accent-soft text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className="font-medium tracking-tight">{role}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-dim">{blurb}</p>
                </div>
                {i < PIPELINE.length - 1 && (
                  <ArrowRight
                    className="hidden size-5 shrink-0 text-mute md:block"
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 py-8">
        <p className="text-sm text-mute">SpecDeck — review specs, not diffs.</p>
      </footer>
    </div>
  );
}
