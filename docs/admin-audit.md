# tvinstallpro.ca — Admin, Forms & Backend Audit

Audited 2026-10-28 from the public live site (read-only HTTP requests and the browser) and this repository.
Companion to `docs/audit.md` (public pages, business details and prices).

**Update 2026-10-28:** the owner signed in to wp-admin in the browser pane, and Claude then looked at it read-only
(see §8). Nothing was changed, exported or downloaded. Individual customer entries were not opened.

Legend: **[verified]** seen directly · **[inferred]** follows from what was seen · **[confirm]** owner to confirm

## 1. Existing architecture

| Part | Old site (live) | New site (this repo) |
|---|---|---|
| Platform | WordPress 7.1.3 on Apache **[verified]** | Next.js 16 (App Router), no database |
| Theme / builder | "Cleano" theme (a dry-cleaning template) + Elementor / Elementor Pro, Slider Revolution **[verified]** | Custom components, design system in `docs/design-system.md` |
| Forms | **Gravity Forms**, 12 forms (below) **[verified]** | `BookingFlow`, `ContactForm`, `PartnerForm` → `/api/enquiry` |
| Form storage | Gravity Forms entries in the WP database (wp-admin → Forms → Entries) **[inferred]** | **None.** Forwards to `ENQUIRY_WEBHOOK_URL`, not set → nothing is delivered |
| Email | WP Mail SMTP plugin **[verified]** | None (mailto fallback in the browser) |
| Admin | wp-admin at `/wp-admin/` **[verified]** | **None** |
| Security | Wordfence installed, but 2FA is off for every user, plus a suspicious "Activator" plugin (§8) **[verified]**; CAPTCHA on some forms | Honeypot field only; no rate limit |
| SEO | Yoast SEO: `sitemap_index.xml`, robots allows all **[verified]** | `sitemap.ts`, `robots.ts`, redirects in `next.config.ts` |
| Analytics | Google Analytics 4 `G-VVKZG2Q0QN` **[verified]** | **None** (would lose analytics at cutover) |
| Chat | Chaty widget (WhatsApp) **[verified]** | WhatsApp link in `site.ts` |
| Domain | `https://tvinstallpro.ca` canonical; `www` and `http` 301 → it **[verified]** | `site.url` = `https://tvinstallpro.ca` |
| Hosting | Apache, provider unknown **[confirm]** | Not deployed yet **[confirm]** where it will run |

## 2. Old forms inventory (all Gravity Forms)

| GF # | Form | Page | Fields | New equivalent |
|---|---|---|---|---|
| 3 | Book TV Installation Service | `/tv-installation-and-mounting-service/` | Name, phone, email, province + region, TV size, mount, fireplace, surface, concealment (+type), add-ons, takedown, device setup, devices behind TV, another TV, maintenance plan, live cost estimate | `/book?service=tv-mounting` (`BookingFlow`, prices in `src/lib/pricing.ts`) |
| 8 | Mantel Mount booking | `/mantel-mount-installation-service/` | Name, phone, email, province + region | `/book?service=mantel-mount` |
| 9 | Laser TV Installation Booking | `/laser-tv-installation-service/` | same | `/book?service=laser-tv` |
| 10 | Samsung Frame TV Installation Booking | `/samsung-frame-tv-installation-service/` | same | `/book?service=samsung-frame` |
| 11 | Blinds and Curtains Installations | `/blinds-and-curtains-installation/` | same + CAPTCHA | `/book?service=blinds-curtains` |
| 12 | Garage Shelf Organization | `/garage-shelves-organization/` | same | `/book?service=garage-shelving` |
| 13 | Home appliances booking | `/home-appliances-installation/` | same | `/book?service=appliances` |
| 14 | Wallpaper Works | `/wallpaper-works/` | same | `/book?service=wallpaper` |
| 15 | Gazebos & sheds booking | `/gazebos-and-sheds-installation/` | same | `/book?service=gazebos-sheds` |
| 7 | General Form (contact) | `/contact-us/` | Name, phone, email, province + region, message, CAPTCHA | `/contact` (`ContactForm`) |
| 2 | Partnership Request Form | `/partner-with-us/` | Name, address (street, line 2, city, postal), preferred contact, phone, email, best time to call, comments | `/partner-with-us` (`PartnerForm`) |
| 1, 4–6 | — | not found on any public page | — | **[confirm]** old/test forms; may still hold entries |

Every old form maps to a new one, so the new site already collects everything the old one did.
The one field that changes shape is location: old forms use **province + region dropdowns** (Canada-wide),
while the new ones use a free-text **"City or neighbourhood"** field. Old entries keep their province and region
text in the imported record.

## 3. Data that must be carried over

