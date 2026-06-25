import { Streamdown } from "streamdown";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Priority, ReqLevel, SpecCard } from "@/mock/types";

// Spec tab (US4). Renders a Spec from STRUCTURED data (not raw markdown) so it
// reads at a glance: Goal, User Stories with priority chips, Given/When/Then
// blocks, FR/SC with mono ids, Edge/Assumptions, and a collapsible Tasks list.
// Only free prose (the Goal) goes through streamdown for markdown + Mermaid.
// A sticky TOC navigates the sections (SC-006: locate without reading raw md).

const PRIORITY_STYLE: Record<Priority, string> = {
  P1: "border-primary/40 text-primary",
  P2: "border-warn/40 text-warn",
  P3: "border-strong text-mute",
};

function PriorityChip({ priority }: { priority: Priority }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-mono tabular-nums", PRIORITY_STYLE[priority])}
    >
      {priority}
    </Badge>
  );
}

function LevelTag({ level }: { level: ReqLevel }) {
  return (
    <span
      className={cn(
        "shrink-0 font-mono text-[0.7rem]",
        level === "MUST" ? "text-foreground/80" : "text-mute",
      )}
    >
      {level}
    </span>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export function SpecView({ spec }: { spec: SpecCard }) {
  const doneTasks = spec.tasks.filter((t) => t.done).length;

  // Build the TOC from sections that actually exist on this Spec.
  const toc: { id: string; label: string }[] = [
    { id: "goal", label: "Goal" },
    { id: "stories", label: "User Stories" },
    { id: "requirements", label: "Requirements" },
    { id: "success", label: "Success Criteria" },
    ...(spec.edgeCases?.length ? [{ id: "edge", label: "Edge Cases" }] : []),
    ...(spec.assumptions?.length
      ? [{ id: "assumptions", label: "Assumptions" }]
      : []),
    ...(spec.tasks.length ? [{ id: "tasks", label: "Tasks" }] : []),
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[170px_1fr]">
      <aside className="hidden lg:block">
        <nav className="sticky top-20 flex flex-col gap-1.5 border-l border-border pl-4 text-sm">
          {toc.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="text-mute transition-colors hover:text-foreground"
            >
              {t.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col gap-8">
        <Section id="goal" title="Goal">
          {/* prose + Mermaid via streamdown */}
          <div className="text-sm leading-relaxed text-dim">
            <Streamdown>{spec.goal}</Streamdown>
          </div>
        </Section>

        <Section id="stories" title="User Stories">
          <div className="flex flex-col gap-5">
            {spec.userStories.map((us) => (
              <article key={us.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <PriorityChip priority={us.priority} />
                  <span className="font-mono text-xs text-mute">{us.id}</span>
                  <h3 className="text-sm font-medium tracking-tight">
                    {us.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-dim">
                  {us.narrative}
                </p>
                {us.whyPriority && (
                  <p className="text-xs italic text-mute">
                    Why this priority: {us.whyPriority}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  {us.scenarios.map((sc, i) => (
                    <dl
                      key={i}
                      className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md border border-border bg-surface-2 p-3 text-sm"
                    >
                      {(
                        [
                          ["Given", sc.given],
                          ["When", sc.when],
                          ["Then", sc.then],
                        ] as const
                      ).map(([label, text]) => (
                        <div key={label} className="contents">
                          <dt className="font-mono text-[0.7rem] uppercase tracking-wide text-mute">
                            {label}
                          </dt>
                          <dd className="text-dim">{text}</dd>
                        </div>
                      ))}
                    </dl>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section id="requirements" title="Requirements">
          <ul className="flex flex-col divide-y divide-border/60">
            {spec.requirements.map((r) => (
              <li key={r.id} className="flex items-start gap-3 py-2 text-sm">
                <span className="shrink-0 font-mono text-xs text-evidence">
                  {r.id}
                </span>
                <span className="flex-1 text-dim">{r.text}</span>
                <LevelTag level={r.level} />
              </li>
            ))}
          </ul>
        </Section>

        <Section id="success" title="Success Criteria">
          <ul className="flex flex-col divide-y divide-border/60">
            {spec.successCriteria.map((s) => (
              <li key={s.id} className="flex items-start gap-3 py-2 text-sm">
                <span className="shrink-0 font-mono text-xs text-evidence">
                  {s.id}
                </span>
                <span className="flex-1 text-dim">{s.text}</span>
              </li>
            ))}
          </ul>
        </Section>

        {spec.edgeCases?.length ? (
          <Section id="edge" title="Edge Cases">
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-dim">
              {spec.edgeCases.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </Section>
        ) : null}

        {spec.assumptions?.length ? (
          <Section id="assumptions" title="Assumptions">
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-dim">
              {spec.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </Section>
        ) : null}

        {spec.tasks.length ? (
          <Section id="tasks" title="Tasks">
            <details className="group rounded-lg border border-border bg-surface">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3 text-sm font-medium">
                <span>Tasks</span>
                <span className="font-mono text-xs text-mute tabular-nums">
                  {doneTasks}/{spec.tasks.length} done
                </span>
              </summary>
              <ul className="flex flex-col divide-y divide-border/60 border-t border-border">
                {spec.tasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm"
                  >
                    <span
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded-sm border text-[0.6rem]",
                        t.done
                          ? "border-check-pass bg-check-pass text-background"
                          : "border-strong",
                      )}
                      aria-hidden
                    >
                      {t.done ? "✓" : ""}
                    </span>
                    <span className="font-mono text-xs text-mute">{t.id}</span>
                    <span
                      className={cn(
                        "flex-1",
                        t.done ? "text-mute line-through" : "text-dim",
                      )}
                    >
                      {t.label}
                    </span>
                    {t.parallel && (
                      <span className="font-mono text-[0.7rem] text-evidence">
                        [P]
                      </span>
                    )}
                    {t.story && (
                      <span className="font-mono text-[0.7rem] text-mute">
                        {t.story}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          </Section>
        ) : null}
      </div>
    </div>
  );
}
