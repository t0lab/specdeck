"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FolderGit2 } from "lucide-react";

import { GithubMark } from "@/components/icons/github-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/base";
import { workspaceApi } from "@/lib/api/workspaces";
import { useProvisioningEvents } from "@/hooks/use-provisioning-events";
import { slugifyToId } from "@/lib/workspace-reducer";
import { CloneTerminal } from "@/components/workspace/clone-terminal";
import {
  GitHubSource,
  type RepoSelection,
} from "@/components/workspace/github-source";
import {
  FolderSource,
  type FolderSelection,
} from "@/components/workspace/folder-source";
import {
  useProjects,
  useWorkspaceDispatch,
} from "@/components/workspace/workspace-context";

// Dedicated create-project page (replaces the old dialog). The Project + its
// workspace are REAL — the chosen source provisions a live workspace against the
// gateway (which creates the backing Project row, keyed by the same slug id). The
// board/overview content stays mock, keyed by that id. No source → a plain mock
// Project. Lives in the (workspace) group, so the sidebar + WorkspaceProvider wrap it.
const SWATCHES = ["#38e8c6", "#f5a524", "#7aa2ff", "#f472b6", "#a3e635", "#c084fc"];

type Source = "github" | "folder";

function cloneError(err: unknown): string {
  if (err instanceof ApiError && err.status === 409) {
    return "A workspace already exists for this project, or a clone is already running.";
  }
  return "Could not start the clone. Check the gateway and try again.";
}

function linkError(err: unknown): string {
  if (err instanceof ApiError && err.status === 409) {
    return "That folder is already linked to another project.";
  }
  if (err instanceof ApiError && err.status === 400) {
    return "That folder can't be linked. Pick another inside the managed root.";
  }
  return "Could not link the folder. Check the gateway and try again.";
}

export default function NewProjectPage() {
  const projects = useProjects();
  const dispatch = useWorkspaceDispatch();
  const router = useRouter();

  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [source, setSource] = useState<Source>("github");
  const [repoSel, setRepoSel] = useState<RepoSelection | null>(null);
  const [folderSel, setFolderSel] = useState<FolderSelection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Set once the (mock) Project is created — also guards against re-adding on retry.
  const [projectId, setProjectId] = useState<string | null>(null);
  const [cloning, setCloning] = useState(false);
  const [linking, setLinking] = useState(false);
  const navigated = useRef(false);

  // Live clone progress — subscribed only while a clone is in flight. When it
  // reaches `ready` we DON'T auto-redirect: the user reviews the clone log and
  // clicks "Open project" themselves.
  const prog = useProvisioningEvents(cloning ? projectId : null, cloning);
  const cloneReady = cloning && prog.status === "ready";

  // Ensure the mock Project exists (idempotent across retries); returns its id.
  function ensureProject(trimmed: string, repoLabel: string): string {
    if (projectId) return projectId;
    const id = slugifyToId(
      trimmed,
      projects.map((p) => p.id),
    );
    dispatch({ type: "add", input: { name: trimmed, repo: repoLabel, color } });
    setProjectId(id);
    return id;
  }

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name is required.");
      return;
    }

    if (source === "folder") {
      if (!folderSel) {
        const id = ensureProject(trimmed, "");
        router.push(`/p/${id}/overview`);
        return;
      }
      const id = ensureProject(trimmed, folderSel.remote_url ?? folderSel.rel_path);
      setSubmitError(null);
      setLinking(true);
      try {
        await workspaceApi.link(id, { mode: "link", rel_path: folderSel.rel_path, name: trimmed });
        if (!navigated.current) {
          navigated.current = true;
          router.push(`/p/${id}/overview`);
        }
      } catch (err) {
        setLinking(false);
        setSubmitError(linkError(err));
      }
      return;
    }

    // GitHub clone
    if (!repoSel) {
      const id = ensureProject(trimmed, "");
      router.push(`/p/${id}/overview`);
      return;
    }
    const id = ensureProject(trimmed, repoSel.repo.full_name);
    setSubmitError(null);
    setCloning(true);
    try {
      await workspaceApi.createWorkspace(id, {
        mode: "clone",
        remote_url: `https://github.com/${repoSel.repo.full_name}.git`,
        base_branch: repoSel.branch,
        name: trimmed,
      });
    } catch (err) {
      setCloning(false);
      setSubmitError(cloneError(err));
    }
  }

  async function cancelClone() {
    setCloning(false);
    if (projectId) {
      try {
        await workspaceApi.cancel(projectId);
      } catch {
        // best-effort — the page returns to the form regardless
      }
    }
  }

  const cloneFailed = cloning && prog.status === "error";
  const hasSelection = source === "github" ? !!repoSel : !!folderSel;
  const submitLabel = !hasSelection
    ? "Create project"
    : source === "folder"
      ? "Create & link"
      : "Create & clone";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-10 md:py-14">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex w-fit cursor-pointer items-center gap-1.5 text-sm text-muted-foreground underline-offset-2 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            A project is its own board and Project Context. Connect code now by
            cloning a GitHub repo or linking an existing folder, or skip and link
            one later in Settings.
          </p>
        </div>
      </div>

      {cloning ? (
        <div className="flex flex-col gap-4">
          <CloneTerminal
            repo={repoSel?.repo.full_name ?? "repository"}
            url={`https://github.com/${repoSel?.repo.full_name ?? "owner/repo"}.git`}
            state={prog}
          />
          <div className="flex justify-end gap-2">
            {cloneReady ? (
              <Button type="button" onClick={() => router.push(`/p/${projectId}/overview`)}>
                Open project
              </Button>
            ) : cloneFailed ? (
              <>
                <Button type="button" variant="ghost" onClick={cancelClone}>
                  Back
                </Button>
                <Button type="button" onClick={submit}>
                  Retry
                </Button>
              </>
            ) : (
              <Button type="button" variant="ghost" onClick={cancelClone}>
                Cancel clone
              </Button>
            )}
          </div>
        </div>
      ) : (
        <form
          className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6"
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

          <div className="flex flex-col gap-2">
            <Label>Code source (optional)</Label>
            {/* segmented source switcher */}
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { key: "github", label: "GitHub repo", icon: GithubMark },
                  { key: "folder", label: "Existing folder", icon: FolderGit2 },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSource(key);
                    setSubmitError(null);
                  }}
                  aria-pressed={source === key}
                  className={cn(
                    "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                    source === key
                      ? "border-primary/40 bg-accent-soft font-medium text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-1">
              {source === "github" ? (
                <GitHubSource selected={repoSel} onSelect={setRepoSel} />
              ) : (
                <FolderSource selected={folderSel} onSelect={setFolderSel} />
              )}
            </div>
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
                    "size-6 cursor-pointer rounded-md ring-offset-2 ring-offset-background transition",
                    color === c && "ring-2 ring-ring",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {submitError && <p className="text-xs text-destructive">{submitError}</p>}

          <div className="flex justify-end gap-2 border-t border-border pt-6">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={linking}>
              {linking ? "Linking…" : submitLabel}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
