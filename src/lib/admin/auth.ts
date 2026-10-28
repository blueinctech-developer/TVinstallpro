import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { roleAtLeast, type Role } from "./vocab";

/*
 * Admin sessions: a random token in an httpOnly cookie; the database stores only its SHA-256.
 * Every admin page and action calls requireUser(), which checks the session against the
 * database. proxy.ts only does a quick cookie-present redirect in front of this.
 */

export const SESSION_COOKIE = "tvip_admin";
const SESSION_DAYS = 7;

export type AdminUser = { id: number; email: string; name: string; role: Role };

const tokenId = (token: string) => createHash("sha256").update(token).digest("hex");

export async function startSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const h = await headers();
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  const conn = await db();
  await conn.query(
    "insert into admin_sessions (id, user_id, expires_at, ip, user_agent) values ($1, $2, $3, $4, $5)",
    [tokenId(token), userId, expires, clientIp(h), h.get("user-agent")?.slice(0, 300) ?? null],
  );
  await conn.query("update admin_users set last_login_at = now() where id = $1", [userId]);
  await conn.query("delete from admin_sessions where expires_at < now()");
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    expires,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await (await db()).query("delete from admin_sessions where id = $1", [tokenId(token)]);
  jar.delete({ name: SESSION_COOKIE, path: "/admin" });
}

/** The signed-in user, or null. Cached per request. */
export const currentUser = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [u] = await (await db()).query<AdminUser>(
    `select u.id, u.email, u.name, u.role from admin_sessions s join admin_users u on u.id = s.user_id
      where s.id = $1 and s.expires_at > now() and not u.disabled`,
    [tokenId(token)],
  );
  return u ?? null;
});

/** Use at the top of every admin page and server action. */
export async function requireUser(min: Role = "viewer"): Promise<AdminUser> {
  const u = await currentUser();
  if (!u) redirect("/admin/login");
  // forbidden() is still experimental in Next 16, so send them to the overview with a notice.
  if (!roleAtLeast(u.role, min)) redirect("/admin?denied=1");
  return u;
}

export async function logActivity(actorId: number | null, action: string, target?: string, meta: object = {}) {
  await (await db()).query("insert into activity_log (actor_id, action, target, meta) values ($1, $2, $3, $4)", [
    actorId,
    action,
    target ?? null,
    JSON.stringify(meta),
  ]);
}
