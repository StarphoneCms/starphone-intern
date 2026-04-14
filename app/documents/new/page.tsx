import { Suspense } from "react";
import NewDocumentForm from "./NewDocumentForm";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; repair_id?: string }>;
}) {
  const params = await searchParams;
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
      </div>
    }>
      <NewDocumentForm prefillType={params.type} repairId={params.repair_id} />
    </Suspense>
  );
}
