import { FilePlus2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PageSkeleton } from "@/components/PageSkeleton";
import { formatDate } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { listInvoices, type InvoiceSummary } from "@/lib/server/invoice-store";

export const metadata: Metadata = { title: "All Invoices — Folio" };

export default function InvoicesPage() {
  return (
    <Suspense fallback={<PageSkeleton active="invoices" />}>
      <InvoiceList />
    </Suspense>
  );
}

async function InvoiceList() {
  await connection(); // always read the current file, never a build-time snapshot

  let invoices: InvoiceSummary[] = [];
  let failed = false;
  try {
    invoices = await listInvoices();
  } catch (error) {
    console.error("Failed to list invoices", error);
    failed = true;
  }

  return (
    <>
      <AppHeader active="invoices" />
      <main className="w-full flex-1 bg-surface pt-16">
        <div className="mx-auto w-full max-w-4xl px-gutter-sm py-space-lg sm:px-gutter-lg">
          <div className="mb-space-lg flex items-center justify-between gap-space-md">
            <h1 className="font-serif text-headline-lg tracking-tight">All Invoices</h1>
            <Link
              href="/?new=1"
              className="inline-flex items-center gap-space-xs rounded-md bg-primary px-space-md py-space-sm text-label-md text-on-primary transition-colors hover:bg-on-surface-variant"
            >
              <FilePlus2 size={16} aria-hidden="true" />
              New invoice
            </Link>
          </div>

          {failed && (
            <p role="alert" className="rounded-md border border-error bg-error-container/40 p-space-md text-body-md text-error">
              Couldn&apos;t load saved invoices. Please refresh and try again.
            </p>
          )}

          {!failed && invoices.length === 0 && (
            <div className="rounded-lg bg-surface-container-lowest p-space-xl text-center shadow-sm">
              <p className="text-title-md">No saved invoices yet</p>
              <p className="mt-space-xs text-body-md text-on-surface-variant">
                Create one and press Save. It will show up here.
              </p>
            </div>
          )}

          {invoices.length > 0 && (
            <ul className="divide-y divide-surface-container overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm">
              {invoices.map((invoice) => (
                <li key={invoice.id}>
                  <Link
                    href={`/?id=${invoice.id}`}
                    className="flex items-center justify-between gap-space-md px-space-lg py-space-md transition-colors hover:bg-surface-container-low"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-tabular-md text-on-surface">{invoice.number}</p>
                      <p className="truncate text-body-sm text-on-surface-variant">
                        {invoice.customer || "No customer"} · Updated {formatDate(invoice.updatedAt.slice(0, 10))}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-tabular-md font-semibold">
                      {formatCents(invoice.totalCents)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
