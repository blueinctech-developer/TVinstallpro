"use server";

import { revalidatePath } from "next/cache";
import { logActivity, requireUser } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { deleteMedia, storeFile } from "@/lib/media";

export type MediaResult = { ok?: string; error?: string };

export async function uploadMedia(_: MediaResult, f: FormData): Promise<MediaResult> {
  const me = await requireUser("staff");
  const files = f.getAll("files").filter((x): x is File => x instanceof File && x.size > 0);
  if (!files.length) return { error: "Choose one or more images." };
  const done: string[] = [];
  const failed: string[] = [];
  for (const file of files.slice(0, 10)) {
    try {
      await storeFile({ name: file.name, type: file.type, size: file.size, body: file }, { userId: me.id });
      done.push(file.name);
    } catch (err) {
      failed.push((err as Error).message);
    }
  }
  if (done.length) await logActivity(me.id, "media uploaded", undefined, { files: done.length });
  revalidatePath("/admin/media");
  if (failed.length) return { error: `${done.length} uploaded. Not uploaded: ${failed.join(" ")}` };
  return { ok: `${done.length} ${done.length === 1 ? "image" : "images"} uploaded.` };
}

export async function updateMedia(_: MediaResult, f: FormData): Promise<MediaResult> {
  const me = await requireUser("staff");
  const id = Number(f.get("id"));
  if (!Number.isInteger(id)) return { error: "Unknown image." };
  if (f.get("op") === "delete") {
    await deleteMedia(id);
    await logActivity(me.id, "media deleted", `media:${id}`);
    revalidatePath("/admin/media");
    revalidatePath("/", "layout");
    return { ok: "Deleted." };
  }
  const alt = String(f.get("alt") ?? "").trim().slice(0, 200);
  await (await db()).query("update media set alt = $2 where id = $1", [id, alt]);
  revalidatePath("/admin/media");
  return { ok: "Saved." };
}
