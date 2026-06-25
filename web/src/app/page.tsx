import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardList,
  Hammer,
  ShieldCheck,
} from "lucide-react";

import { Logo, Mark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ColumnTag, type BoardColumn } from "@/components/board/column-tag";
import { SpecCardView } from "@/components/board/spec-card-view";
import { ChecksPanel } from "@/components/board/detail/checks-panel";
import { InstallTerminal } from "@/components/landing/install-terminal";
import { HighlightWord } from "@/components/landing/highlight-word";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLandingSpec, landingLanes } from "@/mock/landing";

// Landing (US1). Control-deck aesthetic: a product-led hero showing the board
// the way it actually looks (the same SpecCardView the board renders), then the
// evidence-gating idea proved with the real ChecksPanel, the four-column flow,
// and the Planner → Builder → Checker relay. The cards come from a landing-only
// mock of everyday work (mock/landing.ts), not the dogfood board dataset, so
// the value reads at a glance. Everything is theme-token driven (no raw hex);
// the only accent is brand mint (--primary). Static server component; only
// ThemeToggle and the (non-interactive) cards are client.

const COLUMNS: { column: BoardColumn; blurb: string }[] = [
  { column: "backlog", blurb: "Specs waiting to be planned." },
  {
    column: "plan",
    blurb: "An agent drafts the Spec. Review what is about to be built.",
  },
  {
    column: "review",
    blurb: "An agent finished. Approve at the Check and Evidence layer.",
  },
  { column: "done", blurb: "Shipped and frozen. The Spec is the contract." },
];

const GUARANTEES = [
  "Evidence required: tests, logs, screenshots, video.",
  "An independent Checker verifies, never the Builder.",
  "Deterministic checks run first, judges last.",
];

const PIPELINE: {
  role: string;
  Icon: typeof ClipboardList;
  blurb: string;
  emphasized?: boolean;
}[] = [
  {
    role: "Planner",
    Icon: ClipboardList,
    blurb: "Turns intent into a Spec: Goal, Acceptance, and Checks.",
  },
  {
    role: "Builder",
    Icon: Hammer,
    blurb: "Executes one Spec in isolation. One agent per unit of work.",
  },
  {
    role: "Checker",
    Icon: ShieldCheck,
    blurb:
      "An independent model verifies the Evidence. It never grades its own work.",
    emphasized: true,
  },
];

