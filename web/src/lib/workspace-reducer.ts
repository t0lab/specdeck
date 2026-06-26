import type { ProjectMeta } from "@/mock/projects";

// Pure reducer over the in-session workspace (the list of Projects). Lives here
// (no React, no persistence) so the add/update logic is unit-testable apart from
// the WorkspaceProvider that hosts it. Everything is in-memory: a refresh resets
// to the seed (mock-only — kế thừa ràng buộc 002).

// Fallback accent for a Project created without an explicit color.
export const DEFAULT_PROJECT_COLOR = "#38e8c6";

// Derive a stable, URL-safe id from a Project name, guaranteed unique against
// the ids already in the workspace (collisions get a numeric suffix: foo, foo-2…).
export function slugifyToId(name: string, existingIds: string[]): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project";

  if (!existingIds.includes(base)) return base;
  let n = 2;
  while (existingIds.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export interface NewProjectInput {
  name: string;
  repo?: string;
  color?: string;
}

export type WorkspaceAction =
  | { type: "add"; input: NewProjectInput }
  | { type: "update"; id: string; patch: Partial<Omit<ProjectMeta, "id">> };

export function workspaceReducer(
  state: ProjectMeta[],
  action: WorkspaceAction,
): ProjectMeta[] {
  switch (action.type) {
    case "add": {
      const id = slugifyToId(
        action.input.name,
        state.map((p) => p.id),
      );
      const added: ProjectMeta = {
        id,
        name: action.input.name.trim(),
        description: "",
        repo: action.input.repo?.trim() ?? "",
        defaultBranch: "main",
        color: action.input.color ?? DEFAULT_PROJECT_COLOR,
        context: "",
      };
      return [...state, added];
    }
    case "update": {
      if (!state.some((p) => p.id === action.id)) return state;
      return state.map((p) =>
        p.id === action.id ? { ...p, ...action.patch } : p,
      );
    }
  }
}
