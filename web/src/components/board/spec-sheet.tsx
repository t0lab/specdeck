"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { SpecOverview } from "@/components/board/detail/spec-overview";
import { getSpec } from "@/mock/specs";

type BoardSheetValue = { openSpec: (id: string) => void };

const BoardSheetContext = createContext<BoardSheetValue>({
  openSpec: () => {},
});

// Cards call this to peek a Spec. Default is a no-op so SpecCardView stays safe
// when rendered outside a provider (e.g. the landing preview, non-interactive).
export function useBoardSheet() {
  return useContext(BoardSheetContext);
}

// In-page Spec peek (US4, refactor R13). A card click opens a right-side Sheet
// with the condensed Spec overview — pure client state, NO route change / URL
// coupling. This replaces the old `@drawer` intercepting-route drawer, which
// also threw "Invalid interception route" under Next 16. The board stays mounted
// behind the sheet; "Open full" still hard-navigates to /board/[spec], which
// remains the shareable deep-link / refresh surface.
export function BoardSheetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openSpec = useCallback((id: string) => setOpenId(id), []);
  const value = useMemo(() => ({ openSpec }), [openSpec]);
  const spec = openId ? getSpec(openId) : undefined;

  return (
    <BoardSheetContext.Provider value={value}>
      {children}
      <Sheet
        open={openId != null}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      >
        <SheetContent
          side="right"
          className="gap-0 data-[side=right]:w-full data-[side=right]:sm:w-2/5 data-[side=right]:sm:min-w-[28rem] data-[side=right]:sm:max-w-2xl"
        >
          {spec ? (
            <>
              <SheetTitle className="sr-only">
                {spec.id} — {spec.title}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Spec overview: goal, Checks and Evidence.
              </SheetDescription>
              <div className="flex-1 overflow-y-auto px-6 pb-8 pt-12">
                <SpecOverview spec={spec} />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </BoardSheetContext.Provider>
  );
}
