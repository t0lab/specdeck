"use client";

// Existing-folder source (US4): browse directories inside the managed root and
// link one as the Project's workspace. A git folder auto-detects its remote
// (shown as a hint); a non-git folder is `git init`-ed on link. The browse is
// scoped to the managed root server-side — no host filesystem is exposed.

import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, Folder, FolderGit2, Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  workspacesApi,
  type BrowseEntry,
} from "@/lib/api/workspaces";

/** A chosen folder to link as the workspace. */
export interface FolderSelection {
  rel_path: string;
  name: string;
  is_git: boolean;
  remote_url: string | null;
}

function parentOf(path: string): string {
  const i = path.lastIndexOf("/");
  return i === -1 ? "" : path.slice(0, i);
}

export function FolderSource({
  selected,
  onSelect,
}: {
  selected: FolderSelection | null;
  onSelect: (selection: FolderSelection | null) => void;
}) {
  const [path, setPath] = useState("");
  const [entries, setEntries] = useState<BrowseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Once a folder is picked the browser collapses to a compact card; "Change" reopens it.
  const [changing, setChanging] = useState(false);
  const reqId = useRef(0);

  // Fetch the current folder's children. The work is deferred into a timeout so
  // the loading flag is never set synchronously in the effect body (which would
  // trigger cascading renders); `reqId` drops stale responses on fast navigation.
  useEffect(() => {
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await workspacesApi.browse(path);
        if (id !== reqId.current) return;
        setEntries(r.dirs);
        setError(null);
      } catch {
        if (id !== reqId.current) return;
        setError("Could not read the workspace folder.");
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [path]);

  const collapsed = selected && !changing;

  if (collapsed) {
    return (
      <SelectedFolder selection={selected} onChange={() => setChanging(true)} />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => setPath("")}
          className="cursor-pointer underline-offset-2 hover:text-foreground hover:underline"
        >
          Workspaces
        </button>
        {path
          .split("/")
          .filter(Boolean)
          .map((seg, i, arr) => {
            const upto = arr.slice(0, i + 1).join("/");
            return (
              <span key={upto} className="flex items-center gap-1.5">
                <ChevronRight className="size-3 opacity-50" />
                <button
                  type="button"
                  onClick={() => setPath(upto)}
                  className="cursor-pointer font-mono underline-offset-2 hover:text-foreground hover:underline"
                >
                  {seg}
                </button>
              </span>
            );
          })}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="max-h-52 overflow-y-auto rounded-lg border border-border">
        {loading ? (
          <div className="flex flex-col gap-px p-1.5">
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        ) : (
          <ul className="p-1.5">
            {path && (
              <li>
                <button
                  type="button"
                  onClick={() => setPath(parentOf(path))}
                  aria-label="Parent folder"
                  className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/60"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
                    <Folder className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">..</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Parent folder
                    </span>
                  </span>
                </button>
              </li>
            )}
            {entries.length === 0 && !path ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                No folders in the managed root yet. Clone or copy a repo into the
                workspaces volume, then link it here.
              </p>
            ) : (
              entries.map((entry) => {
                const active = selected?.rel_path === entry.rel_path;
                // The row body either selects (selectable) or, for a browse-only
                // container, drills in. A git repo is a leaf — no chevron.
                const enter = () => setPath(entry.rel_path);
                const subtitle = entry.is_git
                  ? (entry.remote_url ?? "git repository")
                  : entry.selectable
                    ? "no git — will be initialized"
                    : "contains repositories — open to pick one";
                return (
                  <li key={entry.rel_path}>
                    <div
                      className={cn(
                        "flex w-full items-center gap-1 rounded-md pr-1 transition-colors",
                        active ? "bg-accent-soft ring-1 ring-inset ring-primary/40" : "hover:bg-muted/60",
                      )}
                    >
                      <button
                        type="button"
                        onClick={
                          entry.selectable
                            ? () =>
                                active
                                  ? onSelect(null)
                                  : (onSelect({
                                      rel_path: entry.rel_path,
                                      name: entry.name,
                                      is_git: entry.is_git,
                                      remote_url: entry.remote_url,
                                    }),
                                    setChanging(false))
                            : enter
                        }
                        aria-pressed={entry.selectable ? active : undefined}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-2.5 py-2 text-left text-sm"
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
                          {entry.is_git ? (
                            <FolderGit2 className="size-4" />
                          ) : (
                            <Folder className="size-4" />
                          )}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium">{entry.name}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {subtitle}
                          </span>
                        </span>
                        {entry.selectable && active && (
                          <Check className="size-4 shrink-0 text-primary" />
                        )}
                      </button>
                      {entry.can_enter && (
                        <button
                          type="button"
                          onClick={enter}
                          aria-label={`Open ${entry.name}`}
                          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function SelectedFolder({
  selection,
  onChange,
}: {
  selection: FolderSelection;
  onChange: () => void;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-muted/30 px-2.5">
      <div className="flex min-h-10 items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
            {selection.is_git ? (
              <FolderGit2 className="size-3.5" />
            ) : (
              <Folder className="size-3.5" />
            )}
          </span>
          <span className="truncate font-mono">{selection.rel_path}</span>
        </span>
        <button
          type="button"
          onClick={onChange}
          className="shrink-0 cursor-pointer text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Change
        </button>
      </div>
      <div className="flex min-h-10 items-center gap-2 border-t border-border text-sm text-muted-foreground">
        {selection.is_git ? (
          <>
            <Check className="size-4 shrink-0 text-emerald-500" />
            <span className="truncate">
              {selection.remote_url ?? "Git repo (no remote)"}
            </span>
          </>
        ) : (
          <>
            <Loader2 className="size-4 shrink-0 opacity-60" />
            <span>Not a git repo yet — it will be initialized on link.</span>
          </>
        )}
      </div>
    </div>
  );
}
