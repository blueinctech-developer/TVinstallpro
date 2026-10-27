import { site } from "./site";

export type SubmitResult =
  | { status: "sent" }
  | { status: "not-delivered"; mailto: string } // backend not connected or delivery failed
  | { status: "invalid"; fields: string[]; message: string };

export type Enquiry = {
  kind: "booking" | "contact" | "partner";
  name: string;
  email: string;
  phone: string;
  /** human-readable text, used for the email fallback too */
  summary: string;
  details?: Record<string, unknown>;
  website?: string; // honeypot
};

export const mailtoFor = (subject: string, body: string) =>
  `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/** Sends an enquiry to /api/enquiry. Never reports success unless the server confirms delivery. */
export async function submitEnquiry(e: Enquiry, subject: string): Promise<SubmitResult> {
  const fallback = { status: "not-delivered" as const, mailto: mailtoFor(subject, e.summary) };
  try {
    const res = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(e),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.delivered) return { status: "sent" };
    if (res.status === 422) return { status: "invalid", fields: data.fields ?? [], message: data.error ?? "Please check the form." };
    return fallback;
  } catch {
    return fallback;
  }
}
