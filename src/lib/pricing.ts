/*
 * TV installation estimator — prices verified from the live booking page
 * (tvinstallpro.ca/tv-installation-and-mounting-service, audited 2026-10-26).
 * Estimates only: the technician confirms the final price.
 */

export type Choice = { id: string; label: string; price: number; note?: string };

export const tvSizes: Choice[] = [
  { id: "up-to-31", label: "Up to 31″", price: 79.99 },
  { id: "32-60", label: "32″ – 60″", price: 89.99 },
  { id: "61-79", label: "61″ – 79″", price: 99.99 },
  { id: "80-plus", label: "80″ – 89″", price: 120.99 },
  { id: "90-100", label: "90″ – 100″", price: 149.99, note: "Needs an extra helper" },
];

/** TV sizes that need a second person on site; the helper is added to the estimate. */
export const helperSizeIds = ["90-100"];
export const extraHelperPrice = 55;

export const mounts: Choice[] = [
  { id: "fixed", label: "Fixed mount", price: 65 },
  { id: "tilting", label: "Tilting mount", price: 75 },
  { id: "full-motion", label: "Full motion mount", price: 110 },
  { id: "own", label: "I already have a mount", price: 0 },
  { id: "help", label: "Help me choose", price: 0, note: "We'll recommend one" },
];

export const fireplaceSurcharge = 25;

export const surfaces: Choice[] = [
  { id: "drywall", label: "Drywall / wood", price: 0 },
  { id: "metal-studs", label: "Drywall with metal studs", price: 25, note: "Standard in apartment buildings" },
  { id: "plaster", label: "Plaster", price: 35 },
  { id: "concrete", label: "Concrete", price: 40 },
  { id: "brick", label: "Brick", price: 40 },
  { id: "tile", label: "Tile", price: 40 },
  { id: "stone", label: "Stone", price: 40 },
  { id: "unknown", label: "Other / I don't know", price: 0, note: "Confirmed on site" },
];

/** Shown only when the customer wants the cords hidden. */
export const concealment: Choice[] = [
  { id: "channel", label: "Wires fed through an existing channel", price: 25 },
  { id: "external", label: "External concealment (hidden outside the wall)", price: 59 },
  { id: "help", label: "Help me choose", price: 0, note: "We'll recommend one" },
];

export const addOns: Choice[] = [
  { id: "soundbar", label: "Sound bar installation on drywall", price: 40 },
  { id: "sound-mount", label: "Sound bar mount", price: 65 },
  { id: "shelf", label: "Wall shelf installation", price: 45 },
  { id: "surround", label: "Surround sound system setup", price: 85, note: "per hour" },
  { id: "hdmi", label: "Additional fire-resistant HDMI", price: 40 },
  { id: "fireplace", label: "Electric fireplace", price: 75.5 },
  { id: "pull-down", label: "Pull-down mount installation on drywall", price: 160 },
  { id: "other", label: "Other", price: 0, note: "Quoted separately" },
];

export const takedownPrice = 45;
export const deviceSetupPrice = 30; // per device (cable box, console…)
export const devicesBehindPrice = 25; // per device hidden behind the TV (Apple TV…)

export const maintenance: Choice[] = [
  { id: "1y", label: "1 full year coverage", price: 49.99 },
  { id: "2y", label: "2 full years coverage", price: 89.99 },
  { id: "none", label: "No additional coverage", price: 0 },
];

export type TvSelection = {
  size?: string;
  mount?: string;
  fireplace?: boolean;
  surface?: string;
  hideCords?: boolean;
  conceal?: string; // only counts when hideCords is true
  addOns: string[];
  /** what the customer typed for the "Other" add-on */
  otherAddOn?: string;
  takedown?: boolean;
  deviceSetup: number; // 0–3 (3 = "3+")
  devicesBehind: number; // 0–3 (3 = "3+")
  maintenance?: string;
  anotherTv?: boolean;
};

export const emptyTvSelection: TvSelection = { addOns: [], deviceSetup: 0, devicesBehind: 0 };

