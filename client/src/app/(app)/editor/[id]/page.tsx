import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editor" };

export default async function EditorPage({ params }: PageProps<"/editor/[id]">) {
  const { id } = await params;

  return (
    <div className="space-y-1">
      <h1 className="font-heading text-2xl font-semibold">Edit resume</h1>
      <p className="text-sm text-muted-foreground">Resume {id}</p>
    </div>
  );
}
