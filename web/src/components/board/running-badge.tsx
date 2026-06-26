import { cn } from "@/lib/utils";
import type { AgentRole } from "@/mock/types";

// "Agent running" badge (FR-004) — a pulsing dot + role label, shown on cards
// and in the drawer. The dot is a distinct shape (not colour-only).
export function RunningBadge({
  role,
  className,
}: {
  role: AgentRole;
  className?: string;
}) {
  const label = `${role[0].toUpperCase()}${role.slice(1)} running`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-running/40 px-1.5 py-0.5 text-xs font-medium text-running",
        className,
      )}
    >
      <span
        className="size-1.5 animate-pulse rounded-full bg-running"
        aria-hidden
      />
      {label}
    </span>
  );
}
