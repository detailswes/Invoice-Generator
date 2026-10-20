import type { Invoice } from "./types";

// Fictional sample data so the page looks complete on first load.
export const sampleInvoice: Invoice = {
  business: {
    name: "Atelier Monochrome Studio LLC",
    email: "billing@ateliermonochrome.design",
    address: "742 Evergreen Terrace, Suite 300\nPortland, OR 97201",
    contact: "+1 (503) 892-4410 • ateliermonochrome.design",
  },
  client: {
    name: "Meridian Health & Tech Ventures",
    contact: "Attn: Sarah Jenkins (VP Operations)",
    email: "accounts.payable@meridianvc.io",
    address: "100 Montgomery St, Fl 18\nSan Francisco, CA 94104",
  },
  number: "INV-2026-0084",
  issueDate: "2026-10-14",
  dueDate: "2026-11-13",
  items: [
    { id: "item-1", description: "Brand Identity Design & Visual System", quantity: "1", unitPrice: "4500.00" },
    { id: "item-2", description: "Web Application Frontend Implementation (hours)", quantity: "40", unitPrice: "140.00" },
    { id: "item-3", description: "Component Library Documentation & Handoff", quantity: "1", unitPrice: "1250.00" },
  ],
  discountLabel: "Early Partner Discount",
  discount: "500.00",
  taxRate: "8.5",
  notes:
    "Payment due within 30 days via ACH wire transfer. Please include the invoice number in your remittance details.\nThank you for your valued partnership.",
  customFields: [
    { id: "field-po", label: "Purchase Order", value: "PO-8921-X", visible: true },
    { id: "field-project", label: "Project Code", value: "MER-2026-Q4", visible: true },
    { id: "field-tax-id", label: "Tax ID / VAT", value: "US-94-3829102", visible: false },
  ],
};
