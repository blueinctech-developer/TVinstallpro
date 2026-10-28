import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { requireUser } from "@/lib/admin/auth";
import { fmtDateTime, fmtDay, fmtMoney, serviceTitle, telHref, waHref } from "@/lib/admin/format";
import { getRequest, markSeen, type EventRow } from "@/lib/admin/requests";
import { roleAtLeast, statuses } from "@/lib/admin/vocab";
import styles from "../../../admin.module.css";
import { StatusBadge, kindLabel } from "../../../ui";
import { NoteForm, StatusForm } from "./forms";

export const metadata: Metadata = { title: "Request" };

const legacyForms: Record<number, string> = {
  1: "Book a Service (early TV form)",
  2: "Partnership Request Form",
  3: "Book TV Installation Service",
  7: "General Form (contact)",
  8: "Mantel Mount Installation Booking",
  10: "Samsung Frame TV Installation Booking",
  13: "Home Appliances Installations",
  14: "Wallpaper Works",
  15: "Gazebos & Sheds Installation",
};

// Website fields shown in "Request"; everything else is already in the summary text.
const websiteFields: [string, string][] = [
  ["area", "City / area"],
  ["address", "Address"],
  ["contact", "Preferred contact"],
  ["preferred", "Preferred contact"],
  ["time", "Best time to call"],
  ["date", "Preferred date"],
];

