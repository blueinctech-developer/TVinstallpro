/*
 * Branded emails, modelled on Shopify's order notifications: logo and reference at the top, a short
 * friendly message with one clear action, a summary card, the customer's details, a quiet footer.
 * Email clients ignore stylesheets, so everything is tables and inline styles, 560px wide.
 */

export type EmailKind = "booking" | "contact" | "partner";

export type RequestEmailData = {
  id: number;
  kind: EmailKind;
  name: string;
  email: string;
  phone: string;
  /** the plain-text summary the site already builds ("Label: value" lines) */
  summary: string;
  details: Record<string, unknown>;
  business: { name: string; phone: string; phoneHref: string; whatsapp: string; area: string; url: string };
  /** the booked service, if any */
  service?: { title: string; image?: string; estimator?: boolean };
  /** TV-mounting answers and estimate, worked out on the server from the saved prices */
  tv?: { answers: { label: string; value: string }[]; lines: { label: string; amount: number }[]; notes: string[]; total: number };
  adminUrl: string;
};

const C = {
  ink: "#0B0F17",
  text: "#2B3340",
  muted: "#5B6472",
  line: "#E2E6EC",
  surface: "#F3F5F8",
  brand: "#0565C8",
  brandSoft: "#EAF3FD",
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** HTML back to plain words, for the text version. */
const plain = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const money = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: n % 1 ? 2 : 0 });

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

const ref = (d: RequestEmailData) => `#${String(d.id).padStart(4, "0")}`;

const kindWord: Record<EmailKind, string> = { booking: "Booking", contact: "Message", partner: "Partnership request" };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** "2026-11-12" → "Thursday, November 12, 2026"; empty → "Flexible". */
const niceDate = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return v || "Flexible";
  const d = new Date(`${v}T12:00:00Z`);
  return d.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
};

/** A block of the customer's own words. */
const quote = (text: string) =>
  `<div style="padding:14px 16px;border-radius:12px;background:${C.surface};font-family:${C.font};font-size:14px;line-height:1.6;color:${C.ink};white-space:pre-wrap">${esc(text)}</div>`;

/** The customer's words as a quote, then any partner preferences as rows. */
const messageBlock = (d: RequestEmailData) =>
  (ownWords(d) ? quote(ownWords(d)) : "") + (messageRows(d).length ? `<div style="padding-top:12px">${rowsTable(messageRows(d))}</div>` : "");

/* ---------- Building blocks ---------- */

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate"><tr>
    <td style="border-radius:999px;background:${C.brand}">
      <a href="${esc(href)}" style="display:inline-block;padding:14px 26px;font-family:${C.font};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${esc(label)}</a>
    </td></tr></table>`;

const heading = (text: string) =>
  `<h2 style="margin:0 0 14px;font-family:${C.font};font-size:17px;font-weight:700;color:${C.ink}">${esc(text)}</h2>`;

const divider = `<tr><td style="padding:28px 0 0"><div style="border-top:1px solid ${C.line};font-size:0;line-height:0">&nbsp;</div></td></tr>`;

const rowsTable = (rows: { label: string; value: string }[]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows
    .map(
      (r) => `<tr>
        <td style="padding:7px 16px 7px 0;font-family:${C.font};font-size:14px;color:${C.muted};vertical-align:top;width:42%">${esc(r.label)}</td>
        <td style="padding:7px 0;font-family:${C.font};font-size:14px;color:${C.ink};vertical-align:top">${esc(r.value)}</td>
      </tr>`,
    )
    .join("")}</table>`;

const section = (inner: string) => `<tr><td style="padding:28px 0 0">${inner}</td></tr>`;

