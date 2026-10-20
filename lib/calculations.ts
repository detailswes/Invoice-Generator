import { dollarsToCents, formatCents, lineTotalCents, parseDecimal, percentOfCents } from "./money";
import type { Invoice } from "./types";

/**
 * Invoice arithmetic, in the order the brief requires:
 *   1. line total = quantity × unit price, rounded to cents
 *   2. subtotal   = sum of the rounded line totals
 *   3. discount   = fixed amount, capped at the subtotal
 *   4. tax        = (subtotal − discount) × rate%, rounded to cents
 *   5. total      = subtotal − discount + tax
 *
 * Invalid values contribute 0 to the totals and are reported in `errors`; blank inputs are 0.
 * Custom fields are not an input here, so they cannot affect any amount.
 */

export type CalcInput = Pick<Invoice, "discount" | "taxRate"> & {
  items: Pick<Invoice["items"][number], "id" | "quantity" | "unitPrice">[];
};

export type ItemErrors = { quantity?: string; unitPrice?: string };

export type CalcErrors = {
  items: Record<string, ItemErrors>;
  discount?: string;
  taxRate?: string;
};

export type Calculation = {
  /** One entry per input item, in the same order. */
  lines: { id: string; totalCents: number }[];
  subtotalCents: number;
  discountCents: number;
  discountedSubtotalCents: number;
  taxCents: number;
  totalCents: number;
  errors: CalcErrors;
  isValid: boolean;
};

export function computeInvoice(input: CalcInput): Calculation {
  const errors: CalcErrors = { items: {} };

  const lines = input.items.map((item) => {
    const quantity = parseDecimal(item.quantity, 4);
    const unitPrice = parseDecimal(item.unitPrice, 4);
    const itemErrors: ItemErrors = {};
    if (!quantity.ok) itemErrors.quantity = quantity.error;
    if (!unitPrice.ok) itemErrors.unitPrice = unitPrice.error;
    if (itemErrors.quantity || itemErrors.unitPrice) errors.items[item.id] = itemErrors;

    const totalCents = quantity.ok && unitPrice.ok ? lineTotalCents(quantity.value, unitPrice.value) : 0;
    return { id: item.id, totalCents };
  });

  const subtotalCents = lines.reduce((sum, line) => sum + line.totalCents, 0);

  let discountCents = 0;
  const discount = parseDecimal(input.discount, 2);
  if (!discount.ok) {
    errors.discount = discount.error;
  } else {
    discountCents = dollarsToCents(discount.value);
    if (discountCents > subtotalCents) {
      errors.discount = `Discount can't exceed the subtotal (${formatCents(subtotalCents)}).`;
      discountCents = subtotalCents;
    }
  }

  const discountedSubtotalCents = subtotalCents - discountCents;

  let taxCents = 0;
  const taxRate = parseDecimal(input.taxRate, 4);
  if (!taxRate.ok) {
    errors.taxRate = taxRate.error;
  } else {
    taxCents = percentOfCents(discountedSubtotalCents, taxRate.value);
  }

  return {
    lines,
    subtotalCents,
    discountCents,
    discountedSubtotalCents,
    taxCents,
    totalCents: discountedSubtotalCents + taxCents,
    errors,
    isValid: !errors.discount && !errors.taxRate && Object.keys(errors.items).length === 0,
  };
}
