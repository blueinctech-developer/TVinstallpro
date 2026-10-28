"use client";

import { useKeepForm } from "../../useKeepForm";
import type { Service } from "@/lib/content";
import type { Choice, PriceBook } from "@/lib/pricing";
import styles from "../../admin.module.css";
import { Msg } from "../settings/forms";
import { savePrices, saveServices, type SaveResult } from "./actions";

const groups: { key: keyof PriceBook; title: string }[] = [
  { key: "tvSizes", title: "TV size (base price)" },
  { key: "mounts", title: "Wall mount" },
  { key: "surfaces", title: "Wall surface (added)" },
  { key: "concealment", title: "Cable concealment" },
  { key: "addOns", title: "Add-ons (added)" },
  { key: "maintenance", title: "Extended maintenance (added)" },
];

const singles: { key: keyof PriceBook; label: string }[] = [
  { key: "fireplaceSurcharge", label: "Above a fireplace (added)" },
  { key: "takedownPrice", label: "Existing TV takedown" },
  { key: "deviceSetupPrice", label: "Device setup, per device" },
  { key: "devicesBehindPrice", label: "Device hidden behind the TV, per device" },
];

function Price({ name, value, label }: { name: string; value: number; label: string }) {
  return (
    <input
      className={styles.input}
      name={name}
      defaultValue={value.toFixed(2)}
      inputMode="decimal"
      aria-label={`${label} price in dollars`}
      style={{ width: 110, textAlign: "right" }}
      required
    />
  );
}

export function PricesForm({ p }: { p: PriceBook }) {
  const [state, action, pending] = useKeepForm<SaveResult>(savePrices, {});
  return (
    <form onSubmit={action} className={styles.stack}>
      {groups.map((g) => (
        <fieldset key={g.key} className={styles.panel} style={{ margin: 0, padding: 0 }}>
          <legend className="sr-only">{g.title}</legend>
          <div className={styles.panelHead}>
            <h2>{g.title}</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <tbody>
                {(p[g.key] as Choice[]).map((c) => (
                  <tr key={c.id}>
                    <td style={{ width: "100%" }}>
                      <input className={styles.input} name={`${g.key}.${c.id}.label`} defaultValue={c.label} aria-label="Label" style={{ width: "100%" }} />
                      {c.note && <div className={`${styles.muted} ${styles.small}`}>{c.note}</div>}
                    </td>
                    <td className={styles.num}>
                      $ <Price name={`${g.key}.${c.id}.price`} value={c.price} label={c.label} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </fieldset>
      ))}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Other prices</h2>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <tbody>
              {singles.map((s) => (
                <tr key={s.key}>
                  <td style={{ width: "100%" }}>{s.label}</td>
                  <td className={styles.num}>
                    $ <Price name={s.key} value={p[s.key] as number} label={s.label} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className={styles.formRow} style={{ position: "sticky", bottom: 0, padding: "12px 0", background: "var(--surface)" }}>
        <button type="submit" className={`btn ${styles.btnSm}`} disabled={pending} aria-busy={pending || undefined}>
          {pending ? "Saving…" : "Save prices"}
        </button>
        <Msg state={state} />
      </div>
    </form>
  );
}

export function ServicesForm({ services, hidden }: { services: Service[]; hidden: string[] }) {
  const [state, action, pending] = useKeepForm<SaveResult>(saveServices, {});
  return (
    <form onSubmit={action} className={styles.stack}>
      {services.map((s) => (
        <section key={s.slug} className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>{s.title}</h2>
            <label className={styles.formRow} style={{ alignItems: "center", fontWeight: 600, fontSize: "0.92rem" }}>
              <input type="checkbox" name={`${s.slug}.hidden`} defaultChecked={hidden.includes(s.slug)} style={{ width: 18, height: 18 }} />
              Hide from the website
            </label>
          </div>
          <div className={styles.panelBody + " " + styles.loginForm}>
            <label className={styles.control}>
              Name
              <input className={styles.input} name={`${s.slug}.title`} defaultValue={s.title} maxLength={80} />
            </label>
            <label className={styles.control}>
              One-line summary
              <input className={styles.input} name={`${s.slug}.short`} defaultValue={s.short} maxLength={200} />
            </label>
            <label className={styles.control}>
              Description
              <textarea className={styles.textarea} name={`${s.slug}.body`} defaultValue={s.body} maxLength={2000} />
            </label>
          </div>
        </section>
      ))}
      <div className={styles.formRow} style={{ position: "sticky", bottom: 0, padding: "12px 0", background: "var(--surface)" }}>
        <button type="submit" className={`btn ${styles.btnSm}`} disabled={pending} aria-busy={pending || undefined}>
          {pending ? "Saving…" : "Save services"}
        </button>
        <Msg state={state} />
      </div>
    </form>
  );
}
