import type { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { currentSessionId, sessionUser } from "@/lib/admin/auth";
import { newSecret, otpauthUri } from "@/lib/admin/totp";
import { db } from "@/lib/db";
import { SetupScreen } from "../forms";
import { MfaShell } from "../shell";

export const metadata: Metadata = { title: "Set up two-factor sign-in" };

export default async function MfaSetupPage() {
  const u = await sessionUser();
  if (!u) redirect("/admin/login");
  if (u.mfaEnrolled) redirect(u.mfaPassed ? "/admin" : "/admin/2fa");

  // One secret per set-up attempt, kept on this session until a code confirms it.
  const sid = await currentSessionId();
  const conn = await db();
  const [s] = await conn.query<{ totp_pending: string | null }>("select totp_pending from admin_sessions where id = $1", [sid]);
  let secret = s?.totp_pending ?? null;
  if (!secret) {
    secret = newSecret();
    await conn.query("update admin_sessions set totp_pending = $2 where id = $1", [sid, secret]);
  }
  const qr = await QRCode.toString(otpauthUri(secret, u.email), { type: "svg", margin: 0, errorCorrectionLevel: "M" });
  const grouped = secret.match(/.{1,4}/g)?.join(" ") ?? secret;

  return (
    <MfaShell email={u.email}>
      <SetupScreen qr={qr} secret={grouped} account={u.email} />
    </MfaShell>
  );
}
