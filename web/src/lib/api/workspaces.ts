// Workspace provisioning client — /api/projects/{id}/workspace*. Kicks off a
// clone (US2) and exposes the SSE events URL for live progress.

import { ApiClient } from "@/lib/api/base";

export type WorkspaceStatus =
  | "unlinked"
  | "provisioning"
  | "ready"
  | "broken"
  | "error";

export interface JobSnapshot {
  id: string;
  kind: "clone" | "init" | "reconnect";
  status: "running" | "success" | "error" | "cancelled";
  phase: string | null;
  progress: number | null;
  message: string | null;
}

export interface WorkspaceState {
  status: WorkspaceStatus;
  source: "clone" | "init" | "linked" | null;
  remote_url: string | null;
  base_branch: string | null;
  rel_path: string | null;
  latest_job: JobSnapshot | null;
}

export interface CreateWorkspaceResult {
  workspace: WorkspaceState;
  job_id: string;
}

export interface CloneRequest {
  mode: "clone";
  remote_url: string;
  base_branch?: string;
  name?: string;
}

/** Link an existing folder inside the managed root (US4) — synchronous. */
export interface LinkRequest {
  mode: "link";
  rel_path: string;
  name?: string;
}

/** Link returns the final workspace state directly (no streaming). */
export interface LinkResult {
  workspace: WorkspaceState;
  job_id: null;
}

/** One directory inside the managed root (folder picker). A git repo is a
 * selectable leaf (`can_enter: false`); a plain folder holding repos is a
 * browse-only container (`selectable: false`); a plain leaf is both. */
export interface BrowseEntry {
  name: string;
  rel_path: string;
  is_git: boolean;
  remote_url: string | null;
  selectable: boolean;
  can_enter: boolean;
}

export interface BrowseResult {
  path: string;
  dirs: BrowseEntry[];
}

class WorkspaceApi extends ApiClient {
  constructor() {
    super("/api/projects");
  }

  createWorkspace(projectId: string, body: CloneRequest): Promise<CreateWorkspaceResult> {
    return this.post<CreateWorkspaceResult>(`/${projectId}/workspace`, body);
  }

  /** Link an existing folder; resolves once the workspace is `ready`. */
  link(projectId: string, body: LinkRequest): Promise<LinkResult> {
    return this.post<LinkResult>(`/${projectId}/workspace`, body);
  }

  getWorkspace(projectId: string): Promise<WorkspaceState> {
    return this.get<WorkspaceState>(`/${projectId}/workspace`);
  }

  cancel(projectId: string): Promise<{ status: string }> {
    return this.post<{ status: string }>(`/${projectId}/workspace/cancel`);
  }

  /** SSE endpoint for live provisioning progress (consumed by EventSource). */
  eventsUrl(projectId: string): string {
    return `${this.base}/${projectId}/workspace/events`;
  }
}

export const workspaceApi = new WorkspaceApi();

/** Folder picker — browses directories inside the managed root (FR-008). */
class WorkspacesApi extends ApiClient {
  constructor() {
    super("/api/workspaces");
  }

  browse(path = ""): Promise<BrowseResult> {
    const qs = path ? `?path=${encodeURIComponent(path)}` : "";
    return this.get<BrowseResult>(`/browse${qs}`);
  }
}

export const workspacesApi = new WorkspacesApi();
