import { createTransport } from "nodemailer";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { EmailUnavailableError } from "../../errors/email-unavailable-error.ts";
import type { EmailMessage } from "../../ports/mailer.ts";
import { createSmtpMailer, createSmtpTransport } from "./smtp-mailer.ts";

const message: EmailMessage = {
  to: "sales@catalogue.test",
  replyTo: { name: "Ada Lovelace", address: "ada@example.com" },
  subject: "Product enquiry: Mens Cotton Jacket",
  text: "Hello",
};

const sentEnvelopeSchema = z.object({
  from: z.object({ address: z.string() }),
  to: z.array(z.object({ address: z.string() })),
  replyTo: z.array(z.object({ name: z.string(), address: z.string() })),
  subject: z.string(),
  text: z.string(),
});

describe("SMTP mailer", () => {
  it("sends the message from the configured sender with the customer as reply-to", async () => {
    const sentMessages: string[] = [];
    const jsonTransport = createTransport({ jsonTransport: true });
    const mailer = createSmtpMailer({
      from: "Catalogue <no-reply@catalogue.test>",
      transport: {
        sendMail: async (options) => {
          const info = await jsonTransport.sendMail(options);
          sentMessages.push(info.message);
          return info;
        },
        close: () => undefined,
      },
    });

    await mailer.send(message);

    expect(sentMessages).toHaveLength(1);
    const sent = sentEnvelopeSchema.parse(JSON.parse(sentMessages[0] ?? ""));
    expect(sent).toEqual({
      from: { address: "no-reply@catalogue.test" },
      to: [{ address: "sales@catalogue.test" }],
      replyTo: [{ name: "Ada Lovelace", address: "ada@example.com" }],
      subject: message.subject,
      text: message.text,
    });
  });

  it("throws EmailUnavailableError when the SMTP server cannot be reached", async () => {
    const transport = createSmtpTransport({
      host: "127.0.0.1",
      port: 1,
      secure: false,
      user: undefined,
      password: undefined,
      timeoutMs: 500,
    });
    const mailer = createSmtpMailer({ transport, from: "no-reply@catalogue.test" });

    await expect(mailer.send(message)).rejects.toBeInstanceOf(EmailUnavailableError);
    transport.close();
  });
});
