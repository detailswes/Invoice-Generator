// Local mail catcher for testing the email feature without any provider account.
// It accepts SMTP on 127.0.0.1 and prints each message instead of delivering it, so nothing is ever
// sent to a real address.   Usage:  npm run smtp-sink   (then see .env.example / README)
import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";

const port = Number(process.env.SINK_PORT) || 1025;

const server = new SMTPServer({
  authOptional: true,
  disabledCommands: ["STARTTLS"],
  onAuth: (auth, session, cb) => cb(null, { user: auth.username }),
  async onData(stream, session, cb) {
    const mail = await simpleParser(stream);
    console.log("\n──────── message received ────────");
    console.log("From:    ", mail.from?.text);
    console.log("To:      ", mail.to?.text);
    console.log("Subject: ", mail.subject);
    console.log("\n" + mail.text);
    cb();
  },
});

server.listen(port, "127.0.0.1", () => {
  console.log(`SMTP sink listening on 127.0.0.1:${port} (messages are printed, never delivered)`);
  console.log("Set in .env.local:  SMTP_HOST=127.0.0.1  SMTP_PORT=1025  EMAIL_FROM=invoices@localhost.test");
});
