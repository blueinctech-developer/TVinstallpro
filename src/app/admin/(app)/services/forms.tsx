"use client";

import { useState } from "react";
import type { IconName } from "@/components/Icon";
import { Icon } from "@/components/Icon";
import type { Service } from "@/lib/content";
import type { Choice, PriceBook } from "@/lib/pricing";
import styles from "../../admin.module.css";
import { Msg } from "../settings/forms";
import { useKeepForm } from "../../useKeepForm";
import { savePrices, saveServices, type SaveResult } from "./actions";

const groups: { key: keyof PriceBook; title: string; add: string }[] = [
  { key: "tvSizes", title: "TV size (base price)", add: "Add a TV size" },
  { key: "mounts", title: "Wall mount", add: "Add a mount" },
  { key: "surfaces", title: "Wall surface (added)", add: "Add a wall surface" },
  { key: "concealment", title: "Cable concealment", add: "Add a concealment option" },
  { key: "addOns", title: "Add-ons (added)", add: "Add an add-on" },
  { key: "maintenance", title: "Extended maintenance (added)", add: "Add a maintenance plan" },
];

const singles: { key: keyof PriceBook; label: string }[] = [
  { key: "fireplaceSurcharge", label: "Above a fireplace (added)" },
  { key: "takedownPrice", label: "Existing TV takedown" },
  { key: "deviceSetupPrice", label: "Device setup, per device" },
  { key: "devicesBehindPrice", label: "Device hidden behind the TV, per device" },
];

const moneyStyle = { width: 110, textAlign: "right" } as const;

