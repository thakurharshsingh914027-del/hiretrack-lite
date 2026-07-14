import "server-only";

import { Resend } from "resend";

import { parseMailEnv } from "@/lib/env";

export type MailMessage = {
  kind: "verification" | "password-reset" | "invitation";
  to: string;
  subject: string;
  url: string;
  text: string;
  html: string;
};

export interface MailAdapter {
  send(message: MailMessage): Promise<void>;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] ?? character,
  );
}

export class CaptureMailAdapter implements MailAdapter {
  readonly messages: MailMessage[] = [];
  async send(message: MailMessage) {
    this.messages.push(message);
  }
}

class ResendMailAdapter implements MailAdapter {
  private readonly resend: Resend;
  constructor(
    private readonly from: string,
    apiKey: string,
  ) {
    this.resend = new Resend(apiKey);
  }
  async send(message: MailMessage) {
    const result = await this.resend.emails.send({
      from: this.from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    if (result.error) throw new Error("Transactional email delivery failed");
  }
}

const globalForMail = globalThis as typeof globalThis & {
  hireTrackMail?: CaptureMailAdapter | MailAdapter;
};

export function getMailAdapter(): MailAdapter {
  if (globalForMail.hireTrackMail) return globalForMail.hireTrackMail;
  const env = parseMailEnv(process.env);
  const production =
    env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
  if (!production || !env.RESEND_API_KEY) {
    globalForMail.hireTrackMail = new CaptureMailAdapter();
  } else {
    globalForMail.hireTrackMail = new ResendMailAdapter(
      env.EMAIL_FROM,
      env.RESEND_API_KEY,
    );
  }
  return globalForMail.hireTrackMail;
}

export function createMailMessage(input: {
  kind: MailMessage["kind"];
  to: string;
  name?: string | null;
  url: string;
  organizationName?: string;
}) {
  const name = escapeHtml(input.name?.trim() || "there");
  const organization = escapeHtml(
    input.organizationName || "your HireTrack workspace",
  );
  const labels = {
    verification: [
      "Verify your HireTrack Lite email",
      `Verify your email to finish creating ${organization}.`,
    ],
    "password-reset": [
      "Reset your HireTrack Lite password",
      "Use this one-time link to choose a new password.",
    ],
    invitation: [
      `Invitation to ${organization}`,
      `You have been invited to join ${organization}.`,
    ],
  } as const;
  const [subject, intro] = labels[input.kind];
  const text = `Hi ${input.name?.trim() || "there"},\n\n${intro}\n\n${input.url}\n\nThis link expires and can only be used once.`;
  return {
    kind: input.kind,
    to: input.to,
    subject,
    url: input.url,
    text,
    html: `<p>Hi ${name},</p><p>${intro}</p><p><a href="${escapeHtml(input.url)}">Continue securely</a></p><p>This link expires and can only be used once.</p>`,
  } satisfies MailMessage;
}
