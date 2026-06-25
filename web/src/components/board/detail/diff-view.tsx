"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import type { DiffFile, DiffStatus } from "@/mock/types";

// Monaco is heavy, so it is lazy-loaded and never server-rendered — the Diff
// tab is a P3 drill-down and must not weigh on the board/landing first paint
// (SC-002). Read-only, with the unified-diff text highlighted via the built-in
// "diff" language.
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.Editor),
  {
    ssr: false,
    loading: () => <div className="h-24 animate-pulse rounded-md bg-surface-2" />,
  },
);

const STATUS_STYLE: Record<DiffStatus, string> = {
  added: "border-good/40 text-good",
  modified: "border-warn/40 text-warn",
  deleted: "border-crit/40 text-crit",
};

function DiffFileView({ file }: { file: DiffFile }) {
  const { resolvedTheme } = useTheme();
  const lines = file.patch.split("\n").length;
  const height = Math.min(Math.max(lines, 3), 26) * 19 + 16;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-2 px-3 py-2">
        <span className="truncate font-mono text-xs text-dim">{file.path}</span>
        <span
          className={cn(
            "shrink-0 rounded border px-1.5 py-0.5 font-mono text-[0.7rem]",
            STATUS_STYLE[file.status],
          )}
        >
          {file.status}
        </span>
      </div>
      <MonacoEditor
        height={height}
        language="diff"
        value={file.patch}
        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
        options={{
          readOnly: true,
          domReadOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: "off",
          folding: false,
          fontSize: 12,
          renderLineHighlight: "none",
          overviewRulerLanes: 0,
          guides: { indentation: false },
        }}
      />
    </div>
  );
}

export function DiffView({ diff }: { diff?: DiffFile[] }) {
  if (!diff || diff.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-mute">
        No diff for this Spec yet.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {diff.map((file) => (
        <DiffFileView key={file.path} file={file} />
      ))}
    </div>
  );
}
