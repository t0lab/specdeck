"use client";

import { ChevronDown, ChevronRight } from "lucide-react";

// The clickable group (swimlane) header — chevron + label + count — shared by
// both the Kanban and List views so collapse/expand looks and behaves the same
// in each, and the same collapsed state drives both.
export function BoardGroupHeader({
  label,
  count,
  collapsed,
  onToggle,
}: {
  label: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const Chevron = collapsed ? ChevronRight : ChevronDown;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      className="group/gh cursor-pointer flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-2"
    >
      <Chevron
        className="size-4 shrink-0 text-mute transition-colors group-hover/gh:text-foreground"
        aria-hidden
      />
      <span className="text-sm font-semibold tracking-tight">{label}</span>
      <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[11px] font-medium text-mute tabular-nums">
        {count}
      </span>
    </button>
  );
}
