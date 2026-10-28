import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { requireUser } from "@/lib/admin/auth";
import { collections, isCollection } from "@/lib/admin/collections";
import { listItems } from "@/lib/admin/content";
import { fmtDate } from "@/lib/admin/format";
import styles from "../../../admin.module.css";
import { Empty } from "../../../ui";

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  return { title: isCollection(type) ? collections[type].label : "Content" };
}

export default async function ContentList({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Promise<{ deleted?: string }> }) {
  await requireUser();
  const { type } = await params;
  if (!isCollection(type)) notFound();
  const c = collections[type];
  const [rows, { deleted }] = await Promise.all([listItems(type), searchParams]);
  const published = rows.filter((r) => r.status === "published").length;

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>
            {c.label} <span className="ghost">{rows.length}</span>
          </h1>
          <p className={styles.sub}>
            {published} published · {rows.length - published} draft{rows.length - published === 1 ? "" : "s"}. Drafts never appear on the website.
          </p>
        </div>
        <Link href={`/admin/content/${type}/new`} className={`btn ${styles.btnSm}`}>
          <Icon name="plus" size={16} /> New {c.singular}
        </Link>
      </div>
      {deleted && (
        <p className={styles.notice} role="status">
          <Icon name="check" size={18} /> Deleted.
        </p>
      )}
      <section className={styles.panel}>
        {rows.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{c.fields[0].label}</th>
                  <th scope="col">Status</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/admin/content/${type}/${r.id}`} className={styles.rowLink}>
                        {String(r[c.titleField] || "(untitled)")}
                      </Link>
                      {c.subtitle && <div className={`${styles.muted} ${styles.small}`}>{c.subtitle(r)}</div>}
                      {r.legacy_id ? <div className={styles.kind}>from the old site</div> : null}
                    </td>
                    <td>
                      <span className={styles.badge} data-tone={r.status === "published" ? "good" : "muted"}>
                        {r.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className={`${styles.muted} ${styles.nowrap}`}>{fmtDate(r.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title={`No ${c.label.toLowerCase()} yet`}>Add one with the button above.</Empty>
        )}
      </section>
    </>
  );
}
