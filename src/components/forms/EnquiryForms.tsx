"use client";

import { useState } from "react";
import { Choices, Field, Honeypot, SubmitOutcome } from "@/components/forms/Fields";
import { Icon } from "@/components/Icon";
import { submitEnquiry, type SubmitResult } from "@/lib/submit";
import styles from "./forms.module.css";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const phoneOk = (v: string) => v.replace(/\D/g, "").length >= 10;

type Values = Record<string, string>;

function useForm(initial: Values) {
  const [v, setV] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const bind = (k: string) => ({ value: v[k] ?? "", onChange: (x: string) => setV((s) => ({ ...s, [k]: x })), error: errors[k] });
  return { v, setV, errors, setErrors, busy, setBusy, result, setResult, bind };
}

function focusFirstError() {
  requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true'], fieldset[data-invalid] input")?.focus());
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button type="submit" className="btn" disabled={busy} aria-busy={busy || undefined}>
      {busy ? "Sending…" : label}
      <span className="btn-dot" aria-hidden="true">
        <Icon name="arrow" size={14} strokeWidth={2} />
      </span>
    </button>
  );
}

/* ---------- Contact ---------- */

export function ContactForm() {
  const f = useForm({ first: "", last: "", phone: "", email: "", area: "", message: "", website: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { v } = f;
    const err: Record<string, string> = {};
    if (!v.first.trim()) err.first = "Enter your first name.";
    if (!v.last.trim()) err.last = "Enter your last name.";
    if (!phoneOk(v.phone)) err.phone = "Enter a phone number we can reach you on.";
    if (!emailOk(v.email)) err.email = "Enter a valid email address.";
    if (!v.message.trim()) err.message = "Write a short message.";
    f.setErrors(err);
    if (Object.keys(err).length) return focusFirstError();

    f.setBusy(true);
    const summary = [`Name: ${v.first} ${v.last}`, `Phone: ${v.phone}`, `Email: ${v.email}`, `City / area: ${v.area || "—"}`, "", v.message].join("\n");
    const r = await submitEnquiry(
      { kind: "contact", name: `${v.first} ${v.last}`, email: v.email, phone: v.phone, summary, details: { area: v.area }, website: v.website },
      "Website enquiry",
    );
    f.setBusy(false);
    if (r.status === "invalid") f.setErrors(Object.fromEntries(r.fields.map((x) => [x, "Please check this field."])));
    else f.setResult(r);
  };

  if (f.result) {
    return <SubmitOutcome result={f.result} sentTitle="Message sent" sentText="Thanks for getting in touch. We'll reply as soon as we can." />;
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.formGrid}>
        <Field label="First name" name="first" required autoComplete="given-name" {...f.bind("first")} />
        <Field label="Last name" name="last" required autoComplete="family-name" {...f.bind("last")} />
        <Field label="Phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" {...f.bind("phone")} />
        <Field label="Email" name="email" type="email" inputMode="email" required autoComplete="email" {...f.bind("email")} />
        <Field label="City or neighbourhood" name="area" autoComplete="address-level2" className={styles.span2} {...f.bind("area")} />
        <Field label="Message" name="message" multiline rows={5} required className={styles.span2} {...f.bind("message")} />
        <Honeypot value={f.v.website} onChange={(x) => f.setV((s) => ({ ...s, website: x }))} />
      </div>
      <SubmitButton busy={f.busy} label="Send message" />
    </form>
  );
}

/* ---------- Partner With Us (fields mirror the live partnership form) ---------- */

const callTimes = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "anytime", label: "Any time" },
];

export function PartnerForm() {
  const f = useForm({
    first: "", last: "", street: "", street2: "", city: "", postal: "",
    preferred: "email", phone: "", email: "", time: "", comments: "", website: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { v } = f;
    const err: Record<string, string> = {};
    if (!v.first.trim()) err.first = "Enter your first name.";
    if (!v.last.trim()) err.last = "Enter your last name.";
    if (!phoneOk(v.phone)) err.phone = "Enter a phone number we can reach you on.";
    if (!emailOk(v.email)) err.email = "Enter a valid email address.";
    if (!v.time) err.time = "Choose the best time to call you.";
    if (!v.comments.trim()) err.comments = "Tell us about the partnership you have in mind.";
    f.setErrors(err);
    if (Object.keys(err).length) return focusFirstError();

    f.setBusy(true);
    const address = [v.street, v.street2, v.city, v.postal].filter(Boolean).join(", ");
    const summary = [
      `Name: ${v.first} ${v.last}`,
      `Phone: ${v.phone}`,
      `Email: ${v.email}`,
      `Preferred contact: ${v.preferred}`,
      `Best time to call: ${v.time}`,
      `Address: ${address || "—"}`,
      "",
      v.comments,
    ].join("\n");
    const r = await submitEnquiry(
      {
        kind: "partner",
        name: `${v.first} ${v.last}`,
        email: v.email,
        phone: v.phone,
        summary,
        details: { address, preferred: v.preferred, time: v.time },
        website: v.website,
      },
      "Partnership request",
    );
    f.setBusy(false);
    if (r.status === "invalid") f.setErrors(Object.fromEntries(r.fields.map((x) => [x, "Please check this field."])));
    else f.setResult(r);
  };

  if (f.result) {
    return <SubmitOutcome result={f.result} sentTitle="Request received" sentText="Thanks. We'll be in touch at the time you chose." />;
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <fieldset className={styles.group}>
        <legend>About you</legend>
        <div className={styles.formGrid}>
          <Field label="First name" name="first" required autoComplete="given-name" {...f.bind("first")} />
          <Field label="Last name" name="last" required autoComplete="family-name" {...f.bind("last")} />
          <Field label="Street address" name="street" autoComplete="address-line1" className={styles.span2} {...f.bind("street")} />
          <Field label="Address line 2" name="street2" autoComplete="address-line2" className={styles.span2} {...f.bind("street2")} />
          <Field label="City" name="city" autoComplete="address-level2" {...f.bind("city")} />
          <Field label="Postal code" name="postal" autoComplete="postal-code" {...f.bind("postal")} />
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>How can we reach you?</legend>
        <div className={styles.formGrid}>
          <Field label="Phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" {...f.bind("phone")} />
          <Field label="Email" name="email" type="email" inputMode="email" required autoComplete="email" {...f.bind("email")} />
          <div className={styles.span2}>
            <Choices legend="Preferred method of contact" name="preferred" columns={2} value={f.v.preferred}
              onChange={(x) => f.setV((s) => ({ ...s, preferred: x }))}
              options={[{ id: "email", label: "Email" }, { id: "phone", label: "Phone" }]} />
          </div>
          <div className={styles.span2}>
            <Choices legend="Best time to call you" name="time" required columns={4} value={f.v.time}
              onChange={(x) => f.setV((s) => ({ ...s, time: x }))} error={f.errors.time} options={callTimes} />
          </div>
        </div>
      </fieldset>

      <Field label="What's on your mind?" name="comments" multiline rows={6} required {...f.bind("comments")} />
      <Honeypot value={f.v.website} onChange={(x) => f.setV((s) => ({ ...s, website: x }))} />
      <SubmitButton busy={f.busy} label="Send partnership request" />
    </form>
  );
}
