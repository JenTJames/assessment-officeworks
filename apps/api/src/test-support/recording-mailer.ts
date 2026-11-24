import type { EmailMessage, Mailer } from "../ports/mailer.ts";

export type RecordingMailer = Mailer & {
  sent: EmailMessage[];
};

export function createRecordingMailer(failure?: Error): RecordingMailer {
  const sent: EmailMessage[] = [];
  return {
    sent,
    send: (message) => {
      if (failure !== undefined) {
        return Promise.reject(failure);
      }
      sent.push(message);
      return Promise.resolve();
    },
  };
}
