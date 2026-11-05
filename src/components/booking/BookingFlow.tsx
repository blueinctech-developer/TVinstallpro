"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Field, Honeypot, SubmitOutcome } from "@/components/forms/Fields";
import { Icon } from "@/components/Icon";
import { useSiteData } from "@/components/SiteData";
import { emptyTvSelection, estimateLines, estimateNotes, estimateTotal, money, type Choice, type TvSelection } from "@/lib/pricing";
import { submitEnquiry, type SubmitResult } from "@/lib/submit";
import { OptionCards, type Option } from "./OptionCards";
import styles from "./BookingFlow.module.css";

/*
 * One question per screen. A single-choice answer moves straight on; prices stay out of the way
 * until the review, where the customer sees one estimate (with an optional breakdown).
 */

type StepId =
  | "service"
  | "size"
  | "mount"
  | "fireplace"
  | "surface"
  | "cords"
  | "conceal"
  | "addons"
  | "takedown"
  | "deviceSetup"
  | "devicesBehind"
  | "another"
  | "maintenance"
  | "details"
  | "review";

const QUESTIONS: Record<StepId, { title: string; help?: string }> = {
  service: { title: "What can we help you with?", help: "Choose a service to get started." },
  size: { title: "How big is your TV?", help: "Measured corner to corner. Not sure? Pick the closest." },
  mount: { title: "Which wall mount would you like?", help: "We bring the mount, or use the one you have." },
  fireplace: { title: "Is the TV going above a fireplace?" },
  surface: { title: "What's the wall made of?", help: "So we arrive with the right anchors and tools." },
  cords: { title: "Would you like the cords hidden?", help: "For a clean wall with no cables in sight." },
  conceal: { title: "How should we hide them?" },
  addons: { title: "Anything else while we're there?", help: "Optional. Pick as many as you like, or skip." },
  takedown: { title: "Does a TV need to come down first?" },
  deviceSetup: { title: "Any devices to set up?", help: "Cable box, games console, streaming box…" },
  devicesBehind: { title: "Any devices to hide behind the TV?", help: "An Apple TV or cable box, tucked out of sight." },
  another: { title: "Is there another TV to install?", help: "We'll plan it into the same visit." },
  maintenance: { title: "Add an extra care plan?", help: "Extended cover in case anything needs adjusting later." },
  details: { title: "How can we reach you?", help: "We'll call or email to confirm a time that suits you." },
  review: { title: "Everything look right?" },
};

/* Plain-language help for the built-in options (options added in the admin simply show their name). */
const SIZE_HINTS: Record<string, string> = {
  "up-to-31": "Bedroom or kitchen TV",
  "32-60": "The most common living-room size",
  "61-79": "Large living-room TV",
  "80-plus": "Home-theatre size",
  "90-100": "Two technicians for the lift",
};
const MOUNT_HINTS: Record<string, string> = {
  fixed: "Sits flat, close to the wall",
  tilting: "Angles down to cut glare",
  "full-motion": "Pulls out and swivels",
  own: "We'll use the mount you have",
  help: "We'll recommend one on site",
};
const SURFACE_HINTS: Record<string, string> = {
  "metal-studs": "Standard in apartment buildings",
  unknown: "No problem, we'll check on the day",
};
const CONCEAL_HINTS: Record<string, string> = {
  channel: "Cables run inside the wall through an existing channel",
  external: "A slim paintable cover running down the wall",
  help: "We'll suggest the best option for your wall",
};
const MAINTENANCE_HINTS: Record<string, string> = {
  "1y": "One year of free adjustments",
  "2y": "Two years of free adjustments",
  none: "Our standard installation warranty still applies",
};

const yesNo: Option[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];
const counts: Option[] = [
  { id: "0", label: "None" },
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3", label: "3+" },
];

type Details = { first: string; last: string; phone: string; email: string; area: string; contact: string; date: string; notes: string };
const emptyDetails: Details = { first: "", last: "", phone: "", email: "", area: "", contact: "phone", date: "", notes: "" };

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const phoneOk = (v: string) => v.replace(/\D/g, "").length >= 10;

const STORE = "tvip-booking-v2";
const ADVANCE_MS = 280;

