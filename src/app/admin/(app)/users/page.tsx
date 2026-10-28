import type { Metadata } from "next";
import { requireUser } from "@/lib/admin/auth";
import { fmtAgo, fmtDate } from "@/lib/admin/format";
import { roles, type Role } from "@/lib/admin/vocab";
import { db } from "@/lib/db";
import styles from "../../admin.module.css";
import { AddUserForm, UserRowActions } from "./forms";

export const metadata: Metadata = { title: "Users" };

type UserRow = {
  id: number;
  email: string;
  name: string;
  username: string | null;
  role: Role;
  disabled: boolean;
  source: "admin" | "wordpress";
  created_at: Date;
  last_login_at: Date | null;
  pending_setup: boolean;
  wp_password: boolean;
};

export default async function UsersPage() {
  const me = await requireUser("admin");
  const users = await (await db()).query<UserRow>(
    `select id, email, name, username, role, disabled, source, created_at, last_login_at,
            password_hash = '!' as pending_setup,
            password_hash not like 'scrypt$%' and password_hash <> '!' as wp_password
       from admin_users order by disabled, role = 'admin' desc, name`,
  );

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>
            Users <span className="ghost">{users.length}</span>
          </h1>
          <p className={styles.sub}>
            Who can sign in to the admin. Administrators manage everything; Staff handle requests and content; Read-only can only look.
          </p>
        </div>
      </div>

      <div className={styles.cols}>
        <section className={styles.panel} aria-labelledby="users-h">
          <div className={styles.panelHead}>
            <h2 id="users-h">Accounts</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Person</th>
                  <th scope="col">Role</th>
                  <th scope="col">Last sign-in</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong style={{ color: "var(--ink)" }}>{u.name}</strong>
                      {u.id === me.id && <span className={styles.muted}> (you)</span>}
                      <div className={`${styles.muted} ${styles.small}`}>
                        {u.email}
                        {u.username ? ` · username ${u.username}` : ""}
                      </div>
                      <div className={styles.small} style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        {u.disabled && (
                          <span className={styles.badge} data-tone="muted">
                            Disabled
                          </span>
                        )}
                        {u.pending_setup && (
                          <span className={styles.badge} data-tone="brand">
                            Hasn&apos;t set a password yet
                          </span>
                        )}
                        {u.source === "wordpress" && (
                          <span className={styles.badge} data-tone="info">
                            From old site{u.wp_password ? " · old password" : ""}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{roles[u.role]}</td>
                    <td className={`${styles.muted} ${styles.nowrap}`}>
                      {u.last_login_at ? fmtAgo(u.last_login_at) : "Never"}
                      <div className={styles.small}>Added {fmtDate(u.created_at)}</div>
                    </td>
                    <td>
                      <UserRowActions id={u.id} role={u.role} disabled={u.disabled} isMe={u.id === me.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="add-h">
          <div className={styles.panelHead}>
            <h2 id="add-h">Add a person</h2>
          </div>
          <div className={styles.panelBody}>
            <AddUserForm />
          </div>
        </section>
      </div>
    </>
  );
}
