export type EmailAddress = {
  name: string;
  address: string;
};

export type EmailMessage = {
  to: string;
  replyTo: EmailAddress;
  subject: string;
  text: string;
};

export interface Mailer {
  send(message: EmailMessage): Promise<void>;
}
