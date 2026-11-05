import type { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { Logo } from "@/components/logo/Logo";
import { currentSessionId, sessionUser } from "@/lib/admin/auth";
import { newSecret, otpauthUri } from "@/lib/admin/totp";
import { db } from "@/lib/db";
import { logout } from "../../actions";
import styles from "../../admin.module.css";
import { SetupForm } from "../forms";

export const metadata: Metadata = { title: "Set up two-factor sign-in" };

export default async function MfaSetupPage() {
  const u = await sessionUser();
  if (!u) redirect("/admin/login");
  if (u.mfaEnrolled) redirect(u.mfaPassed ? "/admin" : "/admin/2fa");

  // One secret per set-up attempt, kept on this session until a code confirms it.
  const sid = await currentSessionId();
  const conn = await db();
  const [s] = await conn.query<{ totp_pending: string | null }>(
    "select totp_pending from admin_sessions where id = $1",
    [sid],
  );
  let secret = s?.totp_pending ?? null;
  if (!secret) {
    secret = newSecret();
    await conn.query(
      "update admin_sessions set totp_pending = $2 where id = $1",
      [sid, secret],
    );
  }
  const qr = await QRCode.toString(otpauthUri(secret, u.email), {
    type: "svg",
    margin: 0,
    width: 168,
    errorCorrectionLevel: "M",
  });
  const grouped = secret.match(/.{1,4}/g)?.join(" ") ?? secret;

  return (
    <main className={styles.login}>
      <div className={styles.loginCard} style={{ maxWidth: 480 }}>
        <Logo />
        <div>
          <h1 className={styles.title}>
            Set up <span className="ghost">two-factor sign-in</span>
          </h1>
          <p className={styles.sub}>
            Required for every admin account. It takes a minute, and after that
            you&apos;ll enter a code from your phone each time you sign in.
          </p>
        </div>

        <SetupForm qr={qr} secret={grouped} account={u.email} />

        <form action={logout}>
          <button type="submit" className={`btn btn--ghost ${styles.btnSm}`}>
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
