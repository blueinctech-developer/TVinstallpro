import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "@/lib/db";
import { alertEmail, customerEmail, type EmailKind, type RequestEmailData } from "@/lib/email-templates";
import { describeTv, emptyTvSelection, estimateLines, estimateNotes, estimateTotal, type TvSelection } from "@/lib/pricing";
import { getEmailSettings, getSiteData } from "@/lib/site-data";

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

type Mail = { to: string; subject: string; text: string; html?: string; replyTo?: string; requestId?: number };

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
      html: m.html,
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

/** New-request alert to the business, and a branded confirmation to the customer. */
export async function sendRequestEmails(r: {
  id: number;
  kind: EmailKind;
  name: string;
  email: string;
  phone: string;
  summary: string;
  details?: Record<string, unknown>;
  origin: string;
}) {
  const [s, siteData] = await Promise.all([getEmailSettings(), getSiteData()]);
  const details = r.details ?? {};
  const svc = siteData.services.find((x) => x.slug === details.service);
  const tvSel = svc?.estimator && details.tv && typeof details.tv === "object" ? ({ ...emptyTvSelection, ...(details.tv as Partial<TvSelection>) } as TvSelection) : undefined;
  const base = siteData.business.url;
  const data: RequestEmailData = {
    ...r,
    details,
    business: siteData.business,
    service: svc ? { title: svc.title, image: new URL(svc.cardImage || svc.image, base).toString(), estimator: svc.estimator } : undefined,
    // Worked out again here from the saved prices, never taken from the browser.
    tv: tvSel
      ? {
          answers: describeTv(tvSel, siteData.prices),
          lines: estimateLines(tvSel, siteData.prices),
          notes: estimateNotes(tvSel, siteData.prices),
          total: estimateTotal(tvSel, siteData.prices),
        }
      : undefined,
    adminUrl: `${r.origin}/admin/requests/${r.id}`,
  };

  // Routing matches the old site: partner requests can go to their own address.
  const to = (r.kind === "partner" && s.partnerAlertsTo ? s.partnerAlertsTo : s.alertsTo)
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter((x) => x.includes("@"));
  const alert = alertEmail(data);
  for (const addr of to) {
    await sendMail({ to: addr, ...alert, replyTo: r.email, requestId: r.id });
  }
  if (s.confirmToCustomer && r.email) {
    await sendMail({ to: r.email, ...customerEmail(data), replyTo: s.replyTo || undefined, requestId: r.id });
  }
}
