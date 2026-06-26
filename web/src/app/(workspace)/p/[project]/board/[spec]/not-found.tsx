import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Rendered when getSpecFor() misses on a hard-nav to a Project's /board/[spec].
export default function SpecNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="font-mono text-sm text-mute">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Spec not found</h1>
      <p className="text-dim">No Spec matches that address in this project.</p>
      <Link
        href="/"
        className={cn(buttonVariants({ size: "lg" }), "mt-2 h-10 px-5")}
      >
        Back home
      </Link>
    </main>
  );
}