/** One price list. Rows keep a client key for React; the saved id travels in a hidden field (empty = new). */
function PriceGroup({ title, name, add, rows }: { title: string; name: string; add: string; rows: Choice[] }) {
  const [list, setList] = useState(() => rows.map((c, i) => ({ ...c, key: `s${i}` })));
  const [next, setNext] = useState(0);
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>{title}</h2>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <tbody>
            {list.map((c) => (
              <tr key={c.key}>
                <td style={{ width: "100%" }}>
                  <input type="hidden" name={`${name}.id`} value={c.id} />
                  <input type="hidden" name={`${name}.note`} value={c.note ?? ""} />
                  <input className={styles.input} name={`${name}.label`} defaultValue={c.label} aria-label="Option name" placeholder="Option name" style={{ width: "100%" }} required />
                  {c.note && <div className={`${styles.muted} ${styles.small}`}>{c.note}</div>}
                </td>
                <td className={styles.num}>
                  ${" "}
                  <input
                    className={styles.input}
                    name={`${name}.price`}
                    defaultValue={c.id ? c.price.toFixed(2) : ""}
                    inputMode="decimal"
                    placeholder="0.00"
                    aria-label={`${c.label || "New option"} price in dollars`}
                    style={moneyStyle}
                    required
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className={`btn btn--ghost ${styles.btnSm}`}
                    onClick={() => setList((l) => l.filter((x) => x.key !== c.key))}
                    aria-label={`Remove ${c.label || "this option"}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.panelBody} style={{ paddingTop: 12, paddingBottom: 12 }}>
        <button
          type="button"
          className={`btn btn--ghost ${styles.btnSm}`}
          onClick={() => {
            setList((l) => [...l, { id: "", label: "", price: 0, key: `n${next}` }]);
            setNext((n) => n + 1);
          }}
        >
          <Icon name="plus" size={16} /> {add}
        </button>
      </div>
    </section>
  );
}

export function PricesForm({ p }: { p: PriceBook }) {
  const [state, onSubmit, pending] = useKeepForm<SaveResult>(savePrices, {});
  return (
    <form onSubmit={onSubmit} className={styles.stack}>
      {groups.map((g) => (
        <PriceGroup key={g.key} name={g.key} title={g.title} add={g.add} rows={p[g.key] as Choice[]} />
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
                    ${" "}
                    <input
                      className={styles.input}
                      name={s.key}
                      defaultValue={(p[s.key] as number).toFixed(2)}
                      inputMode="decimal"
                      aria-label={`${s.label} price in dollars`}
                      style={moneyStyle}
                      required
                    />
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

type Media = { id: number; url: string; alt: string; filename: string };
type Row = Service & { key: string };

export function ServicesForm({ services, icons, media }: { services: Service[]; icons: IconName[]; media: Media[] }) {
  const [state, onSubmit, pending] = useKeepForm<SaveResult>(saveServices, {});
  const [list, setList] = useState<Row[]>(() => services.map((s) => ({ ...s, key: s.slug })));
  const [next, setNext] = useState(0);
  const addRow = () => {
    setList((l) => [...l, { slug: "", title: "", short: "", body: "", icon: "tools", image: "", legacyPath: "", custom: true, key: `n${next}` }]);
    setNext((n) => n + 1);
  };
  return (
    <form onSubmit={onSubmit} className={styles.stack}>
      {list.map((s, i) => (
        <section key={s.key} className={styles.panel}>
          <input type="hidden" name="slug" value={s.slug} />
          <div className={styles.panelHead}>
            <h2>{s.title || "New service"}</h2>
            <div className={styles.formRow} style={{ alignItems: "center" }}>
              <label className={styles.formRow} style={{ alignItems: "center", fontWeight: 600, fontSize: "0.92rem" }}>
                <input type="checkbox" name="hidden" value={i} defaultChecked={!!s.hidden} style={{ width: 18, height: 18 }} />
                Hide
              </label>
              {s.custom && (
                <button
                  type="button"
                  className={`btn btn--ghost ${styles.btnSm}`}
                  onClick={() => {
                    if (!s.slug || confirm(`Remove "${s.title}"? Past requests for it are kept. Press Save to confirm.`)) setList((l) => l.filter((x) => x.key !== s.key));
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <div className={styles.panelBody + " " + styles.loginForm}>
            <label className={styles.control}>
              Name
              <input className={styles.input} name="title" defaultValue={s.title} maxLength={80} required />
            </label>
            <label className={styles.control}>
              One-line summary
              <input className={styles.input} name="short" defaultValue={s.short} maxLength={200} required={s.custom} />
            </label>
            <label className={styles.control}>
              Description
              <textarea className={styles.textarea} name="body" defaultValue={s.body} maxLength={2000} />
            </label>
            {s.estimator ? (
              <>
                <input type="hidden" name="priceFrom" value="" />
                <p className={`${styles.muted} ${styles.small}`}>Priced by the estimator: see the TV mounting prices tab.</p>
              </>
            ) : (
              <label className={styles.control}>
                From price (optional)
                <input className={styles.input} name="priceFrom" defaultValue={s.priceFrom ?? ""} inputMode="decimal" placeholder="Leave empty to show “Quote”" style={{ maxWidth: 240 }} />
              </label>
            )}
            {s.custom ? (
              <>
                <label className={styles.control}>
                  Icon
                  <select className={styles.select} name="icon" defaultValue={s.icon} style={{ maxWidth: 240 }}>
                    {icons.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.control}>
                  Photo
                  <select className={styles.select} name="image" defaultValue={s.image}>
                    <option value="">Use the standard technician photo</option>
                    {media.map((m) => (
                      <option key={m.id} value={m.url}>
                        {m.alt || m.filename}
                      </option>
                    ))}
                  </select>
                  {!media.length && (
                    <span className={`${styles.muted} ${styles.small}`} style={{ fontWeight: 500 }}>
                      Upload photos in Media first.
                    </span>
                  )}
                </label>
              </>
            ) : (
              <>
                <input type="hidden" name="icon" value="" />
                <input type="hidden" name="image" value="" />
              </>
            )}
          </div>
        </section>
      ))}
      <div className={styles.formRow} style={{ position: "sticky", bottom: 0, padding: "12px 0", background: "var(--surface)" }}>
        <button type="button" className={`btn btn--ghost ${styles.btnSm}`} onClick={addRow}>
          <Icon name="plus" size={16} /> Add a service
        </button>
        <button type="submit" className={`btn ${styles.btnSm}`} disabled={pending} aria-busy={pending || undefined}>
          {pending ? "Saving…" : "Save services"}
        </button>
        <Msg state={state} />
      </div>
    </form>
  );
}
