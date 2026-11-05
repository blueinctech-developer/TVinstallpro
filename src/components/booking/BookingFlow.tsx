"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Choices, Field, Honeypot, SubmitOutcome } from "@/components/forms/Fields";
import { Icon } from "@/components/Icon";
import { useSiteData } from "@/components/SiteData";
import { servicePriceLabel } from "@/lib/site-defaults";
import { emptyTvSelection, estimateLines, estimateNotes, estimateTotal, helperSizeIds, money, type Choice, type TvSelection } from "@/lib/pricing";
import { submitEnquiry, type SubmitResult } from "@/lib/submit";
import styles from "./BookingFlow.module.css";

type StepId =
  | "service"
  | "size"
  | "mount"
  | "wall"
  | "conceal"
  | "addons"
  | "takedown"
  | "devices"
  | "another"
  | "maintenance"
  | "details"
  | "review";

const TITLES: Record<StepId, string> = {
  service: "What do you need installed?",
  size: "What size is your TV?",
  mount: "What type of wall mount do you want?",
  wall: "Your wall and cords",
  conceal: "How should we hide the cords?",
  addons: "Would you like to add any products or services?",
  takedown: "Does your current TV need to be taken down?",
  devices: "Any devices to set up?",
  another: "Would you like to install another TV?",
  maintenance: "Would you like an extra care maintenance plan?",
  details: "Your details",
  review: "Review your request",
};

type Details = { first: string; last: string; phone: string; email: string; area: string; contact: string; date: string; notes: string };
const emptyDetails: Details = { first: "", last: "", phone: "", email: "", area: "", contact: "phone", date: "", notes: "" };

const yesNo = [
  { id: "no", label: "No" },
  { id: "yes", label: "Yes" },
];
const counts = [
  { id: "0", label: "None" },
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3", label: "3+" },
];

/** "+$40", or the option's note when it has no price ("Quoted separately"). */
const extra = (c: Choice) => (c.price ? `+${money(c.price)}${c.note ? ` ${c.note}` : ""}` : c.note);

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const phoneOk = (v: string) => v.replace(/\D/g, "").length >= 10;

