"use client";

import { useKeepForm } from "../../useKeepForm";
import { useActionState } from "react";
import { Icon } from "@/components/Icon";
import type { Business, EmailSettings, Tracking } from "@/lib/site-defaults";
import styles from "../../admin.module.css";
import { saveBusiness, saveEmail, saveTracking, sendTestEmail, type SettingsResult } from "./actions";

export function Msg({ state }: { state: SettingsResult }) {
  if (state.error)
    return (
      <p className={styles.msg} data-kind="error" role="alert">
        <Icon name="alert" size={16} /> {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p className={styles.msg} data-kind="ok" role="status">
        <Icon name="check" size={16} /> {state.ok}
      </p>
    );
  return null;
}

function Text({ label, name, value, hint, type = "text", ...rest }: { label: string; name: string; value: string | number; hint?: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={styles.control}>
      {label}
      <input className={styles.input} name={name} type={type} defaultValue={value} {...rest} />
      {hint && <span className={`${styles.muted} ${styles.small}`} style={{ fontWeight: 500 }}>{hint}</span>}
    </label>
  );
}

function Save({ pending, label = "Save" }: { pending: boolean; label?: string }) {
  return (
    <button type="submit" className={`btn ${styles.btnSm}`} disabled={pending} aria-busy={pending || undefined}>
      {pending ? "Saving…" : label}
    </button>
  );
}

export function BusinessForm({ b }: { b: Business }) {
  const [state, action, pending] = useKeepForm<SettingsResult>(saveBusiness, {});
  return (
    <form onSubmit={action} className={styles.loginForm}>
      <Text label="Business name" name="name" value={b.name} required />
      <Text label="Phone" name="phone" value={b.phone} type="tel" required hint="Shown in the header, footer and every call button." />
      <Text label="WhatsApp link" name="whatsapp" value={b.whatsapp} type="url" hint="e.g. https://wa.me/14183347761 or your wa.link address." />
      <Text label="Public email" name="email" value={b.email} type="email" required />
      <Text label="Service area" name="area" value={b.area} required />
      <label className={styles.control}>
        Short description
        <textarea className={styles.textarea} name="description" defaultValue={b.description} maxLength={300} />
        <span className={`${styles.muted} ${styles.small}`} style={{ fontWeight: 500 }}>Used by search engines and link previews.</span>
      </label>
      <div className={styles.formRow}>
        <Text label="Warranty (months)" name="warrantyMonths" value={b.warrantyMonths} type="number" min={0} max={120} required />
        <Text label="Components connected in a standard install" name="componentsIncluded" value={b.componentsIncluded} type="number" min={0} max={20} required />
      </div>
      <Save pending={pending} />
      <Msg state={state} />
    </form>
  );
}

export function TrackingForm({ t }: { t: Tracking }) {
  const [state, action, pending] = useKeepForm<SettingsResult>(saveTracking, {});
  return (
    <form onSubmit={action} className={styles.loginForm}>
      <div className={styles.formRow}>
        <Text label="Google Analytics 4 ID" name="ga4Id" value={t.ga4Id} placeholder="G-XXXXXXXXXX" hint="The old site used G-VVKZG2Q0QN." />
        <Text label="Google Tag Manager ID" name="gtmId" value={t.gtmId} placeholder="GTM-XXXXXXX" hint="Leave empty if you only use Analytics." />
      </div>
      <label className={styles.control}>
        Code in the page head
        <textarea className={styles.textarea} name="headCode" defaultValue={t.headCode} rows={6} spellCheck={false} style={{ fontFamily: "ui-monospace, Consolas, monospace" }}
          placeholder="<!-- e.g. a verification meta tag or pixel script -->" />
      </label>
      <label className={styles.control}>
        Code before the end of the page
        <textarea className={styles.textarea} name="bodyCode" defaultValue={t.bodyCode} rows={6} spellCheck={false} style={{ fontFamily: "ui-monospace, Consolas, monospace" }}
          placeholder="<!-- e.g. a chat widget -->" />
      </label>
      <p className={styles.notice} data-kind="warn">
        <Icon name="alert" size={18} /> Code here runs on every public page for every visitor. Only paste snippets from services you trust;
        a broken snippet can break the site.
      </p>
      <Save pending={pending} />
      <Msg state={state} />
    </form>
  );
}

export function EmailForm({ e }: { e: EmailSettings }) {
  const [state, action, pending] = useKeepForm<SettingsResult>(saveEmail, {});
  return (
    <form onSubmit={action} className={styles.loginForm}>
      <Text label="Send new-request alerts to" name="alertsTo" value={e.alertsTo} hint="One or more addresses, separated by commas." />
      <div className={styles.formRow}>
        <Text label="Sender name" name="fromName" value={e.fromName} required />
        <Text label="Sender address" name="fromEmail" value={e.fromEmail} type="email" required hint="Must be allowed by your SMTP provider." />
      </div>
      <label className={styles.formRow} style={{ alignItems: "center", fontWeight: 600 }}>
        <input type="checkbox" name="confirmToCustomer" defaultChecked={e.confirmToCustomer} style={{ width: 20, height: 20 }} />
        Also email customers a copy of their request
      </label>
      <Save pending={pending} />
      <Msg state={state} />
    </form>
  );
}

export function TestEmailButton({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState<SettingsResult>(sendTestEmail, {});
  return (
    <form action={action} className={styles.loginForm}>
      <button type="submit" className={`btn btn--ghost ${styles.btnSm}`} disabled={pending || disabled} aria-busy={pending || undefined}>
        {pending ? "Sending…" : "Send me a test email"}
      </button>
      <Msg state={state} />
    </form>
  );
}
