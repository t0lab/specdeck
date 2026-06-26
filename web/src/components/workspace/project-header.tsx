"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { ProjectMeta } from "@/mock/projects";
import { ProjectAvatar } from "./project-avatar";
import { Separator } from "../ui/separator";

// Per-Project header inside the SidebarInset: sidebar toggle + identity + the
// Overview · Board · Settings tab bar (link-tabs — each tab is a route segment,
// so refresh/share keep the tab; active is derived from the pathname).
const TABS = [
  { key: "overview", label: "Overview" },
  { key: "board", label: "Board" },
  { key: "settings", label: "Settings" },
] as const;

export function ProjectHeader({ project }: { project: ProjectMeta }) {
  const pathname = usePathname();
  const base = `/p/${project.id}`;

  return (
    <header className="sticky top-0 z-30 flex flex-col border-b border-border bg-ground/80 backdrop-blur">
      <div className="flex h-10 items-center gap-2.5 px-4">
        <SidebarTrigger className="-ml-1.5 size-8 text-mute cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <ProjectAvatar project={project} className="size-5" />
        <h1 className="text-sm font-semibold tracking-tight">{project.name}</h1>
        {project.repo && (
          <a
            href={`https://${project.repo.replace(/^https?:\/\//, "")}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 text-xs text-mute transition-colors hover:text-foreground"
          >
            <span className="font-mono">{project.repo}</span>
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
      </div>

      <nav
        className="flex h-8 items-center gap-1 px-4"
        aria-label="Project sections"
      >
        {TABS.map((tab) => {
          const href = `${base}/${tab.key}`;
          const active = pathname.startsWith(href);
          return (
            <Link
              key={tab.key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-8 items-center -mb-px border-b-2 px-3 text-sm transition-colors",
                active
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-mute hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
