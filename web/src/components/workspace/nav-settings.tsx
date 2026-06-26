"use client";

import { useState } from "react";
import { Monitor, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Settings entry — a small sidebar row that opens a preferences menu.
// Theme is real (next-themes, persisted). The rest are mock toggles: local,
// non-wired, reset on refresh (002/003 are mock-only) — they show the shape of
// the settings surface and tie to the notification feed conceptually.
export function NavSettings() {
  const { isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();

  // Mock preferences (in-session only).
  const [notifyDone, setNotifyDone] = useState(true);
  const [notifyInput, setNotifyInput] = useState(true);
  const [compactCards, setCompactCards] = useState(false);

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip="Settings"
            className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Settings />
            <span>Settings</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          {/* `theme` (incl. "system"), not resolvedTheme; menu only mounts on
              open (client), so reading it can't cause a hydration mismatch. */}
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light" className="cursor-pointer">
              <Sun />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark" className="cursor-pointer">
              <Moon />
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system" className="cursor-pointer">
              <Monitor />
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={notifyDone}
            onCheckedChange={setNotifyDone}
            className="cursor-pointer"
          >
            When a Task finishes
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={notifyInput}
            onCheckedChange={setNotifyInput}
            className="cursor-pointer"
          >
            When an agent needs input
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Board</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={compactCards}
            onCheckedChange={setCompactCards}
            className="cursor-pointer"
          >
            Compact cards
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
