import { describe, expect, it } from "vitest";
import { computeInvoice, type CalcInput } from "./calculations";
import { formatCents } from "./money";

const item = (id: string, quantity: string, unitPrice: string) => ({ id, quantity, unitPrice });
const invoice = (items: CalcInput["items"], discount = "0", taxRate = "0"): CalcInput => ({
  items,
  discount,
  taxRate,
});

describe("computeInvoice", () => {
  it("matches the required example: 2 × $50 − $10 + 10% tax = $99.00", () => {
    const calc = computeInvoice(invoice([item("a", "2", "50")], "10", "10"));
    expect(calc.subtotalCents).toBe(10000);
    expect(calc.discountCents).toBe(1000);
    expect(calc.taxCents).toBe(900);
    expect(calc.totalCents).toBe(9900);
    expect(formatCents(calc.totalCents)).toBe("$99.00");
    expect(calc.isValid).toBe(true);
  });

  it("handles an empty invoice", () => {
    const calc = computeInvoice(invoice([]));
    expect(calc).toMatchObject({ subtotalCents: 0, discountCents: 0, taxCents: 0, totalCents: 0, isValid: true });
  });

  it("treats blank inputs as zero without errors", () => {
    const calc = computeInvoice(invoice([item("a", "", "")], "", ""));
    expect(calc.totalCents).toBe(0);
    expect(calc.isValid).toBe(true);
  });

  it("works with zero discount and zero tax", () => {
    const calc = computeInvoice(invoice([item("a", "3", "19.99")]));
    expect(calc.subtotalCents).toBe(5997);
    expect(calc.totalCents).toBe(5997);
  });

  it("allows a discount exactly equal to the subtotal", () => {
    const calc = computeInvoice(invoice([item("a", "2", "50")], "100", "10"));
    expect(calc.isValid).toBe(true);
    expect(calc.discountedSubtotalCents).toBe(0);
    expect(calc.taxCents).toBe(0);
    expect(calc.totalCents).toBe(0);
  });

  it("rejects a discount greater than the subtotal and clamps it", () => {
    const calc = computeInvoice(invoice([item("a", "2", "50")], "100.01"));
    expect(calc.isValid).toBe(false);
    expect(calc.errors.discount).toMatch(/exceed the subtotal/);
    expect(calc.discountCents).toBe(10000);
    expect(calc.totalCents).toBe(0);
  });

  it("rejects any discount when the subtotal is zero", () => {
    const calc = computeInvoice(invoice([], "0.01"));
    expect(calc.isValid).toBe(false);
  });

  it.each([
    ["quantity", invoice([item("a", "-1", "10")])],
    ["unitPrice", invoice([item("a", "1", "-10")])],
  ])("rejects a negative %s", (field, input) => {
    const calc = computeInvoice(input);
    expect(calc.isValid).toBe(false);
    expect(calc.errors.items.a[field as "quantity" | "unitPrice"]).toBe("Cannot be negative.");
    expect(calc.totalCents).toBe(0);
  });

  it("rejects a negative discount", () => {
    const calc = computeInvoice(invoice([item("a", "1", "10")], "-1"));
    expect(calc.isValid).toBe(false);
    expect(calc.errors.discount).toBe("Cannot be negative.");
    expect(calc.totalCents).toBe(1000);
  });

  it("rejects a negative tax rate", () => {
    const calc = computeInvoice(invoice([item("a", "1", "10")], "0", "-5"));
    expect(calc.isValid).toBe(false);
    expect(calc.errors.taxRate).toBe("Cannot be negative.");
  });

  it("rejects non-numeric input and too many decimals", () => {
    expect(computeInvoice(invoice([item("a", "abc", "1")])).errors.items.a.quantity).toMatch(/Enter a number/);
    expect(computeInvoice(invoice([item("a", "1e3", "1")])).isValid).toBe(false);
    expect(computeInvoice(invoice([item("a", "1", "1")], "1.234")).errors.discount).toMatch(/at most 2/);
  });

  it("rounds a line total that needs cent rounding (half up)", () => {
    // 1.5 × 0.33 = 0.495 → $0.50
    expect(computeInvoice(invoice([item("a", "1.5", "0.33")])).lines[0].totalCents).toBe(50);
    // 3 × 0.333 = 0.999 → $1.00
    expect(computeInvoice(invoice([item("a", "3", "0.333")])).lines[0].totalCents).toBe(100);
    // 0.5 × 0.01 = 0.005 → $0.01
    expect(computeInvoice(invoice([item("a", "0.5", "0.01")])).lines[0].totalCents).toBe(1);
  });

  it("rounds each line before summing", () => {
    // Three lines of 0.004 each round down to $0.00, so the subtotal is $0.00.
    const calc = computeInvoice(invoice([item("a", "1", "0.004"), item("b", "1", "0.004"), item("c", "1", "0.004")]));
    expect(calc.subtotalCents).toBe(0);
    // Three lines of 0.005 each round up to $0.01, so the subtotal is $0.03 (not round(0.015) = $0.02).
    const up = computeInvoice(invoice([item("a", "1", "0.005"), item("b", "1", "0.005"), item("c", "1", "0.005")]));
    expect(up.lines.map((l) => l.totalCents)).toEqual([1, 1, 1]);
    expect(up.subtotalCents).toBe(3);
  });

  it("rounds tax to cents after the discount", () => {
    // ($33.33 − $0) × 8.25% = 2.749725 → $2.75
    const calc = computeInvoice(invoice([item("a", "1", "33.33")], "0", "8.25"));
    expect(calc.taxCents).toBe(275);
    expect(calc.totalCents).toBe(3608);
  });

  it("reproduces the sample invoice totals", () => {
    const calc = computeInvoice(
      invoice([item("a", "1", "4500"), item("b", "40", "140"), item("c", "1", "1250")], "500", "8.5"),
    );
    expect(calc.subtotalCents).toBe(1135000);
    expect(calc.taxCents).toBe(92225);
    expect(calc.totalCents).toBe(1177225);
  });

  it("reports errors per item id and keeps valid rows in the totals", () => {
    const calc = computeInvoice(invoice([item("a", "2", "50"), item("b", "-1", "5")]));
    expect(Object.keys(calc.errors.items)).toEqual(["b"]);
    expect(calc.subtotalCents).toBe(10000);
  });
});

describe("formatCents", () => {
  it("formats USD with grouping", () => {
    expect(formatCents(123456)).toBe("$1,234.56");
    expect(formatCents(0)).toBe("$0.00");
  });
});
