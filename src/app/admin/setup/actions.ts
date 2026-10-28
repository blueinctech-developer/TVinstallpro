"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { logActivity, startSession } from "@/lib/admin/auth";
import { hashPassword, minPasswordLength } from "@/lib/admin/password";
import { consumeToken, findToken } from "@/lib/admin/tokens";
import { db } from "@/lib/db";
import { allow, clientIp } from "@/lib/rate-limit";

export type SetupState = { error?: string };

export async function setPassword(_: SetupState, form: FormData): Promise<SetupState> {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const again = String(form.get("again") ?? "");
  if (!(await allow(`setup-ip:${clientIp(await headers())}`, 20, 900))) return { error: "Too many attempts. Wait 15 minutes." };
  if (password.length < minPasswordLength) return { error: `Use at least ${minPasswordLength} characters.` };
  if (password.length > 500) return { error: "That password is too long." };
  if (password !== again) return { error: "The two passwords don't match." };
  const t = await findToken(token);
  if (!t || !(await consumeToken(token))) return { error: "This link has expired or was already used. Ask for a new one." };
  const conn = await db();
  await conn.query("update admin_users set password_hash = $2 where id = $1", [t.user_id, await hashPassword(password)]);
  // A new password ends every other session for that person.
  await conn.query("delete from admin_sessions where user_id = $1", [t.user_id]);
  await logActivity(t.user_id, t.purpose === "setup" ? "password set (setup link)" : "password reset (link)");
  await startSession(t.user_id);
  redirect("/admin");
}
