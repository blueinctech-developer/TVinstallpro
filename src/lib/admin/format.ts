import { services } from "@/lib/content";

// The business is in Ottawa/Gatineau: show every time in Eastern time, whatever the server's zone.
const TZ = "America/Toronto";

const dateTime = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, dateStyle: "medium" });
const money = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

export const fmtDateTime = (d: Date | string | null) => (d ? dateTime.format(new Date(d)) : "—");
export const fmtDate = (d: Date | string | null) => (d ? dateOnly.format(new Date(d)) : "—");
/** "YYYY-MM-DD" from a date input, without shifting it through a time zone. */
export const fmtDay = (day: string | null) => (day ? dateOnly.format(new Date(`${day}T12:00:00Z`)) : "—");
export const fmtMoney = (n: string | number | null) => (n === null || n === "" ? "—" : money.format(Number(n)));

export function fmtAgo(d: Date | string) {
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days < 31 ? `${days} d ago` : fmtDate(d);
}

export const serviceTitle = (slug: string | null) => (slug ? (services.find((s) => s.slug === slug)?.title ?? slug) : null);

export const telHref = (phone: string) => `tel:+1${phone.replace(/\D/g, "").slice(-10)}`;
export const waHref = (phone: string) => `https://wa.me/1${phone.replace(/\D/g, "").slice(-10)}`;
