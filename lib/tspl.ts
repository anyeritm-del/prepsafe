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
// A prior calibration round found y=10 got clipped at the physical top
// edge while y=25 printed fine — keep this at 18+ even when squeezed for
// height elsewhere.
const TOP_MARGIN_DOTS = 18;
const LEFT_MARGIN_DOTS = 8;

// Requested sizing: product name as large as possible (bold) and the
// clerk/staff line notably large too. Combined with the label's 26mm
// height, there isn't room left for EXP to also hit its requested
// multiplier while showing both date and time on one line — EXP is
// capped lower, and the prepared-time line is dropped from the physical
// print entirely (it still shows in the on-screen preview) to fit.
const NAME_MAX_MULT = 10;
const EXP_MAX_MULT = 6;
const BY_MAX_MULT = 7;
const STATUS_MAX_MULT = 2;

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
  // No "EXP:" prefix: at the requested multiplier, adding it drops the
  // line from fitting at mult 6 to mult 4 (see fittingMultiplier). Since
  // the prepared-time line was dropped from the physical print, this is
  // the only date/time shown, so it's unambiguous without a label.
  const expLine = `${formatDateShort(data.expiresAt)} ${formatTimeShort(data.expiresAt)}`;
  const byLine = `By: ${sanitize(data.preparedBy)}`;

  const nameMult = fittingMultiplier(productName, NAME_MAX_MULT);

  const fields: Array<[string, number]> = [
    [expLine, fittingMultiplier(expLine, EXP_MAX_MULT)],
    [byLine, fittingMultiplier(byLine, BY_MAX_MULT)],
  ];

  if (data.status) {
    const statusLine = `-- ${sanitize(data.status)} --`;
    fields.push([statusLine, fittingMultiplier(statusLine, STATUS_MAX_MULT)]);
  }

  const safeCopies = Math.max(1, Math.floor(copies) || 1);

  // Name is printed twice, offset by one dot horizontally, to simulate
  // bold — font "0" has no built-in bold variant on this printer.
  let y = TOP_MARGIN_DOTS;
  const nameCommands = [
    `TEXT ${LEFT_MARGIN_DOTS},${y},"0",0,${nameMult},${nameMult},"${productName}"`,
    `TEXT ${LEFT_MARGIN_DOTS + 1},${y},"0",0,${nameMult},${nameMult},"${productName}"`,
  ];
  y += nameMult * DOTS_PER_MULT_HEIGHT + LINE_GAP_DOTS;

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
    ...nameCommands,
    ...textCommands,
    `PRINT 1,${safeCopies}`,
  ];

  return lines.join("\r\n") + "\r\n";
}
