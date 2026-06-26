"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BoardColumn, BoardGroup } from "@/mock/types";

const STATUS: { value: BoardColumn; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "plan", label: "Plan" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

// Search + filter toolbar. Lives in BoardView (above the Tabs), so it drives both
// the Kanban and List surfaces and its state is untouched when switching views.
export function BoardToolbar({
  query,
  onQueryChange,
  statuses,
  onToggleStatus,
  groups,
  groupFilter,
  onToggleGroup,
  onClear,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  statuses: Set<BoardColumn>;
  onToggleStatus: (column: BoardColumn) => void;
  groups: BoardGroup[];
  groupFilter: Set<string>;
  onToggleGroup: (groupId: string) => void;
  onClear: () => void;
}) {
  const activeCount = statuses.size + groupFilter.size;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-mute"
          aria-hidden
        />
        <Input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search Specs…"
          aria-label="Search Specs"
          className="h-9 w-44 pl-8 sm:w-64"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Clear search"
            className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 text-mute transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium transition-colors hover:bg-surface-2",
            activeCount > 0 && "border-primary/50 text-primary",
          )}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filter
          {activeCount > 0 && (
            <span className="rounded-full bg-primary/15 px-1.5 text-[11px] font-medium tabular-nums">
              {activeCount}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            {STATUS.map((s) => (
              <DropdownMenuCheckboxItem
                key={s.value}
                checked={statuses.has(s.value)}
                onCheckedChange={() => onToggleStatus(s.value)}
                closeOnClick={false}
                className={"cursor-pointer"}
              >
                {s.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Group</DropdownMenuLabel>
            {groups.map((g) => (
              <DropdownMenuCheckboxItem
                key={g.id}
                checked={groupFilter.has(g.id)}
                onCheckedChange={() => onToggleGroup(g.id)}
                closeOnClick={false}
                className={"cursor-pointer"}
              >
                {g.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
          {activeCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onClear} className={"cursor-pointer"}>
                Clear filters
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
