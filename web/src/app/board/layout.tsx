import { AppBar } from "@/components/app-bar";
import { ThemeToggle } from "@/components/theme-toggle";

// Board layout. Owns the sticky app bar (shared AppBar so the logo sits exactly
// where it does on the landing); `children` is the board (/board) or the full
// detail page (/board/[spec]). The Spec peek is now an in-page Sheet
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
      <AppBar>
        <ThemeToggle />
      </AppBar>
      {children}
    </div>
  );
}
