import { cn } from "@/lib/utils";

export type BoardColumn = "backlog" | "plan" | "review" | "done";

// Columns are told apart by their LABEL (grayscale-safe) — the colored dot is
// the at-a-glance reinforcement. Only Review carries the accent (in-flight).
const COLUMNS: Record<BoardColumn, { label: string; dot: string }> = {
  backlog: { label: "Backlog", dot: "bg-col-backlog" },
  plan: { label: "Plan", dot: "bg-col-plan" },
  review: { label: "Review", dot: "bg-col-review" },
  done: { label: "Done", dot: "bg-col-done" },
};

export function ColumnTag({
  column,
  count,
  className,
}: {
  column: BoardColumn;
  count?: number;
  className?: string;
}) {
  const { label, dot } = COLUMNS[column];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium tracking-tight",
        className,
      )}
    >
      <span className={cn("size-2 shrink-0 rounded-full", dot)} aria-hidden />
      <span>{label}</span>
      {count != null && (
        <span className="font-mono text-xs text-mute tabular-nums">{count}</span>
      )}
    </div>
  );
}
