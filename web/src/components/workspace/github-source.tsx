"use client";

// Real GitHub source picker (US1 + US2), Vercel-style: OAuth Device Flow connect
// (like `gh login`) → repo search/picker. The access token never reaches the
// browser; this only ever sees a user_code, a login, and repo metadata. Repo and
// branch lists are infinite-scrolled (GitHub caps per_page at 100, so we page by
// index and append). The selected repo + branch are reported upward.

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  GitBranch,
  Loader2,
  Lock,
  Search,
} from "lucide-react";
import InfiniteScroll from "react-infinite-scroll-component";

import { GithubMark } from "@/components/icons/github-mark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  GitHubReauthRequired,
  githubApi,
  type DeviceStart,
  type Repo,
} from "@/lib/api/github";

/** A chosen repo plus the branch to clone. */
export interface RepoSelection {
  repo: Repo;
  branch: string;
}

type Conn =
  | { state: "loading" }
  | { state: "disconnected"; note?: string }
  | { state: "connecting"; device: DeviceStart }
  | { state: "connected"; login: string };

const REPO_SCROLL_ID = "gh-repo-scroll";
const BRANCH_SCROLL_ID = "gh-branch-scroll";

export function GitHubSource({
  selected,
  onSelect,
}: {
  selected: RepoSelection | null;
  onSelect: (selection: RepoSelection | null) => void;
}) {
  const [conn, setConn] = useState<Conn>({ state: "loading" });

  // Initial status probe — already-connected sessions skip straight to the picker.
  useEffect(() => {
    let alive = true;
    githubApi.status().then(
      (s) =>
        alive &&
        setConn(
          s.connected && s.github_login
            ? { state: "connected", login: s.github_login }
            : { state: "disconnected" },
        ),
      () => alive && setConn({ state: "disconnected", note: "Gateway unavailable." }),
    );
    return () => {
      alive = false;
    };
  }, []);

  // Poll the device flow while connecting. The gateway tracks the device_code
  // server-side, so polling carries no secret.
  useEffect(() => {
    if (conn.state !== "connecting") return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const interval = Math.max(conn.device.interval, 1) * 1000;

    const tick = async () => {
      try {
        const res = await githubApi.pollDeviceFlow();
        if (!alive) return;
        switch (res.state) {
          case "pending":
            timer = setTimeout(tick, interval);
            break;
          case "connected":
            setConn({ state: "connected", login: res.github_login });
            break;
          case "expired":
            setConn({ state: "disconnected", note: "The code expired — connect again." });
            break;
          case "denied":
            setConn({ state: "disconnected", note: "Access was denied on GitHub." });
            break;
          default:
            setConn({ state: "disconnected", note: res.error ?? "Something went wrong." });
        }
      } catch {
        if (alive) timer = setTimeout(tick, interval); // transient — keep polling
      }
    };
    timer = setTimeout(tick, interval);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [conn]);

  async function connect() {
    setConn({ state: "loading" });
    try {
      const device = await githubApi.startDeviceFlow();
      setConn({ state: "connecting", device });
    } catch {
      setConn({ state: "disconnected", note: "Could not reach GitHub. Try again." });
    }
  }

  async function disconnect() {
    onSelect(null);
    setConn({ state: "loading" });
    try {
      await githubApi.disconnect();
    } finally {
      setConn({ state: "disconnected" });
    }
  }

  if (conn.state === "loading") {
    return <Skeleton className="h-10 w-full rounded-md" />;
  }

  if (conn.state === "disconnected") {
    return (
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={connect}
          className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
        >
          <GithubMark className="size-4" />
          Continue with GitHub
        </Button>
        {conn.note ? (
          <p className="text-xs text-destructive">{conn.note}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Authorize once to clone private and public repos.
          </p>
        )}
      </div>
    );
  }

  if (conn.state === "connecting") {
    return <DeviceCode device={conn.device} onCancel={() => setConn({ state: "disconnected" })} />;
  }

  return (
    <RepoPicker
      login={conn.login}
      selected={selected}
      onSelect={onSelect}
      onDisconnect={disconnect}
      onReauth={() =>
        setConn({ state: "disconnected", note: "Your GitHub session expired — reconnect." })
      }
    />
  );
}

function DeviceCode({ device, onCancel }: { device: DeviceStart; onCancel: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard?.writeText(device.user_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable (insecure context) — the code is shown regardless
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Authorize on GitHub</p>
        <p className="text-xs text-muted-foreground">
          Enter this code at github.com/login/device.
        </p>
      </div>

      {/* OTP-style code with a copy affordance */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {device.user_code.split("").map((ch, i) =>
            ch === "-" ? (
              <span key={`sep-${i}`} className="w-1.5" />
            ) : (
              <span
                key={`ch-${i}`}
                className="flex size-9 items-center justify-center rounded-md border border-border bg-muted/40 font-mono text-lg font-semibold tabular-nums"
              >
                {ch}
              </span>
            ),
          )}
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={copy} aria-label="Copy code">
          {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
        </Button>
      </div>

      <Button
        type="button"
        onClick={copy}
        asChild
        className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
      >
        <a href={device.verification_uri} target="_blank" rel="noopener noreferrer">
          Open GitHub
          <ExternalLink className="size-4" />
        </a>
      </Button>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Waiting for authorization…
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function RepoPicker({
  login,
  selected,
  onSelect,
  onDisconnect,
  onReauth,
}: {
  login: string;
  selected: RepoSelection | null;
  onSelect: (selection: RepoSelection | null) => void;
  onDisconnect: () => void;
  onReauth: () => void;
}) {
  const [query, setQuery] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingFirst, setLoadingFirst] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Once a repo is picked the list collapses to a compact card; "Change" reopens it.
  const [changing, setChanging] = useState(false);
  const onReauthRef = useRef(onReauth);
  useEffect(() => {
    onReauthRef.current = onReauth;
  }, [onReauth]);

  // Debounced search → fetch the FIRST page fresh. Successive pages append via
  // fetchMore (infinite scroll). Resetting all happens inside the async timeout so
  // we never call setState synchronously in the effect body.
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      setLoadingFirst(true);
      try {
        const r = await githubApi.listRepos(query, 1);
        if (!alive) return;
        setRepos(r.repos);
        setPage(1);
        setHasMore(r.next_page !== null);
        setError(null);
      } catch (err) {
        if (!alive) return;
        if (err instanceof GitHubReauthRequired) onReauthRef.current();
        else setError("Could not load repositories.");
      } finally {
        if (alive) setLoadingFirst(false);
      }
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  async function fetchMoreRepos() {
    const next = page + 1;
    try {
      const r = await githubApi.listRepos(query, next);
      setRepos((prev) => [...prev, ...r.repos]);
      setPage(next);
      setHasMore(r.next_page !== null);
    } catch (err) {
      if (err instanceof GitHubReauthRequired) onReauthRef.current();
      else setHasMore(false);
    }
  }

  const collapsed = selected && !changing;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm">
          <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background">
            <GithubMark className="size-3" />
          </span>
          <span className="font-medium">{login}</span>
          <Check className="size-3.5 text-emerald-500" />
        </span>
        <button
          type="button"
          onClick={onDisconnect}
          className="cursor-pointer text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Disconnect
        </button>
      </div>

      {collapsed ? (
        <SelectedRepo
          selection={selected}
          onChangeRepo={() => setChanging(true)}
          onChangeBranch={(branch) => onSelect({ repo: selected.repo, branch })}
          onReauth={onReauth}
        />
      ) : (
        <>
          <InputGroup>
            <InputGroupAddon>
              <Search className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search repositories…"
              aria-label="Search repositories"
            />
          </InputGroup>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div
            id={REPO_SCROLL_ID}
            className="max-h-52 overflow-y-auto rounded-lg border border-border"
          >
            {loadingFirst ? (
              <div className="flex flex-col gap-px p-1.5">
                <Skeleton className="h-11 w-full rounded-md" />
                <Skeleton className="h-11 w-full rounded-md" />
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
            ) : repos.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                No repositories match “{query}”.
              </p>
            ) : (
              <InfiniteScroll
                dataLength={repos.length}
                next={fetchMoreRepos}
                hasMore={hasMore}
                scrollableTarget={REPO_SCROLL_ID}
                loader={
                  <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Loading more…
                  </div>
                }
              >
                <ul className="p-1.5">
                  {repos.map((repo) => {
                    const active = selected?.repo.full_name === repo.full_name;
                    const [owner, ...rest] = repo.full_name.split("/");
                    const name = rest.join("/");
                    return (
                      <li key={repo.full_name}>
                        <button
                          type="button"
                          onClick={() => {
                            if (active) {
                              onSelect(null);
                            } else {
                              onSelect({ repo, branch: repo.default_branch });
                              setChanging(false); // collapse to the compact card
                            }
                          }}
                          aria-pressed={active}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                            active
                              ? "bg-accent-soft ring-1 ring-inset ring-primary/40"
                              : "hover:bg-muted/60",
                          )}
                        >
                          <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
                            {repo.private ? (
                              <Lock className="size-3.5" />
                            ) : (
                              <GithubMark className="size-3.5" />
                            )}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate">
                              <span className="text-muted-foreground">{owner}/</span>
                              <span className="font-medium">{name}</span>
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <GitBranch className="size-3" />
                              <span className="font-mono">{repo.default_branch}</span>
                              {repo.private && <span className="ml-1">· Private</span>}
                            </span>
                          </span>
                          {active && <Check className="size-4 shrink-0 text-primary" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </InfiniteScroll>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SelectedRepo({
  selection,
  onChangeRepo,
  onChangeBranch,
  onReauth,
}: {
  selection: RepoSelection;
  onChangeRepo: () => void;
  onChangeBranch: (branch: string) => void;
  onReauth: () => void;
}) {
  const { repo, branch } = selection;
  const [owner, ...rest] = repo.full_name.split("/");
  const name = rest.join("/");
  return (
    <div className="flex flex-col rounded-lg border border-border bg-muted/30 px-2.5">
      <div className="flex min-h-10 items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
            {repo.private ? (
              <Lock className="size-3.5" />
            ) : (
              <GithubMark className="size-3.5" />
            )}
          </span>
          <span className="truncate">
            <span className="text-muted-foreground">{owner}/</span>
            <span className="font-medium">{name}</span>
          </span>
        </span>
        <button
          type="button"
          onClick={onChangeRepo}
          className="shrink-0 cursor-pointer text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Change
        </button>
      </div>
      <div className="flex min-h-10 items-center justify-between gap-2 border-t border-border">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <GitBranch className="size-4" />
          Branch
        </span>
        <BranchSelect
          key={repo.full_name}
          fullName={repo.full_name}
          defaultBranch={repo.default_branch}
          value={branch}
          onChange={onChangeBranch}
          onReauth={onReauth}
        />
      </div>
    </div>
  );
}

function BranchSelect({
  fullName,
  defaultBranch,
  value,
  onChange,
  onReauth,
}: {
  fullName: string;
  defaultBranch: string;
  value: string;
  onChange: (branch: string) => void;
  onReauth: () => void;
}) {
  // Fresh mount per repo (key={fullName}) → branch state resets cleanly.
  const [branches, setBranches] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingFirst, setLoadingFirst] = useState(true);
  const onReauthRef = useRef(onReauth);
  useEffect(() => {
    onReauthRef.current = onReauth;
  }, [onReauth]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await githubApi.listBranches(fullName, 1);
        if (!alive) return;
        setBranches(r.branches);
        setPage(1);
        setHasMore(r.next_page !== null);
      } catch (err) {
        if (!alive) return;
        if (err instanceof GitHubReauthRequired) onReauthRef.current();
        else setHasMore(false);
      } finally {
        if (alive) setLoadingFirst(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fullName]);

  async function fetchMoreBranches() {
    const next = page + 1;
    try {
      const r = await githubApi.listBranches(fullName, next);
      setBranches((prev) => [...prev, ...r.branches]);
      setPage(next);
      setHasMore(r.next_page !== null);
    } catch (err) {
      if (err instanceof GitHubReauthRequired) onReauthRef.current();
      else setHasMore(false);
    }
  }

  // Default branch pinned to the top, deduped against the fetched pages.
  const ordered = [defaultBranch, ...branches.filter((b) => b !== defaultBranch)];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground data-[state=open]:text-foreground"
        >
          <GitBranch className="size-3.5" />
          <span className="font-mono">{value}</span>
          <ChevronDown className="size-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent id={BRANCH_SCROLL_ID} align="end" className="max-h-72 w-56">
        {loadingFirst ? (
          <DropdownMenuItem disabled>Loading branches…</DropdownMenuItem>
        ) : (
          <InfiniteScroll
            dataLength={ordered.length}
            next={fetchMoreBranches}
            hasMore={hasMore}
            scrollableTarget={BRANCH_SCROLL_ID}
            loader={
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Loading more…
              </div>
            }
          >
            {ordered.map((b) => (
              <DropdownMenuItem
                key={b}
                onClick={() => onChange(b)}
                className="cursor-pointer gap-2 font-mono text-xs"
              >
                <Check
                  className={cn("size-3.5 shrink-0", b === value ? "opacity-100" : "opacity-0")}
                />
                <span className="truncate">{b}</span>
                {b === defaultBranch && (
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                    default
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </InfiniteScroll>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
