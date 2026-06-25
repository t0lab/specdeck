import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

// "Open full" affordance. A PLAIN anchor (not next/link) on purpose: a hard
// navigation to /board/[spec] bypasses the intercepting route, so it always
// lands on the full detail page rather than the drawer (SC-005). ⌘/Ctrl-click
// opens it in a new tab natively.
export function OpenFullLink({
  specId,
  className,
  label = "Open full",
  onClick,
}: {
  specId: string;
  className?: string;
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <a
      href={`/board/${specId}`}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-evidence transition-colors hover:text-primary",
        className,
      )}
    >
      {label}
      <ArrowUpRight className="size-3.5" aria-hidden />
    </a>
  );
}
