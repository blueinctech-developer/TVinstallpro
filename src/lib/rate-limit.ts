import "server-only";
import { db } from "@/lib/db";

/**
 * Fixed-window limiter stored in the database, so it holds across server instances.
 * Returns true while `key` is within `limit` hits per `windowSec`.
 */
export async function allow(key: string, limit: number, windowSec: number): Promise<boolean> {
  const [row] = await (await db()).query<{ count: number }>(
    `insert into rate_limits (key, count, window_start) values ($1, 1, now())
     on conflict (key) do update set
       count = case when rate_limits.window_start < now() - make_interval(secs => $2) then 1 else rate_limits.count + 1 end,
       window_start = case when rate_limits.window_start < now() - make_interval(secs => $2) then now() else rate_limits.window_start end
     returning count`,
    [key, windowSec],
  );
  return row.count <= limit;
}

/** Client IP as reported by the hosting proxy (first x-forwarded-for hop). */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
