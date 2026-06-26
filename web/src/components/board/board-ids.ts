import type { BoardColumn } from "@/mock/types";

// Droppable id for one (group, column) cell. dnd-kit ids are strings, so we
// encode the pair and parse it back when resolving a drop target. Group ids use
// single hyphens (e.g. "review-evidence"); the "::" separator never collides.
const COLUMNS: BoardColumn[] = ["backlog", "plan", "review", "done"];
const SEP = "::";

export function cellId(groupId: string, column: BoardColumn): string {
  return `${groupId}${SEP}${column}`;
}

export function parseCellId(
  id: string,
): { groupId: string; column: BoardColumn } | null {
  const i = id.lastIndexOf(SEP);
  if (i === -1) return null;
  const column = id.slice(i + SEP.length);
  if (!(COLUMNS as string[]).includes(column)) return null;
  return { groupId: id.slice(0, i), column: column as BoardColumn };
}

export function isCellId(id: string): boolean {
  return parseCellId(id) !== null;
}
