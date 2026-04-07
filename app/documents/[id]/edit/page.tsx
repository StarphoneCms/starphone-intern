// app/documents/[id]/edit/page.tsx
// SERVER COMPONENT — lädt Dokument + Items, prüft ob Entwurf

import { createServerComponentClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import EditDocumentForm from "./EditDocumentForm";

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (!doc) notFound();
  if (doc.status !== "entwurf") redirect(`/documents/${id}`);

  const { data: items } = await supabase
    .from("document_items")
    .select("*")
    .eq("document_id", id)
    .order("position");

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
      </div>
    }>
      <EditDocumentForm doc={doc} items={items ?? []} />
    </Suspense>
  );
}
