"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { computeInvoice } from "@/lib/calculations";
import type { Invoice } from "@/lib/types";
import { parseInvoice } from "@/lib/validate-invoice";
import { AppHeader } from "./AppHeader";
import { mobileActionButton, primaryButton, secondaryButton } from "./buttons";
import { EmailDialog } from "./EmailDialog";
import { EditorPanel } from "./editor/EditorPanel";
import { InvoicePreview } from "./InvoicePreview";
import { StatusRibbon, type SaveState } from "./StatusRibbon";

type Props = {
  initialInvoice: Invoice;
  /** Set when the invoice was loaded from storage. */
  savedId: string | null;
  mode: "sample" | "new" | "saved";
};

/** Owns the single invoice state; the editor writes to it and the preview reads from it. */
export function InvoiceWorkspace({ initialInvoice, savedId: initialSavedId, mode }: Props) {
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
  const [savedId, setSavedId] = useState(initialSavedId);
  // Serialised copy of what is stored, used to tell whether there are unsaved edits.
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(
    initialSavedId ? JSON.stringify(initialInvoice) : null,
  );
  const [save, setSave] = useState<SaveState>({ status: "idle" });
  const [emailOpen, setEmailOpen] = useState(false);

  const calc = useMemo(() => computeInvoice(invoice), [invoice]);
  const dirty = JSON.stringify(invoice) !== savedSnapshot;
  const saving = save.status === "saving";

  async function handleSave() {
    const current = invoice;
    const parsed = parseInvoice(current);
    if (!parsed.ok) {
      setSave({ status: "error", message: "Fix these problems before saving:", details: parsed.errors });
      return;
    }

    setSave({ status: "saving" });
    try {
      const response = await fetch(savedId ? `/api/invoices/${savedId}` : "/api/invoices", {
        method: savedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.invoice),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setSave({
          status: "error",
          message: data?.error ?? "Could not save the invoice. Please try again.",
          details: Array.isArray(data?.details) ? data.details : undefined,
        });
        return;
      }
      if (!savedId) {
        setSavedId(data.id);
        // Make the URL a stable link without triggering a server refetch.
        window.history.replaceState(null, "", `/?id=${data.id}`);
      }
      setSavedSnapshot(JSON.stringify(current));
      setSave({ status: "saved" });
    } catch {
      setSave({ status: "error", message: "Couldn't reach the server. Check your connection and try again." });
    }
  }

  function handlePrint() {
    // Browsers use the page title as the default PDF file name.
    const previousTitle = document.title;
    document.title = `Invoice ${invoice.number || "draft"}`;
    window.addEventListener("afterprint", () => (document.title = previousTitle), { once: true });
    window.print();
  }

  const headerStatus = savedId ? (dirty ? "Unsaved" : "Saved") : "Draft";

  return (
    <>
      <AppHeader
        active="editor"
        invoiceNumber={invoice.number}
        status={headerStatus}
        actions={
          <>
            <button type="button" onClick={handlePrint} className={secondaryButton}>
              Print / PDF
            </button>
            <button type="button" onClick={() => setEmailOpen(true)} className={secondaryButton}>
              Email Invoice
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className={primaryButton}>
              {saving && <Loader2 size={14} aria-hidden="true" className="animate-spin" />}
              {saving ? "Saving…" : "Save Invoice"}
            </button>
          </>
        }
      />
      <main className="w-full flex-1 bg-surface pt-16 print:pt-0">
        <h1 className="sr-only">Invoice editor</h1>
        <div className="w-full px-gutter-sm py-space-lg sm:px-gutter-lg print:p-0">
          <div className="mb-space-md flex gap-space-sm sm:hidden print:hidden">
            <button type="button" onClick={handlePrint} className={mobileActionButton}>
              Print / PDF
            </button>
            <button type="button" onClick={() => setEmailOpen(true)} className={mobileActionButton}>
              Email Invoice
            </button>
          </div>
          <StatusRibbon mode={mode} isValid={calc.isValid} isSaved={savedId !== null} dirty={dirty} save={save} />
          <div className="relative flex flex-col items-start gap-space-xl xl:flex-row print:block">
            <EditorPanel invoice={invoice} calc={calc} setInvoice={setInvoice} />
            <InvoicePreview invoice={invoice} calc={calc} />
          </div>
        </div>
      </main>
      {emailOpen && <EmailDialog invoice={invoice} onClose={() => setEmailOpen(false)} />}
    </>
  );
}
