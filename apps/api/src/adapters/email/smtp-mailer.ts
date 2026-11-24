import { createTransport, type SendMailOptions } from "nodemailer";
import { EmailUnavailableError } from "../../errors/email-unavailable-error.ts";
import type { Mailer } from "../../ports/mailer.ts";

export type MailTransport = {
  sendMail(options: SendMailOptions): Promise<object>;
  close(): void;
};

export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string | undefined;
  password: string | undefined;
  timeoutMs: number;
};

type SmtpMailerOptions = {
  transport: MailTransport;
  from: string;
};

export function createSmtpTransport(settings: SmtpSettings): MailTransport {
  const auth =
    settings.user === undefined ? {} : { auth: { user: settings.user, pass: settings.password } };
  return createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    connectionTimeout: settings.timeoutMs,
    greetingTimeout: settings.timeoutMs,
    socketTimeout: settings.timeoutMs,
    ...auth,
  });
}

export function createSmtpMailer({ transport, from }: SmtpMailerOptions): Mailer {
  return {
    async send(message) {
      try {
        await transport.sendMail({
          from,
          to: message.to,
          replyTo: message.replyTo,
          subject: message.subject,
          text: message.text,
        });
      } catch (error) {
        if (error instanceof Error) {
          throw new EmailUnavailableError(error);
        }
        throw error;
      }
    },
  };
}
