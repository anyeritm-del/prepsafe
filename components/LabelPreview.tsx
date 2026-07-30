import { LabelData } from "@/lib/types";
import { formatDateShort, formatTimeShort } from "@/lib/format";
import { LABEL_WIDTH_MM, LABEL_HEIGHT_MM } from "@/lib/tspl";

interface LabelPreviewProps {
  data: LabelData;
}

// Scale factor so the preview is legible on screen while keeping the same
// aspect ratio as the physical label (see lib/tspl.ts for the real size).
const SCALE = 6;

// Mirrors generateLabelTspl in lib/tspl.ts: bold product name (largest),
// a bare EXP date/time line, a bold "By" line, and an optional status
// line. Prepared time is shown here for reference but is NOT on the
// physical print (dropped for space) — keep this in sync if that changes.
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
        <p className="truncate text-2xl font-black leading-none">
          {data.productName || "Nama Produk"}
        </p>
        <p className="truncate text-lg font-semibold leading-none">
          {formatDateShort(data.expiresAt)} {formatTimeShort(data.expiresAt)}
        </p>
        <p className="truncate text-xl font-bold leading-none">By: {data.preparedBy || "-"}</p>
        {data.status && (
          <p className="truncate text-sm font-bold leading-tight">-- {data.status} --</p>
        )}
        <p className="truncate text-[10px] text-neutral-400 leading-tight">
          (tidak dicetak) Prep: {formatDateShort(data.preparedAt)} {formatTimeShort(data.preparedAt)}
        </p>
      </div>
    </div>
  );
}
