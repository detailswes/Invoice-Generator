import type { InvoiceView } from "./invoice-view";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();
const lines = (value: string) => value.split(/\r?\n/).filter((l) => l.trim());

export type InvoiceEmail = { subject: string; text: string; html: string };

/** Builds the subject, plain-text and HTML bodies. Every user-supplied value is escaped in the HTML. */
export function buildInvoiceEmail(view: InvoiceView, note = ""): InvoiceEmail {
  const sender = oneLine(view.business.name) || "your supplier";
  const subject = oneLine(`Invoice ${view.number} from ${sender} (${view.total})`);
  const cleanNote = note.trim();

  const text = [
    cleanNote,
    `Invoice ${view.number} from ${sender}`,
    `Billed to: ${view.client.name || "—"}`,
    `Issued: ${view.issueDate}   Due: ${view.dueDate}`,
    ...view.customFields.map((f) => `${f.label || "Note"}: ${f.value}`),
    "",
    ...view.lines.map((l) => `- ${l.description || "Untitled item"}: ${l.quantity} x ${l.unitPrice} = ${l.amount}`),
    "",
    `Subtotal: ${view.subtotal}`,
    ...(view.discount ? [`${view.discount.label}: -${view.discount.amount}`] : []),
    `Tax (${view.taxRate}%): ${view.tax}`,
    `Total due: ${view.total}`,
    ...(view.notes.trim() ? ["", view.notes.trim()] : []),
  ]
    .filter((line, i, all) => !(line === "" && (i === 0 || all[i - 1] === "")))
    .join("\n")
    .trim();

  const e = escapeHtml;
  const cell = "padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:13px;color:#111827;";
  const num = `${cell}text-align:right;font-family:Menlo,Consolas,monospace;white-space:nowrap;`;
  const totalRow = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;font-size:13px;color:${strong ? "#111827" : "#475569"};${strong ? "font-weight:700;border-top:2px solid #111827;padding-top:8px;" : ""}">${e(label)}</td>` +
    `<td style="padding:4px 0;text-align:right;font-family:Menlo,Consolas,monospace;font-size:${strong ? 16 : 13}px;${strong ? "font-weight:700;border-top:2px solid #111827;padding-top:8px;" : ""}color:#111827;">${e(value)}</td></tr>`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f7f9fb;font-family:Helvetica,Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;padding:32px;">
${cleanNote ? `<p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#111827;">${lines(cleanNote).map(e).join("<br>")}</p>` : ""}
<h1 style="margin:0;font-family:Georgia,serif;font-weight:400;font-size:28px;color:#111827;">Invoice ${e(view.number)}</h1>
<p style="margin:4px 0 24px;font-size:13px;color:#475569;">from ${e(sender)}</p>
<table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:24px;"><tr>
<td valign="top" style="font-size:13px;color:#111827;line-height:1.5;"><strong>Billed to</strong><br>${e(view.client.name || "—")}${view.client.contact ? `<br>${e(view.client.contact)}` : ""}</td>
<td valign="top" align="right" style="font-size:13px;color:#111827;line-height:1.5;">Issued ${e(view.issueDate)}<br><strong>Due ${e(view.dueDate)}</strong>${view.customFields.map((f) => `<br>${e(f.label)}${f.label && f.value ? ": " : ""}${e(f.value)}`).join("")}</td>
</tr></table>
<table role="presentation" width="100%" style="border-collapse:collapse;">
<tr style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#475569;"><th align="left" style="padding:8px 0;border-bottom:1px solid #111827;">Description</th><th align="right" style="padding:8px 0;border-bottom:1px solid #111827;">Qty</th><th align="right" style="padding:8px 0;border-bottom:1px solid #111827;">Price</th><th align="right" style="padding:8px 0;border-bottom:1px solid #111827;">Amount</th></tr>
${view.lines
  .map(
    (l) =>
      `<tr><td style="${cell}">${e(l.description || "Untitled item")}</td><td style="${num}">${e(l.quantity)}</td><td style="${num}">${e(l.unitPrice)}</td><td style="${num}">${e(l.amount)}</td></tr>`,
  )
  .join("\n")}
</table>
<table role="presentation" align="right" style="border-collapse:collapse;margin-top:16px;min-width:240px;">
${totalRow("Subtotal", view.subtotal)}
${view.discount ? totalRow(view.discount.label, `-${view.discount.amount}`) : ""}
${totalRow(`Tax (${view.taxRate}%)`, view.tax)}
${totalRow("Total due", view.total, true)}
</table>
<div style="clear:both;"></div>
${view.notes.trim() ? `<p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.5;color:#475569;">${lines(view.notes).map(e).join("<br>")}</p>` : ""}
</div></body></html>`;

  return { subject, text, html };
}
