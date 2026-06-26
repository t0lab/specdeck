import { cn } from "@/lib/utils";
import type { ProjectMeta } from "@/mock/projects";

// The Project's identity glyph: a colored tile with its monogram. Shared by the
// sidebar (where it is the whole button when collapsed to the icon rail) and the
// project header. Text color is derived from the tile's luminance so the
// monogram stays readable on any Project color, in either theme.
function readableText(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#000";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  // perceived luminance (sRGB-weighted)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0a0c0f" : "#ffffff";
}

function monogram(name: string): string {
  const ch = name.trim().replace(/[^a-z0-9]/i, "").charAt(0);
  return (ch || "?").toUpperCase();
}

export function ProjectAvatar({
  project,
  className,
}: {
  project: Pick<ProjectMeta, "name" | "color">;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-md text-xs font-semibold",
        className,
      )}
      style={{ backgroundColor: project.color, color: readableText(project.color) }}
    >
      {monogram(project.name)}
    </span>
  );
}
