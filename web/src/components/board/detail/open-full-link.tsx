import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

// "Open full" affordance. A PLAIN anchor (not next/link) on purpose: a real
// navigation to the standalone /p/[project]/board/[spec] full detail page —
// distinct from the in-page Sheet peek (SC-005). ⌘/Ctrl-click opens it in a new
// tab natively. `projectId` scopes the deep link to the owning Project; without
// one it falls back to /board/[spec] (which redirects to the default Project).
export function OpenFullLink({
  specId,
  projectId,
  className,
  label = "Open full",
  onClick,
}: {
  specId: string;
  projectId?: string;
  className?: string;
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <a
      href={projectId ? `/p/${projectId}/board/${specId}` : `/board/${specId}`}
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
