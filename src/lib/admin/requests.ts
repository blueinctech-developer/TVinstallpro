import "server-only";
import { db } from "@/lib/db";
import { customerFor } from "./matching.ts";
import { openStatuses, type Kind, type Status } from "./vocab";

/*
 * Data access for requests (bookings, contact and partner enquiries) and customers.
 * Callers in the admin must check the signed-in user's role first (see ./auth.ts).
 */

export type RequestRow = {
  id: number;
  kind: Kind;
  service: string | null;
  status: Status;
  customer_id: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  area: string | null;
  summary: string;
  details: Record<string, unknown>;
  estimate: string | null;
  preferred_date: string | null;
  source: "website" | "wordpress";
  legacy_form_id: number | null;
  legacy_entry_id: number | null;
  submitted_at: Date;
  updated_at: Date;
  seen_at: Date | null;
};

export type EventRow = {
  id: number;
  type: "created" | "imported" | "status" | "note";
  body: string | null;
  from_status: Status | null;
  to_status: Status | null;
  actor_name: string | null;
  created_at: Date;
};

export type CustomerRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  area: string | null;
  created_at: Date;
  updated_at: Date;
  request_count: number;
  last_request_at: Date | null;
};

export type NewRequest = {
  kind: Kind;
  name: string;
  email: string;
  phone: string;
  summary: string;
  details: Record<string, unknown>;
  ip?: string | null;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Stores a website submission. The caller tells the visitor it was received only after this resolves. */
export async function createRequest(r: NewRequest): Promise<number> {
  const d = r.details;
  const estimate = typeof d.estimate === "number" && Number.isFinite(d.estimate) ? d.estimate : null;
  const date = str(d.date);
  return (await db()).transaction(async (tx) => {
    const customerId = await customerFor(tx.query, { name: r.name, email: r.email, phone: r.phone, area: str(d.area) });
    const [row] = await tx.query<{ id: number }>(
      `insert into requests (kind, service, customer_id, name, email, phone, area, summary, details, estimate, preferred_date, ip)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) returning id`,
      [
        r.kind,
        str(d.service),
        customerId,
        r.name,
        r.email,
        r.phone,
        str(d.area) ?? str(d.address),
        r.summary,
        JSON.stringify(d),
        estimate,
        date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
        r.ip ?? null,
      ],
    );
    await tx.query("insert into request_events (request_id, type) values ($1, 'created')", [row.id]);
    return row.id;
  });
}

export type RequestFilters = {
  kind?: Kind;
  status?: Status | "open";
  q?: string;
  customer?: number;
  page?: number;
};

export const pageSize = 25;

function where(f: RequestFilters) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  if (f.kind) clauses.push(`kind = ${p(f.kind)}`);
  if (f.status === "open") clauses.push(`status = any(${p(openStatuses)})`);
  else if (f.status) clauses.push(`status = ${p(f.status)}`);
  if (f.customer) clauses.push(`customer_id = ${p(f.customer)}`);
  if (f.q?.trim()) {
    const like = p(`%${f.q.trim().toLowerCase()}%`);
    clauses.push(`(lower(name) like ${like} or lower(coalesce(email, '')) like ${like} or coalesce(phone, '') like ${like}
      or lower(coalesce(area, '')) like ${like} or lower(summary) like ${like})`);
  }
  return { sql: clauses.length ? `where ${clauses.join(" and ")}` : "", params };
}

