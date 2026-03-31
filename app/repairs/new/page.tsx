// Pfad: src/app/repairs/new/page.tsx
// WICHTIG: Diese Datei darf KEIN "use client" haben und keinen useState/useSearchParams
// Sie dient nur als Server Component Wrapper mit Suspense

import { Suspense } from "react";
import { NewRepairForm } from "./NewRepairForm";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
      </div>
    }>
      <NewRepairForm />
    </Suspense>
  );
}