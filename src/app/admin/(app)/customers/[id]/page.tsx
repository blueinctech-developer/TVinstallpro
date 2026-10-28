import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { requireUser } from "@/lib/admin/auth";
import { fmtDate, fmtDateTime, fmtMoney, serviceTitle, telHref } from "@/lib/admin/format";
import { getCustomer } from "@/lib/admin/requests";
import styles from "../../../admin.module.css";
import { StatusBadge, kindLabel } from "../../../ui";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const data = await getCustomer(id);
  if (!data) notFound();
  const { customer: c, requests, similar } = data;

  return (
    <>
      <div>
        <Link href="/admin/customers" className={styles.back}>
          <Icon name="arrowLeft" size={16} /> Customers
        </Link>
        <div className={styles.head}>
          <div>
            <h1 className={styles.title}>{c.name}</h1>
            <p className={styles.sub}>
              Customer since {fmtDate(c.created_at)} · {requests.length} {requests.length === 1 ? "request" : "requests"}
            </p>
          </div>
          {c.phone && (
            <a className={`btn ${styles.btnSm}`} href={telHref(c.phone)}>
              <Icon name="phone" size={16} /> Call
            </a>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <p className={styles.notice} data-kind="warn">
          <Icon name="alert" size={18} />
          <span>
            Possible duplicate:{" "}
            {similar.map((s, i) => (
              <span key={s.id}>
                {i > 0 && ", "}
                <Link href={`/admin/customers/${s.id}`} className={styles.rowLink} style={{ position: "static" }}>
                  {s.name}
                </Link>{" "}
                ({s.phone ?? s.email ?? "no contact"})
              </span>
            ))}{" "}
            has the same name with different contact details. Check before treating them as one person.
          </span>
        </p>
      )}

      <div className={styles.cols}>
        <section className={styles.panel} aria-labelledby="hist-h">
          <div className={styles.panelHead}>
            <h2 id="hist-h">Request history</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Received</th>
                  <th scope="col">Request</th>
                  <th scope="col">Estimate</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className={`${styles.num} ${styles.muted}`}>{fmtDateTime(r.submitted_at)}</td>
                    <td>
                      <Link href={`/admin/requests/${r.id}`} className={styles.rowLink}>
                        {serviceTitle(r.service) ?? kindLabel(r.kind)}
                      </Link>
                      {r.source === "wordpress" && <div className={styles.kind}>old site</div>}
                    </td>
                    <td className={styles.num}>{fmtMoney(r.estimate)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="det-h">
          <div className={styles.panelHead}>
            <h2 id="det-h">Details</h2>
          </div>
          <div className={styles.panelBody}>
            <dl className={styles.dl}>
              <dt>Phone</dt>
              <dd>{c.phone ?? "—"}</dd>
              <dt>Email</dt>
              <dd>{c.email ? <a href={`mailto:${c.email}`} className={styles.rowLink} style={{ position: "static" }}>{c.email}</a> : "—"}</dd>
              <dt>Area</dt>
              <dd>{c.area ?? "—"}</dd>
            </dl>
          </div>
        </section>
      </div>
    </>
  );
}
