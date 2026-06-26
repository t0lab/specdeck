import { cookies } from "next/headers";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { WorkspaceProvider } from "@/components/workspace/workspace-context";

// Workspace shell: the sidebar + content frame shared by every Project route.
// `sidebar_state` cookie is read here (server) so the collapsed/expanded state is
// correct on first paint — no flash. WorkspaceProvider lifts the in-session
// Project list above the sidebar and all tabs so a create/rename reflects
// everywhere. Landing (/) is in the (landing) group and never reaches this shell.
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <WorkspaceProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        {/* bg-ground = the board canvas, so the sticky column-header band
            (bg-ground/85) matches the surface behind it instead of the default
            SidebarInset --background. */}
        <SidebarInset className="bg-ground">{children}</SidebarInset>
      </SidebarProvider>
    </WorkspaceProvider>
  );
}
