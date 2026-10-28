"use client";

import { useState } from "react";
import { Field, Honeypot } from "@/components/forms/Fields";
import { Icon } from "@/components/Icon";

/** Comments go to the admin for approval; nothing shows until someone approves it. */
export function CommentForm({ postId }: { postId: number }) {
  const [v, setV] = useState({ name: "", email: "", body: "", website: "" });
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const set = (k: keyof typeof v) => (x: string) => setV((s) => ({ ...s, [k]: x }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.name.trim() || !v.body.trim()) {
      setError("Add your name and a comment.");
      setState("error");
      return;
    }
    setState("busy");
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, ...v }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok) setState("sent");
    else {
      setError(data?.error ?? "Your comment couldn't be sent. Please try again later.");
      setState("error");
    }
  };

  if (state === "sent")
    return (
      <p role="status" style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
        <Icon name="check" size={18} /> Thanks. Your comment will appear once it&apos;s approved.
      </p>
    );

  return (
    <form onSubmit={submit} noValidate style={{ display: "grid", gap: 16 }}>
      <h3 style={{ fontSize: "var(--step-1)" }}>Leave a comment</h3>
      <Field label="Name" name="name" value={v.name} onChange={set("name")} required autoComplete="name" />
      <Field label="Email (not published)" name="email" type="email" value={v.email} onChange={set("email")} autoComplete="email" />
      <Field label="Comment" name="body" value={v.body} onChange={set("body")} multiline rows={5} required />
      <Honeypot value={v.website} onChange={set("website")} />
      {state === "error" && (
        <p role="alert" style={{ color: "#991b1b", display: "flex", gap: 8, alignItems: "center" }}>
          <Icon name="alert" size={16} /> {error}
        </p>
      )}
      <button type="submit" className="btn" disabled={state === "busy"} style={{ justifySelf: "start" }}>
        {state === "busy" ? "Sending…" : "Post comment"}
      </button>
    </form>
  );
}