export function BookingFlow({ initialService }: { initialService?: string }) {
  // Services, prices and contact details as saved in the admin.
  const { business: site, services, prices } = useSiteData();
  const { tvSizes, mounts, fireplaceSurcharge, surfaces, addOns, takedownPrice, deviceSetupPrice, devicesBehindPrice, extraHelperPrice, maintenance } = prices;
  // "No concealment" is now the Yes/No question, so an older saved list may still carry it.
  const concealment = prices.concealment.filter((c) => c.id !== "none");
  const serviceBySlug = (slug?: string | null) => services.find((x) => x.slug === slug);
  const preset = serviceBySlug(initialService)?.slug ?? "";
  const [service, setService] = useState(preset);
  const [tv, setTv] = useState<TvSelection>({ ...emptyTvSelection, takedown: false });
  const [d, setD] = useState<Details>(emptyDetails);
  const [honey, setHoney] = useState("");
  const [step, setStep] = useState<StepId>(preset ? (preset === "tv-mounting" ? "size" : "details") : "service");
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const isTv = service === "tv-mounting";
  const steps: StepId[] = isTv
    ? [
        "service",
        "size",
        "mount",
        "wall",
        ...(tv.hideCords ? (["conceal"] as const) : []),
        "addons",
        "takedown",
        "devices",
        "another",
        "maintenance",
        "details",
        "review",
      ]
    : ["service", "details", "review"];
  const index = steps.indexOf(step);
  const svc = serviceBySlug(service);
  const lines = useMemo(() => estimateLines(tv, prices), [tv, prices]);
  const total = estimateTotal(tv, prices);
  const notes = useMemo(() => estimateNotes(tv, prices), [tv, prices]);

  // Move focus to the new step's heading (not on first load).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.closest("section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const set = <K extends keyof TvSelection>(k: K, v: TvSelection[K]) => setTv((s) => ({ ...s, [k]: v }));
  const setDetail = (k: keyof Details) => (v: string) => setD((s) => ({ ...s, [k]: v }));

  const validate = (id: StepId): Record<string, string> => {
    const e: Record<string, string> = {};
    if (id === "service" && !service) e.service = "Choose a service to continue.";
    if (id === "size" && !tv.size) e.size = "Choose your TV size.";
    if (id === "mount" && !tv.mount) e.mount = "Choose a mount, or tell us you already have one.";
    if (id === "wall") {
      if (tv.fireplace === undefined) e.fireplace = "Let us know if it's above a fireplace.";
      if (!tv.surface) e.surface = "Choose the wall surface (or “I don't know”).";
      if (tv.hideCords === undefined) e.hideCords = "Let us know if you'd like the cords hidden.";
    }
    if (id === "conceal" && !concealment.some((c) => c.id === tv.conceal)) e.conceal = "Choose how you'd like the cords hidden.";
    if (id === "maintenance" && !tv.maintenance) e.maintenance = "Choose a plan, or no additional coverage.";
    if (id === "details") {
      if (!d.first.trim()) e.first = "Enter your first name.";
      if (!d.last.trim()) e.last = "Enter your last name.";
      if (!phoneOk(d.phone)) e.phone = "Enter a phone number we can reach you on.";
      if (!emailOk(d.email)) e.email = "Enter a valid email address.";
      if (!d.area.trim()) e.area = "Enter your city or neighbourhood.";
      if (!isTv && !d.notes.trim()) e.notes = "Tell us a little about the job.";
    }
    return e;
  };

  const go = (target: StepId, direction: "fwd" | "back") => {
    setErrors({});
    setDir(direction);
    setStep(target);
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) {
      // focus the first invalid control
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true'], fieldset[data-invalid] input")?.focus());
      return;
    }
    if (step === "service") {
      go(isTv ? "size" : "details", "fwd");
      return;
    }
    go(steps[index + 1], "fwd");
  };

  const back = () => index > 0 && go(steps[index - 1], "back");

  const summary = () => {
    const out = [
      `Service: ${svc?.title ?? service}`,
      `Name: ${d.first} ${d.last}`,
      `Phone: ${d.phone}`,
      `Email: ${d.email}`,
      `City / area: ${d.area}`,
      `Preferred contact: ${d.contact}`,
      `Preferred date: ${d.date || "Flexible"}`,
    ];
    if (isTv) {
      out.push("", "Estimate:", ...lines.map((l) => `  ${l.label}: ${money(l.amount)}`), `  Estimated total: ${money(total)}`);
      if (notes.length) out.push("", "To confirm:", ...notes.map((n) => `  ${n}`));
      if (tv.anotherTv) out.push("  Also has another TV to install");
    }
    if (d.notes.trim()) out.push("", `Notes: ${d.notes.trim()}`);
    return out.join("\n");
  };

  const send = async () => {
    setBusy(true);
    const r = await submitEnquiry(
      {
        kind: "booking",
        name: `${d.first} ${d.last}`.trim(),
        email: d.email,
        phone: d.phone,
        summary: summary(),
        details: { service, area: d.area, contact: d.contact, date: d.date, notes: d.notes, tv: isTv ? tv : undefined, estimate: isTv ? total : undefined },
        website: honey,
      },
      `Booking request: ${svc?.title ?? "Service"}`,
      site.email,
    );
    setBusy(false);
    if (r.status === "invalid") {
      setErrors(Object.fromEntries(r.fields.map((f) => [f, "Please check this field."])));
      go("details", "back");
      return;
    }
    setResult(r);
  };

  if (result) {
    return (
      <div className={styles.done}>
        <SubmitOutcome
          result={result}
          sentTitle="Request received"
          sentText={
            <>
              Thanks, {d.first}. We&apos;ll contact you by {d.contact} to confirm a time{isTv ? " and the final price" : " and a quote"}. This
              isn&apos;t a confirmed appointment yet.
            </>
          }
        >
          <Link href="/" className="btn btn--ghost">
            Back to home
          </Link>
        </SubmitOutcome>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <div className={styles.flow}>
      <section className={styles.main} aria-labelledby="step-title">
        {/* Progress along the axis of the form */}
        <div className={styles.progress} aria-hidden="true">
          <span style={{ transform: `scaleX(${(index + 1) / steps.length})` }} />
        </div>
        <p className={styles.stepCount}>
          Step {index + 1} of {steps.length}
          {svc && step !== "service" ? ` · ${svc.title}` : ""}
        </p>
        <h2 id="step-title" ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
          {TITLES[step]}
        </h2>

        {errorCount > 0 && (
          <p className={styles.errorSummary} role="alert">
            <Icon name="alert" size={16} /> {errorCount === 1 ? "One thing needs your attention." : `${errorCount} things need your attention.`}
          </p>
        )}

        <form
          key={step}
          className={styles.step}
          data-dir={dir}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step === "review") send();
            else next();
          }}
        >
          {step === "service" && (
            <Choices
              legend="Service"
              name="service"
              required
              columns={2}
              value={service}
              onChange={setService}
              error={errors.service}
              options={services.map((s) => ({
                id: s.slug,
                label: s.title,
                detail: s.short,
                meta: servicePriceLabel(s, prices),
              }))}
            />
          )}

          {step === "size" && (
            <Choices legend="TV size" name="size" required columns={2} value={tv.size} onChange={(v) => set("size", v)} error={errors.size}
              options={tvSizes.map((c) => ({
                id: c.id,
                label: c.label,
                meta: money(c.price),
                detail: helperSizeIds.includes(c.id) ? `Extra helper +${money(extraHelperPrice)}` : c.note,
              }))} />
          )}

          {step === "mount" && (
            <Choices legend="Wall mount" name="mount" required columns={2} value={tv.mount} onChange={(v) => set("mount", v)} error={errors.mount}
              hint="Fixed sits flat, tilting angles down, full motion pulls out and swivels."
              options={mounts.map((c) => ({ id: c.id, label: c.label, detail: c.price ? undefined : c.note, meta: c.price ? money(c.price) : undefined }))} />
          )}

          {step === "wall" && (
            <>
              <Choices legend="Is the TV going above a fireplace?" name="fireplace" required columns={2}
                value={tv.fireplace === undefined ? undefined : tv.fireplace ? "yes" : "no"}
                onChange={(v) => set("fireplace", v === "yes")} error={errors.fireplace}
                options={yesNo.map((o) => ({ ...o, meta: o.id === "yes" ? `+${money(fireplaceSurcharge)}` : undefined }))} />
              <Choices legend="What surface will the TV be mounted on?" name="surface" required columns={2} value={tv.surface} onChange={(v) => set("surface", v)} error={errors.surface}
                options={surfaces.map((c) => ({ id: c.id, label: c.label, detail: c.note, meta: c.price ? `+${money(c.price)}` : undefined }))} />
              <Choices legend="Would you like the cords hidden?" name="hideCords" required columns={2}
                value={tv.hideCords === undefined ? undefined : tv.hideCords ? "yes" : "no"}
                onChange={(v) => set("hideCords", v === "yes")} error={errors.hideCords}
                options={yesNo} />
            </>
          )}

          {step === "conceal" && (
            <Choices legend="Cord concealment" name="conceal" required columns={1} value={tv.conceal} onChange={(v) => set("conceal", v)} error={errors.conceal}
              options={concealment.map((c) => ({ id: c.id, label: c.label, detail: c.price ? undefined : c.note, meta: c.price ? `+${money(c.price)}` : undefined }))} />
          )}

          {step === "addons" && (
            <>
              <p className={styles.optional}>All optional. Skip ahead if you don&apos;t need any.</p>
              <Choices legend="Add-ons" name="addons" multiple columns={2} value={tv.addOns} onChange={(v) => set("addOns", v)}
                options={addOns.map((c) => ({ id: c.id, label: c.label, meta: extra(c) }))} />
            </>
          )}

          {step === "takedown" && (
            <Choices legend="Existing TV takedown" name="takedown" columns={2}
              value={tv.takedown ? "yes" : "no"}
              onChange={(v) => set("takedown", v === "yes")}
              options={yesNo.map((o) => ({ ...o, meta: o.id === "yes" ? `+${money(takedownPrice)}` : undefined }))} />
          )}

          {step === "devices" && (
            <>
              <Choices legend="Would you like to set up any devices (cable box, gaming system…)?" name="setup" columns={4}
                value={String(tv.deviceSetup)} onChange={(v) => set("deviceSetup", Number(v))}
                hint={`+${money(deviceSetupPrice)} per device`} options={counts} />
              <Choices legend="Would you like to install any devices behind the TV (Apple TV, cable box…)?" name="behind" columns={4}
                value={String(tv.devicesBehind)} onChange={(v) => set("devicesBehind", Number(v))}
                hint={`+${money(devicesBehindPrice)} per device`} options={counts} />
            </>
          )}

          {step === "another" && (
            <Choices legend="Another TV" name="another" columns={2}
              value={tv.anotherTv ? "yes" : "no"} onChange={(v) => set("anotherTv", v === "yes")}
              hint="We'll include it when we confirm your booking." options={yesNo} />
          )}

          {step === "maintenance" && (
            <Choices legend="Extra care maintenance plan" name="maintenance" required columns={3}
              value={tv.maintenance} onChange={(v) => set("maintenance", v)} error={errors.maintenance}
              options={maintenance.map((c) => ({ id: c.id, label: c.label, meta: c.price ? `+${money(c.price)}` : undefined }))} />
          )}

          {step === "details" && (
            <div className={styles.fields}>
              <Field label="First name" name="first" required autoComplete="given-name" value={d.first} onChange={setDetail("first")} error={errors.first} />
              <Field label="Last name" name="last" required autoComplete="family-name" value={d.last} onChange={setDetail("last")} error={errors.last} />
              <Field label="Phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" value={d.phone} onChange={setDetail("phone")} error={errors.phone} />
              <Field label="Email" name="email" type="email" inputMode="email" required autoComplete="email" value={d.email} onChange={setDetail("email")} error={errors.email} />
              <Field label="City or neighbourhood" name="area" required autoComplete="address-level2" value={d.area} onChange={setDetail("area")} error={errors.area} className={styles.wide} />
              <div className={styles.wide}>
                <Choices legend="Best way to reach you" name="contact" columns={2} value={d.contact} onChange={setDetail("contact")}
                  options={[{ id: "phone", label: "Phone" }, { id: "email", label: "Email" }]} />
              </div>
              <Field label="Preferred date" name="date" type="date" value={d.date} onChange={setDetail("date")}
                hint="Optional. We'll confirm the actual time with you." className={styles.wide} />
              <Field label={isTv ? "Anything we should know?" : "Tell us about the job"} name="notes" multiline required={!isTv}
                value={d.notes} onChange={setDetail("notes")} error={errors.notes} className={styles.wide}
                placeholder={isTv ? "TV model, parking, access…" : "What needs installing, sizes, rooms, timing…"} />
              <Honeypot value={honey} onChange={setHoney} />
            </div>
          )}

          {step === "review" && (
            <div className={styles.review}>
              <dl>
                <div>
                  <dt>Service</dt>
                  <dd>{svc?.title}</dd>
                  <button type="button" className={styles.edit} onClick={() => go("service", "back")}>Edit</button>
                </div>
                {isTv && (
                  <div>
                    <dt>Installation</dt>
                    <dd>
                      <ul className={styles.reviewLines}>
                        {lines.map((l) => (
                          <li key={l.label}>
                            <span>{l.label}</span>
                            <span>{money(l.amount)}</span>
                          </li>
                        ))}
                        {notes.map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                        {tv.anotherTv && <li>Also has another TV to install</li>}
                      </ul>
                    </dd>
                    <button type="button" className={styles.edit} onClick={() => go("size", "back")}>Edit</button>
                  </div>
                )}
                <div>
                  <dt>Contact</dt>
                  <dd>
                    {d.first} {d.last} · {d.phone} · {d.email}
                    <br />
                    {d.area}
                    {d.date ? ` · preferred ${d.date}` : ""}
                  </dd>
                  <button type="button" className={styles.edit} onClick={() => go("details", "back")}>Edit</button>
                </div>
                {d.notes.trim() && (
                  <div>
                    <dt>Notes</dt>
                    <dd>{d.notes}</dd>
                    <button type="button" className={styles.edit} onClick={() => go("details", "back")}>Edit</button>
                  </div>
                )}
              </dl>
              <p className={styles.disclaimer}>
                This is a request, not a confirmed appointment. {isTv ? "Your estimate is based on the options you chose; " : ""}
                we&apos;ll contact you to confirm a time{isTv ? " and the final price" : " and a quote"}. By sending, you agree we may contact you about this request.
              </p>
            </div>
          )}

          <div className={styles.nav}>
            {index > 0 ? (
              <button type="button" className="btn btn--ghost" onClick={back}>
                <Icon name="arrowLeft" size={16} /> Back
              </button>
            ) : (
              <span />
            )}
            <button type="submit" className="btn" disabled={busy} aria-busy={busy || undefined}>
              {step === "review" ? (busy ? "Sending…" : "Send request") : "Continue"}
              <span className="btn-dot" aria-hidden="true">
                <Icon name="arrow" size={14} strokeWidth={2} />
              </span>
            </button>
          </div>
        </form>
      </section>

      {/* Phones: the running total stays visible while choosing (the full breakdown is below the form). */}
      {isTv && step !== "service" && (
        <div className={`${styles.mobileTotal} on-dark`} aria-hidden="true">
          <span>Estimated total</span>
          <strong>{money(total)}</strong>
          <a href="#estimate" tabIndex={-1}>
            Breakdown
          </a>
        </div>
      )}

      {/* Live estimate */}
      <aside id="estimate" className={`${styles.summary} on-dark`} aria-label="Your estimate">
        <div className={styles.summaryInner}>
          <p className={styles.summaryService}>{svc ? svc.title : "Choose a service"}</p>
          {isTv ? (
            <>
              <ul className={styles.lines}>
                {lines.length ? (
                  lines.map((l) => (
                    <li key={l.label}>
                      <span>{l.label}</span>
                      <span>{money(l.amount)}</span>
                    </li>
                  ))
                ) : (
                  <li className={styles.empty}>Your options appear here as you choose them.</li>
                )}
              </ul>
              <p className={styles.total} aria-live="polite">
                <span>Estimated total</span>
                <strong>{money(total)}</strong>
              </p>
              <p className={styles.note}>Estimate only, confirmed by your technician before work begins.</p>
            </>
          ) : (
            <p className={styles.note}>
              {svc ? "We'll quote this job after you send your request." : "TV mounting has an instant estimate; other services are quoted."}
            </p>
          )}
          <p className={styles.help}>
            Prefer to talk? <a href={site.phoneHref}>{site.phone}</a>
          </p>
        </div>
      </aside>
    </div>
  );
}
