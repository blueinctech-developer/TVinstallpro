// Shapes and defaults for the admin-editable site data. Safe in client components.
// The values in site.ts, content.ts and pricing.ts are the defaults until someone saves a change.
import type { IconName } from "@/components/Icon";
import { images, services as defaultServices, type Service } from "./content";
import { defaultPrices, money, tvFromOf, type Choice, type PriceBook } from "./pricing";
import { site } from "./site";

export type Business = {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  area: string;
  description: string;
  warrantyMonths: number;
  componentsIncluded: number;
};

/** A saved service: wording changes to a built-in one, or (custom: true) a service added in the admin. */
export type ServiceEdit = {
  slug: string;
  title?: string;
  short?: string;
  body?: string;
  hidden?: boolean;
  priceFrom?: number | null;
  custom?: boolean;
  icon?: IconName;
  image?: string;
};

export type Tracking = { ga4Id: string; gtmId: string; headCode: string; bodyCode: string };

export type EmailSettings = {
  alertsTo: string; // comma-separated: bookings and contact messages
  partnerAlertsTo: string; // comma-separated: partner requests (empty = same as alertsTo)
  replyTo: string; // where customers' replies go
  fromName: string;
  fromEmail: string;
  confirmToCustomer: boolean;
};

export type SiteData = {
  business: Business & { phoneHref: string; url: string };
  services: Service[];
  prices: PriceBook;
  /** Which optional public sections have published content (they stay out of the menu until then). */
  links: { blog: boolean; work: boolean };
};

export const defaultBusiness: Business = {
  name: site.name,
  phone: site.phone,
  whatsapp: site.whatsapp,
  email: site.email,
  area: site.area,
  description: site.description,
  warrantyMonths: site.warrantyMonths,
  componentsIncluded: site.componentsIncluded,
};

export const defaultTracking: Tracking = { ga4Id: "", gtmId: "", headCode: "", bodyCode: "" };

export const defaultEmail: EmailSettings = {
  alertsTo: "",
  partnerAlertsTo: "",
  replyTo: "",
  fromName: site.name,
  fromEmail: "support@tvinstallpro.ca",
  confirmToCustomer: false,
};

export const phoneHrefOf = (phone: string) => `tel:+1${phone.replace(/\D/g, "").slice(-10)}`;

/** Once a list is saved in the admin it wins entirely, so options can be added and removed. */
function mergeChoices(base: Choice[], saved?: Choice[]): Choice[] {
  if (!Array.isArray(saved) || !saved.length) return base;
  const clean = saved.filter((c) => c?.id && c.label && Number.isFinite(c.price));
  return clean.length ? clean : base;
}

const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : d);

export function mergePrices(saved?: Partial<PriceBook> | null): PriceBook {
  const s = saved ?? {};
  const d = defaultPrices;
  return {
    tvSizes: mergeChoices(d.tvSizes, s.tvSizes),
    mounts: mergeChoices(d.mounts, s.mounts),
    fireplaceSurcharge: num(s.fireplaceSurcharge, d.fireplaceSurcharge),
    surfaces: mergeChoices(d.surfaces, s.surfaces),
    concealment: mergeChoices(d.concealment, s.concealment),
    addOns: mergeChoices(d.addOns, s.addOns),
    takedownPrice: num(s.takedownPrice, d.takedownPrice),
    deviceSetupPrice: num(s.deviceSetupPrice, d.deviceSetupPrice),
    devicesBehindPrice: num(s.devicesBehindPrice, d.devicesBehindPrice),
    extraHelperPrice: num(s.extraHelperPrice, d.extraHelperPrice),
    maintenance: mergeChoices(d.maintenance, s.maintenance),
  };
}

/** Every service, hidden ones included: built-in ones with their saved wording, then those added in the admin. */
export function allServices(edits?: ServiceEdit[] | null): Service[] {
  const list = Array.isArray(edits) ? edits : [];
  const builtIn: Service[] = defaultServices.map((s) => {
    const e = list.find((x) => x.slug === s.slug);
    return e
      ? { ...s, title: e.title || s.title, short: e.short || s.short, body: e.body || s.body, hidden: !!e.hidden, priceFrom: e.priceFrom ?? undefined }
      : s;
  });
  const added: Service[] = list
    .filter((e) => e.custom && e.title)
    .map((e) => ({
      slug: e.slug,
      title: e.title!,
      short: e.short ?? "",
      body: e.body ?? "",
      icon: e.icon ?? "tools",
      image: e.image || images.craft.src,
      legacyPath: "",
      priceFrom: e.priceFrom ?? undefined,
      hidden: !!e.hidden,
      custom: true,
    }));
  return [...builtIn, ...added];
}

export const mergeServices = (edits?: ServiceEdit[] | null) => allServices(edits).filter((s) => !s.hidden);

export function buildSiteData(
  business?: Partial<Business> | null,
  prices?: Partial<PriceBook> | null,
  services?: ServiceEdit[] | null,
  links: SiteData["links"] = { blog: false, work: false },
): SiteData {
  const b = { ...defaultBusiness, ...(business ?? {}) };
  return {
    business: { ...b, phoneHref: phoneHrefOf(b.phone), url: site.url },
    services: mergeServices(services),
    prices: mergePrices(prices),
    links,
  };
}

export const defaultSiteData = buildSiteData();

/** The price shown beside a service wherever services are listed. */
export const servicePriceLabel = (s: Service, prices: PriceBook) =>
  s.estimator ? `From ${money(tvFromOf(prices))}` : s.priceFrom ? `From ${money(s.priceFrom)}` : "Quote";

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
/** 8 → "Eight", for copy that counts services. */
export const countWord = (n: number) => WORDS[n] ?? String(n);
