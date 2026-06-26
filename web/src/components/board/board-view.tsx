"use client";

import { useMemo, useReducer, useState } from "react";
import { List, SquareKanban } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BoardDnd } from "@/components/board/board-dnd";
import { BoardList } from "@/components/board/board-list";
import { BoardToolbar } from "@/components/board/board-toolbar";
import {
  boardReducer,
  filterBoard,
  type GroupedBoardState,
} from "@/lib/board-state";
import type { BoardColumn, BoardGroup } from "@/mock/types";

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

// Owns the single source of truth for the board (state + collapse + filter) and
// switches between the Kanban and List surfaces with Tabs. Both surfaces are
// controlled off this one reducer + collapsed set + filter, so a move, a
// collapse, or a search/filter in either view is reflected in the other — and
// the toolbar (above the Tabs) is untouched when switching modes.
export function BoardView({
  initialLanes,
  groups,
}: {
  initialLanes: GroupedBoardState;
  groups: BoardGroup[];
}) {
  const [state, dispatch] = useReducer(boardReducer, initialLanes);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<Set<BoardColumn>>(new Set());
  const [groupFilter, setGroupFilter] = useState<Set<string>>(new Set());

  function onToggleGroup(groupId: string) {
    setCollapsed((prev) => toggleInSet(prev, groupId));
  }
  function clearFilters() {
    setStatuses(new Set());
    setGroupFilter(new Set());
    setQuery("");
  }

  // Filtered view feeding both surfaces. Drag/dispatch still target the real
  // `state` (the reducer), so hidden cards are never lost.
  const filtered = useMemo(
    () => filterBoard(state, { query, statuses, groups: groupFilter }),
    [state, query, statuses, groupFilter],
  );

  return (
    <Tabs defaultValue="kanban" className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList variant="line">
          <TabsTrigger value="kanban" className="cursor-pointer">
            <SquareKanban className="size-4" aria-hidden />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list" className="cursor-pointer">
            <List className="size-4" aria-hidden />
            List
          </TabsTrigger>
        </TabsList>
        <BoardToolbar
          query={query}
          onQueryChange={setQuery}
          statuses={statuses}
          onToggleStatus={(c) => setStatuses((prev) => toggleInSet(prev, c))}
          groups={groups}
          groupFilter={groupFilter}
          onToggleGroup={(g) => setGroupFilter((prev) => toggleInSet(prev, g))}
          onClear={clearFilters}
        />
      </div>
      <TabsContent value="kanban" className="pt-4">
        <BoardDnd
          state={filtered}
          dispatch={dispatch}
          groups={groups}
          collapsed={collapsed}
          onToggleGroup={onToggleGroup}
        />
      </TabsContent>
      <TabsContent value="list" className="pt-4">
        <BoardList
          state={filtered}
          dispatch={dispatch}
          groups={groups}
          collapsed={collapsed}
          onToggleGroup={onToggleGroup}
        />
      </TabsContent>
    </Tabs>
  );
}
