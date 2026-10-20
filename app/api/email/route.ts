import { NextResponse } from "next/server";
import { isValidEmail } from "@/lib/email-address";
import { EmailConfigError, RecipientNotAllowedError, sendInvoiceEmail } from "@/lib/server/mailer";
import { parseInvoice } from "@/lib/validate-invoice";

const MAX_BODY = 1_000_000;
const MAX_NOTE = 1000;

const fail = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error, ...extra }, { status });

export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > MAX_BODY) return fail(413, "Request is too large.");

  let body: { to?: unknown; note?: unknown; invoice?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return fail(400, "Request body must be valid JSON.");
  }
  if (typeof body !== "object" || body === null) return fail(400, "Request body must be an object.");

  const to = typeof body.to === "string" ? body.to.trim() : "";
  if (!isValidEmail(to)) return fail(400, "Enter a valid recipient email address.", { field: "to" });

  const note = body.note === undefined ? "" : body.note;
  if (typeof note !== "string" || note.length > MAX_NOTE) {
    return fail(400, `The message must be text of at most ${MAX_NOTE} characters.`, { field: "note" });
  }

  const parsed = parseInvoice(body.invoice);
  if (!parsed.ok) return fail(400, "The invoice is not valid.", { details: parsed.errors });

  try {
    const result = await sendInvoiceEmail({ to, invoice: parsed.invoice, note });
    return NextResponse.json({ ok: true, accepted: result.accepted, messageId: result.messageId });
  } catch (error) {
    if (error instanceof EmailConfigError) {
      return fail(503, "Email isn't configured on this server. Set the SMTP variables in .env.local (see README).", {
        code: "email_not_configured",
      });
    }
    if (error instanceof RecipientNotAllowedError) {
      return fail(403, "This server only sends to approved test addresses (EMAIL_ALLOWED_RECIPIENTS).", {
        code: "recipient_not_allowed",
      });
    }
    console.error("Failed to send invoice email", error);
    return fail(502, "The mail server couldn't send the message. Check the SMTP settings and try again.", {
      code: "send_failed",
    });
  }
}
