import "server-only";
import { del, put } from "@vercel/blob";
import { db } from "@/lib/db";

/*
 * Media library on Vercel Blob (Vercel → Storage → Blob, connected to the project, adds
 * BLOB_READ_WRITE_TOKEN). Files are public URLs; the media table keeps the list, alt text and source.
 */

export const blobConfigured = () => !!process.env.BLOB_READ_WRITE_TOKEN;

// Images only. SVG is excluded: it can carry scripts.
export const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
export const maxBytes = 4 * 1024 * 1024;

export type MediaRow = {
  id: number;
  url: string;
  filename: string;
  content_type: string | null;
  size: number | null;
  alt: string;
  source: "upload" | "wordpress";
  created_at: Date;
};

const safeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80) || "image";

export async function storeFile(
  file: { name: string; type: string; size: number; body: Blob | Buffer },
  opts: { userId?: number | null; alt?: string; source?: "upload" | "wordpress"; legacyUrl?: string },
): Promise<MediaRow> {
  if (!blobConfigured()) throw new Error("Media storage isn't connected yet (BLOB_READ_WRITE_TOKEN is missing).");
  if (!allowedTypes.includes(file.type)) throw new Error(`${file.name}: only JPG, PNG, WebP, GIF and AVIF images can be uploaded.`);
  if (file.size > maxBytes) throw new Error(`${file.name} is larger than 4 MB.`);
  const blob = await put(`media/${safeName(file.name)}`, file.body, { access: "public", contentType: file.type, addRandomSuffix: true });
  const [row] = await (await db()).query<MediaRow>(
    `insert into media (url, pathname, filename, content_type, size, alt, source, legacy_url, created_by)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
    [blob.url, blob.pathname, file.name.slice(0, 200), file.type, file.size, opts.alt ?? "", opts.source ?? "upload", opts.legacyUrl ?? null, opts.userId ?? null],
  );
  return row;
}

export async function listMedia(limit = 300) {
  return (await db()).query<MediaRow>("select * from media order by created_at desc, id desc limit $1", [limit]);
}

export async function deleteMedia(id: number) {
  const conn = await db();
  const [m] = await conn.query<{ url: string }>("select url from media where id = $1", [id]);
  if (!m) return;
  // Detach from portfolio items first; posts and team photos are detached by the foreign key.
  await conn.query("update portfolio set media_ids = array_remove(media_ids, $1)", [id]);
  await conn.query("delete from media where id = $1", [id]);
  if (blobConfigured()) await del(m.url).catch((e) => console.error("[media] blob delete failed:", e));
}
