import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo/Logo";
import { sessionUser } from "@/lib/admin/auth";
import { logout } from "../actions";
import styles from "../admin.module.css";
import { VerifyForm } from "./forms";

export const metadata: Metadata = { title: "Two-factor sign-in" };

export default async function MfaPage() {
  const u = await sessionUser();
  if (!u) redirect("/admin/login");
  if (!u.mfaEnrolled) redirect("/admin/2fa/setup");
  if (u.mfaPassed) redirect("/admin");
  return (
    <main className={styles.login}>
      <div className={styles.loginCard}>
        <Logo />
        <div>
          <h1 className={styles.title}>
            Two-factor <span className="ghost">sign-in</span>
          </h1>
          <p className={styles.sub}>Signed in as {u.email}. One more step to open the dashboard.</p>
        </div>
        <VerifyForm />
        <form action={logout}>
          <button type="submit" className={`btn btn--ghost ${styles.btnSm}`}>
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
