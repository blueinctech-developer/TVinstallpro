import { NextResponse } from "next/server";

/*
 * Receives booking, contact and partnership requests from the site and forwards them.
 *
 * Delivery: set ENQUIRY_WEBHOOK_URL (e.g. a Formspree, Make, Zapier or CRM webhook that
 * emails/stores the request). Until it is set, requests are NOT delivered and the client
 * is told so (503), so it can offer the visitor another way to reach the business.
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

  const payload = {
    kind,
    submittedAt: new Date().toISOString(),
    name,
    email,
    phone,
    summary: str(body.summary, 6000),
    details: typeof body.details === "object" && body.details !== null ? body.details : {},
  };

  const url = process.env.ENQUIRY_WEBHOOK_URL;
  if (!url) {
    console.warn("[enquiry] ENQUIRY_WEBHOOK_URL is not set; request not delivered:", payload.kind, payload.name);
    return NextResponse.json({ ok: false, delivered: false, reason: "not_configured" }, { status: 503 });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    return NextResponse.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("[enquiry] delivery failed:", err);
    return NextResponse.json({ ok: false, delivered: false, reason: "delivery_failed" }, { status: 502 });
  }
}