export async function listRequests(f: RequestFilters) {
  const page = Math.max(1, f.page ?? 1);
  const w = where(f);
  const conn = await db();
  const [rows, [{ total }]] = await Promise.all([
    conn.query<RequestRow>(
      `select * from requests ${w.sql} order by submitted_at desc, id desc limit ${pageSize} offset ${(page - 1) * pageSize}`,
      w.params,
    ),
    conn.query<{ total: number }>(`select count(*)::int as total from requests ${w.sql}`, w.params),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Every matching row, for CSV export. */
export async function allRequests(f: Omit<RequestFilters, "page">) {
  const w = where(f);
  return (await db()).query<RequestRow>(`select * from requests ${w.sql} order by submitted_at desc, id desc`, w.params);
}

export async function getRequest(id: number) {
  const conn = await db();
  const [req] = await conn.query<RequestRow>("select * from requests where id = $1", [id]);
  if (!req) return null;
  const [events, related] = await Promise.all([
    conn.query<EventRow>(
      `select e.*, u.name as actor_name from request_events e left join admin_users u on u.id = e.actor_id
        where e.request_id = $1 order by e.created_at, e.id`,
      [id],
    ),
    req.customer_id
      ? conn.query<RequestRow>(
          "select * from requests where customer_id = $1 and id <> $2 order by submitted_at desc limit 20",
          [req.customer_id, id],
        )
      : Promise.resolve([]),
  ]);
  return { req, events, related };
}

export async function markSeen(id: number) {
  await (await db()).query("update requests set seen_at = now() where id = $1 and seen_at is null", [id]);
}

/** Changes status and records who did it. Returns false if the request had already changed (stale page). */
export async function setStatus(id: number, from: Status, to: Status, actorId: number) {
  return (await db()).transaction(async (tx) => {
    const done = await tx.query(
      "update requests set status = $3, updated_at = now() where id = $1 and status = $2 returning id",
      [id, from, to],
    );
    if (!done.length) return false;
    await tx.query(
      "insert into request_events (request_id, type, from_status, to_status, actor_id) values ($1, 'status', $2, $3, $4)",
      [id, from, to, actorId],
    );
    return true;
  });
}

export async function addNote(id: number, body: string, actorId: number) {
  await (await db()).transaction(async (tx) => {
    await tx.query("insert into request_events (request_id, type, body, actor_id) values ($1, 'note', $2, $3)", [id, body, actorId]);
    await tx.query("update requests set updated_at = now() where id = $1", [id]);
  });
}

export async function overview() {
  const conn = await db();
  const [counts, recent, upcoming] = await Promise.all([
    conn.query<{ status: Status; kind: Kind; n: number; unseen: number }>(
      `select status, kind, count(*)::int as n, count(*) filter (where seen_at is null)::int as unseen
         from requests group by status, kind`,
    ),
    conn.query<RequestRow>(
      `select * from requests where status <> all($1) order by submitted_at desc limit 8`,
      [["spam", "legacy"]],
    ),
    conn.query<RequestRow>(
      `select * from requests where status = 'scheduled' and preferred_date >= to_char(now(), 'YYYY-MM-DD')
        order by preferred_date limit 8`,
    ),
  ]);
  return { counts, recent, upcoming };
}

export async function listCustomers(q: string | undefined, page = 1) {
  const params: unknown[] = [];
  let filter = "";
  if (q?.trim()) {
    params.push(`%${q.trim().toLowerCase()}%`);
    filter = `where lower(c.name) like $1 or lower(coalesce(c.email, '')) like $1 or coalesce(c.phone, '') like $1`;
  }
  const conn = await db();
  const base = `from customers c ${filter}`;
  const [rows, [{ total }]] = await Promise.all([
    conn.query<CustomerRow>(
      `select c.*, (select count(*)::int from requests r where r.customer_id = c.id) as request_count,
              (select max(submitted_at) from requests r where r.customer_id = c.id) as last_request_at
         ${base} order by last_request_at desc nulls last, c.id desc
        limit ${pageSize} offset ${(Math.max(1, page) - 1) * pageSize}`,
      params,
    ),
    conn.query<{ total: number }>(`select count(*)::int as total ${base}`, params),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getCustomer(id: number) {
  const conn = await db();
  const [c] = await conn.query<CustomerRow>(
    `select c.*, 0 as request_count, null as last_request_at from customers c where c.id = $1`,
    [id],
  );
  if (!c) return null;
  const requests = await conn.query<RequestRow>("select * from requests where customer_id = $1 order by submitted_at desc", [id]);
  // Possible duplicates: same name but different contact details. Shown for review, never merged automatically.
  const similar = await conn.query<{ id: number; name: string; email: string | null; phone: string | null }>(
    "select id, name, email, phone from customers where id <> $1 and lower(name) = lower($2) limit 10",
    [id, c.name],
  );
  return { customer: c, requests, similar };
}
