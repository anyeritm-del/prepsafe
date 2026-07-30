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
const LINE_GAP_DOTS = 8;
// The largest multiplier the auto-fit search below will try, as a sanity
// ceiling — no realistic label content should ever need more than this.
const MAX_MULT_CEILING = 20;

/** Margins (mm) around the printable area — adjustable per Store so each
 * printer/label setup can be calibrated without a code change. */
export interface LabelMargins {
  topMm: number;
  bottomMm: number;
  leftMm: number;
  rightMm: number;
}

// A prior calibration round found text near the very top edge (y=10 dots,
// ~1.25mm) got clipped by the printer while y=25 dots (~3mm) printed fine
// — hence the larger default top margin.
export const DEFAULT_LABEL_MARGINS: LabelMargins = {
  topMm: 3,
  bottomMm: 1,
  leftMm: 1,
  rightMm: 1,
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
}

/** Strips characters that would break out of a TSPL quoted string literal. */
function sanitize(value: string): string {
  return value.replace(/["\r\n]/g, "").trim();
}

function dateTime(date: Date): string {
  return `${formatDateShort(date)} ${formatTimeShort(date)}`;
}

/**
 * Stacks `fields` top to bottom, each as large as it can be, filling as
 * much of the available width×height box as possible instead of using a
 * fixed per-field size cap (which was leaving visible blank space). For
 * each candidate uniform multiplier `m`, every field is sized to
 * `min(m, its own width-fit limit)` — short fields keep growing with `m`
 * past where longer ones have already maxed out their own width — and the
 * search keeps the largest `m` whose resulting stack still fits the
 * height budget.
 */
function layoutStackedFields(
  fields: FieldSpec[],
  availWidthDots: number,
  availHeightDots: number,
): Array<{ mult: number }> {
  if (fields.length === 0) return [];

  const widthCaps = fields.map((f) =>
    Math.max(2, Math.floor(availWidthDots / (Math.max(f.text.length, 1) * DOTS_PER_CHAR_UNIT))),
  );

  const stackHeight = (mults: number[]) =>
    mults.reduce((sum, mult) => sum + mult * DOTS_PER_MULT_HEIGHT, 0) +
    (fields.length - 1) * LINE_GAP_DOTS;

  let best = widthCaps.map(() => 2);
  for (let m = 2; m <= MAX_MULT_CEILING; m++) {
    const candidate = widthCaps.map((cap) => Math.min(cap, m));
    if (stackHeight(candidate) <= availHeightDots) {
      best = candidate;
    } else {
      break;
    }
  }

  return best.map((mult) => ({ mult }));
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
): LabelElement[] {
  const isThawing = data.status === "THAWING";
  const productName = sanitize(data.productName);
  const clerkLine = `Clerk: ${sanitize(data.preparedBy)}`;
  const row1Line = `${isThawing ? "OOF" : "Prep"} ${dateTime(data.preparedAt)}`;
  const row2Line = `${isThawing ? "Prep By" : "EXP"} ${dateTime(data.expiresAt)}`;

  const fields: FieldSpec[] = [
    { text: productName, bold: true },
    { text: row1Line },
    { text: row2Line },
    { text: clerkLine },
  ];
  if (data.status) {
    fields.push({ text: `-- ${sanitize(data.status)} --`, bold: true });
  }

  const leftDots = margins.leftMm * DOTS_PER_MM;
  const availWidthDots = LABEL_WIDTH_MM * DOTS_PER_MM - leftDots - margins.rightMm * DOTS_PER_MM;
  const availHeightDots =
    LABEL_HEIGHT_MM * DOTS_PER_MM - margins.topMm * DOTS_PER_MM - margins.bottomMm * DOTS_PER_MM;

  const sizes = layoutStackedFields(fields, availWidthDots, availHeightDots);

  let y = margins.topMm * DOTS_PER_MM;
  return fields.map((field, i) => {
    const mult = sizes[i].mult;
    const element: LabelElement = { x: leftDots, y, mult, text: field.text, bold: field.bold };
    y += mult * DOTS_PER_MULT_HEIGHT + LINE_GAP_DOTS;
    return element;
  });
}

export function generateLabelTspl(
  data: LabelData,
  copies: number,
  margins: LabelMargins = DEFAULT_LABEL_MARGINS,
): string {
  const safeCopies = Math.max(1, Math.floor(copies) || 1);

  const textCommands = buildLabelElements(data, margins).flatMap((el) => {
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
