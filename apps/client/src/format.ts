/**
 * Display-edge formatting helpers. Money is integer `satang` everywhere in the
 * app logic; we only convert to a human "฿" string HERE, at the render edge.
 * No float math is ever done on satang in app logic (golden rule #2).
 */
import { SATANG_PER_BAHT } from "@econwar/shared";
import type { Satang } from "@econwar/shared";

/** Format integer satang as "฿1,234.56" (purely for display). */
export function formatBaht(satang: Satang): string {
  const neg = satang < 0n;
  const abs = neg ? -satang : satang;
  const baht = abs / SATANG_PER_BAHT;
  const rem = abs % SATANG_PER_BAHT;
  const whole = baht.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const frac = rem.toString().padStart(2, "0");
  return `${neg ? "-" : ""}฿${whole}.${frac}`;
}

/** Signed delta with sign, e.g. "+฿1,200.00" / "-฿340.00". */
export function formatDelta(satang: Satang): string {
  if (satang >= 0n) return `+${formatBaht(satang)}`;
  return formatBaht(satang); // formatBaht already prepends "-"
}
