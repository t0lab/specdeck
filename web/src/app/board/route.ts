import { redirect } from "next/navigation";

import { DEFAULT_PROJECT_ID } from "@/mock/projects";

// Legacy /board entry point. The board now lives per-Project; send /board to the
// default Project's board so old links (landing CTA, bookmarks) keep working.
export function GET() {
  redirect(`/p/${DEFAULT_PROJECT_ID}/board`);
}
