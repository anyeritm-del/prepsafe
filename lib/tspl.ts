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

// Product name stays a fixed multiplier (not fully adaptive) so it reads
// consistently across items instead of swinging from huge (short names)
// to tiny (long names) — the widest realistic name still fits at this
// size; longer ones fall back to fittingMultiplier's auto-shrink.
const NAME_MULT = 4;
// The 3-column info table (label / date-time / clerk) needs to fit all
// three side by side within the 56mm width, which only leaves room for a
// modest multiplier — this is the trade-off for the name staying big.
const TABLE_MULT = 2;
const STATUS_MULT = 3;

// X positions (dots) for the 3 columns of the info table, sized for the
// longest expected content per column at TABLE_MULT ("Prep By" / "30/07
// 11:15" / a short clerk name) plus a gap between columns.
const COLUMN_X = [LEFT_MARGIN_DOTS, 108, 265];

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
 * Modeled on a real PrepSafe label: big product name, then a compact
 * 3-column table (label / date-time / clerk) — "OOF" (Out Of Freezer) and
 * "Prep By" for a Thawing print, or "Prep" and "EXP" for a normal one —
 * plus an optional status line (e.g. "THAWING"). Returns element positions
 * in dots; use `generateLabelTspl` for the printer or render these
 * directly (scaled) for an on-screen preview.
 */
export function buildLabelElements(data: LabelData): LabelElement[] {
  const isThawing = data.status === "THAWING";
  const productName = sanitize(data.productName);
  const clerkName = sanitize(data.preparedBy);
  const nameMult = fittingMultiplier(productName, NAME_MULT);

  const row1Label = isThawing ? "OOF" : "Prep";
  const row1Value = dateTime(data.preparedAt);
  const row2Label = isThawing ? "Prep By" : "EXP";
  const row2Value = dateTime(data.expiresAt);

  let y = TOP_MARGIN_DOTS;
  const elements: LabelElement[] = [
    { x: LEFT_MARGIN_DOTS, y, mult: nameMult, text: productName, bold: true },
  ];
  y += nameMult * DOTS_PER_MULT_HEIGHT + LINE_GAP_DOTS;

  const row1Y = y;
  y += TABLE_MULT * DOTS_PER_MULT_HEIGHT + LINE_GAP_DOTS;
  const row2Y = y;
  y += TABLE_MULT * DOTS_PER_MULT_HEIGHT + LINE_GAP_DOTS;

  elements.push(
    { x: COLUMN_X[0], y: row1Y, mult: TABLE_MULT, text: row1Label },
    { x: COLUMN_X[1], y: row1Y, mult: TABLE_MULT, text: row1Value },
    { x: COLUMN_X[2], y: row1Y, mult: TABLE_MULT, text: "Clerk" },
    { x: COLUMN_X[0], y: row2Y, mult: TABLE_MULT, text: row2Label },
    { x: COLUMN_X[1], y: row2Y, mult: TABLE_MULT, text: row2Value },
    { x: COLUMN_X[2], y: row2Y, mult: TABLE_MULT, text: clerkName },
  );

  if (data.status) {
    elements.push({
      x: LEFT_MARGIN_DOTS,
      y,
      mult: STATUS_MULT,
      text: `-- ${sanitize(data.status)} --`,
      bold: true,
    });
  }

  return elements;
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
