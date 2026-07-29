import { LabelData } from "./types";
import { formatDateTimeShort } from "./format";

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
// working estimate to keep 4 lines from overflowing the 26mm/208-dot label
// height. Adjust if lines end up clipped at the bottom or overly spaced.
const DOTS_PER_MULT_HEIGHT = 8;
const LINE_GAP_DOTS = 6;
const TOP_MARGIN_DOTS = 12;
const LEFT_MARGIN_DOTS = 8;

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
  const preparedLine = `Prep: ${formatDateTimeShort(data.preparedAt)}`;
  const expValue = formatDateTimeShort(data.expiresAt);
  const byLine = `By: ${sanitize(data.preparedBy)}`;

  // EXP is the food-safety-critical field, so its value gets its own line
  // (with just a small "EXP" header above it) to earn the largest cap;
  // prepared-time and staff initials are supporting info, kept smaller.
  const fields: Array<[string, number]> = [
    [productName, fittingMultiplier(productName, 4)],
    ["EXP", 2],
    [expValue, fittingMultiplier(expValue, 7)],
    [preparedLine, fittingMultiplier(preparedLine, 3)],
    [byLine, fittingMultiplier(byLine, 3)],
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
