import { LabelData } from "@/lib/types";
import {
  buildLabelElements,
  LABEL_WIDTH_MM,
  LABEL_HEIGHT_MM,
  DOTS_PER_MM,
  DOTS_PER_MULT_HEIGHT,
  LabelMargins,
} from "@/lib/tspl";

interface LabelPreviewProps {
  data: LabelData;
  margins?: LabelMargins;
}

// Scale factor (screen px per physical mm) for the preview box.
const SCALE = 6;
const PX_PER_DOT = SCALE / DOTS_PER_MM;

// Renders the exact same element list generateLabelTspl() turns into TEXT
// commands, positioned/sized from the same dot coordinates — so the
// preview can't drift out of sync with the physical print the way a
// hand-written approximation did. Content that would print past the
// label's physical edge is clipped here too (overflow-hidden), matching
// what actually happens on paper.
export function LabelPreview({ data, margins }: LabelPreviewProps) {
  const elements = buildLabelElements(data, margins);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-neutral-500">
        Preview Label ({LABEL_WIDTH_MM}mm x {LABEL_HEIGHT_MM}mm)
      </p>
      <div
        className="relative overflow-hidden border-2 border-neutral-800 bg-white text-black shadow-sm"
        style={{ width: LABEL_WIDTH_MM * SCALE, height: LABEL_HEIGHT_MM * SCALE }}
      >
        {elements.map((el, i) => (
          <span
            key={i}
            className="absolute whitespace-nowrap font-mono leading-none"
            style={{
              left: el.x * PX_PER_DOT,
              top: el.y * PX_PER_DOT,
              fontSize: el.mult * DOTS_PER_MULT_HEIGHT * PX_PER_DOT,
              fontWeight: el.bold ? 900 : 400,
            }}
          >
            {el.text || " "}
          </span>
        ))}
      </div>
    </div>
  );
}
