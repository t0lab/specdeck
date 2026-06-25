import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ColumnTag } from "@/components/board/column-tag";
import { RunningBadge } from "@/components/board/running-badge";
import { Badge } from "@/components/ui/badge";
import { DetailTabs } from "@/components/board/detail/detail-tabs";
import { defaultTab } from "@/lib/default-tab";
import { getSpec, SPECS } from "@/mock/specs";

// Full detail page (US4) — the dual-surface counterpart to the drawer. Reached
// by hard-nav / refresh / share of /board/[spec], or via "Open full". Same data
// source as the drawer (getSpec), so the two surfaces never diverge.
export function generateStaticParams() {
  return SPECS.map((s) => ({ spec: s.id }));
}

export default async function SpecPage({
  params,
}: {
  params: Promise<{ spec: string }>;
}) {
  const { spec: id } = await params;
  const spec = getSpec(id);
  if (!spec) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="flex flex-col gap-6">
        <Link
          href="/board"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-mute transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Board
        </Link>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-mute tabular-nums">
              {spec.id}
            </span>
            <ColumnTag column={spec.column} />
            {spec.fastlane && (
              <Badge
                variant="outline"
                className="border-fastlane/40 text-fastlane"
              >
                Fast lane
              </Badge>
            )}
            {spec.runningAgent && <RunningBadge role={spec.runningAgent} />}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {spec.title}
          </h1>
        </div>

        <DetailTabs spec={spec} defaultTab={defaultTab(spec.column)} />
      </div>
    </main>
  );
}
