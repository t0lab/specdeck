import { Streamdown } from "streamdown";

import { ColumnTag } from "@/components/status/column-tag";
import { RunningBadge } from "@/components/status/running-badge";
import { Badge } from "@/components/ui/badge";
import { ChecksPanel } from "@/components/checks/checks-panel";
import { OpenFullLink } from "@/components/detail/open-full-link";
import type { SpecCard } from "@/mock/types";

// Condensed overview shown in the drawer (US4). Header (code/column/badges),
// goal, and the Checks + Evidence summary — enough to triage without leaving
// the board. "Open full" jumps to the dedicated detail page.
export function DrawerOverview({ spec }: { spec: SpecCard }) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-mute tabular-nums">
              {spec.id}
            </span>
            <ColumnTag column={spec.column} />
          </div>
          <OpenFullLink specId={spec.id} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{spec.title}</h2>
        {(spec.fastlane || spec.runningAgent) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {spec.fastlane && (
              <Badge
                variant="outline"
                className="border-fastlane/40 text-fastlane"
              >
                Fast lane
              </Badge>
            )}
            {spec.runningAgent && <RunningBadge role={spec.runningAgent} />}
          </div>
        )}
      </header>

      <div className="text-sm leading-relaxed text-dim">
        <Streamdown>{spec.goal}</Streamdown>
      </div>

      <div className="border-t border-border pt-4">
        <ChecksPanel checks={spec.checks} />
      </div>
    </div>
  );
}
