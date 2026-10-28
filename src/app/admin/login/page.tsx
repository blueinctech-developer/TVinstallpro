import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo/Logo";
import { currentUser } from "@/lib/admin/auth";
import styles from "../admin.module.css";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await currentUser()) redirect("/admin");
  return (
    <main className={styles.login}>
      <div className={styles.loginCard}>
        <Logo />
        <div>
          <h1 className={styles.title}>
            Admin <span className="ghost">sign in</span>
          </h1>
          <p className={styles.sub}>Bookings, enquiries and customers for TV Install Pro.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
