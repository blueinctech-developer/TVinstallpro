import { NextResponse } from "next/server";
import { createRequest } from "@/lib/admin/requests";
import { allow, clientIp } from "@/lib/rate-limit";

/*
 * Receives booking, contact and partner requests from the site.
 *
 * Every request is saved to the database first (it appears in /admin straight away).
 * The visitor is told it was received only once that save succeeds; if the database
 * is unreachable they get a 503 and the page offers email / phone / WhatsApp instead.
 *
 * Optional: ENQUIRY_WEBHOOK_URL also forwards a copy (e.g. to an email or CRM webhook).
 * A failed forward is logged but doesn't fail the request, since it is already stored.
 */

type Kind = "booking" | "contact" | "partner";
const KINDS: Kind[] = ["booking", "contact", "partner"];

const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const phoneOk = (v: string) => v.replace(/\D/g, "").length >= 10;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field.
  if (str(body.website)) return NextResponse.json({ ok: true, delivered: true });

  const kind = body.kind as Kind;
  if (!KINDS.includes(kind)) return NextResponse.json({ ok: false, error: "Unknown request type." }, { status: 400 });

  const name = str(body.name, 200);
  const email = str(body.email, 200);
  const phone = str(body.phone, 40);
  const errors: string[] = [];
  if (!name) errors.push("name");
  if (!phoneOk(phone)) errors.push("phone");
  if (!emailOk(email)) errors.push("email");
  if (errors.length) return NextResponse.json({ ok: false, error: "Please check the highlighted fields.", fields: errors }, { status: 422 });

  const details = typeof body.details === "object" && body.details !== null && !Array.isArray(body.details) ? body.details : {};
  if (JSON.stringify(details).length > 20000) return NextResponse.json({ ok: false, error: "Request too large." }, { status: 413 });
  const payload = {
    kind,
    submittedAt: new Date().toISOString(),
    name,
    email,
    phone,
    summary: str(body.summary, 6000),
    details: details as Record<string, unknown>,
  };
  const ip = clientIp(req.headers);

  try {
    // 8 requests per 10 minutes per visitor is generous for people, and stops bulk spam.
    if (!(await allow(`enquiry:${ip}`, 8, 600))) {
      return NextResponse.json({ ok: false, delivered: false, reason: "rate_limited" }, { status: 429 });
    }
    const id = await createRequest({ ...payload, ip });
    await forward(payload, id);
    return NextResponse.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("[enquiry] could not store request:", err);
    return NextResponse.json({ ok: false, delivered: false, reason: "storage_failed" }, { status: 503 });
  }
}

async function forward(payload: object, id: number) {
  const url = process.env.ENQUIRY_WEBHOOK_URL;
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...payload, id }),
    });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
  } catch (err) {
    console.error(`[enquiry] request ${id} saved, but forwarding to the webhook failed:`, err);
  }
}
