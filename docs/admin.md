# Admin — how it works and how to run it

The admin lives at **`/admin`** in this same Next.js app. Public forms save into the same database the
admin reads, so a booking appears in the inbox the moment it's sent.

## Pieces

| Part | Where |
|---|---|
| Database schema (additive migrations, applied on start) | `src/lib/db/migrations.ts` |
| Connection: Postgres via `DATABASE_URL`, or local PGlite in `.data/pglite` | `src/lib/db/core.ts` |
| Requests and customers data access | `src/lib/admin/requests.ts` |
| Sign-in, sessions, roles | `src/lib/admin/auth.ts`, `src/app/admin/actions.ts` |
| `/admin` noindex + sign-in redirect; 410 for old demo pages | `src/proxy.ts` |
| Public form endpoint (saves first, then optional webhook) | `src/app/api/enquiry/route.ts` |
| Pages: overview, requests, request detail, customers, CSV export | `src/app/admin/` |
| Users: add people, roles, disable, one-time password links (`/admin/setup`) | `src/app/admin/(app)/users/`, `src/lib/admin/tokens.ts` |
| Settings: business details, tracking (GA4, GTM, head/footer code), email | `src/app/admin/(app)/settings/` |
| Services & prices (the TV estimator) | `src/app/admin/(app)/services/` |
| Content: posts, portfolio, team, testimonials (one editor, field lists in `collections.ts`) | `src/app/admin/(app)/content/`, `src/lib/admin/collections.ts` |
| Comments moderation | `src/app/admin/(app)/comments/`, public form → `src/app/api/comments/` |
| Media on Vercel Blob | `src/lib/media.ts`, `src/app/admin/(app)/media/` |
| Email sending (SMTP) and log | `src/lib/email.ts` |
| Business details, services and prices read by the public site | `src/lib/site-data.ts`, `src/lib/site-defaults.ts`, `src/components/SiteData.tsx` |
| Create an admin / import the old site's entries / import the WordPress backup | `scripts/` |

**What each role sees:** Administrators: everything. Staff: requests, customers, content, comments, media.
Read-only: can look, can't change. Services & prices, Settings and Users are administrator-only, on the
server as well as in the menu.

**Editable site data:** the values in `src/lib/site.ts`, `content.ts` and `pricing.ts` are the defaults. Once
someone saves in the admin, the saved values win. Public pages refresh straight away after a save, and at
most every 5 minutes otherwise. Customers' past estimates keep the prices they were given.

**WordPress passwords:** imported users keep their old passwords (WordPress bcrypt `$wp$…`, phpass `$P$…`,
or old MD5). They sign in with their email or old username; on the first successful sign-in the password is
re-hashed with scrypt. Unused imported accounts can be disabled from the Users page.

**Statuses:** New → Contacted → Quoted → Scheduled → Completed, or Closed (no job) / Spam.
*Old site* marks entries imported from WordPress, whose outcome was never recorded.

**Roles:** Administrator and Staff can change statuses, add notes and export; Read-only can only view.
Every role check runs on the server. Sign-ins, status changes, notes and exports are written to
`activity_log` (never passwords or tokens).

**Security:** scrypt password hashes; random session tokens in an httpOnly, SameSite=Lax cookie scoped to
`/admin` (Secure in production), stored only as SHA-256; 7-day sessions; sign-in limited to 20 tries per IP
and 8 per account every 15 minutes; public forms limited to 8 per visitor every 10 minutes, plus a honeypot.
Admin pages send `X-Robots-Tag: noindex` and are disallowed in `robots.txt`.

## Local development

```bash
npm run dev
```

With no `DATABASE_URL`, data goes to `.data/pglite` (git-ignored; it holds real customer data once imported).
Only one process can open it: **stop `npm run dev` before running a script.**

Create your admin account (asks for the password at a hidden prompt):

```bash
npm run admin:create -- --email you@example.com --name "Your Name"
```

Add `--role staff` or `--role viewer` for others. Running it again for the same email resets the password
and signs that account out everywhere.

Import the old site's Gravity Forms exports (safe to re-run; already-imported entries are skipped):

```bash
npm run import:wordpress -- "<folder with the gf*.csv exports, outside this repo>"
```

Add `--dry-run` to see the counts without writing anything.

Import the rest of the old site from an **UpdraftPlus backup** (users with their passwords, posts, comments,
portfolio, team, testimonials and the media library). Unzip the `…-uploads.zip` first; media needs
`BLOB_READ_WRITE_TOKEN`. Content arrives as **drafts**; existing accounts are never overwritten; safe to re-run.

```bash
npm run import:wp-backup -- --db "<…-db.gz>" --uploads "<unzipped uploads folder>" --dry-run
```

## Production

1. Create the Postgres database (`docs/setup-checklist.md` A4) and set `DATABASE_URL` in the host.
   Without it, the hosted site refuses to start the database layer instead of silently losing requests.
2. From your computer, with `DATABASE_URL` set to the production database in `.env.local`, run
   `admin:create` once and `import:wordpress` once. The schema is created automatically on first connect.
3. Email alerts: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` in the host, then choose the recipients
   in Admin → Settings → Email and press "Send me a test email". The old site's Amazon SES sender
   (`support@tvinstallpro.ca`) can be reused with SES SMTP credentials.
4. Media: Vercel → Storage → Create → Blob, connect it to the project (adds `BLOB_READ_WRITE_TOKEN`), redeploy.
5. Optional: `ENQUIRY_WEBHOOK_URL` forwards a copy of each new request (e.g. to Zapier or a CRM).
