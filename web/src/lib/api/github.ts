// GitHub integration client — /api/integrations/github/*. OAuth Device Flow
// (like `gh login`): start → show user_code → poll until connected. The access
// token lives only on the gateway; nothing here ever sees it.

import { ApiClient, ApiError } from "@/lib/api/base";

export interface GitHubStatus {
  connected: boolean;
  github_login: string | null;
  scope: string | null;
  status: "active" | "expired" | "revoked" | null;
}

export interface DeviceStart {
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export type DevicePoll =
  | { state: "pending"; interval?: number }
  | { state: "connected"; github_login: string }
  | { state: "expired" }
  | { state: "denied" }
  | { state: "error"; error?: string };

export interface Repo {
  full_name: string;
  private: boolean;
  default_branch: string;
}

export interface RepoList {
  repos: Repo[];
  next_page: number | null;
}

export interface BranchList {
  branches: string[];
  next_page: number | null;
}

/** Thrown when the stored token is expired/revoked (HTTP 401) — prompt re-auth. */
export class GitHubReauthRequired extends Error {
  constructor() {
    super("github_reauth_required");
    this.name = "GitHubReauthRequired";
  }
}

class GitHubApi extends ApiClient {
  constructor() {
    super("/api/integrations/github");
  }

  status(): Promise<GitHubStatus> {
    return this.get<GitHubStatus>("/status");
  }

  startDeviceFlow(): Promise<DeviceStart> {
    return this.post<DeviceStart>("/device/start");
  }

  pollDeviceFlow(): Promise<DevicePoll> {
    return this.post<DevicePoll>("/device/poll");
  }

  disconnect(): Promise<void> {
    return this.delete<void>("/connection");
  }

  async listRepos(query = "", page = 1): Promise<RepoList> {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    try {
      return await this.get<RepoList>(`/repos${qs ? `?${qs}` : ""}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) throw new GitHubReauthRequired();
      throw err;
    }
  }

  async listBranches(fullName: string, page = 1): Promise<BranchList> {
    const params = new URLSearchParams({ repo: fullName });
    if (page > 1) params.set("page", String(page));
    try {
      return await this.get<BranchList>(`/branches?${params.toString()}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) throw new GitHubReauthRequired();
      throw err;
    }
  }
}

export const githubApi = new GitHubApi();
