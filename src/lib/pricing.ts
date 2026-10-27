/*
 * TV installation estimator — prices verified from the live booking page
 * (tvinstallpro.ca/tv-installation-and-mounting-service, audited 2026-10-26).
 * Estimates only: the technician confirms the final price.
 */

export type Choice = { id: string; label: string; price: number; note?: string };

export const tvSizes: Choice[] = [
  { id: "up-to-31", label: "Up to 31″", price: 60.99 },
  { id: "32-60", label: "32″ – 60″", price: 79.99 },
  { id: "61-79", label: "61″ – 79″", price: 89.99 },
  { id: "80-plus", label: "80″ and above", price: 120.99 },
];

export const mounts: Choice[] = [
  { id: "fixed", label: "Fixed mount", price: 50 },
  { id: "tilting", label: "Tilting mount", price: 65 },
  { id: "full-motion", label: "Full motion mount", price: 100 },
  { id: "own", label: "I already have a mount", price: 0 },
];

export const fireplaceSurcharge = 25;

export const surfaces: Choice[] = [
  { id: "drywall", label: "Drywall / wood", price: 0 },
  { id: "metal-studs", label: "Drywall with metal studs", price: 10 },
  { id: "plaster", label: "Plaster", price: 10 },
  { id: "concrete", label: "Concrete", price: 20 },
  { id: "brick", label: "Brick", price: 20 },
  { id: "tile", label: "Tile", price: 40 },
  { id: "stone", label: "Stone", price: 40 },
  { id: "unknown", label: "Other / not sure", price: 0, note: "Confirmed on site" },
];

export const concealment: Choice[] = [
  { id: "none", label: "No concealment", price: 0 },
  { id: "channel", label: "Feed wires through an existing channel", price: 25 },
  { id: "external", label: "External concealment (outside the wall)", price: 59 },
];

export const addOns: Choice[] = [
  { id: "soundbar", label: "Sound bar installation", price: 30 },
  { id: "sound-mount", label: "Sound mount installation", price: 50 },
  { id: "shelf", label: "Wall shelf installation", price: 35 },
  { id: "surround", label: "Surround sound system setup", price: 85, note: "per hour" },
  { id: "hdmi", label: "Additional fire-resistant HDMI", price: 40 },
  { id: "fireplace", label: "Electric fireplace", price: 75.5 },
  { id: "pull-down", label: "Pull-down mount installation", price: 70 },
];

export const takedownPrice = 45;
export const deviceSetupPrice = 20; // per device (cable box, console…)
export const devicesBehindPrice = 25; // per device hidden behind the TV (Apple TV…)

export const maintenance: Choice[] = [
  { id: "none", label: "No additional coverage", price: 0 },
  { id: "1y", label: "1 full year", price: 49.99 },
  { id: "2y", label: "2 full years", price: 89.99 },
];

export type TvSelection = {
  size?: string;
  mount?: string;
  fireplace?: boolean;
  surface?: string;
  conceal?: string;
  addOns: string[];
  takedown?: boolean;
  deviceSetup: number; // 0–3 (3 = "3+")
  devicesBehind: number; // 0–3 (3 = "3+")
  maintenance?: string;
  anotherTv?: boolean;
};

export const emptyTvSelection: TvSelection = { addOns: [], deviceSetup: 0, devicesBehind: 0 };

const priceOf = (list: Choice[], id?: string) => list.find((c) => c.id === id)?.price ?? 0;

export type EstimateLine = { label: string; amount: number };

export function estimateLines(s: TvSelection): EstimateLine[] {
  const lines: EstimateLine[] = [];
  const push = (label: string, amount: number) => amount > 0 && lines.push({ label, amount });
  const named = (list: Choice[], id?: string) => list.find((c) => c.id === id)?.label ?? "";

  if (s.size) push(`TV ${named(tvSizes, s.size)}`, priceOf(tvSizes, s.size));
  if (s.mount) push(named(mounts, s.mount), priceOf(mounts, s.mount));
  if (s.fireplace) push("Above a fireplace", fireplaceSurcharge);
  if (s.surface) push(`Wall: ${named(surfaces, s.surface)}`, priceOf(surfaces, s.surface));
  if (s.conceal) push(named(concealment, s.conceal), priceOf(concealment, s.conceal));
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

export const estimateTotal = (s: TvSelection) => estimateLines(s).reduce((sum, l) => sum + l.amount, 0);

export const money = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: n % 1 ? 2 : 0 });

/** The lowest possible TV-mounting estimate: smallest TV, own mount, no extras. */
export const tvFrom = tvSizes[0].price;