/** The service line, Shopify's "product" row: picture, name, a small note, and the total on the right. */
function serviceRow(d: RequestEmailData) {
  if (!d.service) return "";
  const img = d.service.image
    ? `<img src="${esc(d.service.image)}" width="64" height="64" alt="" style="display:block;width:64px;height:64px;border-radius:10px;object-fit:cover;border:1px solid ${C.line}">`
    : "";
  const sub = d.service.estimator ? "TV mounting estimate" : "We'll send you a quote";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    ${img ? `<td style="width:64px;padding-right:16px;vertical-align:middle">${img}</td>` : ""}
    <td style="vertical-align:middle;font-family:${C.font}">
      <div style="font-size:15px;font-weight:700;color:${C.ink}">${esc(d.service.title)}</div>
      <div style="font-size:13px;color:${C.muted};padding-top:2px">${esc(sub)}</div>
    </td>
    ${d.tv ? `<td style="vertical-align:middle;text-align:right;font-family:${C.font};font-size:15px;font-weight:700;color:${C.ink};white-space:nowrap">${esc(money(d.tv.total))}</td>` : ""}
  </tr></table>`;
}

function estimateBlock(d: RequestEmailData, opts: { breakdown: boolean }) {
  if (!d.tv) return "";
  const lines = opts.breakdown
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px">${d.tv.lines
        .map(
          (l) => `<tr>
            <td style="padding:5px 0;font-family:${C.font};font-size:14px;color:${C.muted}">${esc(l.label)}</td>
            <td style="padding:5px 0;font-family:${C.font};font-size:14px;color:${C.ink};text-align:right;white-space:nowrap">${esc(money(l.amount))}</td>
          </tr>`,
        )
        .join("")}</table>`
    : "";
  const notes = d.tv.notes.length
    ? `<div style="padding-top:14px;font-family:${C.font};font-size:13px;color:${C.muted}">
        <strong style="color:${C.ink}">We'll price these with you:</strong><br>${d.tv.notes.map(esc).join("<br>")}</div>`
    : "";
  return `<div style="margin-top:20px;padding:18px 20px;border-radius:14px;background:${C.surface}">
    ${lines}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${opts.breakdown ? `margin-top:10px;border-top:1px solid ${C.line}` : ""}"><tr>
      <td style="padding:${opts.breakdown ? "12px" : "0"} 0 0;font-family:${C.font};font-size:15px;font-weight:700;color:${C.ink}">Estimated total</td>
      <td style="padding:${opts.breakdown ? "12px" : "0"} 0 0;font-family:${C.font};font-size:22px;font-weight:700;color:${C.ink};text-align:right;white-space:nowrap">${esc(money(d.tv.total))}</td>
    </tr></table>
    <div style="padding-top:6px;font-family:${C.font};font-size:12px;color:${C.muted}">CAD. Your technician confirms the final price before work begins.</div>
    ${notes}
  </div>`;
}

function contactRows(d: RequestEmailData) {
  const det = d.details;
  const rows = [
    { label: "Name", value: d.name },
    { label: "Phone", value: d.phone },
    { label: "Email", value: d.email },
  ];
  const area = str(det.area) || str(det.city);
  if (area) rows.push({ label: "City or area", value: area });
  if (d.kind === "booking") {
    rows.push({ label: "Preferred date", value: niceDate(str(det.date)) });
    if (str(det.contact)) rows.push({ label: "Best way to reach you", value: str(det.contact) === "email" ? "Email" : "Phone" });
  }
  return rows;
}

/** What the customer wrote, plus partner call preferences. */
function messageRows(d: RequestEmailData) {
  const det = d.details;
  if (d.kind === "partner") {
    const rows = [
      { label: "Preferred contact", value: str(det.preferred) },
      { label: "Best time to call", value: str(det.time) },
      { label: "Address", value: str(det.address) },
    ];
    return rows.filter((r) => r.value);
  }
  return [];
}

/** The customer's own words: booking notes, contact message or partner comments. */
const ownWords = (d: RequestEmailData) =>
  str(d.kind === "booking" ? d.details.notes : d.kind === "contact" ? d.details.message : d.details.comments) ||
  // older requests: the free text after the summary's labelled lines
  (d.kind === "booking" ? "" : d.summary.split("\n").filter((l) => l.trim() && !/^[^:]{1,40}:\s/.test(l)).join("\n"));

