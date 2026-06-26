import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

// The one app bar, shared by the landing and the board so the SpecDeck lockup
// sits at the EXACT same x-position on every route (the logo used to jump left
// on /board because that header padded the outer full-width element while the
// landing padded the inner max-w-7xl element — a 24px drift on wide screens).
// Container geometry lives here only: `mx-auto max-w-7xl px-6`, fixed h-16, the
// logo on the left, and whatever controls the page passes on the right.
export function AppBar({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/60 bg-ground/80 backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-6">
        <Link href="/" aria-label="SpecDeck home" className="shrink-0">
          <Logo />
        </Link>
        {children ? (
          <nav className="flex items-center gap-2 sm:gap-3">{children}</nav>
        ) : null}
      </div>
    </header>
  );
}
