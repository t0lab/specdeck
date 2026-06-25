import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type CheckState = "pass" | "fail" | "pending" | "running";

// Each state has a distinct SHAPE so it survives grayscale / colour-blindness
// (SC-001): filled ✓ disc, filled ✕ disc, hollow ring, pulsing dot.
const LABELS: Record<CheckState, string> = {
  pass: "Pass",
  fail: "Fail",
  pending: "Pending",
  running: "Running",
};

const TEXT: Record<CheckState, string> = {
  pass: "text-check-pass",
  fail: "text-check-fail",
  pending: "text-check-pending",
  running: "text-check-running",
};

function Glyph({ state }: { state: CheckState }) {
  switch (state) {
    case "pass":
      return (
        <span className="grid size-4 place-items-center rounded-full bg-check-pass text-background">
          <Check className="size-2.5" strokeWidth={3.5} />
        </span>
      );
    case "fail":
      return (
        <span className="grid size-4 place-items-center rounded-full bg-check-fail text-background">
          <X className="size-2.5" strokeWidth={3.5} />
        </span>
      );
    case "pending":
      return (
        <span className="size-4 rounded-full border-2 border-check-pending bg-transparent" />
      );
    case "running":
      return (
        <span className="relative grid size-4 place-items-center">
          <span className="absolute inline-flex size-4 animate-ping rounded-full bg-check-running opacity-60" />
          <span className="relative size-2 rounded-full bg-check-running" />
        </span>
      );
  }
}

export function CheckBadge({
  state,
  showLabel = true,
  className,
}: {
  state: CheckState;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label={LABELS[state]}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        TEXT[state],
        className,
      )}
    >
      <span aria-hidden>
        <Glyph state={state} />
      </span>
      {showLabel && <span>{LABELS[state]}</span>}
    </span>
  );
}
