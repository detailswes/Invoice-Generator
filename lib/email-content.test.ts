import { describe, expect, it } from "vitest";
import { computeInvoice } from "./calculations";
import { buildInvoiceEmail } from "./email-content";
import { isValidEmail } from "./email-address";
import { buildInvoiceView } from "./invoice-view";
import { sampleInvoice } from "./sample-invoice";

describe("invoice view", () => {
  const view = buildInvoiceView(sampleInvoice);

  it("formats totals and dates", () => {
    expect(view).toMatchObject({ subtotal: "$11,350.00", tax: "$922.25", total: "$11,772.25", issueDate: "Oct 14, 2026" });
    expect(view.discount).toEqual({ label: "Early Partner Discount", amount: "$500.00" });
  });

  it("includes only visible custom fields", () => {
    expect(view.customFields.map((f) => f.label)).toEqual(["Purchase Order", "Project Code"]);
  });

  it("omits the discount row when there is no discount", () => {
    expect(buildInvoiceView({ ...sampleInvoice, discount: "0" }).discount).toBeNull();
  });

  it("matches the required example", () => {
    const invoice = {
      ...sampleInvoice,
      items: [{ id: "a", description: "Widget", quantity: "2", unitPrice: "50" }],
      discount: "10",
      taxRate: "10",
    };
    expect(buildInvoiceView(invoice, computeInvoice(invoice)).total).toBe("$99.00");
  });
});

describe("buildInvoiceEmail", () => {
  const email = buildInvoiceEmail(buildInvoiceView(sampleInvoice), "Hi Sarah,\nPlease find the invoice.");

  it("has a clear subject", () => {
    expect(email.subject).toBe("Invoice INV-2026-0084 from Atelier Monochrome Studio LLC ($11,772.25)");
  });

  it("includes the summary in both text and HTML", () => {
    for (const body of [email.text, email.html]) {
      expect(body).toContain("INV-2026-0084");
      expect(body).toContain("Brand Identity Design");
      expect(body).toContain("$11,772.25");
      expect(body).toContain("PO-8921-X");
    }
    expect(email.text).toContain("Please find the invoice.");
  });

  it("leaves hidden custom fields out", () => {
    expect(email.text + email.html).not.toContain("US-94-3829102");
  });

  it("escapes HTML in user-supplied values", () => {
    const hostile = {
      ...sampleInvoice,
      client: { ...sampleInvoice.client, name: '<script>alert("x")</script>' },
      notes: "<img src=x onerror=alert(1)>",
    };
    const html = buildInvoiceEmail(buildInvoiceView(hostile), "<b>note</b>").html;
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b>note</b>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("keeps header injection out of the subject", () => {
    const invoice = { ...sampleInvoice, business: { ...sampleInvoice.business, name: "Evil\r\nBcc: victim@example.com" } };
    expect(buildInvoiceEmail(buildInvoiceView(invoice)).subject).not.toMatch(/[\r\n]/);
  });
});

describe("isValidEmail", () => {
  it.each(["a@b.co", "first.last+tag@sub.example.com"])("accepts %s", (v) => expect(isValidEmail(v)).toBe(true));
  it.each(["", "plain", "a@b", "a b@c.com", "a@b.com, c@d.com", "<a@b.com>", "a@@b.com", "x".repeat(250) + "@b.com"])(
    "rejects %j",
    (v) => expect(isValidEmail(v)).toBe(false),
  );
});
