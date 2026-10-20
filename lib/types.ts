// Numeric inputs are kept as the strings the user typed so editing never jumps or shows NaN;
// lib/calculations.ts parses and validates them.

export type LineItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

export type CustomField = {
  id: string;
  label: string;
  value: string;
  visible: boolean;
};

export type Party = {
  name: string;
  email: string;
  address: string;
  /** Business: phone / website. Client: point of contact. */
  contact: string;
};

export type Invoice = {
  business: Party;
  client: Party;
  number: string;
  /** ISO date, yyyy-mm-dd. */
  issueDate: string;
  dueDate: string;
  items: LineItem[];
  discountLabel: string;
  /** Fixed discount in USD. */
  discount: string;
  /** Tax percentage: "10" means 10%. */
  taxRate: string;
  notes: string;
  customFields: CustomField[];
};
