"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentSessionId, logActivity, passMfa, sessionUser } from "@/lib/admin/auth";
import { hashEmailCode, hashRecoveryCode, newEmailCode, newRecoveryCodes, sameHash, verifyCode } from "@/lib/admin/totp";
import { db } from "@/lib/db";
import { sendMail, smtpConfigured } from "@/lib/email";
import { signInCodeEmail } from "@/lib/email-templates";
import { allow, clientIp } from "@/lib/rate-limit";
import { getSiteData } from "@/lib/site-data";

export type MfaState = { error?: string; recoveryCodes?: string[] };
export type EmailCodeState = { error?: string; sentTo?: string; sentAt?: number };

const TOO_MANY = "Too many attempts. Wait 15 minutes and try again.";
const EMAIL_CODE_MINUTES = 10;
const EMAIL_CODE_TRIES = 5;

/** First-time set-up: confirm the app works with one code, then hand out recovery codes once. */
export async function confirmSetup(_: MfaState, form: FormData): Promise<MfaState> {
  const u = await sessionUser();
  if (!u) redirect("/admin/login");
  if (u.mfaEnrolled) redirect("/admin");
  if (!(await allow(`mfa-setup:${u.id}`, 10, 900))) return { error: TOO_MANY };

  const sid = await currentSessionId();
  const conn = await db();
  const [s] = await conn.query<{ totp_pending: string | null }>("select totp_pending from admin_sessions where id = $1", [sid]);
  if (!s?.totp_pending) return { error: "This set-up has expired. Reload the page to get a new QR code." };

  const step = verifyCode(s.totp_pending, String(form.get("code") ?? ""), null);
  if (step === null) return { error: "That code doesn't match. Check the time on your phone is set automatically, then try the newest code." };

  const codes = newRecoveryCodes();
  await conn.query(
    `update admin_users set totp_secret = $2, totp_enabled_at = now(), totp_last_step = $3, recovery_codes = $4
      where id = $1 and totp_enabled_at is null`,
    [u.id, s.totp_pending, step, JSON.stringify(codes.map(hashRecoveryCode))],
  );
  await passMfa();
  await logActivity(u.id, "2FA set up", undefined, { ip: clientIp(await headers()) });
  // Shown once, never stored in readable form.
  return { recoveryCodes: codes };
}

/** Fallback when the app isn't to hand: email a one-time code to the account's own address. */
export async function sendEmailCode(_: EmailCodeState, _form: FormData): Promise<EmailCodeState> {
  const u = await sessionUser();
  if (!u) redirect("/admin/login");
  if (!u.mfaEnrolled) redirect("/admin/2fa/setup");
  if (u.mfaPassed) redirect("/admin");
  const ip = clientIp(await headers());
  if (!(await allow(`mfa-email:${u.id}`, 4, 900)) || !(await allow(`mfa-email-ip:${ip}`, 10, 900))) {
    return { error: "We've sent several codes already. Wait 15 minutes, then ask for a new one." };
  }

  const sid = await currentSessionId();
  if (!sid) redirect("/admin/login");
  const code = newEmailCode();
  const conn = await db();
  // A new code replaces any earlier one for this browser.
  await conn.query(
    `update admin_sessions set email_code_hash = $2, email_code_expires_at = now() + make_interval(mins => $3), email_code_attempts = 0
      where id = $1`,
    [sid, hashEmailCode(code, sid), EMAIL_CODE_MINUTES],
  );

  const { business } = await getSiteData();
  const mail = signInCodeEmail({ code, name: u.name, minutes: EMAIL_CODE_MINUTES, siteUrl: business.url });
  // Local development without SMTP: print the code to the server console instead.
  const devOnly = !smtpConfigured() && process.env.NODE_ENV !== "production";
  if (devOnly) console.info(`[2fa] email code for ${u.email}: ${code}`);
  const sent = devOnly ? { ok: true } : await sendMail({ to: u.email, ...mail });
  if (!sent.ok) {
    await conn.query("update admin_sessions set email_code_hash = null, email_code_expires_at = null where id = $1", [sid]);
    await logActivity(u.id, "2FA email code failed to send", undefined, { ip });
    return { error: "We couldn't send the email just now. Try again in a minute, or use a recovery code." };
  }
  await logActivity(u.id, "2FA email code sent", undefined, { ip });
  return { sentTo: u.email, sentAt: Date.now() };
}

