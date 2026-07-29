import { LabelData } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

interface LabelPreviewProps {
  data: LabelData;
}

// Physical label is 55mm x 30mm. We render it at this scale factor so it's
// legible on screen while keeping the same 55:30 aspect ratio as the print.
const SCALE = 6;

export function LabelPreview({ data }: LabelPreviewProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-neutral-500">Preview Label (55mm x 30mm)</p>
      <div
        className="flex flex-col justify-between border-2 border-neutral-800 bg-white p-3 text-black shadow-sm"
        style={{ width: 55 * SCALE, height: 30 * SCALE }}
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
