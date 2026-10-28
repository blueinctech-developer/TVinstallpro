"use client";

import { useId, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { useSiteData } from "@/components/SiteData";
import type { SubmitResult } from "@/lib/submit";
import styles from "./forms.module.css";

type BaseProps = {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
};

type FieldProps = BaseProps & {
  type?: "text" | "email" | "tel" | "date";
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
};

export function Field({ label, name, value, onChange, error, hint, required, className, multiline, rows = 4, ...rest }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const common = {
    id,
    name,
    value,
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": [hintId, errId].filter(Boolean).join(" ") || undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    placeholder: rest.placeholder,
  };
  return (
    <div className={`${styles.field} ${className ?? ""}`} data-invalid={error ? "" : undefined}>
      <label htmlFor={id}>
        {label}
        {required && <span className={styles.req} aria-hidden="true"> *</span>}
      </label>
      {multiline ? (
        <textarea {...common} rows={rows} />
      ) : (
        <input {...common} type={rest.type ?? "text"} autoComplete={rest.autoComplete} inputMode={rest.inputMode} />
      )}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className={styles.error}>
          <Icon name="alert" size={14} /> {error}
        </p>
      )}
    </div>
  );
}

type Option = { id: string; label: string; meta?: string; detail?: string };

type ChoicesProps = {
  legend: string;
  name: string;
  options: Option[];
  error?: string;
  required?: boolean;
  columns?: 1 | 2 | 3 | 4;
  hint?: string;
} & (
  | { multiple?: false; value?: string; onChange: (v: string) => void }
  | { multiple: true; value: string[]; onChange: (v: string[]) => void }
);

/** Radio/checkbox cards built on native inputs (arrow-key and screen-reader friendly). */
export function Choices(props: ChoicesProps) {
  const { legend, name, options, error, required, columns = 2, hint } = props;
  const id = useId();
  const errId = error ? `${id}-err` : undefined;
  const isOn = (opt: string) => (props.multiple ? props.value.includes(opt) : props.value === opt);
  const toggle = (opt: string) => {
    if (props.multiple) {
      const v = props.value;
      props.onChange(v.includes(opt) ? v.filter((x) => x !== opt) : [...v, opt]);
    } else props.onChange(opt);
  };

  return (
    <fieldset className={styles.choices} aria-describedby={errId} data-invalid={error ? "" : undefined}>
      <legend>
        {legend}
        {required && <span className={styles.req} aria-hidden="true"> *</span>}
      </legend>
      {hint && <p className={styles.hint}>{hint}</p>}
      <div className={styles.choiceGrid} style={{ "--cols": columns } as React.CSSProperties}>
        {options.map((o) => (
          <label key={o.id} className={styles.choice} data-on={isOn(o.id) || undefined}>
            <input
              type={props.multiple ? "checkbox" : "radio"}
              name={name}
              value={o.id}
              checked={isOn(o.id)}
              onChange={() => toggle(o.id)}
              required={required && !props.multiple}
            />
            <span className={styles.mark} aria-hidden="true">
              <Icon name="check" size={14} strokeWidth={2.2} />
            </span>
            <span className={styles.choiceText}>
              <span className={styles.choiceLabel}>{o.label}</span>
              {o.detail && <span className={styles.choiceDetail}>{o.detail}</span>}
            </span>
            {o.meta && <span className={styles.choiceMeta}>{o.meta}</span>}
          </label>
        ))}
      </div>
      {error && (
        <p id={errId} className={styles.error}>
          <Icon name="alert" size={14} /> {error}
        </p>
      )}
    </fieldset>
  );
}

/** Hidden honeypot input: bots fill it, people never see it. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className={styles.honeypot} aria-hidden="true">
      <label>
        Website
        <input tabIndex={-1} autoComplete="off" name="website" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

/** Outcome of a submission. Success is shown only when the server confirmed delivery. */
export function SubmitOutcome({ result, sentTitle, sentText, children }: { result: SubmitResult | null; sentTitle: string; sentText: ReactNode; children?: ReactNode }) {
  const site = useSiteData().business;
  if (!result || result.status === "invalid") return null;
  if (result.status === "sent") {
    return (
      <div className={`${styles.outcome} ${styles.sent}`} role="status" tabIndex={-1}>
        <span className={styles.outcomeIcon}>
          <Icon name="check" size={22} strokeWidth={2} />
        </span>
        <h2>{sentTitle}</h2>
        <p>{sentText}</p>
        {children}
      </div>
    );
  }
  return (
    <div className={`${styles.outcome} ${styles.fallback}`} role="alert" tabIndex={-1}>
      <span className={styles.outcomeIcon}>
        <Icon name="alert" size={22} strokeWidth={2} />
      </span>
      <h2>We couldn&apos;t send that online</h2>
      <p>
        Nothing was lost. Send the same request by email (it&apos;s filled in for you), or reach us directly.
      </p>
      <div className={styles.outcomeActions}>
        <a href={result.mailto} className="btn">
          <Icon name="mail" size={16} /> Send by email
        </a>
        <a href={site.phoneHref} className="btn btn--ghost">
          <Icon name="phone" size={16} /> {site.phone}
        </a>
        <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
          <Icon name="whatsapp" size={16} /> WhatsApp
        </a>
      </div>
    </div>
  );
}
