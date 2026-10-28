import { currentUser, logActivity } from "@/lib/admin/auth";
import { allRequests } from "@/lib/admin/requests";
import { isKind, isStatus, roleAtLeast } from "@/lib/admin/vocab";

/** CSV of the requests matching the list's filters. Staff and administrators only; every export is logged. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user || !roleAtLeast(user.role, "staff")) return new Response("Not allowed", { status: 403 });

  const sp = new URL(req.url).searchParams;
  const kind = sp.get("kind");
  const status = sp.get("status");
  const filters = {
    kind: isKind(kind) ? kind : undefined,
    status: status === "open" || isStatus(status) ? (status as "open") : undefined,
    q: sp.get("q")?.slice(0, 100) || undefined,
  };
  const rows = await allRequests(filters);

  const cols = ["id", "submitted_at", "kind", "service", "status", "name", "phone", "email", "area", "estimate", "preferred_date", "source", "summary"] as const;
  // Leading =, +, - or @ would run as a formula in Excel; prefix them so a cell is always text.
  const cell = (v: unknown) => {
    let s = v instanceof Date ? v.toISOString() : v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = "﻿" + [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n");

  await logActivity(user.id, "exported requests", undefined, { ...filters, rows: rows.length });
  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tvinstallpro-requests-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
