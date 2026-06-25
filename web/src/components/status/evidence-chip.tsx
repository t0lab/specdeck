import { Paperclip, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

// Evidence is the gate for "pass" (Principle I). A Check missing Evidence must
// NEVER read as pass — `missing` renders a warning chip, never green.
export function EvidenceChip({
  label = "Evidence",
  href,
  missing = false,
  className,
}: {
  label?: string;
  href?: string;
  missing?: boolean;
  className?: string;
}) {
  if (missing) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-crit/40 bg-crit/10 px-1.5 py-0.5 text-xs font-medium text-crit",
          className,
        )}
      >
        <TriangleAlert className="size-3" aria-hidden />
        Thiếu Evidence
      </span>
    );
  }

  const base = cn(
    "inline-flex items-center gap-1 rounded-md border border-evidence/30 bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-evidence",
    href && "transition-colors hover:border-evidence/60",
    className,
  );
  const inner = (
    <>
      <Paperclip className="size-3" aria-hidden />
      <span>{label}</span>
    </>
  );

  return href ? (
    <a href={href} className={base}>
      {inner}
    </a>
  ) : (
    <span className={base}>{inner}</span>
  );
}
