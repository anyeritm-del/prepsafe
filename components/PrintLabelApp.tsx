"use client";

import { useState } from "react";
import { LabelForm } from "@/components/LabelForm";
import { LabelPreview } from "@/components/LabelPreview";
import { PrinterConnect } from "@/components/PrinterConnect";
import { addHours } from "@/lib/format";
import { generateLabelTspl } from "@/lib/tspl";
import { LabelData, SHELF_LIFE_PRESETS } from "@/lib/types";
import { PrinterConnection, sendToPrinter } from "@/lib/webusb";

type PrintStatus =
  | { state: "idle" }
  | { state: "printing" }
  | { state: "success" }
  | { state: "error"; message: string };

function createDefaultLabelData(): LabelData {
  const now = new Date();
  const defaultHours = SHELF_LIFE_PRESETS[0].hours ?? 4;
  return {
    productName: "",
    preparedBy: "",
    preparedAt: now,
    expiresAt: addHours(now, defaultHours),
  };
}

// This component is only ever mounted client-side (see app/page.tsx, which
// loads it with next/dynamic and ssr: false), so it's safe to read the
// client clock directly in useState's lazy initializer without risking a
// server/client hydration mismatch.
export default function PrintLabelApp() {
  const [data, setData] = useState<LabelData>(createDefaultLabelData);
  const [selectedPresetLabel, setSelectedPresetLabel] = useState(SHELF_LIFE_PRESETS[0].label);
  const [copies, setCopies] = useState(1);
  const [connection, setConnection] = useState<PrinterConnection | null>(null);
  const [printStatus, setPrintStatus] = useState<PrintStatus>({ state: "idle" });

  async function handlePrint() {
    if (!connection) return;
    setPrintStatus({ state: "printing" });
    try {
      const tspl = generateLabelTspl(data, copies);
      await sendToPrinter(connection, tspl);
      setPrintStatus({ state: "success" });
    } catch (err) {
      setPrintStatus({
        state: "error",
        message: err instanceof Error ? err.message : "Gagal mencetak label.",
      });
    }
  }

  const canPrint = Boolean(connection) && data.productName.trim().length > 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Print Label</h1>
        <p className="text-sm text-neutral-500">Cetak label ke printer GS 2208D (55mm x 30mm)</p>
      </div>

      <PrinterConnect connection={connection} onConnectionChange={setConnection} />

      <div className="grid gap-8 sm:grid-cols-2">
        <LabelForm
          data={data}
          onChange={setData}
          copies={copies}
          onCopiesChange={setCopies}
          selectedPresetLabel={selectedPresetLabel}
          onPresetChange={setSelectedPresetLabel}
        />
        <div className="flex flex-col items-start gap-4">
          <LabelPreview data={data} />
          <button
            type="button"
            onClick={handlePrint}
            disabled={!canPrint || printStatus.state === "printing"}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {printStatus.state === "printing" ? "Mencetak..." : "Cetak Label"}
          </button>
          {printStatus.state === "success" && (
            <p className="text-sm text-green-600">Label berhasil dikirim ke printer.</p>
          )}
          {printStatus.state === "error" && (
            <p className="text-sm text-red-600">{printStatus.message}</p>
          )}
        </div>
      </div>
    </main>
  );
}
