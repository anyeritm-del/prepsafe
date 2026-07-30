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
const LINE_GAP_DOTS = 4;
const TOP_MARGIN_DOTS = 4;
const LEFT_MARGIN_DOTS = 8;
// EXP is the food-safety-critical field: printed as its own date line and
// time line (rather than one combined "dd/mm HH:mm" line) so each is short
// enough to earn a much bigger multiplier out of the width budget above.
// At mult 9, two EXP lines alone take ~150 of the label's 208-dot height —
// there's only room left for two small (mult 2) supporting lines, so the
// separate small "EXP" header was dropped to fit.
const EXP_MULT = 9;

/** Strips characters that would break out of a TSPL quoted string literal. */
function sanitize(value: string): string {
  return value.replace(/["\r\n]/g, "").trim();
}

/** Largest multiplier (up to `max`) that keeps `text` within the label width. */
function fittingMultiplier(text: string, max: number): number {
  const estimated = Math.floor(WIDTH_BUDGET_CHAR_MULT_UNITS / Math.max(text.length, 1));
  return Math.max(2, Math.min(max, estimated));
}

export function generateLabelTspl(data: LabelData, copies: number): string {
  const productName = sanitize(data.productName);
  // Prepared *date* is dropped here (kept in the on-screen preview) so this
  // line is short enough to earn a bigger multiplier than a bare mult-2 —
  // it's still assumed to be today unless someone reads the full preview.
  const prepByLine = `Prep ${formatTimeShort(data.preparedAt)} By ${sanitize(data.preparedBy)}`;

  // Supporting fields (name, prepared time, staff) are kept small and
  // compact so the two big EXP lines below have room to be as large as
  // possible — that's the one piece of info kitchen staff need at a glance.
  const fields: Array<[string, number]> = [
    [productName, fittingMultiplier(productName, 2)],
    [formatDateShort(data.expiresAt), EXP_MULT],
    [formatTimeShort(data.expiresAt), EXP_MULT],
    [prepByLine, fittingMultiplier(prepByLine, 4)],
  ];

  const safeCopies = Math.max(1, Math.floor(copies) || 1);

  let y = TOP_MARGIN_DOTS;
  const textCommands = fields.map(([text, mult]) => {
    const command = `TEXT ${LEFT_MARGIN_DOTS},${y},"0",0,${mult},${mult},"${text}"`;
    y += mult * DOTS_PER_MULT_HEIGHT + LINE_GAP_DOTS;
    return command;
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

/**
 * Round 3: mult 6 from round 2 was legible and fit the width fine, but
 * still judged too small, and the mult 4 line got clipped at the very top
 * edge (y=10 sits too close to the physical edge under DIRECTION 1). This
 * tests bigger sizes still (7 and 10) with more top margin.
 */
export function generateCalibrationTspl(): string {
  const lines = [
    `SIZE ${LABEL_WIDTH_MM} mm,${LABEL_HEIGHT_MM} mm`,
    `GAP ${GAP_MM} mm,0 mm`,
    "DIRECTION 1",
    "CLS",
    `TEXT 10,25,"0",0,7,7,"0123456789"`,
    `TEXT 10,110,"0",0,10,10,"12345"`,
    "PRINT 1,1",
  ];

  return lines.join("\r\n") + "\r\n";
}
