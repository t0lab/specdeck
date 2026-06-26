"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  CircleAlert,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NOTIFICATIONS, type NotificationKind } from "@/mock/notifications";
import { cn } from "@/lib/utils";

const ICON: Record<NotificationKind, LucideIcon> = {
  "task-done": CheckCircle2,
  "needs-input": CircleAlert,
  "check-failed": XCircle,
};

// Same status palette as the board, so a notification's tone matches the Check
// it came from: green = done, mint = an agent is waiting on you, red = failed.
const TONE: Record<NotificationKind, string> = {
  "task-done": "text-check-pass",
  "needs-input": "text-running",
  "check-failed": "text-check-fail",
};

// Notification inbox — a sidebar entry styled like a Project item, with an unread
// badge, opening a dropdown of the mock feed. The two triggers the user cares
// about (a Task finishing, an agent needing input) plus failed Checks. Static
// mock (no realtime); clicking an item marks it read in-session and deep-links to
// the Spec.
export function NavNotifications() {
  const { isMobile } = useSidebar();
  const [read, setRead] = useState<Set<string>>(() => new Set());

  const unread = NOTIFICATIONS.filter(
    (n) => n.unread && !read.has(n.id),
  ).length;
  const markRead = (id: string) => setRead((prev) => new Set(prev).add(id));
  const markAll = () => setRead(new Set(NOTIFICATIONS.map((n) => n.id)));

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={
              unread ? `Notifications · ${unread} unread` : "Notifications"
            }
            className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <span className="relative">
              {/* explicit size-4: the wrapping span means the button's
                  [&>svg]:size-4 rule doesn't reach this icon */}
              <Bell className="size-4" />
              {unread > 0 && (
                // Collapsed (icon rail): the number is hidden, so a dot on the
                // bell keeps the unread signal visible.
                <span className="absolute right-0.5 top-0 size-1 rounded-full bg-running ring-2 ring-sidebar" />
              )}
            </span>
            <span className="flex-1">Notifications</span>
            {unread > 0 && (
              // h-4 min-w-4 keeps a single digit a circle; grows to a pill for 2+.
              <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-running px-1 text-[8px] font-semibold leading-none tabular-nums text-white group-data-[collapsible=icon]:hidden">
                {unread}
              </span>
            )}
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-80 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="cursor-pointer text-xs font-normal text-mute transition-colors hover:text-foreground"
              >
                Mark all read
              </button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {NOTIFICATIONS.map((n) => {
            const Icon = ICON[n.kind];
            const isUnread = n.unread && !read.has(n.id);
            return (
              <DropdownMenuItem
                key={n.id}
                asChild
                className="items-start gap-2.5 py-2"
                onClick={() => markRead(n.id)}
              >
                <Link href={`/p/${n.projectId}/board/${n.specId}`}>
                  <Icon
                    className={cn("mt-0.5 size-4 shrink-0", TONE[n.kind])}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs text-mute">
                        {n.specId}
                      </span>
                      <span className="shrink-0 text-xs text-mute tabular-nums">
                        {n.ago}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "text-sm leading-snug whitespace-normal",
                        isUnread ? "font-medium" : "text-dim",
                      )}
                    >
                      {n.message}
                    </span>
                  </span>
                  {isUnread && (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-running" />
                  )}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