Held in WordPress only, so it is lost if WordPress is switched off before it is exported:

1. **Gravity Forms entries** for forms 1–15: every booking, contact and partner request, with dates and the
   read/starred/notes data Gravity Forms keeps. *This is the business history.* **[inferred]**
2. Any entry notes or email notifications log. **[inferred]**
3. Real media in the WP media library (job photos, logo files). **[confirm]**
4. GA4 property `G-VVKZG2Q0QN`: keep it on the new site so analytics history continues. **[verified ID]**

Not worth carrying over (theme demo content, already excluded by `docs/audit.md`): dry-cleaning blog posts,
`/portfolio/*`, `/service/*` laundry pages, all `/team-member/*` and `/testimonial/*` entries, `home-01`,
`home-03`, `sample-page`, `elementor-7780`, `services-1`, `contact-us-2`, `service-tab1`, `blog-2`.

### What I need from you (export, no passwords shared)

In wp-admin → **Forms → Import/Export → Export Entries**: export each form (1–15) to CSV, for **all dates**,
with **all fields** ticked, including Entry Id, Entry Date, Source Url, User IP, Is Read, Is Starred and Notes.
Save the CSVs somewhere outside this repository (for example `Documents\TVinstallpro-data\`) and tell me where they are.
Customer data must never be committed to git.

Also back up the whole WordPress site (host control panel, or a plugin such as UpdraftPlus) before anything
changes. That backup is the rollback.

## 4. URLs, redirects and SEO

Already redirected in `next.config.ts`: `/about-us`, `/contact-us`, `/book-a-service`, and the 9 service booking pages.

**Gaps to add:**

| Old URL | Proposed |
|---|---|
| `/pricing/` | 301 → `/services` |
| `/services/` | same path on the new site (no redirect needed) |
| `/partner-with-us/` | same path (no redirect needed) |
| `/other-inquiries/`, `/contact-us-2/`, `/pop-up-form/` | 301 → `/contact` |
| `/cable-concealment/` | 301 → `/book?service=tv-mounting` |
| `/services-1/`, `/service-tab1/` | 301 → `/services` |
| Demo content (`/portfolio/*`, `/service/*`, `/team-member/*`, `/testimonial/*`, dry-cleaning posts, `/blog*`, `/home-0*`, `/sample-page/`, `/elementor-7780/`, `/our-team/`, `/our-portfolio/`, `/category/*`, `/tag/*`, `/author/*`) | **410 Gone** (no real replacement; not redirected to the homepage) |
| `/wp-admin/`, `/wp-login.php` | 404 on the new site; the old WordPress admin stays on the old host until the data is exported |

Also: add GA4 to the new site; add `noindex` and `Disallow: /admin` for the admin.

## 5. Security notes

- `/author/igwetvinstall/` and `/author/blueinchost/` are public and in the sitemap, which exposes both WordPress
  login usernames. **[verified]** Low risk with Wordfence 2FA, but these go away at cutover.
- The homepage returned a one-off HTTP 500 during the audit. **[verified]** The old host may be unstable.
- The new `/api/enquiry` has a honeypot field but no rate limit and no stored audit trail. To be fixed in the backend work below.

## 6. Recommended plan for the new admin

Goal: an admin at `/admin` on the same Next.js app, built on the public site's design system (Jura/Manrope,
`--brand` blue on the axis, light architectural surfaces, AAA text), but denser and calmer: no 3D, no tunnel,
and motion limited to state changes.

**Phase A — Backend (needed before any admin):**
1. Add a database. Recommendation: **Postgres** (Neon or Supabase, both have free tiers and work on any host)
   with a small schema: `customers`, `requests` (kind = booking/contact/partner, service, status, details JSON,
   original submitted date, legacy GF form + entry id), `notes`, `activity_log`, `admin_users`.
2. `/api/enquiry` saves each request first, then sends email. The visitor only sees success once the request is saved.
3. Email notification to the business inbox (Resend or the existing SMTP account).
4. Rate limiting on public forms.

**Phase B — Admin (`/admin`, sign-in required, checked on the server, `noindex`):**
- **Overview:** new requests, today's and upcoming bookings, requests awaiting reply. Every number links to the
  filtered list. Real data only, no sample data or invented revenue.
- **Requests inbox:** bookings, quotes, contact and partner requests in one searchable, filterable table.
  Statuses: New → Contacted → Scheduled → Completed / Cancelled, with history.
- **Request detail:** customer, service, TV estimate breakdown, address/area, preferred date, internal notes,
  status history, one-click call/email/WhatsApp.
- **Customers:** grouped by phone/email (duplicates flagged, not merged automatically), with full request history.
- **Export:** CSV of any filtered view.
- **Later, only if wanted:** editing services and prices from the admin (today they live in `src/lib/`,
  version-controlled, which is simpler and safe for now).

**Phase C — Import history:** import the Gravity Forms CSVs into `requests`/`customers`, keeping original dates
and GF entry ids. Then report counts per form (rows in CSV vs. rows imported vs. skipped, with reasons).

**Phase D — Cutover (your approval needed):** deploy, add GA4, add the redirects above, then switch DNS.
WordPress stays on the old host, untouched, until the import has been checked.

## 7. Decisions needed from you

1. Hosting for the new site (Vercel is the natural fit for Next.js) **and** the database (Neon or Supabase).
2. Who signs in to the admin: just you, or staff/technicians too (roles)?
3. Business inbox for notifications (the open question 1 in `docs/audit.md`).
4. The Gravity Forms CSV exports (section 3).

## 8. wp-admin findings (verified 2026-10-28, read-only)

### Gravity Forms entries: 103 in total

| GF # | Form | Entries | Unread |
|---|---|---|---|
| 3 | Book TV Installation Service | **51** | 47 |
| 7 | General Form (contact) | **32** | 32 |
| 10 | Samsung Frame TV Installation Booking | 8 | — |
| 8 | Mantel Mount Installation Booking | 6 | — |
| 2 | Partnership Request Form | 2 | 2 |
| 1 | Book a Service (older TV form: size, bracket, location, wall type) | 1 | 0 |
| 13 | Home Appliances Installations | 1 | 1 |
| 14 | Wallpaper Works | 1 | 1 |
| 15 | Gazebos & Sheds Installation | 1 | 1 |
| 9, 11, 12 | Laser TV, Blinds & Curtains, Garage Shelf | 0 | — |
| 16 | Email Subscription (email only) | 0 | — |
| 4, 5, 6 | CCTV Camera Installations (×2), WiFi Camera Installation (in the forms trash) | 0 | — |

**Exported 2026-10-28:** all 9 forms with entries were exported to CSV, saved outside this repo in
`Documents\TVinstallpro-data\gravity-forms\`, and checked: each file matches the server's SHA-256, and the row
counts equal the wp-admin totals (103). The CSVs don't include the read/starred flags. For the import: form 3
entry ids 3–7 (March 2023) are setup tests, most of the 32 contact messages are spam, and several customers
submitted twice.

No entries are in Spam or Trash. Almost every entry is **unread**, so requests have most likely been handled
by email (or missed). The new admin's inbox fixes that. Export forms 1, 2, 3, 7, 8, 10, 13, 14 and 15
(the ones with entries).

### Email
- Mailer: **WP Mail SMTP Pro → Amazon SES**, sending as `support@tvinstallpro.ca` ("TV Install Pro").
  The business already has a working domain sender, which the new site can reuse (SES), instead of adding Resend.
- Gravity Forms notifications: form 3 sends an admin alert to a **personal Gmail address** plus a confirmation to the
  customer; forms 2 and 7 send admin alerts; form 2 also confirms to the customer. **[confirm]** that the Gmail
  address belongs to the owner. It is not written here because this repo is public.
- The WP Mail SMTP email log could not be read (it is probably turned off), so it's unknown whether past alerts were delivered.

### Users (4)
3 Administrators (`blueinchost`, `DevAdmin`, `IgweTVinstall`) and 1 Editor (`digital_marketing`).
**Two-factor sign-in is off for all four.** **[confirm]** who `DevAdmin` and `digital_marketing` are.

### Plugins: security concerns
- **"Wordfence Security Activator"** is active. Plugins with this name are usually licence bypasses for pirated
  ("nulled") premium plugins, and these often carry malware or backdoors. Paid plugins on the site (Elementor Pro,
  Gravity Forms + Gravity Perks, WP Mail SMTP Pro, Yoast Premium) should be checked for valid licences.
  Wordfence's own scan should be run.
- **WP File Manager** is active and out of date. It has had critical remote-code-execution flaws before; remove it
  unless it's actually needed.
- Out of date: Gravity Forms, Elementor Pro, Slider Revolution, Chaty, ASE, MainWP Child Reports and others.
- Inactive leftovers: Contact Form 7, One Click Demo Import, Happy Social Login, WP Rocket, Site Kit, MainWP Child, WPS Hide Login.
- Also active: Header Footer Code Manager and "Infinity23 (formerly Tag Manager)". These may hold extra tracking
  snippets **[not opened]**.

### Media
319 items in the media library; check for real job photos before cutover.

Note: the master prompt gives the repo as `bluecintech-developer/TVinstallpro`; the actual repo is
`blueinctech-developer/TVinstallpro`.
