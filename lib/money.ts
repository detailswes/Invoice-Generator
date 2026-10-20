/**
 * Exact decimal parsing and USD cent arithmetic.
 *
 * Money is never handled as a floating-point number. User input is parsed into a
 * BigInt scaled integer (`digits / 10^scale`), multiplied exactly, and rounded
 * once to whole cents with round-half-up. Totals are then plain integer cents.
 */

export type Decimal = { digits: bigint; scale: number };

export type ParseResult = { ok: true; value: Decimal } | { ok: false; error: string };

const MAX_INTEGER_DIGITS = 12;
const NUMBER_PATTERN = /^\d*(\.\d*)?$/;

/** Blank input is treated as zero so a half-typed form never shows an error or NaN. */
export function parseDecimal(raw: string, maxDecimals: number): ParseResult {
  const text = raw.trim();
  if (text === "") return { ok: true, value: { digits: 0n, scale: 0 } };

  if (/^-\s*[\d.]/.test(text)) return { ok: false, error: "Cannot be negative." };
  if (!NUMBER_PATTERN.test(text) || !/\d/.test(text)) {
    return { ok: false, error: "Enter a number, e.g. 12.50." };
  }

  const [whole = "", fraction = ""] = text.split(".");
  if (whole.length > MAX_INTEGER_DIGITS) return { ok: false, error: "That number is too large." };
  if (fraction.length > maxDecimals) {
    return {
      ok: false,
      error: maxDecimals === 0 ? "Use a whole number." : `Use at most ${maxDecimals} decimal places.`,
    };
  }
  return { ok: true, value: { digits: BigInt(whole + fraction || "0"), scale: fraction.length } };
}

/** n / d rounded half-up (inputs are never negative). */
function roundDiv(n: bigint, d: bigint): bigint {
  return (2n * n + d) / (2n * d);
}

const pow10 = (exp: number) => 10n ** BigInt(exp);

/** Whole cents for a Decimal dollar amount that has at most 2 decimal places. */
export function dollarsToCents(amount: Decimal): number {
  return Number(amount.digits * pow10(2 - amount.scale));
}

/** quantity × unit price, rounded to whole cents. */
export function lineTotalCents(quantity: Decimal, unitPrice: Decimal): number {
  const numerator = quantity.digits * unitPrice.digits * 100n;
  return Number(roundDiv(numerator, pow10(quantity.scale + unitPrice.scale)));
}

/** `ratePercent` is a percentage (10 means 10%). Result is rounded to whole cents. */
export function percentOfCents(cents: number, ratePercent: Decimal): number {
  const numerator = BigInt(cents) * ratePercent.digits;
  return Number(roundDiv(numerator, pow10(ratePercent.scale + 2)));
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

const unitPriceFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

/** Display-only formatting of a unit price string; falls back to the raw text if it is invalid. */
export function formatUnitPrice(raw: string): string {
  const parsed = parseDecimal(raw, 4);
  if (!parsed.ok) return raw;
  return unitPriceFormat.format(Number(parsed.value.digits) / 10 ** parsed.value.scale);
}