const hasMessage = (d: RequestEmailData) => !!ownWords(d) || messageRows(d).length > 0;

function layout(o: { preheader: string; label: string; body: string; footer: string; logoUrl: string; homeUrl: string }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>${esc(o.preheader)}</title></head>
<body style="margin:0;padding:0;background:${C.surface}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.surface}">
  <tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:18px;border:1px solid ${C.line}">
      <tr><td style="padding:32px 32px 36px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="vertical-align:middle"><a href="${esc(o.homeUrl)}"><img src="${esc(o.logoUrl)}" width="170" alt="TV Install Pro" style="display:block;width:170px;height:auto;border:0"></a></td>
              <td style="vertical-align:middle;text-align:right;font-family:${C.font};font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${C.muted}">${esc(o.label)}</td>
            </tr></table>
          </td></tr>
          ${o.body}
        </table>
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
      <tr><td style="padding:22px 32px 0;font-family:${C.font};font-size:12px;line-height:1.6;color:${C.muted};text-align:center">${o.footer}</td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

const p = (html: string, extra = "") =>
  `<p style="margin:0;font-family:${C.font};font-size:15px;line-height:1.6;color:${C.text};${extra}">${html}</p>`;

/* ---------- The customer's confirmation ---------- */

export function customerEmail(d: RequestEmailData) {
  const b = d.business;
  const first = firstName(d.name);
  const subject =
    d.kind === "booking"
      ? `We've received your booking request ${ref(d)}`
      : d.kind === "partner"
        ? "We've received your partnership request"
        : "Thanks for getting in touch";
  const title =
    d.kind === "booking" ? `Thanks for your booking, ${first}!` : d.kind === "partner" ? `Thanks, ${first}!` : `Thanks for your message, ${first}!`;
  const intro =
    d.kind === "booking"
      ? `We've received your request${d.service ? ` for <strong>${esc(d.service.title)}</strong>` : ""}. We'll be in touch shortly to confirm a time that suits you${d.tv ? " and your final price" : ""}.`
      : d.kind === "partner"
        ? "We've received your partnership request and we'll call you at the time you chose to talk it through."
        : "We've received your message and we'll get back to you shortly.";

  const body = [
    `<tr><td style="padding:32px 0 0">
      <h1 style="margin:0 0 12px;font-family:${C.font};font-size:24px;line-height:1.25;font-weight:700;color:${C.ink}">${esc(title)}</h1>
      ${p(intro)}
      ${d.kind === "booking" ? p("Your appointment is confirmed once we've spoken, so keep an eye on your phone.", `padding-top:10px;color:${C.muted};font-size:14px`) : ""}
      <div style="padding-top:24px">${button(b.phoneHref, `Call us on ${b.phone}`)}</div>
      ${p(`or <a href="${esc(b.whatsapp)}" style="color:${C.brand};font-weight:700;text-decoration:none">message us on WhatsApp</a>. You can also reply to this email.`, "padding-top:12px;font-size:14px")}
    </td></tr>`,
    d.kind === "booking" && (d.service || d.tv)
      ? divider + section(heading("Booking summary") + serviceRow(d) + (d.tv ? `<div style="padding-top:16px">${rowsTable(d.tv.answers)}</div>` : "") + estimateBlock(d, { breakdown: true }))
      : "",
    hasMessage(d) ? divider + section(heading(d.kind === "booking" ? "Your notes" : "What you told us") + messageBlock(d)) : "",
    divider + section(heading("Your details") + rowsTable(contactRows(d))),
  ].join("");

  const footer = `Questions? Just reply to this email, call <a href="${esc(b.phoneHref)}" style="color:${C.muted}">${esc(b.phone)}</a> or <a href="${esc(b.whatsapp)}" style="color:${C.muted}">message us on WhatsApp</a>.<br>
    ${esc(b.name)} · ${esc(b.area)}<br>
    You're receiving this because you contacted us at <a href="${esc(b.url)}" style="color:${C.muted}">${esc(b.url.replace(/^https?:\/\//, ""))}</a>.`;

  const html = layout({ preheader: d.kind === "booking" ? "We'll be in touch shortly to confirm your appointment." : plain(intro), label: d.kind === "booking" ? `Booking ${ref(d)}` : kindWord[d.kind], body, footer, logoUrl: `${b.url}/email-logo.png`, homeUrl: b.url });

  const text = [
    title,
    "",
    plain(intro),
    "",
    ...(d.kind === "booking" && d.service ? [`Service: ${d.service.title}`] : []),
    ...(d.tv ? [...d.tv.answers.map((a) => `${a.label}: ${a.value}`), "", ...d.tv.lines.map((l) => `${l.label}: ${money(l.amount)}`), `Estimated total: ${money(d.tv.total)} (your technician confirms the final price)`] : []),
    ...(d.tv?.notes.length ? ["", "We'll price these with you:", ...d.tv.notes] : []),
    "",
    ...(ownWords(d) ? [ownWords(d), ""] : []),
    ...messageRows(d).map((r) => `${r.label}: ${r.value}`),
    ...contactRows(d).map((r) => `${r.label}: ${r.value}`),
    "",
    `Questions? Just reply to this email, call ${b.phone} or message us on WhatsApp: ${b.whatsapp}`,
    b.name,
  ].join("\n");

  return { subject, html, text };
}

/* ---------- The alert to the business ---------- */

export function alertEmail(d: RequestEmailData) {
  const b = d.business;
  const what = d.kind === "booking" ? `booking${d.service ? `: ${d.service.title}` : ""}` : d.kind === "partner" ? "partnership request" : "message";
  const subject = `New ${what} from ${d.name} ${ref(d)}`;
  const quick = `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:16px;font-family:${C.font};font-size:14px"><a href="tel:${esc(d.phone.replace(/[^\d+]/g, ""))}" style="color:${C.brand};font-weight:700;text-decoration:none">Call ${esc(d.phone)}</a></td>
      <td style="font-family:${C.font};font-size:14px"><a href="mailto:${esc(d.email)}" style="color:${C.brand};font-weight:700;text-decoration:none">Email ${esc(firstName(d.name))}</a></td>
    </tr></table>`;

  const body = [
    `<tr><td style="padding:32px 0 0">
      <h1 style="margin:0 0 10px;font-family:${C.font};font-size:22px;line-height:1.3;font-weight:700;color:${C.ink}">New ${esc(what)}</h1>
      ${p(`From <strong>${esc(d.name)}</strong>${str(d.details.area) || str(d.details.city) ? ` in ${esc(str(d.details.area) || str(d.details.city))}` : ""}. Reply to this email to answer them directly.`)}
      <div style="padding-top:16px">${quick}</div>
      <div style="padding-top:22px">${button(d.adminUrl, "Open in admin")}</div>
    </td></tr>`,
    d.kind === "booking" && (d.service || d.tv)
      ? divider + section(heading("Booking") + serviceRow(d) + (d.tv ? `<div style="padding-top:16px">${rowsTable(d.tv.answers)}</div>` : "") + estimateBlock(d, { breakdown: true }))
      : "",
    hasMessage(d) ? divider + section(heading(d.kind === "booking" ? "Notes" : "Message") + messageBlock(d)) : "",
    divider + section(heading("Customer") + rowsTable(contactRows(d))),
  ].join("");

  const html = layout({ preheader: `${d.name} · ${d.phone}`, label: `${kindWord[d.kind]} ${ref(d)}`, body, footer: `Sent by your website, ${esc(b.url.replace(/^https?:\/\//, ""))}.`, logoUrl: `${b.url}/email-logo.png`, homeUrl: b.url });
  const text = `${kindWord[d.kind]} ${ref(d)}\n\n${d.summary}\n\nOpen it in the admin: ${d.adminUrl}`;
  return { subject, html, text };
}
