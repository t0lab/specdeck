import { cn } from "@/lib/utils";

// Mark "Columns" (concept #07): Backlog · Plan · Review (accent) · Done.
// Theme-aware by construction — columns inherit `currentColor` (text colour),
// the Review column is the brand accent (`--primary`: mint dark / deep-mint light).
// Geometry is the canonical mark; do not redraw (contract C6).
export function Mark({
  className,
  title = "SpecDeck",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={cn("size-6 text-foreground", className)}
    >
      <title>{title}</title>
      <g fill="none" strokeWidth={6} strokeLinecap="round">
        <path d="M8 39V25" stroke="currentColor" />
        <path d="M18.67 39V18" stroke="currentColor" />
        <path d="M29.33 39V11" className="stroke-primary" />
        <path d="M40 39V22" stroke="currentColor" />
      </g>
    </svg>
  );
}

// Two-tone wordmark: Spec (text colour) + Deck (accent). Rendered in the
// self-hosted Plex Sans SemiBold (FR-006) — adapts to theme via tokens.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-sans text-lg font-semibold leading-none tracking-tight",
        className,
      )}
    >
      <span className="text-foreground">Spec</span>
      <span className="text-primary">Deck</span>
    </span>
  );
}

// Horizontal lockup (mark + wordmark) for the app bar.
export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Mark className={cn("size-6", markClassName)} title="" />
      <Wordmark />
    </span>
  );
}
