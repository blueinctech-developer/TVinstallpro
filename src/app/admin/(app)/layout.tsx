import Link from "next/link";
import { Logo } from "@/components/logo/Logo";
import { requireUser } from "@/lib/admin/auth";
import { roles } from "@/lib/admin/vocab";
import { db } from "@/lib/db";
import { logout } from "../actions";
import styles from "../admin.module.css";
import { AdminNav } from "./AdminNav";

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [counts] = await (await db()).query<{ requests: number; comments: number }>(
    `select (select count(*)::int from requests where status = 'new') as requests,
            (select count(*)::int from comments where status = 'pending') as comments`,
  );
  return (
    <div className={styles.shell}>
      <aside className={styles.side}>
        <Link href="/admin" className={styles.brand} aria-label="TV Install Pro admin, overview">
          <Logo />
          <span className={styles.brandTag}>Admin</span>
        </Link>
        <AdminNav role={user.role} counts={counts} />
        <div className={styles.sideFoot}>
          <div className={styles.who}>
            <strong>{user.name}</strong>
            <span>{roles[user.role]}</span>
          </div>
          <form action={logout}>
            <button type="submit" className={`btn btn--ghost ${styles.btnSm}`}>
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className={styles.main} id="main">
        <div className={styles.inner}>{children}</div>
      </main>
    </div>
  );
}
