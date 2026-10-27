# tvinstallpro.ca — Content & Journey Audit

Audited 2026-10-26 from the live WordPress site. This is the source of truth for business content in the redesign.
Anything marked **UNVERIFIED** or **CONFLICT** needs the owner's confirmation before launch.

## Pages

| Page | URL | Purpose |
|---|---|---|
| Home | `/` | Hero ("Expert TV Installation in Ottawa, Gatineau and Environs"), services, 4-step process, why-us |
| Services & Pricing | `/services/` | Featured services, long "other services" list, four "From $" rates |
| About | `/about-us/` | Mission, anti-big-box positioning, 12-month warranty, 2-components-included |
| Partner With Us | `/partner-with-us/` | Partnership request form |
| Contact Us | `/contact-us/` | General enquiry form |
| Book a Service | `/book-a-service/` | Index of 9 services, each linking to its own booking page |
| 9 × service booking pages | see below | One booking/enquiry form per service |

## Verified business details

- **Name:** TVinstallpro / TV Install Pro
- **Phone:** (418) 334-7761 — `tel:+14183347761` (the only real number; others are template leftovers)
- **WhatsApp:** https://wa.link/71bpsm
- **Service area (marketing copy):** Ottawa, Gatineau and environs
- **Brand colours (sampled from logo PNG):** blue `#0A7CEA`, black `#000000`
- **Logo:** `wp-content/uploads/2023/02/TV-INSTALL-PRO.png` (500×83) — rebuilt as vector in `src/components/logo`
- **Claims on site:** "Same day installation available", "24/7 support", 12-month warranty on installation work,
  up to two existing components included in a standard install, rating "4.9 (Trusted by Thousands)" / "5.0", "since 2021", "50+ happy clients"
  — **UNVERIFIED**: ratings and client counts have no source; do not publish as statistics without proof.

## Placeholder / template leftovers on the live site (do NOT carry over)

- Email `info@example.com` (every page) — **real email unknown**
- Addresses: "85 Road Broklyn Street, 600 New York, USA" and "A-1, envanto headquarters melbourne, australia"
- Phones: +92 555 878 1245, +1 822 223 555
- Social: facebook.com/HandymanIgwe, twitter.com/igwEnterpryz, instagram.com/igwe_enterpryz — **confirm ownership**
- Nav links to `cleano.preyantechnosys.com` (theme demo), unrendered `[instagram-feed feed=1]`, `{all_fields}` tag
- Typos: "Installatiion", "Organizaion", "Shelve", "gurantee"

## CONFLICT — service area

Marketing copy says **Ottawa, Gatineau and environs**, but every form asks for a **province + region across all of Canada**
(AB, BC, MB, NL, NB, NS, ON, PE, QC, SK; e.g. ON lists GTA, Ottawa, Hamilton, London, Windsor…; QC lists Montreal, Quebec City, Gatineau).
Owner must confirm which is true before the redesign states a service area.

## Services and booking pages

| Service | Booking URL | Intake |
|---|---|---|
| TV Installation & Mounting | `/tv-installation-and-mounting-service` | **7-step estimator with prices** (below) |
| Mantel Mount Installation | `/mantel-mount-installation-service` | Contact form only |
| Laser TV Installation | `/laser-tv-installation-service` | Contact form only |
| Samsung Frame Installation | `/samsung-frame-tv-installation-service` | Contact form only |
| Home Appliances Installation | `/home-appliances-installation` | Contact form only |
| Blinds & Curtains Installation | `/blinds-and-curtains-installation` | Contact form only (+ CAPTCHA) |
| Garage Shelves Organization | `/garage-shelves-organization` | Contact form only |
| Gazebos & Sheds Installation | `/gazebos-and-sheds-installation` | Contact form only |
| Wallpaper Works | `/wallpaper-works` | Contact form only |

Standard contact form (all non-TV services): First name*, Last name*, Phone*, Email*, Province*, Region* (depends on province).

Also listed under "other services" on `/services/`: handyman, drywall, fan installation, furniture assembly, flooring,
shelf installation, home cinema, new builds, outdoor living space, basement development, bidet, custom cabinet,
emergency services, sound bar installation/mount, outdoor monitor, fridge install, full-motion wall mount, garage storage,
metal studs, picture hanging, curtain rod, outdoor lighting.

### TV Installation estimator (verified prices)

Steps: General → TV size → Mount type → Structure → Takedown → Add-ons → Maintenance, with a running **Cost Estimate**.

| Group | Option | Price |
|---|---|---|
| TV size* | Up to 31" | $60.99 |
| | 32"–60" | $79.99 |
| | 61"–79" | $89.99 |
| | 80" and above | $120.99 |
| Wall mount* | Fixed | $50 |
| | Tilting | $65 |
| | Full motion | $100 |
| | Already have a mount | — |
| Above fireplace?* | Yes | +$25 |
| Wall surface | Drywall/wood | — |
| | Drywall with metal studs / Plaster | +$10 |
| | Concrete / Brick | +$20 |
| | Tile / Stone | +$40 |
| | Other / don't know | — |
| Cord concealment* | Through existing channel | $25 |
| | External concealment | $59 |
| Add-ons | Sound bar installation | +$30 |
| | Sound mount installation | +$50 |
| | Wall shelf installation | +$35 |
| | Surround sound setup | +$85/hr |
| | Additional fire-resistant HDMI | +$40 |
| | Electric fireplace | +$75.50 |
| | Pull-down mount installation | +$70 |
| | Other | quoted |
| Existing TV takedown* | Yes | +$45 |
| Device setup* (cable box, console…) | per device | +$20 |
| Devices behind TV (Apple TV…) | per device | $25 |
| Add another TV | Yes / No | — |
| Extended maintenance | 1 year / 2 years | +$49.99 / +$89.99 |

No date picker, payment, deposit, terms, cancellation policy or confirmation text exists on any booking page.
**The submission backend is unknown** (WordPress form plugin, not identifiable from the page) — the new site needs its own.

### Services & Pricing page "From" rates — CONFLICT

`/services/` shows TV Installation "From $17", WIFI Setup "From $22", Networking "From $24", Home Theatre "From $31".
These contradict the estimator ($60.99 minimum for TV size alone). Likely theme placeholders — **not published**: the redesign uses only the estimator prices.

## Partner With Us form

About You: Name* (first/last), Address (street, line 2, city, ZIP). How can we reach you: Preferred contact (Email/Phone),
Phone*, Email*, Best time to call* (30-min slots). Comments*. No partner types or benefits are stated on the page.

## Process (verified, from homepage)

1. Book a service (form, email or phone) → 2. Meet our experts (technician visits) → 3. Work starts (minimal disruption) → 4. Testing (final check).

## Open questions for the owner

1. Real public email address?
2. Service area: Ottawa/Gatineau only, or Canada-wide?
3. Are the "From $" rates on /services/ real? (Estimator prices are used in the redesign.)
4. Real reviews (e.g. Google Business Profile) and real job photos?
5. Do the Facebook/Twitter/Instagram accounts belong to the business?
6. Where should booking, contact and partner submissions be delivered (email inbox, CRM)?
