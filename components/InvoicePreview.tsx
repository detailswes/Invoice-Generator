import type { Calculation } from "@/lib/calculations";
import { buildInvoiceView } from "@/lib/invoice-view";
import type { Invoice } from "@/lib/types";

const metaLabel = "block font-mono text-[10px] uppercase tracking-wider text-slate-500";

function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
  return letters || "—";
}

/** Pure presentation of the invoice sheet; reused on screen and (later) for print and email. */
export function InvoiceSheet({ invoice, calc }: { invoice: Invoice; calc: Calculation }) {
  const view = buildInvoiceView(invoice, calc);
  const { business, client } = view;

  return (
    <article
      aria-label="Invoice preview"
      className="invoice-sheet relative flex w-full flex-col justify-between rounded-sm border border-slate-200 bg-white p-6 text-[#111827] shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04),0_2px_6px_-1px_rgba(15,23,42,0.02)] sm:p-12 print:rounded-none print:border-0 print:p-0 print:shadow-none"
    >
      <div>
        <div className="flex flex-wrap items-start justify-between gap-space-md border-b border-slate-200 pb-space-lg">
          <div className="min-w-0">
            <div className="mb-space-sm flex items-center gap-space-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-black text-label-md font-bold tracking-tighter text-white">
                {initials(business.name)}
              </div>
              <span className="break-words font-serif text-headline-sm tracking-tight">
                {business.name || "Your business"}
              </span>
            </div>
            <div className="space-y-0.5 break-words text-xs text-slate-600">
              {business.address && <p className="whitespace-pre-line">{business.address}</p>}
              {business.email && <p className="font-mono text-[11px]">{business.email}</p>}
              {business.contact && <p>{business.contact}</p>}
            </div>
          </div>
          <div className="text-right">
            <span className="block font-serif text-headline-lg uppercase leading-none tracking-tight text-slate-900">
              Invoice
            </span>
            <span className="mt-1 block break-all font-mono text-xs tracking-wider text-slate-600">
              # {view.number || "—"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-space-lg border-b border-slate-200 py-space-lg sm:grid-cols-2">
          <div className="min-w-0 break-words">
            <span className={`${metaLabel} mb-1`}>Billed To</span>
            <p className="text-sm font-semibold text-slate-900">{client.name || "—"}</p>
            {client.contact && <p className="mt-0.5 text-xs text-slate-700">{client.contact}</p>}
            {client.address && <p className="whitespace-pre-line text-xs text-slate-700">{client.address}</p>}
            {client.email && <p className="mt-1 font-mono text-[11px] text-slate-600">{client.email}</p>}
          </div>
          <dl className="grid grid-cols-2 content-start gap-x-2 gap-y-3 sm:text-right">
            <div>
              <dt className={metaLabel}>Date of Issue</dt>
              <dd className="text-xs font-medium text-slate-800">{view.issueDate}</dd>
            </div>
            <div>
              <dt className={metaLabel}>Payment Due</dt>
              <dd className="text-xs font-semibold text-slate-900">{view.dueDate}</dd>
            </div>
            {view.customFields.map((field) => (
              <div key={field.id} className="min-w-0 break-words">
                <dt className={metaLabel}>{field.label || " "}</dt>
                <dd className="font-mono text-xs text-slate-800">{field.value || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="py-space-md">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-900 font-mono text-[10px] uppercase tracking-wider text-slate-600">
                <th scope="col" className="py-2 font-medium">
                  Description
                </th>
                <th scope="col" className="w-12 py-2 text-center font-medium">
                  Qty
                </th>
                <th scope="col" className="hidden w-24 py-2 text-right font-medium sm:table-cell print:table-cell">
                  Unit Price
                </th>
                <th scope="col" className="w-24 py-2 text-right font-medium sm:w-28">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {view.lines.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">
                    No line items
                  </td>
                </tr>
              )}
              {view.lines.map((item) => (
                <tr key={item.id}>
                  <td className="break-words py-3 pr-2 font-semibold text-slate-900">
                    {item.description || <span className="font-normal italic text-slate-500">Untitled item</span>}
                  </td>
                  <td className="py-3 text-center font-mono">{item.quantity}</td>
                  <td className="hidden py-3 text-right font-mono sm:table-cell print:table-cell">{item.unitPrice}</td>
                  <td className="py-3 text-right font-mono font-medium">{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-space-sm">
          <dl className="w-full max-w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-700">
              <dt>Subtotal</dt>
              <dd className="font-mono">{view.subtotal}</dd>
            </div>
            {view.discount && (
              <div className="flex justify-between gap-2 text-emerald-700">
                <dt className="break-words">{view.discount.label}</dt>
                <dd className="font-mono">−{view.discount.amount}</dd>
              </div>
            )}
            <div className="flex justify-between text-slate-700">
              <dt>Tax ({view.taxRate}%)</dt>
              <dd className="font-mono">+{view.tax}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t-2 border-slate-900 pt-2">
              <dt className="font-mono text-xs font-bold uppercase text-slate-900">Total Due</dt>
              <dd className="font-mono text-base font-bold text-slate-900">{view.total}</dd>
            </div>
          </dl>
        </div>
      </div>

      {view.notes.trim() && (
        <footer className="mt-12 border-t border-slate-200 pt-space-md">
          <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wider text-slate-500">Notes</span>
          <p className="whitespace-pre-line break-words text-[11px] leading-relaxed text-slate-700">{view.notes}</p>
        </footer>
      )}
    </article>
  );
}

export function InvoicePreview({ invoice, calc }: { invoice: Invoice; calc: Calculation }) {
  return (
    <div className="flex w-full min-w-0 flex-col items-center xl:sticky xl:top-20 xl:w-[48%] print:static print:block print:w-full">
      <div className="mb-space-md flex w-full max-w-[850px] items-center justify-between rounded-lg print:hidden border border-surface-container-highest bg-surface-container-lowest px-space-md py-space-sm shadow-sm">
        <span className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
          Live preview
        </span>
        <span className="font-mono text-label-sm text-secondary">Updates as you type</span>
      </div>
      <div className="w-full max-w-[850px] print:max-w-none">
        <InvoiceSheet invoice={invoice} calc={calc} />
      </div>
    </div>
  );
}
