import type { BoardColumn } from "@/mock/types";

export type DetailTab = "spec" | "checks" | "diff";

// Two human gates onto a Spec's detail:
//  - Plan column → Spec tab   (review what's about to be built)
//  - Review column → Checks tab (review what was built, via Evidence)
//  - everything else → Spec
export function defaultTab(column: BoardColumn): DetailTab {
  if (column === "review") return "checks";
  return "spec";
}
