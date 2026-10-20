import { Suspense } from "react";
import { InvoiceWorkspace } from "@/components/InvoiceWorkspace";
import { PageMessage } from "@/components/PageMessage";
import { PageSkeleton } from "@/components/PageSkeleton";
import { blankInvoice } from "@/lib/blank-invoice";
import { sampleInvoice } from "@/lib/sample-invoice";
import { getInvoice, type StoredInvoice } from "@/lib/server/invoice-store";

export default function Home({ searchParams }: PageProps<"/">) {
  // Reading search params and storage is request-time work, so it streams in behind Suspense.
  return (
    <Suspense fallback={<PageSkeleton active="editor" />}>
      <EditorPage searchParams={searchParams} />
    </Suspense>
  );
}

async function EditorPage({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const params = await searchParams;
  const id = typeof params.id === "string" ? params.id : null;

  if (id) {
    let record: StoredInvoice | null;
    try {
      record = await getInvoice(id);
    } catch (error) {
      console.error("Failed to load invoice", error);
      return <PageMessage title="Couldn't load this invoice">Something went wrong reading saved invoices. Please try again.</PageMessage>;
    }
    if (!record) {
      return <PageMessage title="Invoice not found">It may have been removed, or the link is wrong.</PageMessage>;
    }
    return <InvoiceWorkspace key={record.id} initialInvoice={record.invoice} savedId={record.id} mode="saved" />;
  }

  if (params.new !== undefined) {
    return <InvoiceWorkspace key="new" initialInvoice={blankInvoice()} savedId={null} mode="new" />;
  }
  return <InvoiceWorkspace key="sample" initialInvoice={sampleInvoice} savedId={null} mode="sample" />;
}
