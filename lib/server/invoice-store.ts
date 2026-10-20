import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { computeInvoice } from "../calculations";
import type { Invoice } from "../types";

/**
 * File-backed invoice repository. Everything lives in one JSON file:
 *
 *   { "version": 1, "invoices": { "<uuid>": StoredInvoice, ... } }
 *
 * StoredInvoice = { id, createdAt, updatedAt (ISO timestamps), invoice: Invoice }
 *
 * The invoice document is stored exactly as edited: numbers stay as the strings the user typed (so
 * no precision is lost) and dates stay as ISO yyyy-mm-dd strings. Writes are serialised in-process
 * and made atomic with write-to-temp + rename. Swap this module for a real database if the app is
 * deployed somewhere without a persistent writable disk (e.g. serverless).
 */

export type StoredInvoice = {
  id: string;
  createdAt: string;
  updatedAt: string;
  invoice: Invoice;
};

export type InvoiceSummary = {
  id: string;
  number: string;
  customer: string;
  totalCents: number;
  updatedAt: string;
};

type Database = { version: 1; invoices: Record<string, StoredInvoice> };

export const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// The path is chosen at runtime (INVOICE_DATA_DIR), so tell Turbopack not to trace it into the build.
const dataDir = () => path.resolve(/*turbopackIgnore: true*/ process.env.INVOICE_DATA_DIR || path.join(process.cwd(), "data"));
const dataFile = () => path.join(dataDir(), "invoices.json");

async function readDatabase(): Promise<Database> {
  let raw: string;
  try {
    raw = await fs.readFile(dataFile(), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { version: 1, invoices: {} };
    throw error;
  }
  // A corrupt file throws here on purpose: silently starting empty would overwrite the user's data.
  const parsed = JSON.parse(raw) as Database;
  if (parsed?.version !== 1 || typeof parsed.invoices !== "object" || parsed.invoices === null) {
    throw new Error("Unrecognised invoice database format");
  }
  return parsed;
}

async function writeDatabase(db: Database): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  const temp = `${dataFile()}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(temp, dataFile());
}

// Serialises read-modify-write cycles so concurrent saves can't clobber each other.
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.catch(() => undefined);
  return result;
}

export async function listInvoices(): Promise<InvoiceSummary[]> {
  const db = await readDatabase();
  return Object.values(db.invoices)
    .map((record) => ({
      id: record.id,
      number: record.invoice.number,
      customer: record.invoice.client.name,
      totalCents: computeInvoice(record.invoice).totalCents,
      updatedAt: record.updatedAt,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getInvoice(id: string): Promise<StoredInvoice | null> {
  if (!ID_PATTERN.test(id)) return null;
  const db = await readDatabase();
  return db.invoices[id] ?? null;
}

export function createInvoice(invoice: Invoice): Promise<StoredInvoice> {
  return exclusive(async () => {
    const db = await readDatabase();
    const now = new Date().toISOString();
    const record: StoredInvoice = { id: randomUUID(), createdAt: now, updatedAt: now, invoice };
    db.invoices[record.id] = record;
    await writeDatabase(db);
    return record;
  });
}

export function updateInvoice(id: string, invoice: Invoice): Promise<StoredInvoice | null> {
  return exclusive(async () => {
    if (!ID_PATTERN.test(id)) return null;
    const db = await readDatabase();
    const existing = db.invoices[id];
    if (!existing) return null;
    const record: StoredInvoice = { ...existing, updatedAt: new Date().toISOString(), invoice };
    db.invoices[id] = record;
    await writeDatabase(db);
    return record;
  });
}
