"use client";

import { use } from "react";

import { SettingsForm } from "@/components/workspace/settings-form";

export default function SettingsPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = use(params);
  return <SettingsForm projectId={project} />;
}
