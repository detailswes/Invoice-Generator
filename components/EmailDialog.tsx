"use client";

import { CheckCircle2, Loader2, Mail, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { isValidEmail } from "@/lib/email-address";
import type { Invoice } from "@/lib/types";
import { parseInvoice } from "@/lib/validate-invoice";
import { primaryButton } from "./buttons";
import { Field, TextAreaField } from "./editor/Field";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent"; to: string }
  | { state: "error"; message: string; details?: string[] };

/** Rendered only while open, so its fields start fresh (recipient prefilled) each time. */
export function EmailDialog({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [to, setTo] = useState(invoice.client.email);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [toError, setToError] = useState<string | undefined>();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const recipient = to.trim();
    if (!isValidEmail(recipient)) {
      setToError("Enter a valid email address, e.g. name@company.com.");
      return;
    }
    setToError(undefined);

    const parsed = parseInvoice(invoice);
    if (!parsed.ok) {
      setStatus({ state: "error", message: "Fix these problems before sending:", details: parsed.errors });
      return;
    }

    setStatus({ state: "sending" });
    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipient, note, invoice: parsed.invoice }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (data?.field === "to") setToError(data.error);
        setStatus({
          state: "error",
          message: data?.error ?? "Couldn't send the email. Please try again.",
          details: Array.isArray(data?.details) ? data.details : undefined,
        });
        return;
      }
      setStatus({ state: "sent", to: recipient });
    } catch {
      setStatus({ state: "error", message: "Couldn't reach the server. Check your connection and try again." });
    }
  }

  const sending = status.state === "sending";

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="email-dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-surface-container-highest bg-surface-container-lowest p-0 text-on-surface shadow-xl backdrop:bg-primary-container/40 print:hidden"
    >
      <form onSubmit={handleSubmit} noValidate className="p-space-lg">
        <div className="mb-space-md flex items-center justify-between border-b border-surface-container-highest pb-space-sm">
          <h2 id="email-dialog-title" className="flex items-center gap-space-xs text-title-md">
            <Mail size={20} aria-hidden="true" />
            Email invoice {invoice.number}
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
            className="rounded-md p-1 text-on-surface-variant hover:text-on-surface"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {status.state === "sent" ? (
          <div role="status" className="space-y-space-md py-space-md">
            <p className="flex items-start gap-space-sm text-body-md">
              <CheckCircle2 size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-700" />
              <span>
                The mail server accepted the invoice for delivery to <strong>{status.to}</strong>.
              </span>
            </p>
            <p className="text-body-sm text-on-surface-variant">
              This confirms the message was handed to the mail server. It doesn&apos;t guarantee it reached the
              inbox, so check for it there or in spam.
            </p>
            <div className="flex justify-end">
              <button type="button" onClick={() => dialogRef.current?.close()} className={primaryButton}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-space-md">
            <Field
              label="Recipient email"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              error={toError}
              autoComplete="off"
              autoFocus
            />
            <TextAreaField
              label="Message (optional)"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              placeholder="Hi, please find the invoice below."
            />
            <p className="text-body-sm text-on-surface-variant">
              The email contains an invoice summary (line items, totals, due date and any visible custom fields).
            </p>

            {status.state === "error" && (
              <div role="alert" className="rounded-md border border-error bg-error-container/40 p-space-md text-body-sm">
                <p className="font-semibold text-error">{status.message}</p>
                {status.details && status.details.length > 0 && (
                  <ul className="mt-space-xs list-disc pl-space-lg">
                    {status.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="rounded-md px-space-md py-space-sm text-label-md text-on-surface hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button type="submit" disabled={sending} className={primaryButton}>
                {sending ? (
                  <Loader2 size={16} aria-hidden="true" className="animate-spin" />
                ) : (
                  <Mail size={16} aria-hidden="true" />
                )}
                {sending ? "Sending…" : "Send invoice"}
              </button>
            </div>
          </div>
        )}
      </form>
    </dialog>
  );
}
