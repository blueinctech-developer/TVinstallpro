import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/admin/auth";
import { fmtDate } from "@/lib/admin/format";
import { listCustomers } from "@/lib/admin/requests";
import styles from "../../admin.module.css";
import { Empty, Pager, withParams } from "../../ui";

export const metadata: Metadata = { title: "Customers" };

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const q = sp.q?.slice(0, 100) || undefined;
  const { rows, total, page, pages } = await listCustomers(q, Math.max(1, Number(sp.page) || 1));

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>
            Customers <span className="ghost">{total}</span>
          </h1>
          <p className={styles.sub}>Grouped by matching email or phone. Nothing is merged automatically.</p>
        </div>
      </div>

      <section className={styles.panel}>
        <form className={styles.filters} role="search">
          <label className={`${styles.control} ${styles.search}`}>
            Search
            <input type="search" name="q" defaultValue={q} placeholder="Name, email or phone" className={styles.input} />
          </label>
          <button type="submit" className={`btn ${styles.btnSm}`}>
            Search
          </button>
          {q && (
            <Link href="/admin/customers" className={`btn btn--ghost ${styles.btnSm}`}>
              Clear
            </Link>
          )}
        </form>
        {rows.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Email</th>
                  <th scope="col">Area</th>
                  <th scope="col" className={styles.num}>
                    Requests
                  </th>
                  <th scope="col">Last request</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/customers/${c.id}`} className={styles.rowLink}>
                        {c.name}
                      </Link>
                    </td>
                    <td className={styles.num}>{c.phone ?? "—"}</td>
                    <td>{c.email ?? "—"}</td>
                    <td>{c.area ?? "—"}</td>
                    <td className={styles.num}>{c.request_count}</td>
                    <td className={`${styles.num} ${styles.muted}`}>{fmtDate(c.last_request_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title={q ? "No matching customers" : "No customers yet"}>
            {q ? "Try a shorter search." : "Customers are created from requests."}
          </Empty>
        )}
        <Pager page={page} pages={pages} total={total} href={(p) => withParams("/admin/customers", { q, page: p })} />
      </section>
    </>
  );
}
