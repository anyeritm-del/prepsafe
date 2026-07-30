import { LabelData } from "@/lib/types";
import { formatDateShort, formatTimeShort } from "@/lib/format";
import { LABEL_WIDTH_MM, LABEL_HEIGHT_MM } from "@/lib/tspl";

interface LabelPreviewProps {
  data: LabelData;
}

// Scale factor so the preview is legible on screen while keeping the same
// aspect ratio as the physical label (see lib/tspl.ts for the real size).
const SCALE = 6;

// Mirrors the actual field order/emphasis printed by generateLabelTspl in
// lib/tspl.ts: small name, then EXP date and time as the two big dominant
// lines, then a small combined prepared-time/staff line. Keep this in sync
// whenever that layout changes, so the preview doesn't mislead like the
// old single-EXP-line version did.
export function LabelPreview({ data }: LabelPreviewProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-neutral-500">
        Preview Label ({LABEL_WIDTH_MM}mm x {LABEL_HEIGHT_MM}mm)
      </p>
      <div
        className="flex flex-col justify-between border-2 border-neutral-800 bg-white p-3 text-black shadow-sm"
        style={{ width: LABEL_WIDTH_MM * SCALE, height: LABEL_HEIGHT_MM * SCALE }}
      >
        <p className="truncate text-xs font-medium leading-tight">
          {data.productName || "Nama Produk"}
        </p>
        <p className="text-3xl font-bold leading-none">{formatDateShort(data.expiresAt)}</p>
        <p className="text-3xl font-bold leading-none">{formatTimeShort(data.expiresAt)}</p>
        <p className="truncate text-xs leading-tight">
          Prep {formatTimeShort(data.preparedAt)} By {data.preparedBy || "-"}
        </p>
      </div>
    </div>
  );
}
