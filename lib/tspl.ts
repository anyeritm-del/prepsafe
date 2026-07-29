import { LabelData } from "./types";
import { formatDateTime } from "./format";

// Measured from the physical label stock with a ruler — not the 55x30mm
// originally assumed. Update these if you switch to a different label size.
export const LABEL_WIDTH_MM = 56;
export const LABEL_HEIGHT_MM = 26;
const GAP_MM = 2;

// Font "0" is the built-in font confirmed working on the GS 2208D. At x/y
// multiplier 2 a product name longer than this many characters starts
// running past the label width, so we drop to multiplier 1 instead.
const PRODUCT_NAME_LARGE_FONT_LIMIT = 18;

/** Strips characters that would break out of a TSPL quoted string literal. */
function sanitize(value: string): string {
  return value.replace(/["\r\n]/g, "").trim();
}

export function generateLabelTspl(data: LabelData, copies: number): string {
  const productName = sanitize(data.productName);
  const preparedBy = sanitize(data.preparedBy);
  const preparedAt = formatDateTime(data.preparedAt);
  const expiresAt = formatDateTime(data.expiresAt);

  const nameMult = productName.length > PRODUCT_NAME_LARGE_FONT_LIMIT ? 1 : 2;
  const safeCopies = Math.max(1, Math.floor(copies) || 1);

  const lines = [
    `SIZE ${LABEL_WIDTH_MM} mm,${LABEL_HEIGHT_MM} mm`,
    `GAP ${GAP_MM} mm,0 mm`,
    "DIRECTION 1",
    "CLS",
    `TEXT 10,10,"0",0,${nameMult},${nameMult},"${productName}"`,
    `TEXT 10,45,"0",0,1,1,"Disiapkan: ${preparedAt}"`,
    `TEXT 10,70,"0",0,2,2,"EXP: ${expiresAt}"`,
    `TEXT 10,105,"0",0,1,1,"Oleh: ${preparedBy}"`,
    `PRINT 1,${safeCopies}`,
  ];

  return lines.join("\r\n") + "\r\n";
}

/**
 * Round 2: multiplier 1-3 (previous test) were all judged "still too small"
 * even at mult 3, despite the calibration box confirming our mm/dot
 * assumptions were roughly correct. So this tests much bigger sizes (4 and
 * 6) with the same 10-digit string, to find where it stops fitting the
 * label width and to measure real character height with a ruler.
 */
export function generateCalibrationTspl(): string {
  const lines = [
    `SIZE ${LABEL_WIDTH_MM} mm,${LABEL_HEIGHT_MM} mm`,
    `GAP ${GAP_MM} mm,0 mm`,
    "DIRECTION 1",
    "CLS",
    `TEXT 10,10,"0",0,4,4,"0123456789"`,
    `TEXT 10,100,"0",0,6,6,"0123456789"`,
    "PRINT 1,1",
  ];

  return lines.join("\r\n") + "\r\n";
}
