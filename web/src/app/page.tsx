import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardList,
  Hammer,
  Info,
  ShieldCheck,
} from "lucide-react";

import { AppBar } from "@/components/app-bar";
import { Logo, Mark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ColumnTag, type BoardColumn } from "@/components/board/column-tag";
import { SpecCardView } from "@/components/board/spec-card-view";
import { ChecksPanel } from "@/components/board/detail/checks-panel";
import { InstallTerminal } from "@/components/landing/install-terminal";
import { HighlightWord } from "@/components/landing/highlight-word";
import { buttonVariants } from "@/components/ui/button";
import { checkProgress } from "@/lib/check-progress";
import { cn } from "@/lib/utils";
import { getLandingSpec, landingLanes } from "@/mock/landing";

// Landing (US1). Control-deck aesthetic: a product-led hero showing the board
// the way it actually looks (the same SpecCardView the board renders), then the
// evidence-gating idea proved with the real ChecksPanel, the four-column flow,
// and the Planner → Builder → Checker relay. The cards come from a landing-only
// mock of everyday work (mock/landing.ts), not the dogfood board dataset, so
// the value reads at a glance. Everything is theme-token driven (no raw hex);
// the only accent is brand mint (--primary). Sections are separated by spacing,
// kickers, elevated panels, and center-fading hairlines — never a full-bleed
// border rule. Static server component; only ThemeToggle and the
// (non-interactive) cards are client.

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

// Mono section label — the consistent "designed" cue that opens each section,
// replacing reliance on full-bleed divider rules for rhythm.
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-xs uppercase tracking-[0.2em] text-mute">
      {children}
    </span>
  );
}

// Refined section break: a center-weighted hairline that fades at both edges and
// is inset to the content column — the tasteful replacement for a cheap
// edge-to-edge `border-b`.
function Divider() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6">
      <div
        aria-hidden
        className="h-px bg-linear-to-r from-transparent via-border to-transparent"
      />
    </div>
  );
}

