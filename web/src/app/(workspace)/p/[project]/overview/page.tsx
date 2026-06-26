"use client";

import { use } from "react";

import { OverviewPanel } from "@/components/workspace/overview-panel";

export default function OverviewPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = use(params);
  return <OverviewPanel projectId={project} />;
}
