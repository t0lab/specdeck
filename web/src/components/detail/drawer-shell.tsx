"use client";

import { useRouter } from "next/navigation";

import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

// Route-driven overlay for the intercepted drawer. Opening is implied by the
// route match (the component only renders when the (.)[spec] route intercepts);
// closing maps any vaul dismissal — Esc, backdrop click, swipe-down, browser
// Back — onto router.back(), returning to /board with the slot reset to null.
export function DrawerShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <Drawer
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DrawerContent className="max-h-[88vh]">
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        <div className="mx-auto w-full max-w-2xl overflow-y-auto px-6 pb-8 pt-2">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
