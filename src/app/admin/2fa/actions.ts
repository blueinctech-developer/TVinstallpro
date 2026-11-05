"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentSessionId, logActivity, passMfa, sessionUser } from "@/lib/admin/auth";
import { hashRecoveryCode, newRecoveryCodes, verifyCode } from "@/lib/admin/totp";
import { db } from "@/lib/db";
import { allow, clientIp } from "@/lib/rate-limit";

export type MfaState = { error?: string; recoveryCodes?: string[] };

const TOO_MANY = "Too many attempts. Wait 15 minutes and try again.";

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

/** Each sign-in: a 6-digit code from the app, or one of the recovery codes. */
export async function verifyMfa(_: MfaState, form: FormData): Promise<MfaState> {
  const u = await sessionUser();
  if (!u) redirect("/admin/login");
  if (!u.mfaEnrolled) redirect("/admin/2fa/setup");
  if (u.mfaPassed) redirect("/admin");
  const ip = clientIp(await headers());
  if (!(await allow(`mfa:${u.id}`, 8, 900)) || !(await allow(`mfa-ip:${ip}`, 30, 900))) return { error: TOO_MANY };

  const raw = String(form.get("code") ?? "").trim();
  const conn = await db();
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