/** Every price the estimator uses. The constants above are the defaults; the admin can override them. */
export type PriceBook = {
  tvSizes: Choice[];
  mounts: Choice[];
  fireplaceSurcharge: number;
  surfaces: Choice[];
  concealment: Choice[];
  addOns: Choice[];
  takedownPrice: number;
  deviceSetupPrice: number;
  devicesBehindPrice: number;
  extraHelperPrice: number;
  maintenance: Choice[];
};

export const defaultPrices: PriceBook = {
  tvSizes,
  mounts,
  fireplaceSurcharge,
  surfaces,
  concealment,
  addOns,
  takedownPrice,
  deviceSetupPrice,
  devicesBehindPrice,
  extraHelperPrice,
  maintenance,
};

const priceOf = (list: Choice[], id?: string) => list.find((c) => c.id === id)?.price ?? 0;

export type EstimateLine = { label: string; amount: number };

export function estimateLines(s: TvSelection, p: PriceBook = defaultPrices): EstimateLine[] {
  const { tvSizes, mounts, fireplaceSurcharge, surfaces, concealment, addOns, takedownPrice, deviceSetupPrice, devicesBehindPrice, extraHelperPrice, maintenance } = p;
  const lines: EstimateLine[] = [];
  const push = (label: string, amount: number) => amount > 0 && lines.push({ label, amount });
  const named = (list: Choice[], id?: string) => list.find((c) => c.id === id)?.label ?? "";

  if (s.size) push(`TV ${named(tvSizes, s.size)}`, priceOf(tvSizes, s.size));
  if (s.size && helperSizeIds.includes(s.size)) push("Extra helper", extraHelperPrice);
  if (s.mount) push(named(mounts, s.mount), priceOf(mounts, s.mount));
  if (s.fireplace) push("Above a fireplace", fireplaceSurcharge);
  if (s.surface) push(`Wall: ${named(surfaces, s.surface)}`, priceOf(surfaces, s.surface));
  if (s.hideCords && s.conceal) push(named(concealment, s.conceal), priceOf(concealment, s.conceal));
  for (const id of s.addOns) push(named(addOns, id), priceOf(addOns, id));
  if (s.takedown) push("Existing TV takedown", takedownPrice);
  push(`Device setup × ${s.deviceSetup}${s.deviceSetup === 3 ? "+" : ""}`, s.deviceSetup * deviceSetupPrice);
  push(
    `Devices behind TV × ${s.devicesBehind}${s.devicesBehind === 3 ? "+" : ""}`,
    s.devicesBehind * devicesBehindPrice,
  );
  if (s.maintenance) push(`Maintenance: ${named(maintenance, s.maintenance)}`, priceOf(maintenance, s.maintenance));
  return lines;
}

/** Choices that carry no price but the technician needs to know about (help me choose, quoted separately). */
export function estimateNotes(s: TvSelection, p: PriceBook = defaultPrices): string[] {
  const pick = (list: Choice[], id?: string) => list.find((c) => c.id === id);
  const notes: string[] = [];
  const add = (prefix: string, c?: Choice) => c && c.price === 0 && c.note && notes.push(`${prefix}${c.label} (${c.note.toLowerCase()})`);
  if (s.mount !== "own") add("Mount: ", pick(p.mounts, s.mount));
  add("Wall: ", pick(p.surfaces, s.surface));
  if (s.hideCords) add("Cords: ", pick(p.concealment, s.conceal));
  for (const id of s.addOns) {
    const c = pick(p.addOns, id);
    if (id === "other" && s.otherAddOn?.trim()) notes.push(`Add-on: ${s.otherAddOn.trim()} (quoted separately)`);
    else add("Add-on: ", c);
  }
  return notes;
}

export const estimateTotal = (s: TvSelection, p: PriceBook = defaultPrices) => estimateLines(s, p).reduce((sum, l) => sum + l.amount, 0);

export const money = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: n % 1 ? 2 : 0 });

/** The lowest possible TV-mounting estimate: smallest TV, own mount, no extras. */
export const tvFrom = tvSizes[0].price;
export const tvFromOf = (p: PriceBook) => Math.min(...p.tvSizes.map((c) => c.price));
