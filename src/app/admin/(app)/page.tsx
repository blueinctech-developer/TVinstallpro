import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { requireUser } from "@/lib/admin/auth";
import { fmtAgo, fmtDay, serviceTitle } from "@/lib/admin/format";
import { overview } from "@/lib/admin/requests";
import { kinds, statusOrder, statuses, type Kind, type Status } from "@/lib/admin/vocab";
import styles from "../admin.module.css";
import { Empty, StatusBadge, kindLabel } from "../ui";

export const metadata: Metadata = { title: "Overview" };

export default async function Overview({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const { denied } = await searchParams;
  const { counts, recent, upcoming } = await overview();

  const sum = (pred: (c: (typeof counts)[number]) => boolean) => counts.filter(pred).reduce((n, c) => n + c.n, 0);
  const by = (s: Status) => sum((c) => c.status === s);
  const cell = (k: Kind, s: Status) => counts.find((c) => c.kind === k && c.status === s)?.n ?? 0;
  const shownStatuses = statusOrder.filter((s) => by(s) > 0);

  const tiles = [
    { label: "New", note: "Not yet handled", n: by("new"), href: "/admin/requests?status=new", accent: true },
    { label: "Awaiting reply", note: "Contacted or quoted", n: by("contacted") + by("quoted"), href: "/admin/requests?status=open" },
    { label: "Scheduled", note: "Appointment agreed", n: by("scheduled"), href: "/admin/requests?status=scheduled" },
    { label: "Completed", note: "Jobs done", n: by("completed"), href: "/admin/requests?status=completed" },
  ];

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>
            Overview <span className="ghost">· {user.name.split(" ")[0]}</span>
          </h1>
          <p className={styles.sub}>Requests from the website and the old site, in one place.</p>
        </div>
        <Link href="/admin/requests" className={`btn ${styles.btnSm}`}>
          All requests
        </Link>
      </div>

      {denied && (
        <p className={styles.notice} data-kind="warn" role="status">
          <Icon name="alert" size={18} /> That page or action needs a higher role than your account has. Ask an administrator if you
          need access.
        </p>
      )}

      <section className={styles.tiles} aria-label="Request counts">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className={styles.tile} data-accent={t.accent && t.n > 0 ? "" : undefined}>
            <span className={styles.figure}>{t.n}</span>
            <span className={styles.tileLabel}>{t.label}</span>
            <span className={styles.tileNote}>{t.note}</span>
          </Link>
        ))}
      </section>

      <div className={styles.cols}>
        <section className={styles.panel} aria-labelledby="recent-h">
          <div className={styles.panelHead}>
            <h2 id="recent-h">Latest requests</h2>
            <Link href="/admin/requests" className={styles.back} style={{ margin: 0 }}>
              View all <Icon name="arrow" size={14} />
            </Link>
          </div>
          {recent.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Request</th>
                    <th scope="col">Received</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id}>
                      <td>
                        {!r.seen_at && <span className={styles.unseen} aria-label="Unread" />}
                        <Link href={`/admin/requests/${r.id}`} className={styles.rowLink}>
                          {r.name}
                        </Link>
                      </td>
                      <td>{serviceTitle(r.service) ?? kindLabel(r.kind)}</td>
                      <td className={`${styles.muted} ${styles.nowrap}`}>{fmtAgo(r.submitted_at)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="No requests yet">New bookings and enquiries from the website will appear here.</Empty>
          )}
        </section>

        <div className={styles.stack}>
          <section className={styles.panel} aria-labelledby="upcoming-h">
            <div className={styles.panelHead}>
              <h2 id="upcoming-h">Upcoming</h2>
            </div>
            {upcoming.length ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <tbody>
                    {upcoming.map((r) => (
                      <tr key={r.id}>
                        <td className={styles.num}>{fmtDay(r.preferred_date)}</td>
                        <td>
                          <Link href={`/admin/requests/${r.id}`} className={styles.rowLink}>
                            {r.name}
                          </Link>
                          <div className={`${styles.muted} ${styles.small}`}>{r.area ?? ""}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="Nothing scheduled">Requests marked Scheduled with a date show here.</Empty>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="sum-h">
            <div className={styles.panelHead}>
              <h2 id="sum-h">By status</h2>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Status</th>
                    {(Object.keys(kinds) as Kind[]).map((k) => (
                      <th key={k} scope="col" className={styles.num}>
                        {kinds[k]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shownStatuses.map((s) => (
                    <tr key={s}>
                      <th scope="row" style={{ fontWeight: 600, color: "var(--ink)" }}>
                        <Link href={`/admin/requests?status=${s}`} className={styles.rowLink}>
                          {statuses[s].label}
                        </Link>
                      </th>
                      {(Object.keys(kinds) as Kind[]).map((k) => (
                        <td key={k} className={styles.num}>
                          {cell(k, s) || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
