import type { Invoice } from "./types";

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** An empty invoice dated today, due in 30 days. */
export function blankInvoice(today = new Date()): Invoice {
  const due = new Date(today);
  due.setDate(due.getDate() + 30);
  const empty = { name: "", email: "", address: "", contact: "" };
  return {
    business: { ...empty },
    client: { ...empty },
    number: "",
    issueDate: iso(today),
    dueDate: iso(due),
    items: [],
    discountLabel: "Discount",
    discount: "0",
    taxRate: "0",
    notes: "",
    customFields: [],
  };
}
