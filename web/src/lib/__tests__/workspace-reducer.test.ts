import { describe, it, expect } from "vitest";

import { slugifyToId, workspaceReducer } from "@/lib/workspace-reducer";
import type { ProjectMeta } from "@/mock/projects";

function project(id: string, name = id): ProjectMeta {
  return {
    id,
    name,
    description: "",
    repo: "",
    defaultBranch: "main",
    color: "#38e8c6",
    context: "",
  };
}

const seed: ProjectMeta[] = [project("specdeck", "SpecDeck"), project("atlas")];

describe("slugifyToId", () => {
  it("kebab-cases a name", () => {
    expect(slugifyToId("My New Project", [])).toBe("my-new-project");
  });

  it("avoids collision with existing ids", () => {
    expect(slugifyToId("Atlas", ["atlas"])).toBe("atlas-2");
    expect(slugifyToId("Atlas", ["atlas", "atlas-2"])).toBe("atlas-3");
  });

  it("falls back when a name has no slug-able characters", () => {
    expect(slugifyToId("", [])).toMatch(/^project/);
  });
});

describe("workspaceReducer — add", () => {
  it("appends a new project with a generated unique id and filled defaults", () => {
    const next = workspaceReducer(seed, {
      type: "add",
      input: { name: "Atlas" },
    });
    expect(next).toHaveLength(3);
    const added = next[2];
    expect(added.id).toBe("atlas-2"); // "atlas" already taken
    expect(added.name).toBe("Atlas");
    expect(added.defaultBranch).toBe("main");
    expect(added.context).toBe("");
  });

  it("carries optional repo and color through", () => {
    const next = workspaceReducer(seed, {
      type: "add",
      input: { name: "Beacon", repo: "git@x:beacon.git", color: "#ff8800" },
    });
    const added = next[next.length - 1];
    expect(added.repo).toBe("git@x:beacon.git");
    expect(added.color).toBe("#ff8800");
  });

  it("does not mutate the input array", () => {
    const before = [...seed];
    workspaceReducer(seed, { type: "add", input: { name: "Zed" } });
    expect(seed).toEqual(before);
  });
});

describe("workspaceReducer — update", () => {
  it("patches fields of the matching project", () => {
    const next = workspaceReducer(seed, {
      type: "update",
      id: "atlas",
      patch: { name: "Atlas Renamed", color: "#123456" },
    });
    const hit = next.find((p) => p.id === "atlas")!;
    expect(hit.name).toBe("Atlas Renamed");
    expect(hit.color).toBe("#123456");
    // untouched fields preserved
    expect(hit.defaultBranch).toBe("main");
  });

  it("leaves other projects untouched", () => {
    const next = workspaceReducer(seed, {
      type: "update",
      id: "atlas",
      patch: { name: "X" },
    });
    expect(next.find((p) => p.id === "specdeck")!.name).toBe("SpecDeck");
  });

  it("is a no-op for an unknown id", () => {
    const next = workspaceReducer(seed, {
      type: "update",
      id: "nope",
      patch: { name: "X" },
    });
    expect(next).toEqual(seed);
  });
});
