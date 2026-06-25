"use client";

import { useTheme } from "next-themes";

import { Highlighter } from "@/components/ui/highlighter";

type HighlightAction = "circle" | "box" | "underline" | "highlight" | "bracket";

// Brand-mint rough-notation annotation for a single word in landing copy.
// rough-notation draws with a fixed color string, so we pick the mint that reads
// on the active surface (deep mint on light, electric mint on dark). Draws once
// when scrolled into view (isView).
export function HighlightWord({
  children,
  action = "circle",
}: {
  children: React.ReactNode;
  action?: HighlightAction;
}) {
  const { resolvedTheme } = useTheme();
  const color = resolvedTheme === "light" ? "#0a8470" : "#38e8c6";
  return (
    <Highlighter
      action={action}
      color={color}
      strokeWidth={1}
      padding={6}
      iterations={6}
      isView
    >
      {children}
    </Highlighter>
  );
}
