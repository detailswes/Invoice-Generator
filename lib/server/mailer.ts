import nodemailer from "nodemailer";
import { buildInvoiceEmail } from "../email-content";
import { buildInvoiceView } from "../invoice-view";
import type { Invoice } from "../types";

/**
 * SMTP sending (tested with Brevo: host smtp-relay.brevo.com, port 587, SMTP login + SMTP key).
 * Credentials are read from the server environment only.
 */

export class EmailConfigError extends Error {}
export class RecipientNotAllowedError extends Error {}

type EmailConfig = { host: string; port: number; secure: boolean; user?: string; pass?: string; from: string };

type Env = Record<string, string | undefined>;

export function getEmailConfig(env: Env = process.env): EmailConfig | null {
  const host = env.SMTP_HOST?.trim();
  const from = env.EMAIL_FROM?.trim();
  if (!host || !from) return null;
  const port = Number(env.SMTP_PORT) || 587;
  return {
    host,
    port,
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465,
    user: env.SMTP_USER?.trim() || undefined,
    pass: env.SMTP_PASS || undefined,
    from,
  };
}

/** EMAIL_ALLOWED_RECIPIENTS: comma-separated addresses or "@domain" entries. Unset = no restriction. */
export function isRecipientAllowed(to: string, env: Env = process.env): boolean {
  const allowed = (env.EMAIL_ALLOWED_RECIPIENTS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  const address = to.toLowerCase();
  return allowed.some((entry) => (entry.startsWith("@") ? address.endsWith(entry) : address === entry));
}

export type SendResult = { messageId: string; accepted: string[] };

export async function sendInvoiceEmail(args: { to: string; invoice: Invoice; note?: string }): Promise<SendResult> {
  const config = getEmailConfig();
  if (!config) throw new EmailConfigError("SMTP_HOST and EMAIL_FROM are not set");
  if (!isRecipientAllowed(args.to)) throw new RecipientNotAllowedError(args.to);

  const view = buildInvoiceView(args.invoice);
  const email = buildInvoiceEmail(view, args.note);

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass ?? "" } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  const replyTo = args.invoice.business.email.trim();
  const info = await transport.sendMail({
    from: config.from,
    to: args.to,
    replyTo: replyTo || undefined,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  // Only what the SMTP server reported: accepted/rejected recipients and its message id.
  if (!info.accepted.map(String).includes(args.to)) throw new Error("Recipient was not accepted by the mail server");
  return { messageId: info.messageId, accepted: info.accepted.map(String) };
}
