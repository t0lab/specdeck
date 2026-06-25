import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

// Board layout. Owns the sticky app bar; `children` is the board (/board) or the
// full detail page (/board/[spec]). The Spec peek is now an in-page Sheet
// (BoardSheetProvider on the board page), not a parallel route — so there is no
// `@drawer` slot here anymore. min-h-svh keeps the board filling the viewport
// even when the lanes are short.
export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-ground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" aria-label="SpecDeck home">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
