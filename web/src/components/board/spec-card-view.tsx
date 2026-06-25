"use client";

import { Badge } from "@/components/ui/badge";
import { RunningBadge } from "@/components/board/running-badge";
import { OpenFullLink } from "@/components/board/detail/open-full-link";
import { useBoardSheet } from "@/components/board/spec-sheet";
import { checkProgress } from "@/lib/check-progress";
import { cn } from "@/lib/utils";
import type { SpecCard } from "@/mock/types";

// One Spec as a board card: code + title + Check progress, plus Fast lane and
// agent-running badges. Progress comes from checkProgress, so an unevidenced
// pass never counts toward green (SC-004).
//
// When `interactive`, the card opens its detail (US4): a plain click opens the
// in-page Sheet (BoardSheetProvider); ⌘/Ctrl-click opens the full page in a new
// tab; the hover "Open full" affordance jumps straight there.
export function SpecCardView({
  card,
  className,
  interactive = false,
}: {
  card: SpecCard;
  className?: string;
  interactive?: boolean;
}) {
  const { openSpec } = useBoardSheet();
  const { passed, total } = checkProgress(card.checks);

  function handleClick(e: React.MouseEvent) {
    if (e.metaKey || e.ctrlKey) {
      window.open(`/board/${card.id}`, "_blank", "noopener,noreferrer");
    } else {
      openSpec(card.id);
    }
  }

  return (
    <article
      onClick={interactive ? handleClick : undefined}
      className={cn(
        "group/card flex flex-col gap-2 rounded-md border border-border bg-surface p-3 shadow-(--shadow-card)",
        interactive && "cursor-pointer transition-colors hover:border-strong",
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

      {interactive && (
        <OpenFullLink
          specId={card.id}
          className="opacity-0 transition-opacity group-hover/card:opacity-100 focus-visible:opacity-100"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </article>
  );
}
