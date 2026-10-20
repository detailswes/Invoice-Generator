import type { Calculation } from "@/lib/calculations";
import { formatCents } from "@/lib/money";
import type { Invoice } from "@/lib/types";
import { EditorSection } from "./EditorSection";
import { Field } from "./Field";
import type { SetInvoice } from "./types";

type Props = { invoice: Invoice; calc: Calculation; setInvoice: SetInvoice };

export function LedgerSection({ invoice, calc, setInvoice }: Props) {
  const set = (patch: Partial<Invoice>) => setInvoice((prev) => ({ ...prev, ...patch }));

  return (
    <EditorSection
      number="06"
      title="Discount, Tax & Totals"
      aside={<span className="font-mono text-label-sm text-secondary">LIVE TOTALS</span>}
    >
      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-3">
        <Field
          label="Discount label"
          value={invoice.discountLabel}
          onChange={(e) => set({ discountLabel: e.target.value })}
          placeholder="Discount"
        />
        <Field
          label="Fixed discount (USD)"
          value={invoice.discount}
          onChange={(e) => set({ discount: e.target.value })}
          inputMode="decimal"
          placeholder="0.00"
          error={calc.errors.discount}
          className="[&_input]:font-mono"
        />
        <Field
          label="Tax rate (%)"
          value={invoice.taxRate}
          onChange={(e) => set({ taxRate: e.target.value })}
          inputMode="decimal"
          placeholder="0"
          error={calc.errors.taxRate}
          className="[&_input]:font-mono"
        />
      </div>

      <dl className="mt-space-lg space-y-space-sm">
        <div className="flex items-center justify-between py-1">
          <dt className="text-body-md text-on-surface-variant">Subtotal</dt>
          <dd className="font-mono text-tabular-md">{formatCents(calc.subtotalCents)}</dd>
        </div>
        <div className="flex items-center justify-between py-1">
          <dt className="text-body-md text-on-surface-variant">{invoice.discountLabel || "Discount"}</dt>
          <dd className="font-mono text-tabular-md text-error">−{formatCents(calc.discountCents)}</dd>
        </div>
        <div className="flex items-center justify-between py-1">
          <dt className="text-body-md text-on-surface-variant">Tax</dt>
          <dd className="font-mono text-tabular-md">+{formatCents(calc.taxCents)}</dd>
        </div>
        <div className="mt-space-sm flex items-center justify-between border-t-2 border-primary pt-space-md">
          <dt>
            <span className="block text-title-md text-on-surface">Grand total</span>
            <span className="font-mono text-label-sm uppercase tracking-widest text-secondary">USD</span>
          </dt>
          <dd className="font-mono text-tabular-lg font-bold text-primary">{formatCents(calc.totalCents)}</dd>
        </div>
      </dl>
    </EditorSection>
  );
}
