"use server";

import { revalidatePath } from "next/cache";
import { logActivity, requireUser } from "@/lib/admin/auth";
import { createToken } from "@/lib/admin/tokens";
import { roles, type Role } from "@/lib/admin/vocab";
import { db } from "@/lib/db";

export type UserActionResult = { ok?: string; error?: string; link?: string; linkFor?: string };

const isRole = (v: unknown): v is Role => typeof v === "string" && v in roles;

/** At least one enabled administrator must remain after a change. */
async function wouldLeaveNoAdmin(userId: number) {
  const [{ n }] = await (await db()).query<{ n: number }>(
    "select count(*)::int as n from admin_users where role = 'admin' and not disabled and id <> $1",
    [userId],
  );
  return n === 0;
}

export async function addUser(_: UserActionResult, form: FormData): Promise<UserActionResult> {
  const me = await requireUser("admin");
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  const role = form.get("role");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: "Enter a valid email address." };
  if (!name) return { error: "Enter their name." };
  if (!isRole(role)) return { error: "Choose a role." };
  const conn = await db();
  const exists = await conn.query("select 1 from admin_users where email = $1", [email]);
  if (exists.length) return { error: "There's already an account with that email." };
  // No usable password until they open the setup link and choose one.
  const [u] = await conn.query<{ id: number }>(
    "insert into admin_users (email, name, password_hash, role) values ($1, $2, '!', $3) returning id",
    [email, name, role],
  );
  const link = await createToken(u.id, "setup", me.id);
  await logActivity(me.id, "user added", `user:${u.id}`, { role });
  revalidatePath("/admin/users");
  return { ok: `Account created for ${name}.`, link, linkFor: email };
}

export async function updateUser(_: UserActionResult, form: FormData): Promise<UserActionResult> {
  const me = await requireUser("admin");
  const id = Number(form.get("id"));
  const op = String(form.get("op"));
  if (!Number.isInteger(id)) return { error: "Unknown account." };
  const conn = await db();
  const [u] = await conn.query<{ id: number; email: string; name: string; role: Role; disabled: boolean }>(
    "select id, email, name, role, disabled from admin_users where id = $1",
    [id],
  );
  if (!u) return { error: "That account no longer exists." };

  if (op === "role") {
    const role = form.get("role");
    if (!isRole(role)) return { error: "Choose a role." };
    if (u.id === me.id && role !== "admin") return { error: "You can't remove your own administrator role." };
    if (u.role === "admin" && role !== "admin" && (await wouldLeaveNoAdmin(u.id))) return { error: "Keep at least one administrator." };
    await conn.query("update admin_users set role = $2 where id = $1", [id, role]);
    await logActivity(me.id, "user role changed", `user:${id}`, { from: u.role, to: role });
    revalidatePath("/admin/users");
    return { ok: `${u.name} is now ${roles[role]}.` };
  }

  if (op === "disable" || op === "enable") {
    const disable = op === "disable";
    if (u.id === me.id && disable) return { error: "You can't disable your own account." };
    if (disable && u.role === "admin" && (await wouldLeaveNoAdmin(u.id))) return { error: "Keep at least one administrator." };
    await conn.query("update admin_users set disabled = $2 where id = $1", [id, disable]);
    // Disabling signs them out everywhere at once.
    if (disable) await conn.query("delete from admin_sessions where user_id = $1", [id]);
    await logActivity(me.id, disable ? "user disabled" : "user enabled", `user:${id}`);
    revalidatePath("/admin/users");
    return { ok: `${u.name} ${disable ? "can no longer sign in" : "can sign in again"}.` };
  }

  if (op === "reset") {
    const link = await createToken(u.id, "reset", me.id);
    await logActivity(me.id, "password reset link created", `user:${id}`);
    return { ok: `Reset link for ${u.name}. It works once, for 72 hours.`, link, linkFor: u.email };
  }

  return { error: "Unknown action." };
}
