"use client";

import { BoardCell } from "@/components/board/board-cell";
import { BoardGroupHeader } from "@/components/board/board-group-header";
import type { ColumnCells } from "@/lib/board-state";
import type { BoardColumn } from "@/mock/types";

const COLUMNS: BoardColumn[] = ["backlog", "plan", "review", "done"];

// One swimlane: a full-width group header (chevron + label + count) over the
// four-column grid of cells. Collapsing hides the whole grid — every card of the
// group across all four columns folds away — leaving just the header (the count
// still shows how much is hidden). A faint top rule + generous top padding
// separate bands (the columns themselves are borderless, point 1).
export function BoardGroupLane({
  groupId,
  label,
  cells,
  collapsed,
  onToggle,
  activeCell,
}: {
  groupId: string;
  label: string;
  cells: ColumnCells;
  collapsed: boolean;
  onToggle: () => void;
  // The cell the dragged card currently sits in — highlighted while dragging.
  activeCell: { groupId: string; column: BoardColumn } | null;
}) {
  const total = COLUMNS.reduce((n, column) => n + cells[column].length, 0);
  return (
    <section
      aria-label={label}
      className="flex flex-col border-t border-border/50 pt-3"
    >
      <BoardGroupHeader
        label={label}
        count={total}
        collapsed={collapsed}
        onToggle={onToggle}
      />
      {!collapsed && (
        <div className="mt-1 grid grid-cols-4 gap-x-3 gap-y-1">
          {COLUMNS.map((column) => (
            <BoardCell
              key={column}
              groupId={groupId}
              column={column}
              cards={cells[column]}
              isTarget={
                activeCell?.groupId === groupId && activeCell.column === column
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
