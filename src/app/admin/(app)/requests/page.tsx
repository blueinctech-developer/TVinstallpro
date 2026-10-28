import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/admin/auth";
import { fmtDateTime, fmtMoney, serviceTitle } from "@/lib/admin/format";
import { listRequests, type RequestFilters } from "@/lib/admin/requests";
import { isKind, isStatus, kinds, roleAtLeast, statusOrder, statuses, type Kind } from "@/lib/admin/vocab";
import styles from "../../admin.module.css";
import { Empty, Pager, StatusBadge, kindLabel, withParams } from "../../ui";

export const metadata: Metadata = { title: "Requests" };

type Search = { kind?: string; status?: string; q?: string; page?: string };

export default async function Requests({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const f: RequestFilters = {
    kind: isKind(sp.kind) ? sp.kind : undefined,
    status: sp.status === "open" || isStatus(sp.status) ? (sp.status as RequestFilters["status"]) : undefined,
    q: sp.q?.slice(0, 100) || undefined,
    page: Math.max(1, Number(sp.page) || 1),
  };
  const { rows, total, page, pages } = await listRequests(f);
  const keep = { kind: f.kind, status: f.status, q: f.q };

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>
            Requests <span className="ghost">{f.kind ? kinds[f.kind] : "all"}</span>
          </h1>
          <p className={styles.sub}>Bookings, contact messages and partner requests, newest first.</p>
        </div>
        {roleAtLeast(user.role, "staff") && (
          <a href={withParams("/admin/export", keep)} className={`btn btn--ghost ${styles.btnSm}`}>
            Export CSV
          </a>
        )}
      </div>

      <section className={styles.panel}>
        <div className={styles.filters}>
          <nav className={styles.tabs} aria-label="Request type">
            {([undefined, ...Object.keys(kinds)] as (Kind | undefined)[]).map((k) => (
              <Link
                key={k ?? "all"}
                href={withParams("/admin/requests", { ...keep, kind: k })}
                className={styles.tab}
                aria-current={f.kind === k ? "page" : undefined}
              >
                {k ? kinds[k] : "All"}
              </Link>
            ))}
          </nav>
          <form className={styles.formRow} style={{ flex: "1 1 420px" }} role="search">
            {f.kind && <input type="hidden" name="kind" value={f.kind} />}
            <label className={styles.control}>
              Status
              <select name="status" defaultValue={f.status ?? ""} className={styles.select}>
                <option value="">Any status</option>
                <option value="open">Open (needs action)</option>
                {statusOrder.map((s) => (
                  <option key={s} value={s}>
                    {statuses[s].label}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${styles.control} ${styles.search}`}>
              Search
              <input
                type="search"
                name="q"
                defaultValue={f.q}
                placeholder="Name, email, phone, area or message"
                className={styles.input}
              />
            </label>
            <button type="submit" className={`btn ${styles.btnSm}`}>
              Apply
            </button>
            {(f.status || f.q) && (
              <Link href={withParams("/admin/requests", { kind: f.kind })} className={`btn btn--ghost ${styles.btnSm}`}>
                Clear
              </Link>
            )}
          </form>
        </div>

        {rows.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Received</th>
                  <th scope="col">Name</th>
                  <th scope="col">Request</th>
                  <th scope="col">Area</th>
                  <th scope="col">Estimate</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className={`${styles.num} ${styles.muted}`}>{fmtDateTime(r.submitted_at)}</td>
                    <td>
                      {!r.seen_at && <span className={styles.unseen} aria-label="Unread" />}
                      <Link href={`/admin/requests/${r.id}`} className={styles.rowLink}>
                        {r.name}
                      </Link>
                      <div className={`${styles.muted} ${styles.small}`}>{r.phone ?? r.email ?? ""}</div>
                    </td>
                    <td>
                      {serviceTitle(r.service) ?? kindLabel(r.kind)}
                      {(r.service || r.source === "wordpress") && (
                        <div className={styles.kind}>
                          {[r.service && kindLabel(r.kind), r.source === "wordpress" && "old site"].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </td>
                    <td>{r.area ?? <span className={styles.muted}>—</span>}</td>
                    <td className={styles.num}>{fmtMoney(r.estimate)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No matching requests">{f.q || f.status ? "Try clearing the search or status filter." : "Nothing here yet."}</Empty>
        )}
        <Pager page={page} pages={pages} total={total} href={(p) => withParams("/admin/requests", { ...keep, page: p })} />
      </section>
    </>
  );
}
