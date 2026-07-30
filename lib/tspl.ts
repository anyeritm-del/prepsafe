import { LabelData } from "./types";
import { formatDateShort, formatTimeShort } from "./format";

// Measured from the physical label stock with a ruler — not the 55x30mm
// originally assumed. Update these if you switch to a different label size.
export const LABEL_WIDTH_MM = 56;
export const LABEL_HEIGHT_MM = 26;
const GAP_MM = 2;

// Font "0" on this GS 2208D unit, calibrated by printing known strings at
// known multipliers and measuring the result: "0123456789" (10 chars) just
// fits the ~56mm label width at multiplier 7 without clipping. That implies
// roughly 70 "character-multiplier units" of width available per line —
// used below to size each line as large as will still fit. It's also
// consistent with an assumed 8 dots/mm (203dpi) print resolution.
const WIDTH_BUDGET_CHAR_MULT_UNITS = 70;
export const DOTS_PER_MM = 8;
// Not independently measured (no ruler reading was given for height) — a
// working estimate to keep lines from overflowing the 26mm/208-dot label
// height. Adjust if lines end up clipped at the bottom or overly spaced.
export const DOTS_PER_MULT_HEIGHT = 8;
const LINE_GAP_DOTS = 8;
// A prior calibration round found y=10 got clipped at the physical top
// edge while y=25 printed fine.
const TOP_MARGIN_DOTS = 20;
const LEFT_MARGIN_DOTS = 8;

// A 3-column side-by-side layout (label | date-time | clerk) was tried and
// printed too small to read comfortably — 3 columns sharing the 56mm
// width forces every column down to mult 2. Stacked full-width lines let
// each one use the whole width budget instead, at the cost of not
// visually matching the reference mockup's column layout.
const NAME_MAX_MULT = 5;
const ROW_MAX_MULT = 5;
const CLERK_MAX_MULT = 5;
const STATUS_MAX_MULT = 3;

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

/** Strips characters that would break out of a TSPL quoted string literal. */
function sanitize(value: string): string {
  return value.replace(/["\r\n]/g, "").trim();
}

/** Largest multiplier (up to `max`) that keeps `text` within the label width. */
function fittingMultiplier(text: string, max: number): number {
  const estimated = Math.floor(WIDTH_BUDGET_CHAR_MULT_UNITS / Math.max(text.length, 1));
  return Math.max(2, Math.min(max, estimated));
}

function dateTime(date: Date): string {
  return `${formatDateShort(date)} ${formatTimeShort(date)}`;
}

/**
 * Stacked full-width lines, each sized as large as its own text allows:
 * bold product name, "OOF"/"Prep By" (Thawing) or "Prep"/"EXP" (normal)
 * date-time lines, a Clerk line, and an optional status line. Returns
 * element positions in dots; use `generateLabelTspl` for the printer or
 * render these directly (scaled) for an on-screen preview.
 */
export function buildLabelElements(data: LabelData): LabelElement[] {
  const isThawing = data.status === "THAWING";
  const productName = sanitize(data.productName);
  const clerkLine = `Clerk: ${sanitize(data.preparedBy)}`;

  const row1Line = `${isThawing ? "OOF" : "Prep"} ${dateTime(data.preparedAt)}`;
  const row2Line = `${isThawing ? "Prep By" : "EXP"} ${dateTime(data.expiresAt)}`;

  const fields: Array<[string, number, boolean?]> = [
    [productName, fittingMultiplier(productName, NAME_MAX_MULT), true],
    [row1Line, fittingMultiplier(row1Line, ROW_MAX_MULT)],
    [row2Line, fittingMultiplier(row2Line, ROW_MAX_MULT)],
    [clerkLine, fittingMultiplier(clerkLine, CLERK_MAX_MULT)],
  ];

  if (data.status) {
    const statusLine = `-- ${sanitize(data.status)} --`;
    fields.push([statusLine, fittingMultiplier(statusLine, STATUS_MAX_MULT), true]);
  }

  let y = TOP_MARGIN_DOTS;
  return fields.map(([text, mult, bold]) => {
    const element: LabelElement = { x: LEFT_MARGIN_DOTS, y, mult, text, bold };
    y += mult * DOTS_PER_MULT_HEIGHT + LINE_GAP_DOTS;
    return element;
  });
}

export function generateLabelTspl(data: LabelData, copies: number): string {
  const safeCopies = Math.max(1, Math.floor(copies) || 1);

  const textCommands = buildLabelElements(data).flatMap((el) => {
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
