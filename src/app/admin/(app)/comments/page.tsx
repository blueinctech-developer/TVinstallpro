import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/admin/auth";
import { fmtDateTime } from "@/lib/admin/format";
import { roleAtLeast } from "@/lib/admin/vocab";
import { db } from "@/lib/db";
import styles from "../../admin.module.css";
import { Empty } from "../../ui";
import { bulkComments, moderateComment } from "../content/actions";
import { ConfirmSubmit } from "../content/[type]/[id]/Editor";

export const metadata: Metadata = { title: "Comments" };

const lists = [
  { id: "pending", label: "Waiting" },
  { id: "approved", label: "Approved" },
  { id: "spam", label: "Spam" },
  { id: "trash", label: "Trash" },
] as const;

type C = { id: number; author_name: string; author_email: string | null; body: string; status: string; created_at: Date; post_title: string | null; post_slug: string | null; legacy_id: number | null };

export default async function CommentsPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const user = await requireUser();
  const canEdit = roleAtLeast(user.role, "staff");
  const s = (await searchParams).s;
  const status = lists.find((l) => l.id === s)?.id ?? "pending";
  const conn = await db();
  const [counts, rows] = await Promise.all([
    conn.query<{ status: string; n: number }>("select status, count(*)::int as n from comments group by status"),
    conn.query<C>(
      `select c.*, p.title as post_title, p.slug as post_slug from comments c left join posts p on p.id = c.post_id
        where c.status = $1 order by c.created_at desc limit 200`,
      [status],
    ),
  ]);
  const count = (id: string) => counts.find((c) => c.status === id)?.n ?? 0;

  const act = (id: number, to: string, label: string) => (
    <form action={moderateComment}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="to" value={to} />
      <button type="submit" className={`btn btn--ghost ${styles.btnSm}`}>
        {label}
      </button>
    </form>
  );

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>
            Comments <span className="ghost">{count("pending")} waiting</span>
          </h1>
          <p className={styles.sub}>Nothing appears on the website until it&apos;s approved here.</p>
        </div>
        {canEdit && (status === "spam" || status === "trash") && count(status) > 0 && (
          <form action={bulkComments}>
            <input type="hidden" name="op" value={`empty-${status}`} />
            <ConfirmSubmit label={`Delete all ${count(status)} permanently`} message={`Permanently delete every comment in ${status}? This can't be undone.`} />
          </form>
        )}
      </div>
      <nav className={styles.tabs} aria-label="Comment lists" style={{ justifySelf: "start" }}>
        {lists.map((l) => (
          <Link key={l.id} href={`/admin/comments?s=${l.id}`} className={styles.tab} aria-current={status === l.id ? "page" : undefined}>
            {l.label} ({count(l.id)})
          </Link>
        ))}
      </nav>
      <section className={styles.panel}>
        {rows.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td style={{ width: "100%" }}>
                      <strong style={{ color: "var(--ink)" }}>{c.author_name}</strong>
                      <span className={`${styles.muted} ${styles.small}`}>
                        {c.author_email ? ` · ${c.author_email}` : ""} · {fmtDateTime(c.created_at)}
                        {c.post_title ? ` · on “${c.post_title}”` : ""}
                        {c.legacy_id ? " · old site" : ""}
                      </span>
                      <p className={styles.message} style={{ marginTop: 6 }}>
                        {c.body.length > 700 ? `${c.body.slice(0, 700)}…` : c.body}
                      </p>
                    </td>
                    {canEdit && (
                      <td>
                        <div style={{ display: "grid", gap: 6 }}>
                          {status !== "approved" && act(c.id, "approved", "Approve")}
                          {status === "approved" && act(c.id, "pending", "Unapprove")}
                          {status !== "spam" && act(c.id, "spam", "Spam")}
                          {status !== "trash" && act(c.id, "trash", "Trash")}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Nothing here">{status === "pending" ? "New comments from the website will wait here for approval." : ""}</Empty>
        )}
      </section>
    </>
  );
}
