# TV Install Pro — What's left, and how to do it

Last updated 2026-10-28. Work through Part A in order. Part B is what Claude builds once you say go.

Never paste passwords, API keys or database connection strings into the chat or into a committed file.
Put them only in `.env.local` (ignored by git) and in the hosting dashboard.

---

## Part A — Things only you can do

### A1. Back up the WordPress site (do this first)
This backup is the rollback if anything goes wrong.
1. Sign in at https://tvinstallpro.ca/wp-admin/.
2. **Plugins → Add New**, search **UpdraftPlus**, click **Install Now**, then **Activate**.
3. **Settings → UpdraftPlus Backups → Backup Now**. Tick both *database* and *files*, click **Backup Now**.
4. When it finishes, under **Existing backups** click each part (Database, Plugins, Themes, Uploads, Others) to
   download it to your computer.
5. Store the files in a folder outside the project, e.g. `Documents\TVinstallpro-data\wp-backup-2026-10-28\`.
   - If your web host has its own backup tool (cPanel → Backups), take one there too.

### A2. Export the old form submissions (the business history)
1. In wp-admin: **Forms → Import/Export → Export Entries**.
2. **Select a form**: start with *Book TV Installation Service* (#3).
3. Tick **Select All** for fields. Make sure *Entry Id, Entry Date, Source Url, Is Read, Is Starred* are included.
4. Leave the date range empty (that means all dates), click **Download Export File**.
5. Repeat for every form in the list: #2 Partnership, #7 General (contact), #8–#15 service bookings,
   and any others listed (#1, #4–#6 might be old forms with entries).
6. Save all the CSVs in `Documents\TVinstallpro-data\gravity-forms\`. **Not** inside the TVinstallpro folder.
7. Tell Claude the folder path. Claude will count the rows and import them, keeping the original dates.

### A3. Confirm the business details
Answer these (in chat is fine; they're not secret):
1. The real email inbox for the public site and for new-request notifications.
2. Service area: Ottawa/Gatineau only, or the Canada-wide regions the old forms listed?
3. Are the "From $" prices on the old /services page real, or only the TV estimator prices?
4. Real reviews (e.g. a Google Business Profile link) and real job photos, if any.
5. Do the Facebook (`HandymanIgwe`), Twitter and Instagram accounts belong to the business?
6. Who signs in to the admin: just you, or staff/technicians too?

### A4. Create the database (Neon, free tier)
1. Go to https://neon.tech and sign up (GitHub sign-in is easiest).
2. **Create project**: name `tvinstallpro`, Postgres version = default, region = the one closest to Ottawa
   (an *AWS US East* option).
3. On the project dashboard click **Connect**. Copy the connection string (it starts with `postgresql://`).
4. In the TVinstallpro folder, create a file named `.env.local` (git ignores it) containing:
   ```
   DATABASE_URL=postgresql://...paste here...
   ```
