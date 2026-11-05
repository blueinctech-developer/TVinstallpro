import { Logo } from "@/components/logo/Logo";
import { logout } from "../actions";
import styles from "../admin.module.css";
import m from "./mfa.module.css";

/** Page frame for the two-factor screens: logo top-left, who's signed in and Sign out top-right. */
export function MfaShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <div className={m.page}>
      <header className={m.top}>
        <span className={m.logo} aria-label="TV Install Pro">
          <Logo />
        </span>
        <div className={m.who}>
          <span>Signed in as {email}</span>
          <form action={logout}>
            <button type="submit" className={`btn btn--ghost ${styles.btnSm}`}>
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className={m.main}>{children}</main>
    </div>
  );
}
