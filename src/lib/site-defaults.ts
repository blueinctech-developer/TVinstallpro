// Shapes and defaults for the admin-editable site data. Safe in client components.
// The values in site.ts, content.ts and pricing.ts are the defaults until someone saves a change.
import { services as defaultServices, type Service } from "./content";
import { defaultPrices, type Choice, type PriceBook } from "./pricing";
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

export type ServiceEdit = { slug: string; title?: string; short?: string; body?: string; hidden?: boolean };

export type Tracking = { ga4Id: string; gtmId: string; headCode: string; bodyCode: string };

export type EmailSettings = {
  alertsTo: string; // comma-separated
  fromName: string;
  fromEmail: string;
  confirmToCustomer: boolean;
};

export type SiteData = {
  business: Business & { phoneHref: string; url: string };
  services: Service[];
  prices: PriceBook;
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
  fromName: site.name,
  fromEmail: "support@tvinstallpro.ca",
  confirmToCustomer: false,
};

export const phoneHrefOf = (phone: string) => `tel:+1${phone.replace(/\D/g, "").slice(-10)}`;

/** Saved prices may lack options added in code later: keep the defaults' shape, take saved labels/prices by id. */
function mergeChoices(base: Choice[], saved?: Choice[]): Choice[] {
  if (!Array.isArray(saved)) return base;
  return base.map((c) => {
    const s = saved.find((x) => x.id === c.id);
    return s ? { ...c, label: s.label || c.label, price: Number.isFinite(s.price) ? s.price : c.price } : c;
  });
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
    maintenance: mergeChoices(d.maintenance, s.maintenance),
  };
}

export function mergeServices(edits?: ServiceEdit[] | null): Service[] {
  const list = Array.isArray(edits) ? edits : [];
  return defaultServices
    .map((s) => {
      const e = list.find((x) => x.slug === s.slug);
      return e ? { ...s, title: e.title || s.title, short: e.short || s.short, body: e.body || s.body, hidden: !!e.hidden } : s;
    })
    .filter((s) => !(s as Service & { hidden?: boolean }).hidden);
}

export function buildSiteData(business?: Partial<Business> | null, prices?: Partial<PriceBook> | null, services?: ServiceEdit[] | null): SiteData {
  const b = { ...defaultBusiness, ...(business ?? {}) };
  return {
    business: { ...b, phoneHref: phoneHrefOf(b.phone), url: site.url },
    services: mergeServices(services),
    prices: mergePrices(prices),
  };
}

export const defaultSiteData = buildSiteData();
