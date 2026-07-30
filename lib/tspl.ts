import { LabelData } from "./types";
import { formatDateShort, formatTimeShort } from "./format";

// Measured from the physical label stock with a ruler — not the 55x30mm
// originally assumed. Update these if you switch to a different label size.
export const LABEL_WIDTH_MM = 56;
export const LABEL_HEIGHT_MM = 26;
const GAP_MM = 2;

export const DOTS_PER_MM = 8;
// Font "0" on this GS 2208D unit, calibrated by printing known strings at
// known multipliers and measuring the result: "0123456789" (10 chars) just
// fits the ~56mm label width at multiplier 7 without clipping — i.e. about
// 6.4 dots of width per (character × multiplier) unit.
const DOTS_PER_CHAR_UNIT = (LABEL_WIDTH_MM * DOTS_PER_MM) / 70;
// Not independently measured (no ruler reading was given for height) — a
// working estimate for how tall one multiplier unit of font "0" prints.
// Adjust if lines end up clipped or under-filling the label height.
export const DOTS_PER_MULT_HEIGHT = 8;
// The largest multiplier the auto-fit search below will try, as a sanity
// ceiling — no realistic label content should ever need more than this.
const MAX_MULT_CEILING = 20;

/** Margins (mm) around the printable area, plus vertical line spacing —
 * adjustable per Store so each printer/label setup can be calibrated
 * without a code change. */
export interface LabelMargins {
  topMm: number;
  bottomMm: number;
  leftMm: number;
  rightMm: number;
  lineGapMm: number;
}

// A prior calibration round found text near the very top edge (y=10 dots,
// ~1.25mm) got clipped by the printer while y=25 dots (~3mm) printed fine
// — hence the larger default top margin.
export const DEFAULT_LABEL_MARGINS: LabelMargins = {
  topMm: 3,
  bottomMm: 1,
  leftMm: 1,
  rightMm: 1,
  lineGapMm: 1,
};

/** One piece of text to render, in printer dots — shared by the TSPL
 * generator and the on-screen preview so they can never drift apart. */
export interface LabelElement {
  x: number;
  y: number;
  mult: number;
  text: string;
  /** Font "0" has no built-in bold; bold elements get double-printed with a 1-dot offset. */
  bold?: boolean;
}

interface FieldSpec {
  text: string;
  bold?: boolean;
  /** Manual size override — skips auto-fit for this field entirely. */
  fixedMult?: number;
}

/** Manual per-field size overrides (TSPL multiplier). Undefined/null means
 * "Auto" — sized by the fit-to-box algorithm below. */
export interface LabelMultOverrides {
  name?: number | null;
  row1?: number | null;
  row2?: number | null;
  clerk?: number | null;
  status?: number | null;
}

