/** Format a number with an explicit leading sign (e.g. +2.4, -1.0). */
export function signed(x: number, dp = 1): string {
  const v = Math.abs(x).toFixed(dp);
  if (Object.is(x, -0) || x < 0) return `-${v}`;
  return x > 0 ? `+${v}` : v;
}
