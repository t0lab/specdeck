import { redirect } from "next/navigation";

// A Project's index resolves to its default tab — Overview (FR-007). Server
// redirect: needs only the id, no client store, so the URL always reflects the
// real tab and refresh/share land on Overview.
export default async function ProjectIndex({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  redirect(`/p/${project}/overview`);
}