function BoardPreview() {
  const lanes = landingLanes();

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div className="overflow-hidden rounded-2xl border border-strong/70 bg-surface/60 ring-1 ring-inset ring-border backdrop-blur-sm">
        {/* window chrome — reads as a real product screenshot and nods to the
            self-host story (the deck runs on your own localhost) */}
        <div className="flex items-center gap-3 border-b border-border bg-ground/50 px-4 py-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="size-3 rounded-full bg-strong/70" />
            <span className="size-3 rounded-full bg-strong/50" />
            <span className="size-3 rounded-full bg-strong/40" />
          </div>
          <div className="flex flex-1 justify-center">
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              <span className="font-mono text-xs text-mute">
                localhost:3000/board
              </span>
            </div>
          </div>
          {/* balances the traffic dots so the URL pill stays centered */}
          <div className="hidden w-10.5 shrink-0 sm:block" aria-hidden />
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 lg:grid-cols-4">
          {lanes.map((lane) => (
            <div key={lane.column} className="flex min-w-0 flex-col gap-2.5">
              <div className="flex items-center rounded-md bg-ground/40 px-2 py-1.5">
                <ColumnTag
                  column={lane.column}
                  count={lane.cards.length}
                  className={
                    lane.column === "review" ? "text-primary" : undefined
                  }
                />
              </div>
              {lane.cards.map((card) => (
                <SpecCardView key={card.id} card={card} />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Fade the board into the page (the dark-mode "dissolve" effect): a plain
          color overlay to --ground, which blends in both themes. The drop
          shadow stays removed so the bottom edge no longer pools in light mode. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 rounded-b-2xl bg-linear-to-t from-ground via-ground/80 to-transparent"
      />
    </div>
  );
}

export default function Home() {
  const evidenceSpec = getLandingSpec("SPEC-104");
  const evidenceProgress = evidenceSpec
    ? checkProgress(evidenceSpec.checks)
    : { passed: 0, total: 0 };

  return (
    <div className="flex min-h-full flex-col bg-ground text-foreground">
      <AppBar>
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
      </AppBar>

      <main className="flex-1">
        {/* ── Hero: product-led, real board preview ─────────────────────── */}
        <section className="relative isolate overflow-hidden">
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
              <Kicker>Async coding agents, on one deck</Kicker>
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
        <section>
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28">
            <div className="flex flex-col gap-5">
              <Kicker>Evidence</Kicker>
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
              <div className="relative">
                {/* soft mint halo so the proof panel reads as the focal point */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-4 -z-10"
                  style={{
                    background:
                      "radial-gradient(60% 60% at 70% 30%, color-mix(in oklab, var(--primary) 10%, transparent), transparent 70%)",
                  }}
                />
                <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-black/10 sm:p-6">
                  {/* what we are looking at: one Spec sitting in Review */}
                  <div className="mb-4 flex flex-col gap-2 border-b border-border pb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-mute tabular-nums">
                        {evidenceSpec.id}
                      </span>
                      <ColumnTag column="review" className="text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight">
                      {evidenceSpec.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-mute">
                      {evidenceSpec.goal}
                    </p>
                  </div>

                  <ChecksPanel checks={evidenceSpec.checks} />

                  {/* the teaching moment, spelled out: pass ≠ green without Evidence */}
                  <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-border bg-surface-2 p-3">
                    <Info
                      className="mt-0.5 size-4 shrink-0 text-mute"
                      aria-hidden
                    />
                    <p className="text-sm leading-relaxed text-dim">
                      <span className="font-medium text-foreground">
                        &ldquo;The receipt shows the right total&rdquo;
                      </span>{" "}
                      is marked pass by the agent — but with no Evidence attached
                      it stays amber and out of the score. Only{" "}
                      <span className="font-medium text-foreground">
                        {evidenceProgress.passed} of {evidenceProgress.total}
                      </span>{" "}
                      Checks count as truly green.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <Divider />

        {/* ── Four columns, left to right ───────────────────────────────── */}
        <section id="how-it-works" className="scroll-mt-20">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-28">
            <div className="flex flex-col gap-3">
              <Kicker>The deck</Kicker>
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

            <ol className="mt-12 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-3">
              {COLUMNS.map(({ column, blurb }, i) => {
                const review = column === "review";
                return (
                  <li
                    key={column}
                    className="flex items-stretch gap-3 lg:flex-1"
                  >
                    <div
                      className={cn(
                        "relative flex flex-1 flex-col gap-3 rounded-xl border p-5 transition-colors",
                        review
                          ? "border-primary/50 bg-accent-soft shadow-(--shadow-card)"
                          : "border-border bg-surface",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <ColumnTag
                          column={column}
                          className={review ? "text-primary" : undefined}
                        />
                        <span className="font-mono text-xs text-mute tabular-nums">
                          0{i + 1}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-dim">{blurb}</p>
                      {review && (
                        <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          <span
                            className="size-1.5 rounded-full bg-primary"
                            aria-hidden
                          />
                          You review here
                        </span>
                      )}
                    </div>
                    {i < COLUMNS.length - 1 && (
                      <ArrowRight
                        className="hidden shrink-0 self-center text-strong lg:block"
                        aria-hidden
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <Divider />

        {/* ── Planner → Builder → Checker relay ─────────────────────────── */}
        <section>
          <div className="mx-auto w-full max-w-3xl px-6 py-20 lg:py-28">
            <div className="flex flex-col gap-3">
              <Kicker>The pipeline</Kicker>
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

        <Divider />

        {/* ── Open source: self-host ────────────────────────────────────── */}
        <section>
          <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
            <div className="flex flex-col gap-5">
              <Kicker>Open source</Kicker>
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

        {/* ── Closing CTA — a deliberate framed panel, not loose text ────── */}
        <section className="px-6 pb-24 pt-4 lg:pb-32">
          <div className="relative isolate mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-surface px-6 py-16 text-center shadow-2xl shadow-black/10 sm:px-12 lg:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 mask-[radial-gradient(70%_60%_at_50%_45%,black,transparent)]"
              style={{
                backgroundImage:
                  "radial-gradient(var(--border) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3"
              style={{
                background:
                  "radial-gradient(50% 90% at 50% 100%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 72%)",
              }}
            />
            <Kicker>Get started</Kicker>
            <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Stop reading diffs.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-dim sm:text-lg">
              Open the deck and review what your agents are building, at the
              layer that matters.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
              <Link
                href="#how-it-works"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "h-12 px-5 text-sm text-dim",
                )}
              >
                How it works
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
