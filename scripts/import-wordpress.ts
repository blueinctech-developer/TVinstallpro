/*
 * Imports the old WordPress site's Gravity Forms entries (CSV exports) into the database.
 *
 *   npm run import:wordpress -- "C:\path\to\gravity-forms" [--dry-run]
 *
 * Expects the files named gf<formId>-*.csv (as exported on 2026-10-28). Safe to run again:
 * entries already imported (same form + entry id) are skipped. Nothing is deleted or merged.
 * Every entry keeps its original submission date and answers; status is "legacy" (Old site),
 * because the old site never recorded whether a request was handled.
 * Local database: stop `npm run dev` first (only one process can open it).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { connect } from "../src/lib/db/core.ts";
import { customerFor } from "../src/lib/admin/matching.ts";

const dir = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
if (!dir || dir.startsWith("--")) {
  console.error('Usage: npm run import:wordpress -- "<folder with gf*.csv>" [--dry-run]');
  process.exit(1);
}

// Gravity Forms form id → what it was on the old site.
const forms: Record<number, { kind: "booking" | "contact" | "partner"; service?: string }> = {
  1: { kind: "booking", service: "tv-mounting" },
  2: { kind: "partner" },
  3: { kind: "booking", service: "tv-mounting" },
  7: { kind: "contact" },
  8: { kind: "booking", service: "mantel-mount" },
  9: { kind: "booking", service: "laser-tv" },
  10: { kind: "booking", service: "samsung-frame" },
  11: { kind: "booking", service: "blinds-curtains" },
  12: { kind: "booking", service: "garage-shelving" },
  13: { kind: "booking", service: "appliances" },
  14: { kind: "booking", service: "wallpaper" },
  15: { kind: "booking", service: "gazebos-sheds" },
};

// Gravity Forms columns that describe the entry rather than the customer's answers.
const META = new Set([
  "Created By (User Id)", "Entry Id", "Entry Date", "Date Updated", "Source Url", "Transaction Id",
  "Payment Amount", "Payment Date", "Payment Status", "Post Id", "User Agent", "User IP",
]);

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r" || text[i + 1] !== "\n") field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Answers in the form's own question order (an array, since jsonb doesn't keep object key order).
 * Repeated columns (one "Region" per province) keep the first non-empty value; the running
 * "Cost Estimate" totals are dropped, the final one is stored as the estimate.
 */
function answers(header: string[], cells: string[]): [string, string][] {
  const out = new Map<string, string>();
  header.forEach((h, i) => {
    const label = h.replace(/\s*\*\s*$/, "").trim() || "(unlabelled)";
    const v = (cells[i] ?? "").trim();
    if (!v || META.has(h) || label === "Cost Estimate" || out.has(label)) return;
    out.set(label, v);
  });
  return [...out];
}

const pick = (a: Record<string, string>, ...keys: string[]) => keys.map((k) => a[k]).find(Boolean) ?? "";

const files = readdirSync(dir).filter((f) => /^gf\d+-.*\.csv$/i.test(f)).sort((a, b) => parseInt(a.slice(2)) - parseInt(b.slice(2)));
if (!files.length) {
  console.error(`No gf<id>-*.csv files in ${dir}`);
  process.exit(1);
}

const db = await connect();
const report: { file: string; rows: number; imported: number; skipped: number; failed: number }[] = [];

