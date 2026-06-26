"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useProject, useWorkspaceDispatch } from "./workspace-context";

// Project Settings (US5): edit identity (name, repo, branch, color) + Project
// Context. NO secret/API-key fields — secrets stay server-side (FR-021). Saving
// dispatches `update`, which reflects immediately in the sidebar and Overview
// (same in-session store).
const SWATCHES = [
  "#38e8c6",
  "#f5a524",
  "#7aa2ff",
  "#f472b6",
  "#a3e635",
  "#c084fc",
];

export function SettingsForm({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const dispatch = useWorkspaceDispatch();
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(project?.name ?? "");
  const [repo, setRepo] = useState(project?.repo ?? "");
  const [defaultBranch, setDefaultBranch] = useState(
    project?.defaultBranch ?? "main",
  );
  const [color, setColor] = useState(project?.color ?? SWATCHES[0]);
  const [context, setContext] = useState(project?.context ?? "");

  if (!project) return null;

  function save() {
    dispatch({
      type: "update",
      id: projectId,
      patch: { name: name.trim() || project!.name, repo, defaultBranch, color, context },
    });
    setSaved(true);
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <h2 className="text-lg font-semibold tracking-tight">Settings</h2>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="s-name">Name</Label>
          <Input
            id="s-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="s-repo">Repository</Label>
          <Input
            id="s-repo"
            value={repo}
            onChange={(e) => {
              setRepo(e.target.value);
              setSaved(false);
            }}
            placeholder="github.com/org/repo"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="s-branch">Default branch</Label>
          <Input
            id="s-branch"
            value={defaultBranch}
            onChange={(e) => {
              setDefaultBranch(e.target.value);
              setSaved(false);
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Color</Label>
          <div className="flex gap-2">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Use color ${c}`}
                aria-pressed={color === c}
                onClick={() => {
                  setColor(c);
                  setSaved(false);
                }}
                className={cn(
                  "size-6 rounded-md ring-offset-2 ring-offset-background transition",
                  color === c && "ring-2 ring-ring",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="s-context">Project Context</Label>
          <p className="text-xs text-mute">
            Standing rules every Spec in this project inherits.
          </p>
          <Textarea
            id="s-context"
            value={context}
            onChange={(e) => {
              setContext(e.target.value);
              setSaved(false);
            }}
            rows={6}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit">Save changes</Button>
          {saved && <span className="text-sm text-primary">Saved</span>}
        </div>
      </form>
    </main>
  );
}