const stepsFor = (isTv: boolean, tv: TvSelection): StepId[] =>
  isTv
    ? [
        "service",
        "size",
        "mount",
        "fireplace",
        "surface",
        "cords",
        ...(tv.hideCords ? (["conceal"] as const) : []),
        "addons",
        "takedown",
        "deviceSetup",
        "devicesBehind",
        "another",
        "maintenance",
        "details",
        "review",
      ]
    : ["service", "details", "review"];

const choiceLabel = (list: Choice[], id?: string) => list.find((c) => c.id === id)?.label;
const countLabel = (n: number) => (n === 0 ? "None" : n >= 3 ? "3+" : String(n));

export function BookingFlow({ initialService }: { initialService?: string }) {
  const { business: site, services, prices } = useSiteData();
  const { tvSizes, mounts, surfaces, addOns, maintenance } = prices;
  // "No concealment" is the Yes/No question now, so an older saved price list may still carry it.
  const concealment = prices.concealment.filter((c) => c.id !== "none");
  const serviceBySlug = (slug?: string | null) => services.find((x) => x.slug === slug);
  const preset = serviceBySlug(initialService)?.slug ?? "";

  const [service, setService] = useState(preset);
  const [tv, setTv] = useState<TvSelection>(emptyTvSelection);
  const [answered, setAnswered] = useState<Partial<Record<StepId, boolean>>>({});
  const [d, setD] = useState<Details>(emptyDetails);
  const [step, setStep] = useState<StepId>(preset ? (preset === "tv-mounting" ? "size" : "details") : "service");
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [honey, setHoney] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const advancing = useRef<number | null>(null);
  /** set while changing one answer from the review, so the flow can jump back there */
  const [editing, setEditing] = useState(false);
  const restored = useRef(false);

  const isTv = service === "tv-mounting";
  const steps = stepsFor(isTv, tv);
  const index = Math.max(0, steps.indexOf(step));
  const svc = serviceBySlug(service);
  const lines = useMemo(() => estimateLines(tv, prices), [tv, prices]);
  const notes = useMemo(() => estimateNotes(tv, prices), [tv, prices]);
  const total = estimateTotal(tv, prices);

  /* ---------- Keep answers through a refresh (this tab only) ---------- */
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? "null");
      if (saved && saved.service && (!preset || saved.service === preset) && serviceBySlug(saved.service)) {
        setService(saved.service);
        setTv({ ...emptyTvSelection, ...saved.tv });
        setAnswered(saved.answered ?? {});
        setD({ ...emptyDetails, ...saved.d });
        if (saved.step) setStep(saved.step);
      }
    } catch {
      /* storage unavailable: start fresh */
    }
    restored.current = true;
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    try {
      if (result?.status === "sent") sessionStorage.removeItem(STORE);
      else sessionStorage.setItem(STORE, JSON.stringify({ service, tv, answered, d, step }));
    } catch {
      /* ignore */
    }
  }, [service, tv, answered, d, step, result]);

  useEffect(() => () => {
    if (advancing.current) window.clearTimeout(advancing.current);
  }, []);

  /* ---------- Moving between questions ---------- */
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    // Only scroll when the question has moved out of view (long answer lists on phones).
    const top = sectionRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0 || top > window.innerHeight * 0.6) sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const go = (target: StepId, direction: "fwd" | "back") => {
    if (advancing.current) window.clearTimeout(advancing.current);
    advancing.current = null;
    setErrors({});
    setDir(direction);
    setStep(target);
    if (target === "review") setEditing(false);
  };

  const nextAfter = (from: StepId, nextIsTv = isTv, nextTv = tv, nowAnswered = answered) => {
    const list = stepsFor(nextIsTv, nextTv);
    const following = list.slice(list.indexOf(from) + 1);
    // Changing one answer from the review: go back there, unless the change opened a question not yet answered.
    if (editing) {
      const open = following.find((id) => id !== "review" && id !== "details" && id !== "addons" && !nowAnswered[id]);
      return open ?? "review";
    }
    return following[0] ?? "review";
  };

  const edit = (target: StepId) => {
    setEditing(true);
    go(target, "back");
  };

  /** Record a single-choice answer, show it as chosen for a moment, then move on. */
  const answer = (from: StepId, update: (s: TvSelection) => TvSelection) => {
    const nextTv = update(tv);
    const nowAnswered = { ...answered, [from]: true };
    setTv(nextTv);
    setAnswered(nowAnswered);
    if (advancing.current) window.clearTimeout(advancing.current);
    advancing.current = window.setTimeout(() => go(nextAfter(from, isTv, nextTv, nowAnswered), "fwd"), ADVANCE_MS);
  };

  const pickService = (slug: string) => {
    if (slug !== service) {
      setTv(emptyTvSelection);
      setAnswered({});
      setEditing(false);
    }
    setService(slug);
    if (advancing.current) window.clearTimeout(advancing.current);
    advancing.current = window.setTimeout(() => go(slug === "tv-mounting" ? "size" : "details", "fwd"), ADVANCE_MS);
  };

  const back = () => index > 0 && go(steps[index - 1], "back");

  const validateDetails = () => {
    const e: Record<string, string> = {};
    if (!d.first.trim()) e.first = "Enter your first name.";
    if (!d.last.trim()) e.last = "Enter your last name.";
    if (!phoneOk(d.phone)) e.phone = "Enter a phone number we can reach you on.";
    if (!emailOk(d.email)) e.email = "Enter a valid email address.";
    if (!d.area.trim()) e.area = "Enter your city or neighbourhood.";
    if (!isTv && !d.notes.trim()) e.notes = "Tell us a little about the job.";
    return e;
  };

  const canContinue = (id: StepId) => {
    if (id === "addons" || id === "details" || id === "review") return true;
    if (id === "service") return !!service;
    return !!answered[id];
  };

  const next = () => {
    if (step === "details") {
      const e = validateDetails();
      setErrors(e);
      if (Object.keys(e).length) {
        requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
        return;
      }
    }
    const nowAnswered = { ...answered, [step]: true };
    if (step === "addons" || step === "details") setAnswered(nowAnswered);
    if (!canContinue(step)) return;
    go(nextAfter(step, isTv, tv, nowAnswered), "fwd");
  };

  /* ---------- What the customer has told us so far (no prices) ---------- */
  const answers: { step: StepId; label: string; value: string }[] = [];
  if (isTv) {
    const a = (s: StepId, label: string, value?: string) => value && answered[s] && answers.push({ step: s, label, value });
    a("size", "TV size", choiceLabel(tvSizes, tv.size));
    a("mount", "Mount", choiceLabel(mounts, tv.mount));
    a("fireplace", "Above a fireplace", tv.fireplace ? "Yes" : "No");
    a("surface", "Wall", choiceLabel(surfaces, tv.surface));
    a("cords", "Hidden cords", tv.hideCords ? choiceLabel(concealment, tv.conceal) ?? "Yes" : "No");
    a(
      "addons",
      "Extras",
      tv.addOns.length
        ? tv.addOns.map((id) => (id === "other" && tv.otherAddOn?.trim() ? tv.otherAddOn.trim() : choiceLabel(addOns, id))).filter(Boolean).join(", ")
        : "None",
    );
    a("takedown", "Take down a TV", tv.takedown ? "Yes" : "No");
    a("deviceSetup", "Devices to set up", countLabel(tv.deviceSetup));
    a("devicesBehind", "Devices behind the TV", countLabel(tv.devicesBehind));
    a("another", "Another TV", tv.anotherTv ? "Yes" : "No");
    a("maintenance", "Care plan", choiceLabel(maintenance, tv.maintenance));
  }

  /* ---------- Sending ---------- */
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
      out.push("", "Answers:", ...answers.map((x) => `  ${x.label}: ${x.value}`));
      out.push("", "Estimate:", ...lines.map((l) => `  ${l.label}: ${money(l.amount)}`), `  Estimated total: ${money(total)}`);
      if (notes.length) out.push("", "To confirm:", ...notes.map((n) => `  ${n}`));
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
          sentTitle="You're booked in"
          sentText={
            <>
              Thanks, {d.first}. We&apos;ll {d.contact === "email" ? "email" : "call"} you shortly to confirm a time
              {isTv ? " and your final price" : " and a quote"}.
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

  const setDetail = (k: keyof Details) => (v: string) => setD((s) => ({ ...s, [k]: v }));
  const q = QUESTIONS[step];
  const progress = steps.length > 1 ? index / (steps.length - 1) : 0;
  const showNext = step === "details" || step === "review" || step === "addons" || canContinue(step);
  const image = svc ? svc.cardImage || svc.image : undefined;
  // A running total once there's something to add up; the review shows the full estimate instead.
  const showRunning = isTv && total > 0 && step !== "review";

  /* Option lists for each question. */
  const opts = (list: Choice[], hints: Record<string, string> = {}): Option[] =>
    list.map((c) => ({ id: c.id, label: c.label, hint: hints[c.id] ?? (c.price ? undefined : c.note) }));

  return (
    <div className={styles.flow}>
      <section ref={sectionRef} className={styles.main} aria-labelledby="step-title">
        {/* Top bar: back, progress, and (on phones) the chosen service */}
        <div className={styles.top}>
          {index > 0 ? (
            <button type="button" className={styles.back} onClick={back}>
              <Icon name="arrowLeft" size={16} /> Back
            </button>
          ) : (
            <span />
          )}
          <div
            className={styles.progress}
            role="progressbar"
            aria-label="Booking progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <span style={{ transform: `scaleX(${Math.max(progress, 0.04)})` }} />
          </div>
        </div>

        {svc && step !== "service" && (
          <div className={styles.chip}>
            {image && (
              <span className={styles.chipImage}>
                <Image src={image} alt="" fill sizes="56px" />
              </span>
            )}
            <span className={styles.chipText}>
              <span>{svc.title}</span>
              {showRunning && (
                <span className={styles.chipTotal} aria-live="polite">
                  Estimate so far <strong>{money(total)}</strong>
                </span>
              )}
            </span>
            <button type="button" className={styles.chipChange} onClick={() => go("service", "back")}>
              Change
            </button>
          </div>
        )}

        <div key={step} className={styles.step} data-dir={dir}>
          <h2 id="step-title" ref={headingRef} tabIndex={-1} className={styles.question}>
            {step === "details" && !isTv && svc ? "Tell us about the job" : q.title}
          </h2>
          {q.help && step !== "details" && <p className={styles.help}>{q.help}</p>}
          {step === "details" && (
            <p className={styles.help}>{isTv ? q.help : "Describe the job and we'll come back with a quote."}</p>
          )}

          {Object.keys(errors).length > 0 && (
            <p className={styles.errorSummary} role="alert">
              <Icon name="alert" size={16} />
              {Object.keys(errors).length === 1 ? "One thing needs your attention." : `${Object.keys(errors).length} things need your attention.`}
            </p>
          )}

          <div className={styles.body}>
            {step === "service" && (
              <OptionCards
                labelledBy="step-title"
                layout="photo"
                value={service}
                onPick={pickService}
                options={services.map((s) => ({
                  id: s.slug,
                  label: s.title,
                  hint: s.short,
                  image: s.cardImage || s.image,
                  tag: s.estimator ? "Instant estimate" : "Free quote",
                }))}
              />
            )}

            {step === "size" && (
              <OptionCards labelledBy="step-title" layout="list" value={answered.size ? tv.size : undefined}
                onPick={(v) => answer("size", (s) => ({ ...s, size: v }))} options={opts(tvSizes, SIZE_HINTS)} />
            )}

            {step === "mount" && (
              <OptionCards labelledBy="step-title" value={answered.mount ? tv.mount : undefined}
                onPick={(v) => answer("mount", (s) => ({ ...s, mount: v }))} options={opts(mounts, MOUNT_HINTS)} />
            )}

            {step === "fireplace" && (
              <OptionCards labelledBy="step-title" value={answered.fireplace ? (tv.fireplace ? "yes" : "no") : undefined}
                onPick={(v) => answer("fireplace", (s) => ({ ...s, fireplace: v === "yes" }))}
                options={yesNo} />
            )}

            {step === "surface" && (
              <OptionCards labelledBy="step-title" value={answered.surface ? tv.surface : undefined}
                onPick={(v) => answer("surface", (s) => ({ ...s, surface: v }))} options={opts(surfaces, SURFACE_HINTS)} />
            )}

            {step === "cords" && (
              <OptionCards labelledBy="step-title" value={answered.cords ? (tv.hideCords ? "yes" : "no") : undefined}
                onPick={(v) => answer("cords", (s) => ({ ...s, hideCords: v === "yes" }))}
                options={[
                  { id: "yes", label: "Yes, hide them", hint: "Clean wall, no visible cables" },
                  { id: "no", label: "No thanks", hint: "Cables hang below the TV" },
                ]} />
            )}

            {step === "conceal" && (
              <OptionCards labelledBy="step-title" layout="list" value={answered.conceal ? tv.conceal : undefined}
                onPick={(v) => answer("conceal", (s) => ({ ...s, conceal: v }))} options={opts(concealment, CONCEAL_HINTS)} />
            )}

            {step === "addons" && (
              <>
                <OptionCards labelledBy="step-title" multiple value={tv.addOns}
                  onPick={(v) => setTv((s) => ({ ...s, addOns: v }))}
                  options={addOns.map((c) => ({ id: c.id, label: c.label, hint: c.id === "other" ? "Tell us below" : undefined }))} />
                {tv.addOns.includes("other") && (
                  <Field label="What else would you like done?" name="otherAddOn" value={tv.otherAddOn ?? ""}
                    onChange={(v) => setTv((s) => ({ ...s, otherAddOn: v }))} placeholder="e.g. mount a second soundbar, hang a mirror" />
                )}
              </>
            )}

            {step === "takedown" && (
              <OptionCards labelledBy="step-title" value={answered.takedown ? (tv.takedown ? "yes" : "no") : undefined}
                onPick={(v) => answer("takedown", (s) => ({ ...s, takedown: v === "yes" }))}
                options={[
                  { id: "yes", label: "Yes", hint: "We'll take the old one down first" },
                  { id: "no", label: "No", hint: "The wall is ready" },
                ]} />
            )}

            {step === "deviceSetup" && (
              <OptionCards labelledBy="step-title" layout="pills" value={answered.deviceSetup ? String(tv.deviceSetup) : undefined}
                onPick={(v) => answer("deviceSetup", (s) => ({ ...s, deviceSetup: Number(v) }))} options={counts} />
            )}

            {step === "devicesBehind" && (
              <OptionCards labelledBy="step-title" layout="pills" value={answered.devicesBehind ? String(tv.devicesBehind) : undefined}
                onPick={(v) => answer("devicesBehind", (s) => ({ ...s, devicesBehind: Number(v) }))} options={counts} />
            )}

            {step === "another" && (
              <OptionCards labelledBy="step-title" value={answered.another ? (tv.anotherTv ? "yes" : "no") : undefined}
                onPick={(v) => answer("another", (s) => ({ ...s, anotherTv: v === "yes" }))} options={yesNo} />
            )}

            {step === "maintenance" && (
              <OptionCards labelledBy="step-title" layout="list" value={answered.maintenance ? tv.maintenance : undefined}
                onPick={(v) => answer("maintenance", (s) => ({ ...s, maintenance: v }))} options={opts(maintenance, MAINTENANCE_HINTS)} />
            )}

            {step === "details" && (
              <form
                id="details-form"
                className={styles.fields}
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  next();
                }}
              >
                <Field label="First name" name="first" required autoComplete="given-name" value={d.first} onChange={setDetail("first")} error={errors.first} />
                <Field label="Last name" name="last" required autoComplete="family-name" value={d.last} onChange={setDetail("last")} error={errors.last} />
                <Field label="Phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" value={d.phone} onChange={setDetail("phone")} error={errors.phone} />
                <Field label="Email" name="email" type="email" inputMode="email" required autoComplete="email" value={d.email} onChange={setDetail("email")} error={errors.email} />
                <Field label="City or neighbourhood" name="area" required autoComplete="address-level2" value={d.area} onChange={setDetail("area")} error={errors.area} />
                <Field label="Preferred date" name="date" type="date" value={d.date} onChange={setDetail("date")} hint="Optional" />
                <div className={styles.wide}>
                  <p className={styles.fieldLabel} id="contact-label">Best way to reach you</p>
                  <OptionCards labelledBy="contact-label" layout="pills" value={d.contact} onPick={setDetail("contact")}
                    options={[{ id: "phone", label: "Phone" }, { id: "email", label: "Email" }]} />
                </div>
                <Field label={isTv ? "Anything we should know?" : "What needs doing?"} name="notes" multiline required={!isTv}
                  value={d.notes} onChange={setDetail("notes")} error={errors.notes} className={styles.wide}
                  placeholder={isTv ? "TV model, parking, stairs… (optional)" : "What needs installing, sizes, rooms, timing…"} />
                <Honeypot value={honey} onChange={setHoney} />
                {/* lets Enter submit the step */}
                <button type="submit" hidden tabIndex={-1} />
              </form>
            )}

            {step === "review" && (
              <div className={styles.review}>
                {isTv && (
                  <div className={styles.estimate}>
                    <p className={styles.estimateLabel}>Your estimate</p>
                    <p className={styles.estimateTotal}>{money(total)}</p>
                    <p className={styles.estimateNote}>Your technician confirms the final price before starting. No payment now.</p>
                    {notes.length > 0 && <p className={styles.toConfirmLabel}>Not included yet, we&apos;ll price these with you:</p>}
                    {notes.length > 0 && (
                      <ul className={styles.toConfirm}>
                        {notes.map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                    )}
                    <button type="button" className={styles.breakdownToggle} aria-expanded={showBreakdown} onClick={() => setShowBreakdown((v) => !v)}>
                      {showBreakdown ? "Hide breakdown" : "See breakdown"}
                      <Icon name="chevronDown" size={16} />
                    </button>
                    {showBreakdown && (
                      <ul className={styles.breakdown}>
                        {lines.map((l) => (
                          <li key={l.label}>
                            <span>{l.label}</span>
                            <span>{money(l.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <dl className={styles.answers}>
                  <div>
                    <dt>Service</dt>
                    <dd>{svc?.title}</dd>
                    <button type="button" className={styles.edit} onClick={() => edit("service")} aria-label="Change service">Change</button>
                  </div>
                  {answers.map((x) => (
                    <div key={x.step}>
                      <dt>{x.label}</dt>
                      <dd>{x.value}</dd>
                      <button type="button" className={styles.edit} onClick={() => edit(x.step)} aria-label={`Change ${x.label.toLowerCase()}`}>Change</button>
                    </div>
                  ))}
                  <div>
                    <dt>Contact</dt>
                    <dd>
                      {d.first} {d.last} · {d.phone} · {d.email} · {d.area}
                      {d.date ? ` · preferred ${d.date}` : ""}
                    </dd>
                    <button type="button" className={styles.edit} onClick={() => edit("details")} aria-label="Change contact details">Change</button>
                  </div>
                  {d.notes.trim() && (
                    <div>
                      <dt>Notes</dt>
                      <dd>{d.notes}</dd>
                      <button type="button" className={styles.edit} onClick={() => edit("details")} aria-label="Change notes">Change</button>
                    </div>
                  )}
                </dl>
                <p className={styles.disclaimer}>
                  This is a booking request. We&apos;ll contact you to confirm a time{isTv ? " and the final price" : " and a quote"}. By sending,
                  you agree we may contact you about it.
                </p>
              </div>
            )}
          </div>

          {showNext && (
            <div className={styles.nav}>
              {step === "review" ? (
                <button type="button" className="btn" onClick={send} disabled={busy} aria-busy={busy || undefined}>
                  {busy ? "Sending…" : "Send booking request"}
                  <span className="btn-dot" aria-hidden="true">
                    <Icon name="arrow" size={14} strokeWidth={2} />
                  </span>
                </button>
              ) : (
                <button type={step === "details" ? "submit" : "button"} form={step === "details" ? "details-form" : undefined}
                  className="btn" onClick={step === "details" ? undefined : next}>
                  {step === "addons" && tv.addOns.length === 0 ? "Skip" : step === "details" ? "Review booking" : "Continue"}
                  <span className="btn-dot" aria-hidden="true">
                    <Icon name="arrow" size={14} strokeWidth={2} />
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* The chosen service and the answers so far; prices wait for the review. */}
      <aside className={`${styles.summary} on-dark`} aria-label="Your booking">
        {image && (
          <div className={styles.summaryImage}>
            <Image key={svc?.slug} src={image} alt="" fill sizes="400px" />
          </div>
        )}
        <div className={styles.summaryInner}>
          <p className={styles.summaryService}>{svc ? svc.title : "Your booking"}</p>
          {answers.length > 0 ? (
            <ul className={styles.summaryAnswers}>
              {answers.map((x) => (
                <li key={x.step}>
                  <span>{x.label}</span>
                  <span>{x.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.summaryEmpty}>
              {svc
                ? isTv
                  ? "Your answers appear here as you go. You'll see your estimate before you send anything."
                  : "Tell us about the job and we'll come back with a quote."
                : "A few quick questions, then we'll confirm a time that suits you."}
            </p>
          )}
          {showRunning && (
            <p className={styles.running} aria-live="polite">
              <span>Estimate so far</span>
              <strong>{money(total)}</strong>
            </p>
          )}
          <p className={styles.summaryHelp}>
            Prefer to talk? <a href={site.phoneHref}>{site.phone}</a>
          </p>
        </div>
      </aside>
    </div>
  );
}