for (const file of files) {
  const formId = parseInt(file.slice(2));
  const form = forms[formId];
  const rows = parseCsv(readFileSync(join(dir, file), "utf8").replace(/^\uFEFF/, ""));
  const [header, ...data] = rows;
  const col = (name: string) => header.indexOf(name);
  const r = { file, rows: data.length, imported: 0, skipped: 0, failed: 0 };
  report.push(r);
  if (!form) {
    console.error(`  ${file}: unknown form ${formId}, not imported`);
    r.failed = data.length;
    continue;
  }
  // Oldest first, so each customer's "created" date is their first request.
  data.sort((x, y) => (x[col("Entry Date")] ?? "").localeCompare(y[col("Entry Date")] ?? ""));

  for (const cells of data) {
    const entryId = Number(cells[col("Entry Id")]);
    try {
      if (cells.length !== header.length || !Number.isInteger(entryId)) throw new Error(`malformed row (${cells.length} of ${header.length} columns)`);
      const exists = await db.query("select 1 from requests where legacy_form_id = $1 and legacy_entry_id = $2", [formId, entryId]);
      if (exists.length) {
        r.skipped++;
        continue;
      }
      const list = answers(header, cells);
      const a = Object.fromEntries(list);
      const first = pick(a, "First Name", "Your Name (First)");
      const last = pick(a, "Last name", "Your Name (Last)");
      const name = [first, last].filter(Boolean).join(" ").trim() || "(no name)";
      const phone = pick(a, "Phone", "Your Phone") || null;
      const email = pick(a, "Email", "Your Email Address") || null;
      const region = a["Select Your Region"];
      const province = pick(a, "Select Your Province", "Your Address (State / Province)");
      const area = [region || a["Your Address (City)"], province].filter(Boolean).join(", ") || null;
      const message = pick(a, "Your Message", "Your Comments");
      const estimateCells = header.map((h, i) => (h === "Cost Estimate" ? cells[i] : "")).filter((v) => /^\d+(\.\d+)?$/.test(v ?? ""));
      const estimate = estimateCells.length ? Number(estimateCells[estimateCells.length - 1]) : null;
      // GF stores entry dates in UTC.
      const submitted = new Date(`${cells[col("Entry Date")].replace(" ", "T")}Z`);
      if (Number.isNaN(submitted.getTime())) throw new Error("bad Entry Date");
      const details = {
        answers: list,
        _legacy: {
          form_id: formId,
          entry_id: entryId,
          entry_date: cells[col("Entry Date")],
          source_url: cells[col("Source Url")] || null,
          user_agent: cells[col("User Agent")] || null,
          ip: cells[col("User IP")] || null,
        },
      };
      if (dryRun) {
        r.imported++;
        continue;
      }
      await db.transaction(async (tx) => {
        const customerId = name === "(no name)" && !phone && !email ? null : await customerFor(tx.query, { name, email, phone, area }, submitted);
        const [row] = await tx.query<{ id: number }>(
          `insert into requests (kind, service, status, customer_id, name, email, phone, area, summary, details, estimate,
                                 source, legacy_form_id, legacy_entry_id, ip, submitted_at, updated_at)
           values ($1, $2, 'legacy', $3, $4, $5, $6, $7, $8, $9, $10, 'wordpress', $11, $12, $13, $14, $14) returning id`,
          [form.kind, form.service ?? null, customerId, name, email, phone, area, message, JSON.stringify(details), estimate, formId, entryId,
            cells[col("User IP")] || null, submitted],
        );
        await tx.query("insert into request_events (request_id, type, body) values ($1, 'imported', $2)", [
          row.id,
          `Imported from the old site (Gravity Forms #${formId}, entry ${entryId})`,
        ]);
      });
      r.imported++;
    } catch (err) {
      r.failed++;
      console.error(`  ${file} entry ${entryId}: ${(err as Error).message}`);
    }
  }
}

const total = (k: "rows" | "imported" | "skipped" | "failed") => report.reduce((n, r) => n + r[k], 0);
console.log(dryRun ? "\nDry run (nothing written):" : "\nImport report:");
console.table(report);
console.log(`Rows in CSVs: ${total("rows")} · imported: ${total("imported")} · already there: ${total("skipped")} · failed: ${total("failed")}`);
if (!dryRun) {
  const [c] = await db.query<{ requests: number; customers: number }>(
    "select (select count(*)::int from requests where source = 'wordpress') as requests, (select count(*)::int from customers) as customers",
  );
  console.log(`Database now holds ${c.requests} old-site requests and ${c.customers} customers.`);
}
await db.close();
process.exit(total("failed") ? 1 : 0);
