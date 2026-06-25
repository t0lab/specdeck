import { DrawerShell } from "@/components/detail/drawer-shell";
import { DrawerOverview } from "@/components/detail/drawer-overview";
import { getSpec } from "@/mock/specs";

// Intercepted route (US4). On SOFT navigation to /board/[spec] (clicking a card
// body) this renders the drawer overview overlaid on the board. On hard-nav /
// refresh the interception does not apply and the full page renders instead.
export default async function InterceptedSpecDrawer({
  params,
}: {
  params: Promise<{ spec: string }>;
}) {
  const { spec: id } = await params;
  const spec = getSpec(id);
  if (!spec) return null;

  return (
    <DrawerShell title={`${spec.id} — ${spec.title}`}>
      <DrawerOverview spec={spec} />
    </DrawerShell>
  );
}
