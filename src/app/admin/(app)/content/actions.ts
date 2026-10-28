"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity, requireUser } from "@/lib/admin/auth";
import { isCollection } from "@/lib/admin/collections";
import { deleteItem, saveItem } from "@/lib/admin/content";
import { db } from "@/lib/db";

export type ContentResult = { ok?: string; error?: string };

// Content can show on several public pages (and /blog, /our-work only exist once something is
// published), so refresh the whole public site. It's small; this costs one re-render per page.
function refresh(type: string) {
  revalidatePath(`/admin/content/${type}`);
  revalidatePath("/", "layout");
}

export async function saveContent(_: ContentResult, form: FormData): Promise<ContentResult> {
  const me = await requireUser("staff");
  const type = form.get("type");
  if (!isCollection(type)) return { error: "Unknown content type." };
  const rawId = String(form.get("id") ?? "");
  const id = rawId === "new" ? null : Number(rawId);
  if (id !== null && !Number.isInteger(id)) return { error: "Unknown item." };
  const r = await saveItem(type, id, form, me.id);
  if ("error" in r && r.error) return { error: r.error };
  await logActivity(me.id, id ? "content updated" : "content created", `${type}:${r.id}`, { status: form.get("status") });
  refresh(type);
  if (!id) redirect(`/admin/content/${type}/${r.id}?saved=1`);
  return { ok: form.get("status") === "published" ? "Saved and published." : "Saved as a draft." };
}

export async function deleteContent(form: FormData) {
  const me = await requireUser("staff");
  const type = form.get("type");
  const id = Number(form.get("id"));
  if (!isCollection(type) || !Number.isInteger(id)) return;
  await deleteItem(type, id);
  await logActivity(me.id, "content deleted", `${type}:${id}`);
  refresh(type);
  redirect(`/admin/content/${type}?deleted=1`);
}

export async function moderateComment(form: FormData) {
  const me = await requireUser("staff");
  const id = Number(form.get("id"));
  const to = String(form.get("to"));
  if (!Number.isInteger(id) || !["approved", "pending", "spam", "trash"].includes(to)) return;
  const conn = await db();
  if (to === "trash" && form.get("purge") === "1") await conn.query("delete from comments where id = $1", [id]);
  else await conn.query("update comments set status = $2 where id = $1", [id, to]);
  await logActivity(me.id, `comment ${to}`, `comment:${id}`);
  revalidatePath("/admin/comments");
  revalidatePath("/", "layout");
}

export async function bulkComments(form: FormData) {
  const me = await requireUser("staff");
  const op = String(form.get("op"));
  const conn = await db();
  // Emptying spam/trash is permanent, so it's limited to those two lists.
  if (op === "empty-spam" || op === "empty-trash") {
    const status = op === "empty-spam" ? "spam" : "trash";
    const gone = await conn.query("delete from comments where status = $1 returning id", [status]);
    await logActivity(me.id, `comments ${status} emptied`, undefined, { count: gone.length });
  }
  revalidatePath("/admin/comments");
}