function eventText(e: EventRow) {
  if (e.type === "created") return "Submitted on the website";
  if (e.type === "imported") return e.body ?? "Imported from the old site";
  if (e.type === "status")
    return `Status: ${e.from_status ? statuses[e.from_status]?.label : "—"} → ${e.to_status ? statuses[e.to_status]?.label : "—"}`;
  return null;
}

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const data = await getRequest(id);
  if (!data) notFound();
  const { req: r, events, related } = data;
  if (!r.seen_at) await markSeen(r.id);
  const canEdit = roleAtLeast(user.role, "staff");
  const d = r.details as Record<string, unknown>;
  const legacy = r.source === "wordpress";
  // Old-site answers in the form's order. Name, phone and email are already under Contact.
  // Gravity Forms appends the price to choices ("Concrete (+$20)|20"); the label already says it.
  const legacyFields = legacy && Array.isArray(d.answers)
    ? (d.answers as [string, string][])
        .filter(([k]) => !/^(first name|last name|phone|email|your phone|your email address|your name \((first|last)\))$/i.test(k))
        .map(([k, v]) => [k, v.replace(/\|-?\d+(\.\d+)?$/, "")] as const)
    : [];

  return (
    <>
      <div>
        <Link href="/admin/requests" className={styles.back}>
          <Icon name="arrowLeft" size={16} /> Requests
        </Link>
        <div className={styles.head}>
          <div>
            <h1 className={styles.title}>
              {r.name} <span className="ghost">· {serviceTitle(r.service) ?? kindLabel(r.kind)}</span>
            </h1>
            <p className={styles.sub}>
              {kindLabel(r.kind)} request #{r.id} · received {fmtDateTime(r.submitted_at)}
              {legacy && ` · imported from the old site (${legacyForms[r.legacy_form_id ?? 0] ?? `form ${r.legacy_form_id}`}, entry ${r.legacy_entry_id})`}
            </p>
          </div>
          <StatusBadge status={r.status} />
        </div>
      </div>

      <div className={styles.cols}>
        <div className={styles.stack}>
          <section className={styles.panel} aria-labelledby="contact-h">
            <div className={styles.panelHead}>
              <h2 id="contact-h">Contact</h2>
              {r.customer_id && (
                <Link href={`/admin/customers/${r.customer_id}`} className={styles.back} style={{ margin: 0 }}>
                  Customer history <Icon name="arrow" size={14} />
                </Link>
              )}
            </div>
            <div className={styles.panelBody}>
              <dl className={styles.dl}>
                <dt>Name</dt>
                <dd>{r.name}</dd>
                <dt>Phone</dt>
                <dd>{r.phone || "—"}</dd>
                <dt>Email</dt>
                <dd>{r.email || "—"}</dd>
                <dt>Area</dt>
                <dd>{r.area || "—"}</dd>
              </dl>
              <div className={styles.contactLinks} style={{ marginTop: 16 }}>
                {r.phone && (
                  <>
                    <a className={`btn ${styles.btnSm}`} href={telHref(r.phone)}>
                      <Icon name="phone" size={16} /> Call
                    </a>
                    <a className={`btn btn--ghost ${styles.btnSm}`} href={waHref(r.phone)} target="_blank" rel="noopener noreferrer">
                      <Icon name="whatsapp" size={16} /> WhatsApp
                    </a>
                  </>
                )}
                {r.email && (
                  <a className={`btn btn--ghost ${styles.btnSm}`} href={`mailto:${r.email}`}>
                    <Icon name="mail" size={16} /> Email
                  </a>
                )}
              </div>
            </div>
          </section>

          <section className={styles.panel} aria-labelledby="req-h">
            <div className={styles.panelHead}>
              <h2 id="req-h">Request</h2>
            </div>
            <div className={styles.panelBody}>
              <dl className={styles.dl}>
                <dt>Type</dt>
                <dd>{kindLabel(r.kind)}</dd>
                {r.service && (
                  <>
                    <dt>Service</dt>
                    <dd>{serviceTitle(r.service)}</dd>
                  </>
                )}
                {r.preferred_date && (
                  <>
                    <dt>Preferred date</dt>
                    <dd>{fmtDay(r.preferred_date)}</dd>
                  </>
                )}
                {r.estimate && (
                  <>
                    <dt>Online estimate</dt>
                    <dd>
                      <strong className={styles.num}>{fmtMoney(r.estimate)}</strong>{" "}
                      <span className={`${styles.muted} ${styles.small}`}>calculated by the form; confirm the final price on site</span>
                    </dd>
                  </>
                )}
                {!legacy &&
                  websiteFields
                    .filter(([k]) => typeof d[k] === "string" && (d[k] as string).trim() && k !== "date" && k !== "area")
                    .map(([k, label]) => (
                      <div key={k} style={{ display: "contents" }}>
                        <dt>{label}</dt>
                        <dd>{String(d[k])}</dd>
                      </div>
                    ))}
              </dl>
              {!legacy && r.summary && (
                <>
                  <h3 style={{ fontSize: "1rem", margin: "20px 0 8px" }}>What they sent</h3>
                  <pre className={styles.message}>{r.summary}</pre>
                </>
              )}
              {legacy && (
                <>
                  <h3 style={{ fontSize: "1rem", margin: "20px 0 8px" }}>Original form answers</h3>
                  <dl className={styles.dl}>
                    {legacyFields.map(([k, v]) => (
                      <div key={k} style={{ display: "contents" }}>
                        <dt>{k}</dt>
                        <dd className={styles.message}>{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
            </div>
          </section>
        </div>

        <div className={styles.stack}>
          <section className={styles.panel} aria-labelledby="status-h">
            <div className={styles.panelHead}>
              <h2 id="status-h">Status</h2>
            </div>
            <div className={styles.panelBody}>
              {canEdit ? (
                <StatusForm id={r.id} current={r.status} />
              ) : (
                <p className={styles.muted}>Your account is read-only.</p>
              )}
            </div>
          </section>

          <section className={styles.panel} aria-labelledby="activity-h">
            <div className={styles.panelHead}>
              <h2 id="activity-h">Notes & activity</h2>
            </div>
            <div className={styles.panelBody}>
              {canEdit && <NoteForm id={r.id} />}
              <ol className={styles.timeline} style={{ marginTop: canEdit ? 24 : 0 }}>
                {[...events].reverse().map((e) => (
                  <li key={e.id} data-type={e.type}>
                    <span className={styles.when}>
                      {fmtDateTime(e.created_at)}
                      {e.actor_name ? ` · ${e.actor_name}` : ""}
                    </span>
                    {e.type === "note" ? <p className={styles.message}>{e.body}</p> : <span>{eventText(e)}</span>}
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {related.length > 0 && (
            <section className={styles.panel} aria-labelledby="rel-h">
              <div className={styles.panelHead}>
                <h2 id="rel-h">Other requests from them</h2>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <tbody>
                    {related.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link href={`/admin/requests/${o.id}`} className={styles.rowLink}>
                            {serviceTitle(o.service) ?? kindLabel(o.kind)}
                          </Link>
                          <div className={`${styles.muted} ${styles.small}`}>{fmtDateTime(o.submitted_at)}</div>
                        </td>
                        <td>
                          <StatusBadge status={o.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
