"use client";

import { useKeepForm } from "../../../../useKeepForm";
import { useState } from "react";
import type { Field } from "@/lib/admin/collections";
import styles from "../../../../admin.module.css";
import { Msg } from "../../../settings/forms";
import { saveContent, type ContentResult } from "../../actions";

type Media = { id: number; url: string; alt: string; filename: string };

export function ConfirmSubmit({ label, message }: { label: string; message: string }) {
  return (
    <button type="submit" className={`btn btn--ghost ${styles.btnSm}`} onClick={(e) => !confirm(message) && e.preventDefault()}>
      {label}
    </button>
  );
}

/** Thumbnail picker over the media library: one image (radio) or several (checkbox). */
function MediaPicker({ name, media, multiple, value, disabled }: { name: string; media: Media[]; multiple?: boolean; value: number[]; disabled?: boolean }) {
  const [chosen, setChosen] = useState<number[]>(value);
  const toggle = (id: number) => setChosen((c) => (multiple ? (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]) : [id]));
  if (!media.length) return <p className={`${styles.muted} ${styles.small}`}>No images yet. Upload some in Media first.</p>;
  return (
    <div>
      {/* The chosen ids, in the order picked (the first photo leads on the website). */}
      {chosen.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      {!multiple && chosen.length > 0 && (
        <button type="button" className={`btn btn--ghost ${styles.btnSm}`} onClick={() => setChosen([])} disabled={disabled} style={{ marginBottom: 8 }}>
          Remove image
        </button>
      )}
      <div
        role="group"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8, maxHeight: 280, overflowY: "auto", padding: 4 }}
      >
        {media.map((m) => {
          const on = chosen.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              disabled={disabled}
              aria-pressed={on}
              title={m.alt || m.filename}
              style={{
                padding: 0,
                aspectRatio: "1",
                borderRadius: 10,
                overflow: "hidden",
                cursor: "pointer",
                border: on ? "3px solid var(--brand-strong)" : "1px solid var(--line)",
                position: "relative",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.alt || m.filename} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {on && multiple && (
                <span className={styles.navCount} style={{ position: "absolute", top: 4, right: 4 }}>
                  {chosen.indexOf(m.id) + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Editor({
  type,
  id,
  fields,
  values,
  media,
  services,
  readOnly,
  justSaved,
}: {
  type: string;
  id: string;
  fields: Field[];
  values: Record<string, unknown>;
  media: Media[];
  services: { slug: string; title: string }[];
  readOnly: boolean;
  justSaved: boolean;
}) {
  const [state, action, pending] = useKeepForm<ContentResult>(saveContent, justSaved ? { ok: "Saved." } : {});
  const v = (k: string) => (values[k] === null || values[k] === undefined ? "" : String(values[k]));

  return (
    <form onSubmit={action} className={styles.cols}>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="id" value={id} />
      <section className={styles.panel}>
        <div className={styles.panelBody + " " + styles.loginForm}>
          {fields
            .filter((f) => f.type !== "image" && f.type !== "images" && f.type !== "checkbox")
            .map((f) => (
              <label key={f.name} className={styles.control}>
                {f.label}
                {f.required && <span className="sr-only"> (required)</span>}
                {f.type === "markdown" ? (
                  <textarea
                    className={styles.textarea}
                    name={f.name}
                    defaultValue={v(f.name)}
                    rows={18}
                    disabled={readOnly}
                    style={{ fontFamily: "ui-monospace, Consolas, monospace", fontSize: "0.92rem" }}
                  />
                ) : f.type === "textarea" ? (
                  <textarea className={styles.textarea} name={f.name} defaultValue={v(f.name)} maxLength={f.max} required={f.required} disabled={readOnly} />
                ) : f.type === "service" ? (
                  <select className={styles.select} name={f.name} defaultValue={v(f.name)} disabled={readOnly}>
                    <option value="">None</option>
                    {services.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={styles.input}
                    name={f.name}
                    type={f.type === "number" ? "number" : "text"}
                    min={f.min}
                    max={f.type === "number" ? f.max : undefined}
                    maxLength={f.type === "number" ? undefined : f.max}
                    defaultValue={v(f.name)}
                    required={f.required}
                    disabled={readOnly}
                  />
                )}
                {(f.hint || f.type === "markdown") && (
                  <span className={`${styles.muted} ${styles.small}`} style={{ fontWeight: 500 }}>
                    {f.hint ?? "Markdown: ## heading, **bold**, *italic*, - list item, [link text](https://…). Paste image URLs from Media as ![description](URL)."}
                  </span>
                )}
              </label>
            ))}
        </div>
      </section>

      <div className={styles.stack}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Publish</h2>
          </div>
          <div className={styles.panelBody + " " + styles.loginForm}>
            <label className={styles.control}>
              Status
              <select className={styles.select} name="status" defaultValue={v("status") || "draft"} disabled={readOnly}>
                <option value="draft">Draft (not on the website)</option>
                <option value="published">Published</option>
              </select>
            </label>
            {fields
              .filter((f) => f.type === "checkbox")
              .map((f) => (
                <label key={f.name} className={styles.formRow} style={{ alignItems: "center", fontWeight: 600 }}>
                  <input type="checkbox" name={f.name} defaultChecked={values[f.name] === true} disabled={readOnly} style={{ width: 18, height: 18 }} />
                  {f.label}
                </label>
              ))}
            {!readOnly && (
              <button type="submit" className={`btn ${styles.btnSm}`} disabled={pending} aria-busy={pending || undefined}>
                {pending ? "Saving…" : "Save"}
              </button>
            )}
            <Msg state={state} />
          </div>
        </section>
        {fields
          .filter((f) => f.type === "image" || f.type === "images")
          .map((f) => (
            <section key={f.name} className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>{f.label}</h2>
              </div>
              <div className={styles.panelBody}>
                <MediaPicker
                  name={f.name}
                  media={media}
                  multiple={f.type === "images"}
                  disabled={readOnly}
                  value={f.type === "images" ? ((values[f.name] as number[] | undefined) ?? []) : values[f.name] ? [Number(values[f.name])] : []}
                />
              </div>
            </section>
          ))}
      </div>
    </form>
  );
}
