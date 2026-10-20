import { computeInvoice, type Calculation } from "./calculations";
import { formatDate } from "./format";
import { formatCents, formatUnitPrice } from "./money";
import type { Invoice, Party } from "./types";

/**
 * Display-ready invoice: everything formatted, hidden custom fields already removed. The on-screen
 * sheet (print included) and the email both render from this, so they cannot disagree.
 */
export type InvoiceView = {
  number: string;
  issueDate: string;
  dueDate: string;
  business: Party;
  client: Party;
  lines: { id: string; description: string; quantity: string; unitPrice: string; amount: string }[];
  /** Only visible fields that have a label or a value. */
  customFields: { id: string; label: string; value: string }[];
  subtotal: string;
  /** null when there is no discount to show. */
  discount: { label: string; amount: string } | null;
  taxRate: string;
  tax: string;
  total: string;
  notes: string;
};

export function buildInvoiceView(invoice: Invoice, calc: Calculation = computeInvoice(invoice)): InvoiceView {
  return {
    number: invoice.number,
    issueDate: formatDate(invoice.issueDate),
    dueDate: formatDate(invoice.dueDate),
    business: invoice.business,
    client: invoice.client,
    lines: invoice.items.map((item, i) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity.trim() || "0",
      unitPrice: formatUnitPrice(item.unitPrice),
      amount: formatCents(calc.lines[i]?.totalCents ?? 0),
    })),
    customFields: invoice.customFields
      .filter((f) => f.visible && (f.label.trim() || f.value.trim()))
      .map(({ id, label, value }) => ({ id, label, value })),
    subtotal: formatCents(calc.subtotalCents),
    discount:
      calc.discountCents > 0
        ? { label: invoice.discountLabel.trim() || "Discount", amount: formatCents(calc.discountCents) }
        : null,
    taxRate: invoice.taxRate.trim() || "0",
    tax: formatCents(calc.taxCents),
    total: formatCents(calc.totalCents),
    notes: invoice.notes,
  };
}
