"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { slugifyToId } from "@/lib/workspace-reducer";
import { useProjects, useWorkspaceDispatch } from "./workspace-context";

// Quick create flow (US4): name (required) + optional repo + an accent color.
// The Project's id is derived deterministically from the name with the SAME
// helper the reducer uses, so we can navigate to the new Project right after
// dispatching `add` (the ids are guaranteed to match).
const SWATCHES = [
  "#38e8c6",
  "#f5a524",
  "#7aa2ff",
  "#f472b6",
  "#a3e635",
  "#c084fc",
];

export function NewProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const projects = useProjects();
  const dispatch = useWorkspaceDispatch();
  const router = useRouter();

  const [name, setName] = useState("");
  const [repo, setRepo] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setRepo("");
    setColor(SWATCHES[0]);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name is required.");
      return;
    }
    const id = slugifyToId(
      trimmed,
      projects.map((p) => p.id),
    );
    dispatch({ type: "add", input: { name: trimmed, repo, color } });
    handleOpenChange(false);
    router.push(`/p/${id}/overview`);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            A project is its own board and Project Context. You can fill in the
            rest later in Settings.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="np-name">Name</Label>
            <Input
              id="np-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Helix Gateway"
              autoFocus
              aria-invalid={error ? true : undefined}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="np-repo">Repository (optional)</Label>
            <Input
              id="np-repo"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="github.com/org/repo"
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
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-6 rounded-md ring-offset-2 ring-offset-background transition",
                    color === c && "ring-2 ring-ring",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