function BoardPreview() {
  const lanes = landingLanes();

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div className="overflow-hidden rounded-2xl border border-strong/70 bg-ground/40 shadow-2xl shadow-black/20 ring-1 ring-inset ring-border">
        <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 lg:grid-cols-4">
          {lanes.map((lane) => (
            <div key={lane.column} className="flex min-w-0 flex-col gap-2.5">
              <ColumnTag
                column={lane.column}
                count={lane.cards.length}
                className={
                  lane.column === "review" ? "text-primary" : undefined
                }
              />
              {lane.cards.map((card) => (
                <SpecCardView key={card.id} card={card} />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* fade the board into the page, hinting there is more below */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 rounded-b-2xl bg-linear-to-t from-ground to-transparent"
      />
    </div>
  );
}

export default function Home() {
  const evidenceSpec = getLandingSpec("SPEC-104");

  return (
    <div className="flex min-h-full flex-col bg-ground text-foreground">
      {/* ── Nav (single line, ≤64px) ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-ground/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-6">
          <Link href="/" aria-label="SpecDeck home" className="shrink-0">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden text-dim sm:inline-flex",
              )}
            >
              How it works
            </Link>
            <ThemeToggle />
            <Link
              href="/board"
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
            >
              Open the board
              <ArrowRight className="size-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero: product-led, real board preview ─────────────────────── */}
        <section className="relative isolate overflow-hidden border-b border-border/60">
          {/* control-room backdrop: faint dot grid + mint glow, token-driven */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 mask-[radial-gradient(75%_60%_at_50%_0%,black,transparent)]"
            style={{
              backgroundImage:
                "radial-gradient(var(--border) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-105"
            style={{
              background:
                "radial-gradient(50% 70% at 50% 0%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 72%)",
            }}
          />

          <div className="mx-auto w-full max-w-7xl px-6 pb-20 pt-16 lg:pt-24">
            <div className="flex max-w-3xl flex-col items-start gap-5 duration-700 animate-in fade-in slide-in-from-bottom-2">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-mute">
                Async coding agents, on one deck
              </span>
              <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                Your <span className="text-primary">spec</span> is the source
                code now.
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-dim">
                You author the intent; agents turn it into code. Approve at the
                Spec, proven by Evidence.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
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
            </div>

            <div className="mt-12 duration-1000 animate-in fade-in slide-in-from-bottom-4 lg:mt-16">
              <BoardPreview />
            </div>
          </div>
        </section>

        {/* ── Evidence-gating: read the Checks, not the code ────────────── */}
        <section className="border-b border-border/60">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28">
            <div className="flex flex-col gap-5">
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Read the{" "}
                <HighlightWord action="underline">Checks</HighlightWord>, not
                the code.
              </h2>
              <p className="max-w-prose text-base leading-relaxed text-dim sm:text-lg">
                Each Spec carries its Checks and the Evidence behind them. A
                passing Check with no Evidence never counts as green.
              </p>
              <ul className="flex flex-col gap-3 pt-1">
                {GUARANTEES.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft text-primary">
                      <Check className="size-3" />
                    </span>
                    <span className="text-dim">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {evidenceSpec && (
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-(--shadow-card) sm:p-6">
                <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-border pb-3">
                  <span className="font-mono text-xs text-mute tabular-nums">
                    {evidenceSpec.id}
                  </span>
                  <span className="truncate text-sm font-medium tracking-tight">
                    {evidenceSpec.title}
                  </span>
                </div>
                <ChecksPanel checks={evidenceSpec.checks} />
              </div>
            )}
          </div>
        </section>

        {/* ── Four columns, left to right ───────────────────────────────── */}
        <section
          id="how-it-works"
          className="scroll-mt-20 border-b border-border/60"
        >
          <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-28">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Mark className="size-7" />
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Four columns, left to right.
                </h2>
              </div>
              <p className="max-w-2xl text-base text-dim sm:text-lg">
                Every card is one Spec. It moves across the deck as agents pick
                it up, and you review at each gate.
              </p>
            </div>

            <div className="mt-12 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-3">
              {COLUMNS.map(({ column, blurb }, i) => (
                <div
                  key={column}
                  className="flex items-stretch gap-3 lg:flex-1"
                >
                  <div
                    className={cn(
                      "flex flex-1 flex-col gap-3 rounded-xl border p-5",
                      column === "review"
                        ? "border-primary/40 bg-accent-soft"
                        : "border-border bg-surface",
                    )}
                  >
                    <ColumnTag
                      column={column}
                      className={
                        column === "review" ? "text-primary" : undefined
                      }
                    />
                    <p className="text-sm leading-relaxed text-dim">{blurb}</p>
                  </div>
                  {i < COLUMNS.length - 1 && (
                    <ArrowRight
                      className="hidden shrink-0 self-center text-mute lg:block"
                      aria-hidden
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Planner → Builder → Checker relay ─────────────────────────── */}
        <section className="border-b border-border/60">
          <div className="mx-auto w-full max-w-3xl px-6 py-20 lg:py-28">
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Planner, Builder, Checker.
              </h2>
              <p className="text-base text-dim sm:text-lg">
                A pipeline of specialized agents. Verification is independent
                and evidence-gated.
              </p>
            </div>

            <ol className="relative mt-12 flex flex-col gap-8">
              {/* spine the icon nodes punch through */}
              <div
                aria-hidden
                className="absolute bottom-7 left-7 top-7 w-px bg-border"
              />
              {PIPELINE.map(({ role, Icon, blurb, emphasized }) => (
                <li key={role} className="relative flex items-start gap-5">
                  <span
                    className={cn(
                      "z-10 grid size-14 shrink-0 place-items-center rounded-full border-2 bg-ground",
                      emphasized
                        ? "border-primary text-primary"
                        : "border-strong text-dim",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="flex flex-col gap-1.5 pt-2.5">
                    <span className="text-base font-semibold tracking-tight">
                      {role}
                    </span>
                    <p className="max-w-md text-sm leading-relaxed text-dim">
                      {blurb}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Open source: self-host ────────────────────────────────────── */}
        <section className="border-b border-border/60">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
            <div className="flex flex-col gap-5">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-mute">
                Open source
              </span>
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Self-host the whole deck.
              </h2>
              <p className="max-w-prose text-base leading-relaxed text-dim sm:text-lg">
                SpecDeck runs on your own machine. Clone it, drop in your agent
                keys, and bring the full stack up with one command — then reach
                it through your own Cloudflare Tunnel.
              </p>
              <ul className="flex flex-col gap-3 pt-1">
                {[
                  "Postgres, Redis, gateway, agents and web in one compose file.",
                  "Bring your own model keys — they never leave your backend.",
                  "No SaaS, no lock-in. The repo is the system of record.",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft text-primary">
                      <Check className="size-3" />
                    </span>
                    <span className="text-dim">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <InstallTerminal />
          </div>
        </section>

        {/* ── Closing CTA ───────────────────────────────────────────────── */}
        <section className="relative isolate overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-90"
            style={{
              background:
                "radial-gradient(50% 80% at 50% 100%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 72%)",
            }}
          />
          <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center lg:py-32">
            <h2 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Stop reading diffs.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-dim sm:text-lg">
              Open the deck and review what your agents are building, at the
              layer that matters.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/board"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 gap-2 px-7 text-sm",
                )}
              >
                Open the board
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <Logo className="h-7" />
            <p className="text-sm text-mute">
              Your spec is the source code now.
            </p>
          </div>
          <nav className="flex items-center gap-5 text-sm text-dim">
            <Link
              href="/board"
              className="transition-colors hover:text-foreground"
            >
              Board
            </Link>
            <Link
              href="#how-it-works"
              className="transition-colors hover:text-foreground"
            >
              How it works
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
