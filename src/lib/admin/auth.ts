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
 *
 * Two-factor sign-in is required for everyone: a session only counts once it has passed a
 * code (mfa_at). Without 2FA set up, the account is sent to /admin/2fa/setup; with it, to /admin/2fa.
 */

export const SESSION_COOKIE = "tvip_admin";
const SESSION_DAYS = 7;

export type AdminUser = { id: number; email: string; name: string; role: Role };
/** A session that has passed the password; it may still owe a 2FA code. */
export type SessionUser = AdminUser & { mfaEnrolled: boolean; mfaPassed: boolean };

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

/** The id of this browser's session row, or null. */
export async function currentSessionId() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? tokenId(token) : null;
}

/** Whoever this session belongs to, whether or not it has passed 2FA. Cached per request. */
export const sessionUser = cache(async (): Promise<SessionUser | null> => {
  const id = await currentSessionId();
  if (!id) return null;
  const [u] = await (await db()).query<SessionUser>(
    `select u.id, u.email, u.name, u.role,
            u.totp_enabled_at is not null as "mfaEnrolled",
            s.mfa_at is not null as "mfaPassed"
       from admin_sessions s join admin_users u on u.id = s.user_id
      where s.id = $1 and s.expires_at > now() and not u.disabled`,
    [id],
  );
  return u ?? null;
});

/** The fully signed-in user (password and 2FA), or null. */
export const currentUser = cache(async (): Promise<AdminUser | null> => {
  const u = await sessionUser();
  return u && u.mfaEnrolled && u.mfaPassed ? { id: u.id, email: u.email, name: u.name, role: u.role } : null;
});

/** Marks this session as having passed 2FA. */
export async function passMfa() {
  const id = await currentSessionId();
  if (id) await (await db()).query("update admin_sessions set mfa_at = now(), totp_pending = null where id = $1", [id]);
}

/** Use at the top of every admin page and server action. */
export async function requireUser(min: Role = "viewer"): Promise<AdminUser> {
  const s = await sessionUser();
  if (!s) redirect("/admin/login");
  // Everyone needs 2FA: set it up first, or enter this session's code.
  if (!s.mfaEnrolled) redirect("/admin/2fa/setup");
  if (!s.mfaPassed) redirect("/admin/2fa");
  const u: AdminUser = { id: s.id, email: s.email, name: s.name, role: s.role };
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
