import { cn } from "@/lib/utils";
import type { BoardColumn } from "@/mock/types";

// Per-column identity, used only here. Each header gets its column's accent as a
// top rule + dot; Review carries the live mint, Done the shipped blue (tokens).
const COLUMN_META: Record<
  BoardColumn,
  { label: string; dot: string; rule: string }
> = {
  backlog: { label: "Backlog", dot: "bg-col-backlog", rule: "bg-col-backlog" },
  plan: { label: "Plan", dot: "bg-col-plan", rule: "bg-col-plan" },
  review: { label: "Review", dot: "bg-col-review", rule: "bg-col-review" },
  done: { label: "Done", dot: "bg-col-done", rule: "bg-col-done" },
};

const COLUMNS: BoardColumn[] = ["backlog", "plan", "review", "done"];

// The single shared column header — rendered once above every swimlane and
// pinned below the app bar so it stays put while the groups scroll. Aligned to
// the same fixed 4-column grid the group bands use, so the columns line up.
// No boxes (point 1): each column is an uppercase label with a dot + count pill,
// anchored by a full-width accent underline in the column's own colour.
export function BoardColumnHeader({
  counts,
}: {
  counts: Record<BoardColumn, number>;
}) {
  return (
    <div className="sticky top-16 z-20 mb-2 grid grid-cols-4 gap-3 bg-ground/85 pb-2 pt-4 backdrop-blur">
      {COLUMNS.map((column) => {
        const meta = COLUMN_META[column];
        return (
          <div key={column} className="flex flex-col gap-2 pt-1">
            <div className="flex items-center gap-2 px-1">
              <span
                className={cn("size-2 shrink-0 rounded-full", meta.dot)}
                aria-hidden
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-dim">
                {meta.label}
              </span>
              {/* h-[18px] min-w-[18px] = a clean circle for one digit, grows to a
                  soft pill for 2+; lighter fill than before so it reads as a quiet
                  count, not a heavy badge. */}
              <span className="ml-auto inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-foreground/6 px-1 text-[10px] font-semibold leading-none text-mute tabular-nums">
                {counts[column]}
              </span>
            </div>
            <div className={cn("h-0.75 rounded-full", meta.rule)} aria-hidden />
          </div>
        );
      })}
    </div>
  );
}
