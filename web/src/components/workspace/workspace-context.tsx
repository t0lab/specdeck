"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";

import {
  workspaceReducer,
  type WorkspaceAction,
} from "@/lib/workspace-reducer";
import { PROJECTS, type ProjectMeta } from "@/mock/projects";

// The in-session workspace: the live list of Projects (seeded from mock, mutable
// via the reducer). Lifted above the routes so the sidebar, project header, and
// every tab read the SAME list — a create/rename reflects everywhere without a
// refresh. Refresh resets to the seed (mock-only).
interface WorkspaceContextValue {
  projects: ProjectMeta[];
  dispatch: React.Dispatch<WorkspaceAction>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [projects, dispatch] = useReducer(workspaceReducer, PROJECTS);
  return (
    <WorkspaceContext.Provider value={{ projects, dispatch }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider.");
  }
  return ctx;
}

export function useProjects(): ProjectMeta[] {
  return useWorkspace().projects;
}

export function useProject(id: string): ProjectMeta | undefined {
  return useWorkspace().projects.find((p) => p.id === id);
}

export function useWorkspaceDispatch(): React.Dispatch<WorkspaceAction> {
  return useWorkspace().dispatch;
}
