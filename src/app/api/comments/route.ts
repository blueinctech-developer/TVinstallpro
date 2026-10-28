import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allow, clientIp } from "@/lib/rate-limit";

/** New blog comment. Always stored as pending: nothing is shown until approved in Admin → Comments. */
export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  if (str(b.website, 200)) return NextResponse.json({ ok: true }); // honeypot
  const postId = Number(b.postId);
  const name = str(b.name, 80);
  const email = str(b.email, 200);
  const body = str(b.body, 3000);
  if (!Number.isInteger(postId) || !name || !body) return NextResponse.json({ error: "Add your name and a comment." }, { status: 422 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ error: "That email address doesn't look right." }, { status: 422 });
  const ip = clientIp(req.headers);
  try {
    if (!(await allow(`comment:${ip}`, 5, 600))) return NextResponse.json({ error: "Too many comments. Try again in a few minutes." }, { status: 429 });
    const conn = await db();
    const [post] = await conn.query("select 1 from posts where id = $1 and status = 'published' and comments_open", [postId]);
    if (!post) return NextResponse.json({ error: "Comments are closed on this post." }, { status: 403 });
    await conn.query("insert into comments (post_id, author_name, author_email, body, ip, user_agent) values ($1, $2, $3, $4, $5, $6)", [
      postId,
      name,
      email || null,
      body,
      ip,
      req.headers.get("user-agent")?.slice(0, 300) ?? null,
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[comments] could not store:", err);
    return NextResponse.json({ error: "Your comment couldn't be saved. Please try again later." }, { status: 503 });
  }
}
