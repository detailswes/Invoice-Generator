import type { AddressInfo } from "node:net";
import { simpleParser, type AddressObject, type ParsedMail } from "mailparser";
import { SMTPServer } from "smtp-server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sampleInvoice } from "../sample-invoice";
import { EmailConfigError, getEmailConfig, isRecipientAllowed, RecipientNotAllowedError, sendInvoiceEmail } from "./mailer";

// A real SMTP server on 127.0.0.1: exercises the actual protocol without contacting any third party.
let server: SMTPServer;
let received: ParsedMail[];
let authSeen: { user?: string; pass?: string } | null;
const saved = { ...process.env };
const addressText = (a: AddressObject | AddressObject[] | undefined) => (Array.isArray(a) ? a[0]?.text : a?.text);

beforeEach(async () => {
  received = [];
  authSeen = null;
  server = new SMTPServer({
    authOptional: true,
    disabledCommands: ["STARTTLS"],
    onAuth(auth, _session, cb) {
      authSeen = { user: auth.username ?? undefined, pass: auth.password ?? undefined };
      cb(null, { user: auth.username });
    },
    async onData(stream, _session, cb) {
      received.push(await simpleParser(stream));
      cb();
    },
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.server.address() as AddressInfo).port;
  process.env.SMTP_HOST = "127.0.0.1";
  process.env.SMTP_PORT = String(port);
  process.env.EMAIL_FROM = "Folio <invoices@sender.test>";
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  delete process.env.EMAIL_ALLOWED_RECIPIENTS;
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  process.env = { ...saved };
});

describe("sendInvoiceEmail", () => {
  it("delivers a message to the SMTP server with the invoice summary", async () => {
    const result = await sendInvoiceEmail({ to: "me@example.test", invoice: sampleInvoice, note: "Thanks!" });
    expect(result.accepted).toEqual(["me@example.test"]);
    expect(received).toHaveLength(1);
    const mail = received[0];
    expect(addressText(mail.to)).toBe("me@example.test");
    expect(addressText(mail.from)).toContain("invoices@sender.test");
    expect(addressText(mail.replyTo)).toBe(sampleInvoice.business.email);
    expect(mail.subject).toContain("INV-2026-0084");
    expect(mail.text).toContain("Thanks!");
    expect(mail.text).toContain("Total due: $11,772.25");
    expect(mail.html).toContain("$11,772.25");
    expect(mail.text).not.toContain("US-94-3829102");
  });

  it("authenticates when credentials are configured", async () => {
    process.env.SMTP_USER = "apikey";
    process.env.SMTP_PASS = "placeholder-secret";
    await sendInvoiceEmail({ to: "me@example.test", invoice: sampleInvoice });
    expect(authSeen).toEqual({ user: "apikey", pass: "placeholder-secret" });
  });

  it("throws a configuration error when SMTP is not set up", async () => {
    delete process.env.SMTP_HOST;
    await expect(sendInvoiceEmail({ to: "me@example.test", invoice: sampleInvoice })).rejects.toBeInstanceOf(EmailConfigError);
    expect(received).toHaveLength(0);
  });

  it("refuses recipients outside the allowlist without contacting the server", async () => {
    process.env.EMAIL_ALLOWED_RECIPIENTS = "me@example.test";
    await expect(sendInvoiceEmail({ to: "stranger@elsewhere.test", invoice: sampleInvoice })).rejects.toBeInstanceOf(
      RecipientNotAllowedError,
    );
    expect(received).toHaveLength(0);
    await sendInvoiceEmail({ to: "ME@example.test", invoice: sampleInvoice });
    expect(received).toHaveLength(1);
  });

  it("surfaces a failure when the SMTP server is unreachable", async () => {
    process.env.SMTP_PORT = "1"; // nothing listens here
    await expect(sendInvoiceEmail({ to: "me@example.test", invoice: sampleInvoice })).rejects.toThrow();
  });
});

describe("config helpers", () => {
  it("getEmailConfig returns null unless host and from are set", () => {
    expect(getEmailConfig({})).toBeNull();
    expect(getEmailConfig({ SMTP_HOST: "h" })).toBeNull();
    expect(getEmailConfig({ SMTP_HOST: "h", EMAIL_FROM: "a@b.co", SMTP_PORT: "465" })).toMatchObject({ port: 465, secure: true });
    expect(getEmailConfig({ SMTP_HOST: "h", EMAIL_FROM: "a@b.co" })).toMatchObject({ port: 587, secure: false });
  });

  it("isRecipientAllowed supports addresses and @domains", () => {
    const env = { EMAIL_ALLOWED_RECIPIENTS: " a@x.test, @corp.test " };
    expect(isRecipientAllowed("a@x.test", env)).toBe(true);
    expect(isRecipientAllowed("anyone@corp.test", env)).toBe(true);
    expect(isRecipientAllowed("b@x.test", env)).toBe(false);
    expect(isRecipientAllowed("anyone@else.test", {})).toBe(true);
  });
});
