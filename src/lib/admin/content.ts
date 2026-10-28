import "server-only";
import { db } from "@/lib/db";
import { services } from "@/lib/content";
import { collections, slugify, type CollectionKey, type Field } from "./collections";

/*
 * Data access for Admin → Content. Column names come only from the fixed field lists in
 * ./collections, never from user input, so the SQL built here is safe.
 */

export type Row = Record<string, unknown> & { id: number; status: "draft" | "published"; updated_at: Date };

export async function listItems(type: CollectionKey) {
  const c = collections[type];
  return (await db()).query<Row>(`select * from ${c.table} order by ${c.order}`);
}

export async function getItem(type: CollectionKey, id: number) {
  const [row] = await (await db()).query<Row>(`select * from ${collections[type].table} where id = $1`, [id]);
  return row ?? null;
}

function parse(f: Field, form: FormData): { value?: unknown; error?: string } {
  const raw = form.get(f.name);
  const s = String(raw ?? "").trim();
  switch (f.type) {
    case "checkbox":
      return { value: raw === "on" };
    case "number": {
      if (!s) return { value: f.name === "sort" ? 0 : null };
      const n = Number(s);
      if (!Number.isInteger(n) || (f.min !== undefined && n < f.min) || (f.max !== undefined && n > f.max))
        return { error: `${f.label}: enter a whole number between ${f.min} and ${f.max}.` };
      return { value: n };
    }
    case "image": {
      const n = Number(s);
      return { value: s && Number.isInteger(n) ? n : null };
    }
    case "images":
      return { value: form.getAll(f.name).map(Number).filter(Number.isInteger) };
    case "service":
      return { value: services.some((x) => x.slug === s) ? s : null };
    case "slug":
      return { value: slugify(s) };
    default:
      if (f.required && !s) return { error: `${f.label} is required.` };
      if (f.max && s.length > f.max) return { error: `${f.label} is too long (max ${f.max} characters).` };
      return { value: f.type === "markdown" || f.type === "textarea" ? String(raw ?? "").slice(0, f.max ?? 100000) : s };
  }
}

/** Creates (id null) or updates an item. Returns its id. */
export async function saveItem(type: CollectionKey, id: number | null, form: FormData, userId: number) {
  const c = collections[type];
  const values: Record<string, unknown> = {};
  for (const f of c.fields) {
    const r = parse(f, form);
    if (r.error) return { error: r.error };
    values[f.name] = r.value;
  }
  const status = form.get("status") === "published" ? "published" : "draft";
  values.status = status;

  const conn = await db();
  if ("slug" in values) {
    let slug = (values.slug as string) || slugify(String(values[c.titleField] ?? "")) || `${c.singular.replace(/\s+/g, "-")}-${Date.now()}`;
    // Keep web addresses unique: add -2, -3… if needed.
    for (let i = 2; ; i++) {
      const clash = await conn.query(`select 1 from ${c.table} where slug = $1 and id <> $2`, [slug, id ?? 0]);
      if (!clash.length) break;
      slug = `${(values.slug as string) || slugify(String(values[c.titleField]))}-${i}`;
    }
    values.slug = slug;
  }

  const cols = Object.keys(values);
  const params: unknown[] = cols.map((k) => values[k]);
  // Posts: the first publish stamps published_at; going back to draft keeps the date.
  const firstPublish = type === "posts" && status === "published";
  if (id) {
    const sets = cols.map((k, i) => `${k} = $${i + 1}`);
    if (firstPublish) sets.push("published_at = coalesce(published_at, now())");
    params.push(id);
    const done = await conn.query<{ id: number }>(
      `update ${c.table} set ${sets.join(", ")}, updated_at = now() where id = $${params.length} returning id`,
      params,
    );
    return done.length ? { id } : { error: "That item no longer exists." };
  }
  const placeholders = cols.map((_, i) => `$${i + 1}`);
  if (type === "posts") {
    cols.push("author_id");
    params.push(userId);
    placeholders.push(`$${params.length}`);
    if (firstPublish) {
      cols.push("published_at");
      placeholders.push("now()");
    }
  }
  const [row] = await conn.query<{ id: number }>(
    `insert into ${c.table} (${cols.join(", ")}) values (${placeholders.join(", ")}) returning id`,
    params,
  );
  return { id: row.id };
}

export async function deleteItem(type: CollectionKey, id: number) {
  await (await db()).query(`delete from ${collections[type].table} where id = $1`, [id]);
}
