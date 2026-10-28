"use server";

import { revalidatePath } from "next/cache";
import { logActivity, requireUser } from "@/lib/admin/auth";
import { sendMail } from "@/lib/email";
import { saveSetting } from "@/lib/site-data";
import type { Business, EmailSettings, Tracking } from "@/lib/site-defaults";

export type SettingsResult = { ok?: string; error?: string };

const text = (f: FormData, k: string, max = 300) => String(f.get(k) ?? "").trim().slice(0, max);
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const int = (f: FormData, k: string, min: number, max: number) => {
  const n = Number(f.get(k));
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

/** Every public page reads these, so rebuild them all. */
const refreshSite = () => revalidatePath("/", "layout");

export async function saveBusiness(_: SettingsResult, f: FormData): Promise<SettingsResult> {
  const me = await requireUser("admin");
  const b: Business = {
    name: text(f, "name", 80),
    phone: text(f, "phone", 30),
    whatsapp: text(f, "whatsapp", 300),
    email: text(f, "email", 200).toLowerCase(),
    area: text(f, "area", 120),
    description: text(f, "description", 300),
    warrantyMonths: int(f, "warrantyMonths", 0, 120) ?? -1,
    componentsIncluded: int(f, "componentsIncluded", 0, 20) ?? -1,
  };
  if (!b.name) return { error: "Enter the business name." };
  if (b.phone.replace(/\D/g, "").length < 10) return { error: "Enter a phone number with area code." };
  if (b.whatsapp && !/^https:\/\//.test(b.whatsapp)) return { error: "The WhatsApp link must start with https://" };
  if (!emailOk(b.email)) return { error: "Enter a valid public email address." };
  if (!b.area) return { error: "Enter the service area." };
  if (b.warrantyMonths < 0) return { error: "Warranty must be a whole number of months (0–120)." };
  if (b.componentsIncluded < 0) return { error: "Components included must be a whole number (0–20)." };
  await saveSetting("business", b, me.id);
  await logActivity(me.id, "settings saved", "business");
  refreshSite();
  return { ok: "Business details saved. The website updates within a minute." };
}

export async function saveTracking(_: SettingsResult, f: FormData): Promise<SettingsResult> {
  const me = await requireUser("admin");
  const t: Tracking = {
    ga4Id: text(f, "ga4Id", 30).toUpperCase(),
    gtmId: text(f, "gtmId", 30).toUpperCase(),
    headCode: String(f.get("headCode") ?? "").slice(0, 20000),
    bodyCode: String(f.get("bodyCode") ?? "").slice(0, 20000),
  };
  if (t.ga4Id && !/^G-[A-Z0-9]{4,}$/.test(t.ga4Id)) return { error: "A Google Analytics 4 ID looks like G-XXXXXXXXXX." };
  if (t.gtmId && !/^GTM-[A-Z0-9]{4,}$/.test(t.gtmId)) return { error: "A Tag Manager ID looks like GTM-XXXXXXX." };
  await saveSetting("tracking", t, me.id);
  await logActivity(me.id, "settings saved", "tracking", { ga4: !!t.ga4Id, gtm: !!t.gtmId, head: t.headCode.length, body: t.bodyCode.length });
  refreshSite();
  return { ok: "Tracking saved. It's live on the website within a minute." };
}

export async function saveEmail(_: SettingsResult, f: FormData): Promise<SettingsResult> {
  const me = await requireUser("admin");
  const list = text(f, "alertsTo", 1000)
    .split(/[,;\s]+/)
    .filter(Boolean);
  const bad = list.find((x) => !emailOk(x));
  if (bad) return { error: `"${bad}" isn't a valid email address.` };
  const e: EmailSettings = {
    alertsTo: list.join(", "),
    fromName: text(f, "fromName", 80),
    fromEmail: text(f, "fromEmail", 200).toLowerCase(),
    confirmToCustomer: f.get("confirmToCustomer") === "on",
  };
  if (!e.fromName) return { error: "Enter the sender name." };
  if (!emailOk(e.fromEmail)) return { error: "Enter a valid sender address (it must be allowed by your SMTP provider)." };
  await saveSetting("email", e, me.id);
  await logActivity(me.id, "settings saved", "email", { recipients: list.length });
  revalidatePath("/admin/settings");
  return { ok: "Email settings saved." };
}

export async function sendTestEmail(_: SettingsResult): Promise<SettingsResult> {
  const me = await requireUser("admin");
  const r = await sendMail({
    to: me.email,
    subject: "Test email from the TV Install Pro admin",
    text: "If you're reading this, the website can send email: new-request alerts will arrive like this one.",
  });
  revalidatePath("/admin/settings");
  return r.ok ? { ok: `Test email sent to ${me.email}.` } : { error: `Couldn't send: ${r.error}` };
}
