/*
 * Imports the old WordPress site from an UpdraftPlus backup:
 *   users (with their existing password hashes), posts, comments, portfolio, team, testimonials,
 *   and the media library (uploaded to Vercel Blob).
 *
 *   npm run import:wp-backup -- --db "<…-db.gz>" [--uploads "<folder unzipped from …-uploads.zip>"] [--dry-run]
 *
 * Rules: everything content-like arrives as a DRAFT (nothing goes live until someone publishes it);
 * existing accounts in the new admin are never overwritten; re-running skips what's already there
 * (matched by WordPress id). Theme pages, demo "services" and client logos aren't imported: the
 * new site's pages and services are built differently. Stop `npm run dev` first if using the local database.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import TurndownService from "turndown";
import { connect } from "../src/lib/db/core.ts";

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const dbFile = arg("db");
const uploadsDir = arg("uploads");
const dryRun = process.argv.includes("--dry-run");
if (!dbFile || !existsSync(dbFile)) {
  console.error('Usage: npm run import:wp-backup -- --db "<backup…-db.gz>" [--uploads "<unzipped uploads folder>"] [--dry-run]');
  process.exit(1);
}

// ---------- 1. Read the SQL dump ----------

const raw = readFileSync(dbFile);
const sql = (dbFile.endsWith(".gz") ? gunzipSync(raw) : raw).toString("utf8");
const prefix = sql.match(/CREATE TABLE `([A-Za-z0-9_]*?)users`/)?.[1];
if (prefix === undefined) {
  console.error("Couldn't find the WordPress users table in this file. Is it the UpdraftPlus database backup (…-db.gz)?");
  process.exit(1);
}

function columnsOf(table: string): string[] {
  const m = sql.match(new RegExp("CREATE TABLE `" + table + "` \\(([\\s\\S]*?)\\n\\)"));
  if (!m) return [];
  return [...m[1].matchAll(/^\s*`([^`]+)`/gm)].map((x) => x[1]);
}

/** Every row of every INSERT INTO `table` (MySQL dump syntax, extended inserts included). */
function rowsOf(table: string): Record<string, string | null>[] {
  const out: Record<string, string | null>[] = [];
  const defaultCols = columnsOf(table);
  const re = new RegExp("INSERT INTO `" + table + "`\\s*(\\(([^)]*)\\))?\\s*VALUES\\s*", "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    const cols = m[2] ? m[2].split(",").map((c) => c.trim().replace(/`/g, "")) : defaultCols;
    let i = re.lastIndex;
    for (;;) {
      while (/\s/.test(sql[i])) i++;
      if (sql[i] !== "(") break;
      i++;
      const values: (string | null)[] = [];
      for (;;) {
        while (sql[i] === " ") i++;
        if (sql[i] === "'") {
          let s = "";
          i++;
          for (;;) {
            const ch = sql[i];
            if (ch === "\\") {
              const n = sql[i + 1];
              s += n === "n" ? "\n" : n === "r" ? "\r" : n === "t" ? "\t" : n === "0" ? "\0" : n === "Z" ? "\x1a" : n;
              i += 2;
            } else if (ch === "'" && sql[i + 1] === "'") {
              s += "'";
              i += 2;
            } else if (ch === "'") {
              i++;
              break;
            } else {
              s += ch;
              i++;
            }
          }
          values.push(s);
        } else {
          let j = i;
          while (sql[j] !== "," && sql[j] !== ")") j++;
          const tok = sql.slice(i, j).trim();
          values.push(tok.toUpperCase() === "NULL" ? null : tok);
          i = j;
        }
        if (sql[i] === ",") {
          i++;
          continue;
        }
        if (sql[i] === ")") {
          i++;
          break;
        }
      }
      out.push(Object.fromEntries(cols.map((c, k) => [c, values[k] ?? null])));
      while (/\s/.test(sql[i])) i++;
      if (sql[i] === ",") {
        i++;
        continue;
      }
      break; // ";" ends the statement
    }
    re.lastIndex = i;
  }
  return out;
}

