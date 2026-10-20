import { describe, expect, it } from "vitest";
import { sampleInvoice } from "./sample-invoice";
import { parseInvoice } from "./validate-invoice";

// Tests deliberately mutate fields into invalid shapes, so the clone is loosely typed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clone = () => structuredClone(sampleInvoice) as Record<string, any>;

describe("parseInvoice", () => {
  it("accepts the sample invoice unchanged", () => {
    const result = parseInvoice(clone());
    expect(result).toEqual({ ok: true, invoice: sampleInvoice });
  });

  it("keeps custom field visibility", () => {
    const result = parseInvoice(clone());
    expect(result.ok && result.invoice.customFields.map((f) => f.visible)).toEqual([true, true, false]);
  });

  it("drops unknown properties", () => {
    const input = { ...clone(), isAdmin: true };
    const result = parseInvoice(input);
    expect(result.ok && "isAdmin" in result.invoice).toBe(false);
  });

  it.each([null, "x", 42, [], undefined])("rejects non-object input %s", (input) => {
    expect(parseInvoice(input).ok).toBe(false);
  });

  it("requires an invoice number", () => {
    const input = clone();
    input.number = "   ";
    expect(parseInvoice(input)).toMatchObject({ ok: false, errors: ["Invoice number is required."] });
  });

  it("rejects impossible or malformed dates", () => {
    const input = clone();
    input.issueDate = "2026-02-31";
    input.dueDate = "tomorrow";
    const result = parseInvoice(input);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toEqual(["Issue date must be a valid date.", "Due date must be a valid date."]);
  });

  it("enforces the money rules on the server too", () => {
    const input = clone();
    input.items[0].quantity = "-1";
    input.taxRate = "-3";
    const result = parseInvoice(input);
    expect(!result.ok && result.errors.join(" ")).toMatch(/Line item 1 quantity: Cannot be negative/);
    expect(!result.ok && result.errors.join(" ")).toMatch(/Tax rate: Cannot be negative/);
  });

  it("rejects a discount larger than the subtotal", () => {
    const input = clone();
    input.discount = "999999";
    expect(parseInvoice(input).ok).toBe(false);
  });

  it("rejects wrong types, bad visibility and duplicate ids", () => {
    const input = clone();
    input.items[0].quantity = 5;
    input.customFields[0].visible = "yes";
    input.customFields[1].id = input.customFields[0].id;
    const result = parseInvoice(input);
    expect(!result.ok && result.errors).toEqual(
      expect.arrayContaining([
        "Line item 1 quantity must be text.",
        "Custom field 1 visibility must be true or false.",
        "Duplicate custom field ids.",
      ]),
    );
  });

  it("rejects oversized fields and lists", () => {
    const input = clone();
    input.notes = "x".repeat(5001);
    input.items = Array.from({ length: 201 }, (_, i) => ({ id: String(i), description: "", quantity: "1", unitPrice: "1" }));
    const result = parseInvoice(input);
    expect(!result.ok && result.errors).toEqual(
      expect.arrayContaining(["Notes must be at most 5000 characters.", "An invoice can have at most 200 line items."]),
    );
  });
});
