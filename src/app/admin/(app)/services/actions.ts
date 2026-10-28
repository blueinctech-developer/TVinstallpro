"use server";

import { revalidatePath } from "next/cache";
import { logActivity, requireUser } from "@/lib/admin/auth";
import { services as defaultServices } from "@/lib/content";
import { defaultPrices, type Choice, type PriceBook } from "@/lib/pricing";
import { saveSetting } from "@/lib/site-data";
import type { ServiceEdit } from "@/lib/site-defaults";

export type SaveResult = { ok?: string; error?: string };

const listKeys = ["tvSizes", "mounts", "surfaces", "concealment", "addOns", "maintenance"] as const;
const scalarKeys = ["fireplaceSurcharge", "takedownPrice", "deviceSetupPrice", "devicesBehindPrice"] as const;

const money = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 && n <= 10000 ? Math.round(n * 100) / 100 : null;
};

export async function savePrices(_: SaveResult, f: FormData): Promise<SaveResult> {
  const me = await requireUser("admin");
  const out = {} as PriceBook;
  for (const key of listKeys) {
    const rows: Choice[] = [];
    for (const c of defaultPrices[key]) {
      const price = money(f.get(`${key}.${c.id}.price`));
      const label = String(f.get(`${key}.${c.id}.label`) ?? "").trim().slice(0, 120);
      if (price === null) return { error: `Check the price for "${label || c.label}" (a number between 0 and 10,000).` };
      rows.push({ ...c, label: label || c.label, price });
    }
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
  return { ok: "Prices saved. The website and the booking estimator update within a minute." };
}

export async function saveServices(_: SaveResult, f: FormData): Promise<SaveResult> {
  const me = await requireUser("admin");
  const edits: ServiceEdit[] = defaultServices.map((s) => ({
    slug: s.slug,
    title: String(f.get(`${s.slug}.title`) ?? "").trim().slice(0, 80) || s.title,
    short: String(f.get(`${s.slug}.short`) ?? "").trim().slice(0, 200) || s.short,
    body: String(f.get(`${s.slug}.body`) ?? "").trim().slice(0, 2000) || s.body,
    hidden: f.get(`${s.slug}.hidden`) === "on",
  }));
  if (edits.every((e) => e.hidden)) return { error: "Keep at least one service visible." };
  await saveSetting("services", edits, me.id);
  await logActivity(me.id, "services saved", undefined, { hidden: edits.filter((e) => e.hidden).map((e) => e.slug) });
  revalidatePath("/", "layout");
  return { ok: "Services saved. The website updates within a minute." };
}
