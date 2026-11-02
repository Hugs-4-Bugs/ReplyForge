// Email sending. Uses nodemailer with SMTP env vars. If SMTP is not
// configured, we log the email to the server log + return it in the response
// so the developer can see what would have been sent. This file NEVER
// silently swallows the email — the caller knows whether it was delivered.

import nodemailer, { type Transporter } from "nodemailer";

export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendResult =
  | { ok: true; delivered: true; messageId: string }
  | { ok: true; delivered: false; reason: "smtp-not-configured"; preview: OutboundEmail }
  | { ok: false; error: string };

function transporter(): Transporter | null {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: parseInt(process.env.SMTP_PORT ?? "587", 10) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function sendEmail(email: OutboundEmail): Promise<SendResult> {
  const t = transporter();
  if (!t) {
    console.log("[email:dev-mode] Would send:", email);
    return { ok: true, delivered: false, reason: "smtp-not-configured", preview: email };
  }
  try {
    const info = await t.sendMail({
      from: process.env.EMAIL_FROM ?? "ReplyForge <noreply@replyforge.app>",
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    return { ok: true, delivered: true, messageId: info.messageId };
  } catch (err: any) {
    return { ok: false, error: String(err?.message ?? err) };
  }
}
