import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo/Logo";
import { findToken } from "@/lib/admin/tokens";
import styles from "../admin.module.css";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = { title: "Set your password" };

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const t = token ? await findToken(token) : null;
  return (
    <main className={styles.login}>
      <div className={styles.loginCard}>
        <Logo />
        {t ? (
          <>
            <div>
              <h1 className={styles.title}>
                {t.purpose === "setup" ? "Welcome" : "New"} <span className="ghost">password</span>
              </h1>
              <p className={styles.sub}>
                {t.name} · {t.email}. Choose a password of at least 12 characters.
              </p>
            </div>
            <SetupForm token={token} />
          </>
        ) : (
          <div>
            <h1 className={styles.title}>
              Link <span className="ghost">expired</span>
            </h1>
            <p className={styles.sub}>
              This password link has already been used or is more than 72 hours old. Ask an administrator for a new one.
            </p>
            <p style={{ marginTop: 16 }}>
              <Link href="/admin/login" className="btn btn--ghost">
                Go to sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
