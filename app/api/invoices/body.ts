import { NextResponse } from "next/server";
import type { Invoice } from "@/lib/types";
import { parseInvoice } from "@/lib/validate-invoice";

const MAX_BODY_BYTES = 1_000_000;

type BodyResult = { ok: true; invoice: Invoice } | { ok: false; response: NextResponse };

/** Reads and validates an invoice request body; failures come back as ready-to-return responses. */
export async function readInvoiceBody(request: Request): Promise<BodyResult> {
  const fail = (status: number, error: string, details?: string[]): BodyResult => ({
    ok: false,
    response: NextResponse.json({ error, details }, { status }),
  });

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return fail(413, "Invoice is too large.");

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return fail(400, "Request body must be valid JSON.");
  }

  const result = parseInvoice(json);
  if (!result.ok) return fail(400, "The invoice is not valid.", result.errors);
  return { ok: true, invoice: result.invoice };
}
