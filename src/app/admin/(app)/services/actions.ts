"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { logActivity, requireUser } from "@/lib/admin/auth";
import { slugify } from "@/lib/admin/collections";
import { services as defaultServices } from "@/lib/content";
import { type Choice, type PriceBook } from "@/lib/pricing";
import { getSetting, saveSetting } from "@/lib/site-data";
import type { ServiceEdit } from "@/lib/site-defaults";

export type SaveResult = { ok?: string; error?: string };

const listKeys = ["tvSizes", "mounts", "surfaces", "concealment", "addOns", "maintenance"] as const;
const scalarKeys = ["fireplaceSurcharge", "takedownPrice", "deviceSetupPrice", "devicesBehindPrice", "extraHelperPrice"] as const;

const money = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(/[$,\s]/g, ""));
  return String(v ?? "").trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 10000 ? Math.round(n * 100) / 100 : null;
};

export async function savePrices(_: SaveResult, f: FormData): Promise<SaveResult> {
  const me = await requireUser("admin");
  const out = {} as PriceBook;
  for (const key of listKeys) {
    // Rows arrive as parallel lists, one per row on the page, in the order shown.
    const ids = f.getAll(`${key}.id`).map(String);
    const labels = f.getAll(`${key}.label`).map((x) => String(x).trim().slice(0, 120));
    const notes = f.getAll(`${key}.note`).map((x) => String(x).trim().slice(0, 60));
    const prices = f.getAll(`${key}.price`);
    const rows: Choice[] = [];
    for (let i = 0; i < ids.length; i++) {
      const price = money(prices[i]);
      if (!labels[i]) return { error: "Every price option needs a name." };
      if (price === null) return { error: `Check the price for "${labels[i]}" (a number between 0 and 10,000).` };
      // New rows get a stable id once; customers' past selections keep working after a rename.
      const id = ids[i] || `${slugify(labels[i]) || "option"}-${randomBytes(2).toString("hex")}`;
      rows.push({ id, label: labels[i], price, ...(notes[i] ? { note: notes[i] } : {}) });
    }
    if (key === "tvSizes" && !rows.length) return { error: "Keep at least one TV size." };
    out[key] = rows;
  }
  for (const key of scalarKeys) {
    const price = money(f.get(key));
    if (price === null) return { error: "Check the per-item prices (numbers between 0 and 10,000)." };
    out[key] = price;
  }
  await saveSetting("prices", out, me.id);
  await logActivity(me.id, "prices saved");
  revalidatePath("/", "layout");
  return { ok: "Prices saved. The website and the booking estimator are updated." };
}

const iconOk = (v: string) => /^[a-zA-Z]{2,20}$/.test(v);
const imageOk = (v: string) => !v || v.startsWith("/images/") || /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(v);

export async function saveServices(_: SaveResult, f: FormData): Promise<SaveResult> {
  const me = await requireUser("admin");
  const slugs = f.getAll("slug").map(String);
  const edits: ServiceEdit[] = [];
  const taken = new Set(defaultServices.map((s) => s.slug));

  for (let i = 0; i < slugs.length; i++) {
    const at = (k: string) => String(f.getAll(k)[i] ?? "").trim();
    const title = at("title").slice(0, 80);
    if (!title) return { error: "Every service needs a name." };
    const rawPrice = at("priceFrom");
    const priceFrom = rawPrice ? money(rawPrice) : null;
    if (rawPrice && priceFrom === null) return { error: `Check the "from" price for ${title}.` };
    const builtIn = defaultServices.find((s) => s.slug === slugs[i]);
    const hidden = f.getAll("hidden").includes(String(i));
    const short = at("short").slice(0, 200);
    const body = at("body").slice(0, 2000);

    if (builtIn) {
      edits.push({ slug: builtIn.slug, title, short: short || builtIn.short, body: body || builtIn.body, hidden, priceFrom });
      continue;
    }
    const image = at("image");
    const icon = at("icon");
    if (!imageOk(image)) return { error: `The image for ${title} isn't from the media library.` };
    if (!short) return { error: `Add a one-line summary for ${title}.` };
    if (!iconOk(icon)) return { error: `Choose an icon for ${title}.` };
    // The web address is set once, from the name, so old booking links keep working after a rename.
    let slug = slugs[i] || slugify(title) || `service-${randomBytes(2).toString("hex")}`;
    while (taken.has(slug)) slug = `${slugify(title)}-${randomBytes(2).toString("hex")}`;
    taken.add(slug);
    edits.push({ slug, title, short, body: body || short, hidden, priceFrom, custom: true, icon: icon as ServiceEdit["icon"], image });
  }
  if (edits.every((e) => e.hidden)) return { error: "Keep at least one service visible." };

  const before = (await getSetting<ServiceEdit[]>("services")) ?? [];
  const removed = before.filter((b) => b.custom && !edits.some((e) => e.slug === b.slug)).map((b) => b.slug);
  await saveSetting("services", edits, me.id);
  await logActivity(me.id, "services saved", undefined, { hidden: edits.filter((e) => e.hidden).map((e) => e.slug), added: edits.filter((e) => e.custom && !before.some((b) => b.slug === e.slug)).map((e) => e.slug), removed });
  revalidatePath("/", "layout");
  return { ok: "Services saved. The website and booking form are updated." };
}
