import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpecView } from "@/components/board/detail/spec-view";
import { ChecksPanel } from "@/components/board/detail/checks-panel";
import { DiffView } from "@/components/board/detail/diff-view";
import type { DetailTab } from "@/lib/default-tab";
import type { SpecCard } from "@/mock/types";

// Full detail surface (US4): three keyboard-navigable tabs. The opening tab is
// chosen by the card's column (defaultTab) — Plan → Spec, Review → Checks.
export function DetailTabs({
  spec,
  defaultTab,
}: {
  spec: SpecCard;
  defaultTab: DetailTab;
}) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList variant="line">
        <TabsTrigger value="spec">Spec</TabsTrigger>
        <TabsTrigger value="checks">Checks + Evidence</TabsTrigger>
        <TabsTrigger value="diff">Diff</TabsTrigger>
      </TabsList>
      <TabsContent value="spec" className="pt-6">
        <SpecView spec={spec} />
      </TabsContent>
      <TabsContent value="checks" className="pt-6">
        <ChecksPanel checks={spec.checks} />
      </TabsContent>
      <TabsContent value="diff" className="pt-6">
        <DiffView diff={spec.diff} />
      </TabsContent>
    </Tabs>
  );
}
