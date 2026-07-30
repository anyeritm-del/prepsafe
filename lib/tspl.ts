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
const LINE_GAP_DOTS = 6;
// A prior calibration round found y=10 got clipped at the physical top
// edge while y=25 printed fine.
const TOP_MARGIN_DOTS = 18;
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

/**
 * Moderate, uniform sizing (name a bit bigger, everything else the same
 * size) laid out as a compact info table — Name / EXP / Prep / By, plus an
 * optional status line (e.g. "THAWING") — modeled after a real PrepSafe
 * label rather than maximizing any single field's size.
 */
export function generateLabelTspl(data: LabelData, copies: number): string {
  const productName = sanitize(data.productName);
  const expLine = `EXP: ${formatDateShort(data.expiresAt)} ${formatTimeShort(data.expiresAt)}`;
  const prepLine = `Prep: ${formatDateShort(data.preparedAt)} ${formatTimeShort(data.preparedAt)}`;
  const byLine = `By: ${sanitize(data.preparedBy)}`;

  const fields: Array<[string, number]> = [
    [productName, fittingMultiplier(productName, 4)],
    [expLine, fittingMultiplier(expLine, 3)],
    [prepLine, fittingMultiplier(prepLine, 3)],
    [byLine, fittingMultiplier(byLine, 3)],
  ];

  if (data.status) {
    const statusLine = `-- ${sanitize(data.status)} --`;
    fields.push([statusLine, fittingMultiplier(statusLine, 3)]);
  }

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
