"use client";

import dynamic from "next/dynamic";
import type { PrintPageData } from "@/components/PrintLabelApp";

// WebUSB and the printer's clock are browser-only, so this is never
// rendered on the server.
const PrintLabelApp = dynamic(() => import("@/components/PrintLabelApp"), {
  ssr: false,
  loading: () => (
    <main className="flex flex-1 items-center justify-center">
      <p className="text-sm text-neutral-400">Memuat...</p>
    </main>
  ),
});

export function PrintPageClient({ data }: { data: PrintPageData }) {
  return <PrintLabelApp data={data} />;
}
