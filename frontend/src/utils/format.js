// Pure, dependency-free unit-conversion helpers for the native XLM asset.
// The native Stellar asset uses 7 decimal places (1 XLM = 10,000,000 stroops).
// Kept free of stellar-sdk imports so they can be unit-tested in isolation.

export const STROOPS_PER_XLM = 10_000_000;

/**
 * Convert a human XLM amount to an integer stroop count (BigInt).
 * Fractions below 1 stroop are floored, matching on-chain integer math.
 */
export function toStroops(amountXlm) {
  return BigInt(Math.floor(Number(amountXlm) * STROOPS_PER_XLM));
}

/**
 * Convert a stroop count (number | bigint | string) back to an XLM string.
 * Returns "0" for null/undefined/0 input.
 */
export function fromStroops(amountStroops) {
  if (!amountStroops) return "0";
  return (Number(amountStroops) / STROOPS_PER_XLM).toString();
}
