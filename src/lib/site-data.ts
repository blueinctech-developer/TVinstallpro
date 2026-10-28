import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import {
  buildSiteData,
  defaultEmail,
  defaultTracking,
  type Business,
  type EmailSettings,
  type ServiceEdit,
  type SiteData,
  type Tracking,
} from "./site-defaults";
import type { PriceBook } from "./pricing";

/** Reads one settings row. If the database can't be reached, the site keeps working on the code defaults. */
export async function getSetting<T>(key: string): Promise<T | null> {
  // `next build` prerenders in parallel worker processes; the local PGlite database allows one
  // process at a time, so a local build uses the defaults. With DATABASE_URL (Vercel) it reads normally.
  if (process.env.NEXT_PHASE === "phase-production-build" && !process.env.DATABASE_URL) return null;
  try {
    const [row] = await (await db()).query<{ value: T }>("select value from settings where key = $1", [key]);
    return row?.value ?? null;
  } catch (err) {
    console.error(`[settings] could not read "${key}", using defaults:`, (err as Error).message);
    return null;
  }
}

export async function saveSetting(key: string, value: unknown, userId: number) {
  await (await db()).query(
    `insert into settings (key, value, updated_by) values ($1, $2, $3)
     on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now()`,
    [key, JSON.stringify(value), userId],
  );
}

/** Business details, services and prices for the public site. Cached per request. */
export const getSiteData = cache(async (): Promise<SiteData> => {
  const [business, prices, services] = await Promise.all([
    getSetting<Partial<Business>>("business"),
    getSetting<Partial<PriceBook>>("prices"),
    getSetting<ServiceEdit[]>("services"),
  ]);
  return buildSiteData(business, prices, services);
});

export const getTracking = cache(async (): Promise<Tracking> => ({ ...defaultTracking, ...((await getSetting<Partial<Tracking>>("tracking")) ?? {}) }));

export const getEmailSettings = async (): Promise<EmailSettings> => ({
  ...defaultEmail,
  ...((await getSetting<Partial<EmailSettings>>("email")) ?? {}),
});
