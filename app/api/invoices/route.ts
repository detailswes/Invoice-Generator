import { NextResponse } from "next/server";
import { createInvoice, listInvoices } from "@/lib/server/invoice-store";
import { readInvoiceBody } from "./body";

export async function GET() {
  try {
    return NextResponse.json({ invoices: await listInvoices() });
  } catch (error) {
    console.error("Failed to list invoices", error);
    return NextResponse.json({ error: "Could not load invoices." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await readInvoiceBody(request);
  if (!body.ok) return body.response;
  try {
    return NextResponse.json(await createInvoice(body.invoice), { status: 201 });
  } catch (error) {
    console.error("Failed to create invoice", error);
    return NextResponse.json({ error: "Could not save the invoice." }, { status: 500 });
  }
}
