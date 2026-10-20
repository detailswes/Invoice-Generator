import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sampleInvoice } from "../sample-invoice";
import { createInvoice, getInvoice, listInvoices, updateInvoice } from "./invoice-store";

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "invoice-store-"));
  process.env.INVOICE_DATA_DIR = dir;
});

afterEach(async () => {
  delete process.env.INVOICE_DATA_DIR;
  await fs.rm(dir, { recursive: true, force: true });
});

describe("invoice store", () => {
  it("returns an empty list when nothing has been saved", async () => {
    expect(await listInvoices()).toEqual([]);
  });

  it("creates an invoice with a stable id and reads it back identically", async () => {
    const created = await createInvoice(sampleInvoice);
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect((await getInvoice(created.id))?.invoice).toEqual(sampleInvoice);
  });

  it("persists to disk, so a fresh read (new process-equivalent) sees it", async () => {
    const created = await createInvoice(sampleInvoice);
    const onDisk = JSON.parse(await fs.readFile(path.join(dir, "invoices.json"), "utf8"));
    expect(onDisk.invoices[created.id].invoice.customFields[2].visible).toBe(false);
  });

  it("updates in place, keeping id and createdAt", async () => {
    const created = await createInvoice(sampleInvoice);
    const updated = await updateInvoice(created.id, { ...sampleInvoice, number: "INV-EDITED" });
    expect(updated).toMatchObject({ id: created.id, createdAt: created.createdAt });
    expect((await getInvoice(created.id))?.invoice.number).toBe("INV-EDITED");
    expect(await listInvoices()).toHaveLength(1);
  });

  it("lists summaries with computed totals, newest first", async () => {
    const first = await createInvoice(sampleInvoice);
    await new Promise((r) => setTimeout(r, 5));
    const second = await createInvoice({ ...sampleInvoice, number: "INV-2" });
    const list = await listInvoices();
    expect(list.map((s) => s.id)).toEqual([second.id, first.id]);
    expect(list[0]).toMatchObject({ number: "INV-2", customer: sampleInvoice.client.name, totalCents: 1177225 });
  });

  it("returns null for unknown or malformed ids", async () => {
    expect(await getInvoice("00000000-0000-4000-8000-000000000000")).toBeNull();
    expect(await getInvoice("../../etc/passwd")).toBeNull();
    expect(await updateInvoice("nope", sampleInvoice)).toBeNull();
  });

  it("survives concurrent saves without losing data", async () => {
    await Promise.all(Array.from({ length: 10 }, (_, i) => createInvoice({ ...sampleInvoice, number: `INV-${i}` })));
    expect(await listInvoices()).toHaveLength(10);
  });

  it("refuses to overwrite a corrupt database file", async () => {
    await fs.writeFile(path.join(dir, "invoices.json"), "{not json");
    await expect(createInvoice(sampleInvoice)).rejects.toThrow();
    expect(await fs.readFile(path.join(dir, "invoices.json"), "utf8")).toBe("{not json");
  });
});
