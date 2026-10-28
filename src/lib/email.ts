import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "@/lib/db";
import { getEmailSettings } from "@/lib/site-data";

/*
 * Outgoing email (what WP Mail SMTP did on the old site). Works with any SMTP server, e.g.
 * Amazon SES SMTP (email-smtp.<region>.amazonaws.com:587), Gmail/Workspace, or your host's mail.
 * Credentials live only in environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.
 * Sender and recipients are edited in Admin → Settings → Email. Every attempt is logged.
 */

export const smtpConfigured = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

export function smtpSummary() {
  return smtpConfigured() ? `${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587} as ${process.env.SMTP_USER}` : null;
}

let transport: Transporter | null = null;
function transporter() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 587);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transport;
}

type Mail = { to: string; subject: string; text: string; replyTo?: string; requestId?: number };

/** Sends one email and logs the outcome. Never throws: a failed email must not fail the request that triggered it. */
export async function sendMail(m: Mail): Promise<{ ok: boolean; error?: string }> {
  const log = (status: "sent" | "failed" | "skipped", error?: string) =>
    db()
      .then((c) =>
        c.query("insert into email_log (to_addr, subject, status, error, request_id) values ($1, $2, $3, $4, $5)", [
          m.to,
          m.subject.slice(0, 300),
          status,
          error?.slice(0, 500) ?? null,
          m.requestId ?? null,
        ]),
      )
      .catch((e) => console.error("[email] could not write log:", e));

  if (!smtpConfigured()) {
    await log("skipped", "SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)");
    return { ok: false, error: "Email isn't set up yet: the SMTP settings are missing in the hosting environment." };
  }
  const s = await getEmailSettings();
  try {
    await transporter().sendMail({
      from: { name: s.fromName, address: s.fromEmail },
      to: m.to,
      subject: m.subject,
      text: m.text,
      replyTo: m.replyTo,
    });
    await log("sent");
    return { ok: true };
  } catch (err) {
    const msg = (err as Error).message;
    console.error("[email] send failed:", msg);
    await log("failed", msg);
    return { ok: false, error: msg };
  }
}

const kindLabel = { booking: "Booking request", contact: "Contact message", partner: "Partnership request" } as const;

/** New-request alert to the business (and, if enabled, a confirmation to the customer). */
export async function sendRequestEmails(r: {
  id: number;
  kind: keyof typeof kindLabel;
  name: string;
  email: string;
  phone: string;
  summary: string;
  origin: string;
}) {
  const s = await getEmailSettings();
  const to = s.alertsTo
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter((x) => x.includes("@"));
  const link = `${r.origin}/admin/requests/${r.id}`;
  for (const addr of to) {
    await sendMail({
      to: addr,
      subject: `${kindLabel[r.kind]} from ${r.name}`,
      text: `${kindLabel[r.kind]} #${r.id}\n\n${r.summary}\n\nOpen it in the admin: ${link}`,
      replyTo: r.email,
      requestId: r.id,
    });
  }
  if (s.confirmToCustomer && r.email) {
    await sendMail({
      to: r.email,
      subject: `We received your request – ${s.fromName}`,
      text: `Hi ${r.name.split(" ")[0]},\n\nThanks for contacting ${s.fromName}. We've received your request and will get back to you soon to confirm the details. This isn't a confirmed appointment yet.\n\nWhat you sent:\n\n${r.summary}\n\n${s.fromName}`,
      requestId: r.id,
    });
  }
}
