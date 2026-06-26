"use client";

import { use } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ProjectHeader } from "@/components/workspace/project-header";
import { useProject } from "@/components/workspace/workspace-context";
import { cn } from "@/lib/utils";

// Project shell: resolves the active Project from the in-session workspace store
// (client — so a Project created this session resolves too) and frames every tab
// with the ProjectHeader. An unknown id renders an inline not-found rather than
// a hard 404, because the store is client-side (a server notFound() can't see
// session-created Projects).
export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ project: string }>;
}) {
  const { project: id } = use(params);
  const project = useProject(id);

  if (!project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-lg font-semibold">Project not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          No project with id <span className="font-mono">{id}</span> in this
          workspace.
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col">
      <ProjectHeader project={project} />
      {children}
    </div>
  );
}
