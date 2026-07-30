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
// used below to size each line as large as will still fit.
const WIDTH_BUDGET_CHAR_MULT_UNITS = 70;
// Not independently measured (no ruler reading was given for height) — a
// working estimate to keep lines from overflowing the 26mm/208-dot label
// height. Adjust if lines end up clipped at the bottom or overly spaced.
const DOTS_PER_MULT_HEIGHT = 8;
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
 * plus an optional status line (e.g. "THAWING").
 */
export function generateLabelTspl(data: LabelData, copies: number): string {
  const isThawing = data.status === "THAWING";
  const productName = sanitize(data.productName);
  const clerkName = sanitize(data.preparedBy);
  const nameMult = fittingMultiplier(productName, NAME_MULT);

  const row1Label = isThawing ? "OOF" : "Prep";
  const row1Value = dateTime(data.preparedAt);
  const row2Label = isThawing ? "Prep By" : "EXP";
  const row2Value = dateTime(data.expiresAt);

  const safeCopies = Math.max(1, Math.floor(copies) || 1);

  // Name is printed twice, offset by one dot horizontally, to simulate
  // bold — font "0" has no built-in bold variant on this printer.
  let y = TOP_MARGIN_DOTS;
  const nameCommands = [
    `TEXT ${LEFT_MARGIN_DOTS},${y},"0",0,${nameMult},${nameMult},"${productName}"`,
    `TEXT ${LEFT_MARGIN_DOTS + 1},${y},"0",0,${nameMult},${nameMult},"${productName}"`,
  ];
  y += nameMult * DOTS_PER_MULT_HEIGHT + LINE_GAP_DOTS;

  const row1Y = y;
  y += TABLE_MULT * DOTS_PER_MULT_HEIGHT + LINE_GAP_DOTS;
  const row2Y = y;
  y += TABLE_MULT * DOTS_PER_MULT_HEIGHT + LINE_GAP_DOTS;

  const tableCommands = [
    `TEXT ${COLUMN_X[0]},${row1Y},"0",0,${TABLE_MULT},${TABLE_MULT},"${row1Label}"`,
    `TEXT ${COLUMN_X[1]},${row1Y},"0",0,${TABLE_MULT},${TABLE_MULT},"${row1Value}"`,
    `TEXT ${COLUMN_X[2]},${row1Y},"0",0,${TABLE_MULT},${TABLE_MULT},"Clerk"`,
    `TEXT ${COLUMN_X[0]},${row2Y},"0",0,${TABLE_MULT},${TABLE_MULT},"${row2Label}"`,
    `TEXT ${COLUMN_X[1]},${row2Y},"0",0,${TABLE_MULT},${TABLE_MULT},"${row2Value}"`,
    `TEXT ${COLUMN_X[2]},${row2Y},"0",0,${TABLE_MULT},${TABLE_MULT},"${clerkName}"`,
  ];

  const statusCommands: string[] = [];
  if (data.status) {
    const statusLine = `-- ${sanitize(data.status)} --`;
    statusCommands.push(
      `TEXT ${LEFT_MARGIN_DOTS},${y},"0",0,${STATUS_MULT},${STATUS_MULT},"${statusLine}"`,
    );
  }

  const lines = [
    `SIZE ${LABEL_WIDTH_MM} mm,${LABEL_HEIGHT_MM} mm`,
    `GAP ${GAP_MM} mm,0 mm`,
    "DIRECTION 1",
    "CLS",
    ...nameCommands,
    ...tableCommands,
    ...statusCommands,
    `PRINT 1,${safeCopies}`,
  ];

  return lines.join("\r\n") + "\r\n";
}