/** Each sign-in: a 6-digit code from the app, an emailed code, or one of the recovery codes. */
export async function verifyMfa(_: MfaState, form: FormData): Promise<MfaState> {
  const u = await sessionUser();
  if (!u) redirect("/admin/login");
  if (!u.mfaEnrolled) redirect("/admin/2fa/setup");
  if (u.mfaPassed) redirect("/admin");
  const ip = clientIp(await headers());
  if (!(await allow(`mfa:${u.id}`, 8, 900)) || !(await allow(`mfa-ip:${ip}`, 30, 900))) return { error: TOO_MANY };

  const raw = String(form.get("code") ?? "").trim();
  const conn = await db();

  if (form.get("method") === "email") return verifyEmailCode(u.id, raw, ip);

  const [row] = await conn.query<{ totp_secret: string; totp_last_step: string | number | null; recovery_codes: string[] }>(
    "select totp_secret, totp_last_step, recovery_codes from admin_users where id = $1",
    [u.id],
  );
  if (!row) redirect("/admin/login");

  const digits = raw.replace(/\s/g, "");
  if (/^\d{6}$/.test(digits)) {
    const last = row.totp_last_step === null ? null : Number(row.totp_last_step);
    const step = verifyCode(row.totp_secret, digits, last);
    if (step !== null) {
      // Only moves forward, so the same code can't be used twice (even from two tabs at once).
      const used = await conn.query(
        "update admin_users set totp_last_step = $2 where id = $1 and (totp_last_step is null or totp_last_step < $2) returning id",
        [u.id, step],
      );
      if (used.length) {
        await passMfa();
        await logActivity(u.id, "2FA passed", undefined, { ip });
        redirect("/admin");
      }
    }
  } else if (raw.replace(/[^a-z0-9]/gi, "").length === 10) {
    const hash = hashRecoveryCode(raw);
    const codes = Array.isArray(row.recovery_codes) ? row.recovery_codes : [];
    if (codes.includes(hash)) {
      await conn.query("update admin_users set recovery_codes = $2 where id = $1", [u.id, JSON.stringify(codes.filter((c) => c !== hash))]);
      await passMfa();
      await logActivity(u.id, "2FA passed with a recovery code", undefined, { ip, left: codes.length - 1 });
      redirect("/admin?recovery=1");
    }
  }
  await logActivity(u.id, "2FA failed", undefined, { ip });
  return { error: "That code didn't work. Enter the 6-digit code your app shows now, or one of your recovery codes." };
}

/** Checks an emailed code against this browser's session. Wrong guesses count; the code works once. */
async function verifyEmailCode(userId: number, raw: string, ip: string): Promise<MfaState> {
  const sid = await currentSessionId();
  if (!sid) redirect("/admin/login");
  const digits = raw.replace(/\s/g, "");
  const conn = await db();
  // Count the attempt first, so parallel guesses can't get past the limit.
  const [row] = await conn.query<{ email_code_hash: string | null; expired: boolean; email_code_attempts: number }>(
    `update admin_sessions set email_code_attempts = email_code_attempts + 1
      where id = $1 and email_code_hash is not null
      returning email_code_hash, email_code_expires_at < now() as expired, email_code_attempts`,
    [sid],
  );
  if (!row?.email_code_hash) return { error: "Ask for a code first, using the button below." };
  if (row.expired || row.email_code_attempts > EMAIL_CODE_TRIES) {
    await conn.query("update admin_sessions set email_code_hash = null, email_code_expires_at = null where id = $1", [sid]);
    return { error: row.expired ? "That code has expired. Send a new one." : "Too many wrong codes. Send a new one." };
  }
  if (/^\d{6}$/.test(digits) && sameHash(row.email_code_hash, hashEmailCode(digits, sid))) {
    // Used once: clearing it only succeeds for the first request that matches.
    const used = await conn.query(
      "update admin_sessions set email_code_hash = null, email_code_expires_at = null where id = $1 and email_code_hash = $2 returning id",
      [sid, row.email_code_hash],
    );
    if (used.length) {
      await passMfa();
      await logActivity(userId, "2FA passed with an email code", undefined, { ip });
      redirect("/admin");
    }
  }
  await logActivity(userId, "2FA failed (email code)", undefined, { ip });
  return { error: "That code didn't work. Check the newest email from us and try again." };
}
