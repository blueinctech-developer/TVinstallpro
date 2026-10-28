import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/admin/auth";
import { smtpConfigured, smtpSummary } from "@/lib/email";
import { fmtDateTime } from "@/lib/admin/format";
import { db } from "@/lib/db";
import { getEmailSettings, getSiteData, getTracking } from "@/lib/site-data";
import styles from "../../admin.module.css";
import { BusinessForm, EmailForm, TestEmailButton, TrackingForm } from "./forms";

export const metadata: Metadata = { title: "Settings" };

const tabs = [
  { id: "business", label: "Business" },
  { id: "tracking", label: "Tracking & code" },
  { id: "email", label: "Email" },
] as const;

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireUser("admin");
  const { tab: t } = await searchParams;
  const tab = tabs.find((x) => x.id === t)?.id ?? "business";

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>
            Settings <span className="ghost">{tabs.find((x) => x.id === tab)!.label.toLowerCase()}</span>
          </h1>
          <p className={styles.sub}>Administrators only. Changes to business details and tracking appear on the website within a minute.</p>
        </div>
      </div>
      <nav className={styles.tabs} aria-label="Settings sections" style={{ justifySelf: "start" }}>
        {tabs.map((x) => (
          <Link key={x.id} href={`/admin/settings?tab=${x.id}`} className={styles.tab} aria-current={tab === x.id ? "page" : undefined}>
            {x.label}
          </Link>
        ))}
      </nav>
      {tab === "business" && <Business />}
      {tab === "tracking" && <TrackingTab />}
      {tab === "email" && <EmailTab />}
    </>
  );
}

async function Business() {
  const { business } = await getSiteData();
  return (
    <section className={styles.panel} style={{ maxWidth: 760 }}>
      <div className={styles.panelBody}>
        <BusinessForm b={business} />
      </div>
    </section>
  );
}

async function TrackingTab() {
  return (
    <section className={styles.panel} style={{ maxWidth: 900 }}>
      <div className={styles.panelBody}>
        <TrackingForm t={await getTracking()} />
      </div>
    </section>
  );
}

async function EmailTab() {
  const [settings, log] = await Promise.all([
    getEmailSettings(),
    (await db()).query<{ id: number; to_addr: string; subject: string; status: string; error: string | null; created_at: Date }>(
      "select id, to_addr, subject, status, error, created_at from email_log order by created_at desc limit 25",
    ),
  ]);
  const smtp = smtpSummary();
  return (
    <div className={styles.cols}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Who gets email</h2>
        </div>
        <div className={styles.panelBody}>
          <EmailForm e={settings} />
        </div>
      </section>
      <div className={styles.stack}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Sending server</h2>
          </div>
          <div className={styles.panelBody} style={{ display: "grid", gap: 12 }}>
            {smtp ? (
              <p>
                <span className={styles.badge} data-tone="good">Connected</span> <span className={styles.small}>{smtp}</span>
              </p>
            ) : (
              <p className={styles.small}>
                <span className={styles.badge} data-tone="muted">Not set up</span> Add <code>SMTP_HOST</code>, <code>SMTP_PORT</code>,{" "}
                <code>SMTP_USER</code> and <code>SMTP_PASS</code> in Vercel → Settings → Environment Variables, then redeploy. For Amazon SES,
                use its SMTP credentials and host <code>email-smtp.&lt;region&gt;.amazonaws.com</code>, port 587.
              </p>
            )}
            <TestEmailButton disabled={!smtpConfigured()} />
          </div>
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Email log</h2>
          </div>
          {log.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <tbody>
                  {log.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <span className={styles.badge} data-tone={m.status === "sent" ? "good" : "muted"}>
                          {m.status === "sent" ? "Sent" : m.status === "failed" ? "Failed" : "Not sent"}
                        </span>
                      </td>
                      <td>
                        {m.subject}
                        <div className={`${styles.muted} ${styles.small}`}>
                          to {m.to_addr} · {fmtDateTime(m.created_at)}
                          {m.error ? ` · ${m.error}` : ""}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.panelBody + " " + styles.muted}>No email sent yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