const T = (t: string) => prefix + t;
const users = rowsOf(T("users"));
const usermeta = rowsOf(T("usermeta"));
const posts = rowsOf(T("posts"));
const postmeta = rowsOf(T("postmeta"));
const comments = rowsOf(T("comments"));
const meta = (postId: string, key: string) => postmeta.find((m) => m.post_id === postId && m.meta_key === key)?.meta_value ?? null;
const gmt = (d: string | null) => (d && !d.startsWith("0000") ? new Date(`${d.replace(" ", "T")}Z`) : new Date());
console.log(`Read ${users.length} users, ${posts.length} posts/pages/attachments, ${comments.length} comments (table prefix "${prefix}").`);

// ---------- 2. Helpers ----------

const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });
const toMarkdown = (html: string) =>
  td
    .turndown(
      html
        .replace(/<!--[\s\S]*?-->/g, "") // block editor comments
        .replace(/\[\/?[a-z_][^\]]*\]/gi, ""), // shortcodes
    )
    .trim();
const toText = (html: string) =>
  toMarkdown(html)
    .replace(/[#*_>`]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
const roleOf = (caps: string | null) => {
  const r = caps?.match(/"(administrator|editor|author|contributor|subscriber|shop_manager)";b:1/)?.[1];
  return r === "administrator" ? "admin" : r === "editor" || r === "author" || r === "shop_manager" ? "staff" : "viewer";
};

type Report = Record<string, { found: number; imported: number; skipped: number; notes: string[] }>;
const report: Report = {};
const rep = (k: string) => (report[k] ??= { found: 0, imported: 0, skipped: 0, notes: [] });

const db = await connect();
const mediaIds = new Map<string, number>(); // WP attachment id → media id

// ---------- 3. Media (needs Vercel Blob) ----------

const attachments = posts.filter((p) => p.post_type === "attachment" && (p.post_mime_type ?? "").startsWith("image/"));
rep("media").found = attachments.length;
for (const a of attachments) {
  const [existing] = await db.query<{ id: number }>("select id from media where legacy_url = $1", [a.guid]);
  if (existing) {
    mediaIds.set(a.ID!, existing.id);
    rep("media").skipped++;
    continue;
  }
  const rel = meta(a.ID!, "_wp_attached_file");
  const file = rel && uploadsDir ? [join(uploadsDir, rel), join(uploadsDir, "uploads", rel)].find(existsSync) : undefined;
  if (!file) {
    rep("media").notes.push(`${rel ?? a.guid}: file not found${uploadsDir ? "" : " (no --uploads folder given)"}`);
    continue;
  }
  const type = a.post_mime_type!;
  if (type === "image/svg+xml") {
    rep("media").notes.push(`${rel}: SVG skipped (can carry scripts)`);
    continue;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    rep("media").notes.push("BLOB_READ_WRITE_TOKEN not set: media not uploaded");
    break;
  }
  if (dryRun) {
    rep("media").imported++;
    continue;
  }
  try {
    const { put } = await import("@vercel/blob");
    const buf = readFileSync(file);
    if (buf.length > 4 * 1024 * 1024) {
      rep("media").notes.push(`${rel}: over 4 MB, skipped`);
      continue;
    }
    const name = (rel ?? file).split(/[\\/]/).pop()!;
    const blob = await put(`media/${name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-")}`, buf, { access: "public", contentType: type, addRandomSuffix: true });
    const alt = meta(a.ID!, "_wp_attachment_image_alt") ?? a.post_title ?? "";
    const [row] = await db.query<{ id: number }>(
      `insert into media (url, pathname, filename, content_type, size, alt, source, legacy_url, created_at)
       values ($1, $2, $3, $4, $5, $6, 'wordpress', $7, $8) returning id`,
      [blob.url, blob.pathname, name, type, buf.length, alt.slice(0, 200), a.guid, gmt(a.post_date_gmt)],
    );
    mediaIds.set(a.ID!, row.id);
    rep("media").imported++;
  } catch (err) {
    rep("media").notes.push(`${rel}: ${(err as Error).message}`);
  }
}
const thumb = (postId: string) => mediaIds.get(meta(postId, "_thumbnail_id") ?? "") ?? null;

// ---------- 4. Users (keeping their WordPress password hashes) ----------

for (const u of users) {
  const r = rep("users");
  r.found++;
  const email = (u.user_email ?? "").trim().toLowerCase();
  const caps = usermeta.find((m) => m.user_id === u.ID && m.meta_key === `${prefix}capabilities`)?.meta_value ?? null;
  const role = roleOf(caps);
  const [byEmail] = await db.query<{ id: number; source: string }>("select id, source from admin_users where email = $1", [email]);
  if (byEmail) {
    // Never replace the password of an account made in the new admin; just record the old username.
    if (!dryRun) await db.query("update admin_users set username = coalesce(username, $2) where id = $1", [byEmail.id, u.user_login]);
    r.skipped++;
    r.notes.push(`${u.user_login} <${email}>: account already exists, kept as is (username linked)`);
    continue;
  }
  if (!email.includes("@") || !u.user_pass) {
    r.notes.push(`${u.user_login}: no email or password, skipped`);
    continue;
  }
  if (!dryRun)
    await db.query(
      `insert into admin_users (email, name, username, password_hash, role, source, created_at)
       values ($1, $2, $3, $4, $5, 'wordpress', $6)
       on conflict (username) do nothing`,
      [email, u.display_name || u.user_login, u.user_login, u.user_pass, role, gmt(u.user_registered)],
    );
  r.imported++;
  r.notes.push(`${u.user_login} <${email}> → ${role}`);
}

// ---------- 5. Posts, portfolio, team, testimonials (all as drafts) ----------

const postIds = new Map<string, number>();
async function insertOnce(kind: string, table: string, legacyId: string, cols: Record<string, unknown>) {
  const r = rep(kind);
  r.found++;
  const [ex] = await db.query<{ id: number }>(`select id from ${table} where legacy_id = $1`, [Number(legacyId)]);
  if (ex) {
    r.skipped++;
    return ex.id;
  }
  if (dryRun) {
    r.imported++;
    return null;
  }
  const keys = Object.keys(cols);
  const [row] = await db.query<{ id: number }>(
    `insert into ${table} (${[...keys, "legacy_id"].join(", ")}) values (${keys.map((_, i) => `$${i + 1}`).join(", ")}, $${keys.length + 1}) returning id`,
    [...keys.map((k) => cols[k]), Number(legacyId)],
  );
  r.imported++;
  return row.id;
}

const live = (p: Record<string, string | null>) => !["auto-draft", "inherit", "trash"].includes(p.post_status ?? "");
const uniqueSlug = async (table: string, base: string) => {
  let s = base || `item-${Date.now()}`;
  for (let i = 2; (await db.query(`select 1 from ${table} where slug = $1`, [s])).length; i++) s = `${base}-${i}`;
  return s;
};

for (const p of posts.filter((p) => p.post_type === "post" && live(p))) {
  const id = await insertOnce("posts", "posts", p.ID!, {
    slug: await uniqueSlug("posts", p.post_name ?? ""),
    title: p.post_title || "(untitled)",
    excerpt: toText(p.post_excerpt ?? "").slice(0, 400),
    body: toMarkdown(p.post_content ?? ""),
    status: "draft",
    cover_media_id: thumb(p.ID!),
    comments_open: p.comment_status === "open",
    created_at: gmt(p.post_date_gmt),
    updated_at: gmt(p.post_modified_gmt),
  });
  if (id) postIds.set(p.ID!, id);
}

for (const p of posts.filter((p) => p.post_type === "tm_portfolio" && live(p))) {
  const t = thumb(p.ID!);
  await insertOnce("portfolio", "portfolio", p.ID!, {
    slug: await uniqueSlug("portfolio", p.post_name ?? ""),
    title: p.post_title || "(untitled)",
    description: toText(p.post_excerpt || p.post_content || "").slice(0, 2000),
    media_ids: t ? [t] : [],
    status: "draft",
    sort: Number(p.menu_order) || 0,
    created_at: gmt(p.post_date_gmt),
  });
}

for (const p of posts.filter((p) => p.post_type === "tm_team_member" && live(p))) {
  const roleMeta = postmeta.find((m) => m.post_id === p.ID && /(position|designation|job|role)/i.test(m.meta_key ?? "") && !(m.meta_key ?? "").startsWith("_"))?.meta_value;
  await insertOnce("team", "team", p.ID!, {
    name: p.post_title || "(no name)",
    role_title: (roleMeta ?? "").slice(0, 120),
    bio: toText(p.post_content ?? "").slice(0, 2000),
    photo_media_id: thumb(p.ID!),
    status: "draft",
    sort: Number(p.menu_order) || 0,
    created_at: gmt(p.post_date_gmt),
  });
}

for (const p of posts.filter((p) => p.post_type === "tm_testimonial" && live(p))) {
  const body = toText(p.post_content || p.post_excerpt || "");
  await insertOnce("testimonials", "testimonials", p.ID!, {
    author: p.post_title || "(no name)",
    body: body || "(empty)",
    source: "old website (theme demo content?)",
    status: "draft",
    sort: Number(p.menu_order) || 0,
    created_at: gmt(p.post_date_gmt),
  });
}

// ---------- 6. Comments ----------

const statusOf = (a: string | null) => (a === "1" ? "approved" : a === "spam" ? "spam" : a === "trash" ? "trash" : "pending");
for (const c of comments) {
  // Comments on posts keep their link; comments on pages or demo content have no post here.
  const postId = postIds.get(c.comment_post_ID ?? "") ?? null;
  if (c.comment_type && !["comment", ""].includes(c.comment_type)) {
    rep("comments").found++;
    rep("comments").skipped++;
    continue;
  }
  await insertOnce("comments", "comments", c.comment_ID!, {
    post_id: postId,
    author_name: (c.comment_author || "(anonymous)").slice(0, 80),
    author_email: c.comment_author_email || null,
    body: (c.comment_content ?? "").slice(0, 3000) || "(empty)",
    status: statusOf(c.comment_approved),
    ip: c.comment_author_IP || null,
    user_agent: (c.comment_agent ?? "").slice(0, 300) || null,
    created_at: gmt(c.comment_date_gmt),
  });
}

// ---------- 7. What wasn't imported, and why ----------

const count = (t: string) => posts.filter((p) => p.post_type === t && live(p)).length;
const notImported = {
  "pages (the new site's pages are built in code)": count("page"),
  "theme demo services (tm_service)": count("tm_service"),
  "client logos": posts.filter((p) => /client|logo/i.test(p.post_type ?? "") && live(p)).length,
  "Elementor templates": count("elementor_library"),
};

console.log(dryRun ? "\nDRY RUN (nothing written)\n" : "\nImport report\n");
console.table(Object.fromEntries(Object.entries(report).map(([k, v]) => [k, { found: v.found, imported: v.imported, "already there / kept": v.skipped }])));
for (const [k, v] of Object.entries(report)) {
  if (!v.notes.length) continue;
  console.log(`\n${k}:`);
  const shown = v.notes.slice(0, 25);
  for (const n of shown) console.log(`  - ${n}`);
  if (v.notes.length > shown.length) console.log(`  … and ${v.notes.length - shown.length} more`);
}
console.log("\nNot imported:");
for (const [k, n] of Object.entries(notImported)) if (n) console.log(`  - ${n} ${k}`);
await db.close();
