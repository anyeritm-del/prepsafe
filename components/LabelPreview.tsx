import { LabelData } from "@/lib/types";
import { formatDateShort, formatTimeShort } from "@/lib/format";
import { LABEL_WIDTH_MM, LABEL_HEIGHT_MM } from "@/lib/tspl";

interface LabelPreviewProps {
  data: LabelData;
}

// Scale factor so the preview is legible on screen while keeping the same
// aspect ratio as the physical label (see lib/tspl.ts for the real size).
const SCALE = 6;

function dateTime(date: Date): string {
  return `${formatDateShort(date)} ${formatTimeShort(date)}`;
}

// Mirrors generateLabelTspl in lib/tspl.ts: a bold product name, then a
// 3-column table (label / date-time / clerk) — "OOF"/"Prep By" for a
// Thawing print, "Prep"/"EXP" otherwise — plus an optional status line.
// Keep this in sync whenever that layout changes.
export function LabelPreview({ data }: LabelPreviewProps) {
  const isThawing = data.status === "THAWING";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-neutral-500">
        Preview Label ({LABEL_WIDTH_MM}mm x {LABEL_HEIGHT_MM}mm)
      </p>
      <div
        className="flex flex-col justify-between border-2 border-neutral-800 bg-white p-3 text-black shadow-sm"
        style={{ width: LABEL_WIDTH_MM * SCALE, height: LABEL_HEIGHT_MM * SCALE }}
      >
        <p className="truncate text-xl font-black leading-none">
          {data.productName || "Nama Produk"}
        </p>
        <div className="grid grid-cols-3 gap-x-2 text-xs leading-tight">
          <span>{isThawing ? "OOF" : "Prep"}</span>
          <span>{dateTime(data.preparedAt)}</span>
          <span>Clerk</span>
          <span>{isThawing ? "Prep By" : "EXP"}</span>
          <span>{dateTime(data.expiresAt)}</span>
          <span className="truncate">{data.preparedBy || "-"}</span>
        </div>
        {data.status && (
          <p className="truncate text-sm font-bold leading-tight">-- {data.status} --</p>
        )}
      </div>
    </div>
  );
}
