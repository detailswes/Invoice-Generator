import { NextResponse } from "next/server";
import { getInvoice, updateInvoice } from "@/lib/server/invoice-store";
import { readInvoiceBody } from "../body";

const notFound = () => NextResponse.json({ error: "Invoice not found." }, { status: 404 });

export async function GET(_request: Request, ctx: RouteContext<"/api/invoices/[id]">) {
  const { id } = await ctx.params;
  try {
    const record = await getInvoice(id);
    return record ? NextResponse.json(record) : notFound();
  } catch (error) {
    console.error("Failed to load invoice", error);
    return NextResponse.json({ error: "Could not load the invoice." }, { status: 500 });
  }
}

export async function PUT(request: Request, ctx: RouteContext<"/api/invoices/[id]">) {
  const { id } = await ctx.params;
  const body = await readInvoiceBody(request);
  if (!body.ok) return body.response;
  try {
    const record = await updateInvoice(id, body.invoice);
    return record ? NextResponse.json(record) : notFound();
  } catch (error) {
    console.error("Failed to update invoice", error);
    return NextResponse.json({ error: "Could not save the invoice." }, { status: 500 });
  }
}
