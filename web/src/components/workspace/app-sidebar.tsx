"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, SquarePlus } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/brand/logo";
import { ProjectAvatar } from "./project-avatar";
import { NavNotifications } from "./nav-notifications";
import { NavSettings } from "./nav-settings";
import { NavUser } from "./nav-user";
import { useProjects } from "./workspace-context";

// Mock signed-in user — no auth yet (002/003 are mock-only). Empty avatar falls
// back to the name monogram.
const MOCK_USER = {
  name: "Liam Lee",
  email: "lexuandaibn@gmail.com",
  avatar: "",
};

// Shared className for nav rows so Notifications/Settings/Help match the Project
// items exactly (height, active/open state, icon-rail padding).
const NAV_ITEM_CLASS =
  "data-[state=open]:bg-sidebar-accent h-10 data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-1! cursor-pointer";

// Workspace sidebar (shadcn sidebar-07, collapsible="icon"). Header = SpecDeck
// brand (full wordmark expanded, just the Mark glyph collapsed); content = the
// Project list, with a secondary nav (Notifications inbox, Settings, Help) pinned
// to the bottom; footer = the account block (NavUser). Theme + preferences live
// under Settings (NavSettings), not the footer.
export function AppSidebar() {
  const projects = useProjects();
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="/"
                aria-label="SpecDeck home"
                className="group-data-[collapsible=icon]:mt-1 transition-all"
              >
                <span>
                  <Logo className="group-data-[collapsible=icon]:-translate-x-1 transition-all" />
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarMenu className="gap-2">
            {projects.map((project) => {
              const active = pathname.startsWith(`/p/${project.id}`);
              return (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={project.name}
                    className={NAV_ITEM_CLASS}
                  >
                    <Link href={`/p/${project.id}/overview`}>
                      {/* collapsed: avatar grows to fill the size-8 button (p-0) so
                          the tile occupies the whole icon rail, not a small inset */}
                      <ProjectAvatar project={project} className="size-6" />
                      <span>{project.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/new"}
                tooltip="New project"
                size="lg"
                className={NAV_ITEM_CLASS}
              >
                <Link href="/new">
                  <SquarePlus className="size-6!" />
                  <span>New project</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Secondary nav, pushed to the bottom of the content area. Smaller than
            the Project rows — default SidebarMenuButton size (h-8, size-4 icons). */}
        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            <NavNotifications />
            <NavSettings />
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Help & docs">
                <Link href="#">
                  <CircleHelp />
                  <span>Help &amp; docs</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={MOCK_USER} />
      </SidebarFooter>

      {/* <SidebarRail /> */}
    </Sidebar>
  );
}
