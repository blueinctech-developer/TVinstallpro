"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { endSession, logActivity, requireUser, startSession, currentUser } from "@/lib/admin/auth";
import { dummyHash, verifyPassword } from "@/lib/admin/password";
import { addNote, setStatus } from "@/lib/admin/requests";
import { isStatus } from "@/lib/admin/vocab";
import { db } from "@/lib/db";
import { allow, clientIp } from "@/lib/rate-limit";

export type LoginState = { error?: string; email?: string };

const SIGN_IN_FAILED = "That email and password don't match an active account.";

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(form.get("password") ?? "").slice(0, 500);
  if (!email || !password) return { error: "Enter your email and password.", email };

  const ip = clientIp(await headers());
  // Per IP and per account, so one attacker can't lock everyone out and can't spray one account.
  const ok = (await allow(`login-ip:${ip}`, 20, 900)) && (await allow(`login-email:${email}`, 8, 900));
  if (!ok) return { error: "Too many sign-in attempts. Wait 15 minutes and try again.", email };

  const [user] = await (await db()).query<{ id: number; password_hash: string; disabled: boolean }>(
    "select id, password_hash, disabled from admin_users where email = $1",
    [email],
  );
  const valid = await verifyPassword(password, user?.password_hash ?? dummyHash);
  if (!user || !valid || user.disabled) {
    await logActivity(user?.id ?? null, "sign-in failed", email, { ip });
    return { error: SIGN_IN_FAILED, email };
  }
  await startSession(user.id);
  await logActivity(user.id, "signed in", undefined, { ip });
  redirect("/admin");
}

export async function logout() {
  const u = await currentUser();
  await endSession();
  if (u) await logActivity(u.id, "signed out");
  redirect("/admin/login");
}

export type ActionResult = { ok?: string; error?: string };

export async function changeStatus(_: ActionResult, form: FormData): Promise<ActionResult> {
  const u = await requireUser("staff");
  const id = Number(form.get("id"));
  const from = form.get("from");
  const to = form.get("to");
  if (!Number.isInteger(id) || !isStatus(from) || !isStatus(to)) return { error: "Choose a status." };
  if (from === to) return { error: "That's already the status." };
  const done = await setStatus(id, from, to, u.id);
  if (!done) return { error: "Someone else changed this request a moment ago. Reload to see the latest." };
  await logActivity(u.id, "status changed", `request:${id}`, { from, to });
  revalidatePath(`/admin/requests/${id}`);
  return { ok: "Status updated." };
}

export async function addNoteAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const u = await requireUser("staff");
  const id = Number(form.get("id"));
  const body = String(form.get("body") ?? "").trim().slice(0, 4000);
  if (!Number.isInteger(id)) return { error: "Unknown request." };
  if (!body) return { error: "Write a note first." };
  await addNote(id, body, u.id);
  await logActivity(u.id, "note added", `request:${id}`);
  revalidatePath(`/admin/requests/${id}`);
  return { ok: "Note added." };
}
