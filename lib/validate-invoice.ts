import { computeInvoice } from "./calculations";
import type { CustomField, Invoice, LineItem, Party } from "./types";

/**
 * Validates and normalises an untrusted value into an Invoice. Used by the API routes (the real
 * trust boundary) and by the client before saving so users see problems early.
 * Unknown properties are dropped; the money rules come from computeInvoice.
 */

export type ParseInvoiceResult = { ok: true; invoice: Invoice } | { ok: false; errors: string[] };

const LIMITS = {
  name: 200,
  email: 254,
  address: 1000,
  contact: 300,
  number: 60,
  label: 200,
  description: 500,
  numeric: 30,
  notes: 5000,
  id: 64,
  maxItems: 200,
  maxCustomFields: 50,
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function isRealDate(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

export function parseInvoice(input: unknown): ParseInvoiceResult {
  const errors: string[] = [];
  if (!isRecord(input)) return { ok: false, errors: ["Invoice must be an object."] };

  const text = (source: Record<string, unknown>, key: string, label: string, max: number): string => {
    const value = source[key];
    if (typeof value !== "string") {
      errors.push(`${label} must be text.`);
      return "";
    }
    if (value.length > max) errors.push(`${label} must be at most ${max} characters.`);
    return value;
  };

  const party = (value: unknown, who: string): Party => {
    if (!isRecord(value)) {
      errors.push(`${who} details are missing.`);
      return { name: "", email: "", address: "", contact: "" };
    }
    return {
      name: text(value, "name", `${who} name`, LIMITS.name),
      email: text(value, "email", `${who} email`, LIMITS.email),
      address: text(value, "address", `${who} address`, LIMITS.address),
      contact: text(value, "contact", `${who} contact`, LIMITS.contact),
    };
  };

  const business = party(input.business, "Business");
  const client = party(input.client, "Customer");

  const number = text(input, "number", "Invoice number", LIMITS.number);
  if (typeof input.number === "string" && !number.trim()) errors.push("Invoice number is required.");

  const issueDate = text(input, "issueDate", "Issue date", 10);
  const dueDate = text(input, "dueDate", "Due date", 10);
  if (typeof input.issueDate === "string" && !isRealDate(issueDate)) errors.push("Issue date must be a valid date.");
  if (typeof input.dueDate === "string" && !isRealDate(dueDate)) errors.push("Due date must be a valid date.");

  const items: LineItem[] = [];
  if (!Array.isArray(input.items)) {
    errors.push("Line items must be a list.");
  } else if (input.items.length > LIMITS.maxItems) {
    errors.push(`An invoice can have at most ${LIMITS.maxItems} line items.`);
  } else {
    input.items.forEach((raw, i) => {
      if (!isRecord(raw)) return errors.push(`Line item ${i + 1} is invalid.`);
      items.push({
        id: text(raw, "id", `Line item ${i + 1} id`, LIMITS.id),
        description: text(raw, "description", `Line item ${i + 1} description`, LIMITS.description),
        quantity: text(raw, "quantity", `Line item ${i + 1} quantity`, LIMITS.numeric),
        unitPrice: text(raw, "unitPrice", `Line item ${i + 1} unit price`, LIMITS.numeric),
      });
    });
  }

  const customFields: CustomField[] = [];
  if (!Array.isArray(input.customFields)) {
    errors.push("Custom fields must be a list.");
  } else if (input.customFields.length > LIMITS.maxCustomFields) {
    errors.push(`An invoice can have at most ${LIMITS.maxCustomFields} custom fields.`);
  } else {
    input.customFields.forEach((raw, i) => {
      if (!isRecord(raw)) return errors.push(`Custom field ${i + 1} is invalid.`);
      if (typeof raw.visible !== "boolean") errors.push(`Custom field ${i + 1} visibility must be true or false.`);
      customFields.push({
        id: text(raw, "id", `Custom field ${i + 1} id`, LIMITS.id),
        label: text(raw, "label", `Custom field ${i + 1} label`, LIMITS.label),
        value: text(raw, "value", `Custom field ${i + 1} value`, LIMITS.label),
        visible: raw.visible === true,
      });
    });
  }

  for (const [list, name] of [
    [items, "line item"],
    [customFields, "custom field"],
  ] as const) {
    if (new Set(list.map((entry) => entry.id)).size !== list.length) errors.push(`Duplicate ${name} ids.`);
  }

  const invoice: Invoice = {
    business,
    client,
    number,
    issueDate,
    dueDate,
    items,
    discountLabel: text(input, "discountLabel", "Discount label", LIMITS.label),
    discount: text(input, "discount", "Discount", LIMITS.numeric),
    taxRate: text(input, "taxRate", "Tax rate", LIMITS.numeric),
    notes: text(input, "notes", "Notes", LIMITS.notes),
    customFields,
  };

  // Money rules (negatives, discount ≤ subtotal, decimals…) only make sense on well-formed input.
  if (errors.length === 0) {
    const calc = computeInvoice(invoice);
    if (!calc.isValid) {
      if (calc.errors.discount) errors.push(`Discount: ${calc.errors.discount}`);
      if (calc.errors.taxRate) errors.push(`Tax rate: ${calc.errors.taxRate}`);
      items.forEach((item, i) => {
        const e = calc.errors.items[item.id];
        if (e?.quantity) errors.push(`Line item ${i + 1} quantity: ${e.quantity}`);
        if (e?.unitPrice) errors.push(`Line item ${i + 1} unit price: ${e.unitPrice}`);
      });
    }
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, invoice };
}
