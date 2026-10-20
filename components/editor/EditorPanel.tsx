import type { Calculation } from "@/lib/calculations";
import type { Invoice, Party } from "@/lib/types";
import { CustomFieldsSection } from "./CustomFieldsSection";
import { EditorSection } from "./EditorSection";
import { Field, TextAreaField } from "./Field";
import { LedgerSection } from "./LedgerSection";
import { LineItemsSection } from "./LineItemsSection";
import type { SetInvoice } from "./types";

type Props = { invoice: Invoice; calc: Calculation; setInvoice: SetInvoice };

export function EditorPanel({ invoice, calc, setInvoice }: Props) {
  const set = (patch: Partial<Invoice>) => setInvoice((prev) => ({ ...prev, ...patch }));
  const setParty = (key: "business" | "client", patch: Partial<Party>) =>
    setInvoice((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  const { business, client } = invoice;

  return (
    <div className="flex w-full min-w-0 flex-col gap-space-xl xl:w-[52%] print:hidden">
      <EditorSection number="01" title="Your Business">
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          <Field
            label="Business name"
            value={business.name}
            onChange={(e) => setParty("business", { name: e.target.value })}
            autoComplete="organization"
          />
          <Field
            label="Billing email"
            type="email"
            value={business.email}
            onChange={(e) => setParty("business", { email: e.target.value })}
          />
          <TextAreaField
            label="Address"
            rows={2}
            className="md:col-span-2"
            value={business.address}
            onChange={(e) => setParty("business", { address: e.target.value })}
          />
          <Field
            label="Phone / website"
            className="md:col-span-2"
            value={business.contact}
            onChange={(e) => setParty("business", { contact: e.target.value })}
          />
        </div>
      </EditorSection>

      <EditorSection number="02" title="Bill To">
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          <Field
            label="Customer name"
            value={client.name}
            onChange={(e) => setParty("client", { name: e.target.value })}
          />
          <Field
            label="Contact person"
            value={client.contact}
            onChange={(e) => setParty("client", { contact: e.target.value })}
          />
          <Field
            label="Customer email"
            type="email"
            className="md:col-span-2"
            value={client.email}
            onChange={(e) => setParty("client", { email: e.target.value })}
          />
          <TextAreaField
            label="Billing address"
            rows={2}
            className="md:col-span-2"
            value={client.address}
            onChange={(e) => setParty("client", { address: e.target.value })}
          />
        </div>
      </EditorSection>

      <EditorSection
        number="03"
        title="Invoice Details"
        aside={<span className="font-mono text-label-sm text-secondary">USD</span>}
      >
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-3">
          <Field
            label="Invoice number"
            value={invoice.number}
            onChange={(e) => set({ number: e.target.value })}
            className="[&_input]:font-mono"
          />
          <Field
            label="Issue date"
            type="date"
            value={invoice.issueDate}
            onChange={(e) => set({ issueDate: e.target.value })}
          />
          <Field
            label="Due date"
            type="date"
            value={invoice.dueDate}
            onChange={(e) => set({ dueDate: e.target.value })}
          />
        </div>
      </EditorSection>

      <LineItemsSection items={invoice.items} calc={calc} setInvoice={setInvoice} />
      <CustomFieldsSection fields={invoice.customFields} setInvoice={setInvoice} />
      <LedgerSection invoice={invoice} calc={calc} setInvoice={setInvoice} />

      <EditorSection number="07" title="Notes" className="mb-space-xl">
        <TextAreaField
          label="Notes & payment instructions"
          rows={4}
          value={invoice.notes}
          onChange={(e) => set({ notes: e.target.value })}
        />
        <p className="mt-space-xs font-mono text-label-sm text-secondary">
          Printed in the footer of the invoice.
        </p>
      </EditorSection>
    </div>
  );
}
