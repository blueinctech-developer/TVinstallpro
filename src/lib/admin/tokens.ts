import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";

// One-time links for setting or resetting a password. Only the SHA-256 of the token is stored.

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createToken(userId: number, purpose: "setup" | "reset", createdBy: number, hours = 72) {
  const token = randomBytes(32).toString("base64url");
  const conn = await db();
  // A new link replaces any unused one for the same person.
  await conn.query("update admin_tokens set used_at = now() where user_id = $1 and used_at is null", [userId]);
  await conn.query(
    "insert into admin_tokens (id, user_id, purpose, created_by, expires_at) values ($1, $2, $3, $4, now() + make_interval(hours => $5))",
    [hashToken(token), userId, purpose, createdBy, hours],
  );
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  return `${origin}/admin/setup?token=${token}`;
}

export async function findToken(token: string) {
  const [row] = await (await db()).query<{ user_id: number; purpose: string; email: string; name: string }>(
    `select t.user_id, t.purpose, u.email, u.name from admin_tokens t join admin_users u on u.id = t.user_id
      where t.id = $1 and t.used_at is null and t.expires_at > now() and not u.disabled`,
    [hashToken(token)],
  );
  return row ?? null;
}

/** Marks the token used; returns false if it was already used or expired (e.g. double submit). */
export async function consumeToken(token: string) {
  const done = await (await db()).query(
    "update admin_tokens set used_at = now() where id = $1 and used_at is null and expires_at > now() returning id",
    [hashToken(token)],
  );
  return done.length > 0;
}
