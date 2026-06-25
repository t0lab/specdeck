import { Badge } from "@/components/ui/badge";
import { checkProgress } from "@/lib/check-progress";
import { cn } from "@/lib/utils";
import type { AgentRole, SpecCard } from "@/mock/types";

// One Spec rendered as a board card: code + title + Check progress, plus the
// Fast lane and "agent running" badges. Progress comes from checkProgress, so a
// pass missing Evidence is never counted — the board fraction can't read green
// for unevidenced work (SC-004). Click-to-open is wired in US4.

function RunningBadge({ role }: { role: AgentRole }) {
  const label = `${role[0].toUpperCase()}${role.slice(1)} running`;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-running/40 px-1.5 py-0.5 text-xs font-medium text-running">
      {/* pulsing dot — distinct shape, not colour-only; stilled by reduced-motion */}
      <span className="relative grid size-2.5 place-items-center" aria-hidden>
        <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-running opacity-60" />
        <span className="relative size-1.5 rounded-full bg-running" />
      </span>
      {label}
    </span>
  );
}

export function SpecCardView({
  card,
  className,
}: {
  card: SpecCard;
  className?: string;
}) {
  const { passed, total } = checkProgress(card.checks);
  return (
    <article
      className={cn(
        "flex flex-col gap-2 rounded-md border border-border bg-surface p-3 shadow-(--shadow-card)",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs text-mute tabular-nums">
          {card.id}
        </span>
        {total > 0 && (
          <span className="font-mono text-xs text-mute tabular-nums">
            {passed}/{total}
          </span>
        )}
      </div>

      <h3 className="text-sm font-medium leading-snug tracking-tight">
        {card.title}
      </h3>

      {(card.fastlane || card.runningAgent) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {card.fastlane && (
            <Badge
              variant="outline"
              className="border-fastlane/40 text-fastlane"
            >
              Fast lane
            </Badge>
          )}
          {card.runningAgent && <RunningBadge role={card.runningAgent} />}
        </div>
      )}

      {total > 0 && (
        <div
          className="mt-0.5 h-1 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={passed}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${passed} of ${total} checks passed`}
        >
          <div
            className="h-full rounded-full bg-check-pass"
            style={{ width: `${total === 0 ? 0 : (passed / total) * 100}%` }}
          />
        </div>
      )}
    </article>
  );
}
