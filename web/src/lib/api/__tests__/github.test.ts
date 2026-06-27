import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the axios module so the client's `axios.create()` returns a controllable
// instance. `vi.hoisted` lets the factory reference our shared request mock.
const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));
vi.mock("axios", () => ({
  default: {
    create: () => ({ request: requestMock }),
    isAxiosError: (e: unknown) => Boolean((e as { isAxiosError?: boolean })?.isAxiosError),
  },
}));

import { GitHubReauthRequired, githubApi } from "@/lib/api/github";

function resolveWith(data: unknown) {
  requestMock.mockResolvedValueOnce({ data });
}
function rejectStatus(status: number) {
  requestMock.mockRejectedValueOnce({ isAxiosError: true, response: { status } });
}

afterEach(() => requestMock.mockReset());

describe("githubApi", () => {
  it("status() maps the connected payload", async () => {
    resolveWith({
      connected: true,
      github_login: "octocat",
      scope: "repo,read:user",
      status: "active",
    });
    const s = await githubApi.status();
    expect(s.connected).toBe(true);
    expect(s.github_login).toBe("octocat");
  });

  it("startDeviceFlow() returns the user code + verification uri", async () => {
    resolveWith({
      user_code: "WDJB-MJHT",
      verification_uri: "https://github.com/login/device",
      expires_in: 900,
      interval: 5,
    });
    const d = await githubApi.startDeviceFlow();
    expect(d.user_code).toBe("WDJB-MJHT");
    expect(d.interval).toBe(5);
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({ method: "POST", url: "/device/start" }),
    );
  });

  it("pollDeviceFlow() surfaces pending then connected", async () => {
    resolveWith({ state: "pending" });
    expect((await githubApi.pollDeviceFlow()).state).toBe("pending");
    resolveWith({ state: "connected", github_login: "octocat" });
    expect(await githubApi.pollDeviceFlow()).toEqual({
      state: "connected",
      github_login: "octocat",
    });
  });

  it("listRepos() passes the query and returns the documented shape", async () => {
    resolveWith({
      repos: [{ full_name: "octocat/spec-deck", private: true, default_branch: "main" }],
      next_page: null,
    });
    const r = await githubApi.listRepos("spec");
    expect(r.repos[0]).toEqual({
      full_name: "octocat/spec-deck",
      private: true,
      default_branch: "main",
    });
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET", url: "/repos?query=spec" }),
    );
  });

  it("listRepos() throws GitHubReauthRequired on 401", async () => {
    rejectStatus(401);
    await expect(githubApi.listRepos()).rejects.toBeInstanceOf(GitHubReauthRequired);
  });

  it("disconnect() resolves on success", async () => {
    resolveWith("");
    await expect(githubApi.disconnect()).resolves.toBe("");
  });
});