/** Strips characters that would break out of a TSPL quoted string literal. */
function sanitize(value: string): string {
  return value.replace(/["\r\n]/g, "").trim();
}

function dateTime(date: Date): string {
  return `${formatDateShort(date)} ${formatTimeShort(date)}`;
}

/**
 * Stacks `fields` top to bottom. Fields with a manual `fixedMult` use it
 * exactly, as-is (even if it overflows — that's the point of a manual
 * override). The rest are auto-fit into whatever width×height remains
 * after subtracting the fixed fields' own height: for each candidate
 * uniform multiplier `m`, every auto field is sized to `min(m, its own
 * width-fit limit)` — short fields keep growing with `m` past where
 * longer ones have already maxed out their own width — and the search
 * keeps the largest `m` whose resulting stack still fits the remaining
 * height budget.
 */
function layoutStackedFields(
  fields: FieldSpec[],
  availWidthDots: number,
  availHeightDots: number,
  lineGapDots: number,
): Array<{ mult: number }> {
  if (fields.length === 0) return [];

  const gapsHeight = (fields.length - 1) * lineGapDots;
  const fixedHeight = fields.reduce(
    (sum, f) => sum + (f.fixedMult ? f.fixedMult * DOTS_PER_MULT_HEIGHT : 0),
    0,
  );
  const availHeightForAuto = availHeightDots - gapsHeight - fixedHeight;

  const autoIndexes = fields.reduce<number[]>((acc, f, i) => {
    if (!f.fixedMult) acc.push(i);
    return acc;
  }, []);
  const widthCaps = autoIndexes.map((i) =>
    Math.max(2, Math.floor(availWidthDots / (Math.max(fields[i].text.length, 1) * DOTS_PER_CHAR_UNIT))),
  );

  const stackHeight = (mults: number[]) =>
    mults.reduce((sum, mult) => sum + mult * DOTS_PER_MULT_HEIGHT, 0);

  let bestAuto = widthCaps.map(() => 2);
  for (let m = 2; m <= MAX_MULT_CEILING; m++) {
    const candidate = widthCaps.map((cap) => Math.min(cap, m));
    if (stackHeight(candidate) <= availHeightForAuto) {
      bestAuto = candidate;
    } else {
      break;
    }
  }

  const result = fields.map((f) => ({ mult: f.fixedMult ?? 2 }));
  autoIndexes.forEach((fieldIndex, autoI) => {
    result[fieldIndex] = { mult: bestAuto[autoI] };
  });
  return result;
}

/**
 * Stacked full-width lines, auto-sized to fill the printable area (label
 * size minus `margins`): bold product name, "OOF"/"Prep By" (Thawing) or
 * "Prep"/"EXP" (normal) date-time lines, a Clerk line, and an optional
 * status line. Returns element positions in dots; use `generateLabelTspl`
 * for the printer or render these directly (scaled) for an on-screen
 * preview.
 */
export function buildLabelElements(
  data: LabelData,
  margins: LabelMargins = DEFAULT_LABEL_MARGINS,
  overrides: LabelMultOverrides = {},
): LabelElement[] {
  const isThawing = data.status === "THAWING";
  const productName = sanitize(data.productName);
  const clerkLine = `Clerk: ${sanitize(data.preparedBy)}`;
  const row1Line = `${isThawing ? "OOF" : "Prep"} ${dateTime(data.preparedAt)}`;
  const row2Line = `${isThawing ? "Prep By" : "EXP"} ${dateTime(data.expiresAt)}`;

  const fields: FieldSpec[] = [
    { text: productName, bold: true, fixedMult: overrides.name ?? undefined },
    { text: row1Line, fixedMult: overrides.row1 ?? undefined },
    { text: row2Line, fixedMult: overrides.row2 ?? undefined },
    { text: clerkLine, fixedMult: overrides.clerk ?? undefined },
  ];
  if (data.status) {
    fields.push({
      text: `-- ${sanitize(data.status)} --`,
      bold: true,
      fixedMult: overrides.status ?? undefined,
    });
  }

  const leftDots = margins.leftMm * DOTS_PER_MM;
  const lineGapDots = margins.lineGapMm * DOTS_PER_MM;
  const availWidthDots = LABEL_WIDTH_MM * DOTS_PER_MM - leftDots - margins.rightMm * DOTS_PER_MM;
  const availHeightDots =
    LABEL_HEIGHT_MM * DOTS_PER_MM - margins.topMm * DOTS_PER_MM - margins.bottomMm * DOTS_PER_MM;

  const sizes = layoutStackedFields(fields, availWidthDots, availHeightDots, lineGapDots);

  let y = margins.topMm * DOTS_PER_MM;
  return fields.map((field, i) => {
    const mult = sizes[i].mult;
    const element: LabelElement = { x: leftDots, y, mult, text: field.text, bold: field.bold };
    y += mult * DOTS_PER_MULT_HEIGHT + lineGapDots;
    return element;
  });
}

export function generateLabelTspl(
  data: LabelData,
  copies: number,
  margins: LabelMargins = DEFAULT_LABEL_MARGINS,
  overrides: LabelMultOverrides = {},
): string {
  const safeCopies = Math.max(1, Math.floor(copies) || 1);

  const textCommands = buildLabelElements(data, margins, overrides).flatMap((el) => {
    const command = `TEXT ${el.x},${el.y},"0",0,${el.mult},${el.mult},"${el.text}"`;
    return el.bold ? [command, `TEXT ${el.x + 1},${el.y},"0",0,${el.mult},${el.mult},"${el.text}"`] : [command];
  });

  const lines = [
    `SIZE ${LABEL_WIDTH_MM} mm,${LABEL_HEIGHT_MM} mm`,
    `GAP ${GAP_MM} mm,0 mm`,
    "DIRECTION 1",
    "CLS",
    ...textCommands,
    `PRINT 1,${safeCopies}`,
  ];

  return lines.join("\r\n") + "\r\n";
}
