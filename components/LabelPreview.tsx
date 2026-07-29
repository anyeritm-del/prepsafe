import { LabelData } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { LABEL_WIDTH_MM, LABEL_HEIGHT_MM } from "@/lib/tspl";

interface LabelPreviewProps {
  data: LabelData;
}

// Scale factor so the preview is legible on screen while keeping the same
// aspect ratio as the physical label (see lib/tspl.ts for the real size).
const SCALE = 6;

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
        <p className="truncate text-lg font-bold leading-tight">
          {data.productName || "Nama Produk"}
        </p>
        <p className="text-xs leading-tight">
          Disiapkan: {formatDateTime(data.preparedAt)}
        </p>
        <p className="text-base font-bold leading-tight">
          EXP: {formatDateTime(data.expiresAt)}
        </p>
        <p className="text-xs leading-tight">Oleh: {data.preparedBy || "-"}</p>
      </div>
    </div>
  );
}
