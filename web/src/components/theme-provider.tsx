"use client";

import type * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Thin client wrapper so the server root layout can mount next-themes.
// Anti-FOUC inline script + persistence are handled by the library.
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
