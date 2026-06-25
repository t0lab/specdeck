import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

// Board layout (US4). Owns the app bar and hosts two parallel slots:
//  - `children`: the board (/board) or the full detail page (/board/[spec])
//  - `drawer`:   the intercepted drawer overview, overlaid on soft-nav
// On hard-nav/refresh the drawer slot has no match and falls back to its
// default.tsx (null), so children renders the full detail page instead.
export default function BoardLayout({
  children,
  drawer,
}: {
  children: React.ReactNode;
  drawer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-ground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" aria-label="SpecDeck home">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      {children}
      {drawer}
    </div>
  );
}