5. Tell Claude "the database is set up". Do not paste the string in the chat.
   - Supabase (https://supabase.com) works too; use its *Connection string → URI*.

### A5. Set up email sending (Resend)
Needed so new requests email you, and the site can email customers.
1. Sign up at https://resend.com.
2. **Domains → Add Domain** → `tvinstallpro.ca`.
3. Resend shows DNS records (TXT for SPF/DKIM, sometimes MX for a `send` subdomain).
   Add each one at wherever your domain's DNS is managed (see A7 step 1 to find out where), exactly as shown.
4. Back in Resend, click **Verify**. It can take from a few minutes to a few hours.
5. **API Keys → Create API Key** (permission: *Sending access*). Add it to `.env.local`:
   ```
   RESEND_API_KEY=re_...
   ENQUIRY_NOTIFY_TO=the-inbox-from-A3@...
   ```
   - Alternative: keep using the SMTP account that WP Mail SMTP uses today (wp-admin → WP Mail SMTP → Settings
     shows the provider). Tell Claude which one you prefer.

### A6. Host the new site (Vercel)
1. Sign up at https://vercel.com with the GitHub account that owns `blueinctech-developer/TVinstallpro`.
2. **Add New → Project → Import** the TVinstallpro repository. Framework is detected as Next.js; leave defaults.
3. Before clicking **Deploy**, open **Environment Variables** and add the same keys as in `.env.local`
   (`DATABASE_URL`, `RESEND_API_KEY`, `ENQUIRY_NOTIFY_TO`, plus any admin keys Claude tells you about later).
4. Click **Deploy**. You get a test address like `tvinstallpro-xxxx.vercel.app`. The live domain is not touched yet.
5. Test everything on that address first (Part C).

### A7. Point the domain at the new site (cutover; only after Part C passes)
1. Find where DNS is managed: your domain registrar (where you pay for `tvinstallpro.ca`) or your current host.
   If unsure, look up the domain at https://lookup.icann.org. "Name Server" shows who manages it.
2. In Vercel: **Project → Settings → Domains → Add** `tvinstallpro.ca` and `www.tvinstallpro.ca`.
   Set `tvinstallpro.ca` as primary (so `www` redirects to it, as today).
3. Vercel shows the records to set (typically an **A** record for `@` and a **CNAME** for `www`).
   At your DNS provider, change **only those two records**.
   - **Do not** change the nameservers, and **do not** touch MX records. That keeps any existing
     `@tvinstallpro.ca` email working.
4. Wait until Vercel shows both domains as *Valid* (minutes to a few hours). HTTPS is issued automatically.
5. Check: https://tvinstallpro.ca loads the new site; https://www.tvinstallpro.ca and http:// redirect to it;
   an old link such as https://tvinstallpro.ca/contact-us/ lands on /contact.
6. **Keep the old WordPress hosting running** (unlinked from the domain) until Claude has imported and
   checked the form history. Cancel it only after that.

### A8. Analytics and Google Search Console
1. Make sure you can open the existing GA4 property at https://analytics.google.com
   (Admin → Data streams should show `G-VVKZG2Q0QN`). If nobody has access, find out who set it up
   (possibly the "blueinchost" account).
2. Go to https://search.google.com/search-console → **Add property → Domain** → `tvinstallpro.ca`.
   It gives a TXT record: add it at your DNS provider, then click **Verify**.
3. After cutover: **Sitemaps** → submit `https://tvinstallpro.ca/sitemap.xml`.
4. For the next few weeks, check **Pages** for 404 errors and send any you see to Claude.

### A9. First admin account
In a terminal in the TVinstallpro folder (stop `npm run dev` first when using the local database):
```
npm run admin:create -- --email you@example.com --name "Your Name"
```
It asks for a password (at least 12 characters) that you type yourself, and stores only a secure hash.
No default passwords exist. Then sign in at `/admin/login`.

---

## Part B — Not built yet (Claude does these on your go-ahead)

Status as of 2026-10-28 (branch `feat/admin-dashboard`). How it all works: `docs/admin.md`.

| # | Item | Status |
|---|---|---|
| B1 | Database tables (customers, requests, notes, status history, activity log, admin users) | **Done**, tested locally; production waits for A4 |
| B2 | Save every form submission before showing "sent" | **Done**, tested end to end. Email notification **not built**: waits for A5 (or reuse the old site's Amazon SES) |
| B3 | Rate limiting and spam protection on public forms | **Done**, tested (honeypot + 8 per 10 min) |
| B4 | `/admin` in the new design: overview, requests inbox, request detail, customers, CSV export | **Done**, tested in the browser (desktop + mobile) |
| B5 | Admin sign-in checked on the server, roles (admin / staff / read-only), `noindex` + robots block | **Done**, tested (forged cookie and export refused) |
| B6 | Import old Gravity Forms entries with a count report | **Done** locally: 103 of 103, re-run imports 0. Run again against production after A4 |
| B7 | Missing redirects and 410 for demo pages | **Done**, tested |
| B8 | Google Analytics on the new site | Pending A8.1 |
| B9 | Test pass | Typecheck + production build pass; routes, redirects, forms, auth tested. No automated test suite yet |
| B10 | Commit and push | Pending your go-ahead |

## Part C — Checks before cutover (A7)
On the `.vercel.app` address:
1. Send a test booking, a contact message and a partner request. Each appears in `/admin`, and an email arrives.
2. `/admin` shows the sign-in page when signed out, including in a private window.
3. The imported history count matches the CSV row counts Claude reports.
4. The pages look right on your phone.
