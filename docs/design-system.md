# TV Install Pro — Design System

Concept: **a precision installation, seen on its central axis.** A calm, light, architectural
environment (white, cool neutrals, the floating TV) that turns into a deep-blue "technical" space
(the light tunnel) when the story moves to *how* we install. Every major composition is built on
one vertical axis; the brand blue lives on that axis.

Art-direction reference: the supplied 23s video (MachinaFusion mock-up) — centred two-tone headline,
sculptural object on the axis, inset panel expanding into a mirrored light tunnel with letter-spaced
words, odometer figures with soft 3D toggles, a pile of screens fanning out, giant footer wordmark.
Reinterpreted for TV Install Pro; none of its branding or imagery is reused.

Tokens live in `src/app/globals.css`. Business content lives in `src/lib/` (see `docs/audit.md`).

## Colour

| Token | Value | Use |
|---|---|---|
| `--brand` | `#0A7CEA` | Logo, fills, glows, display text ≥24px (4.1:1 — not for body text) |
| `--brand-strong` | `#0565C8` | Button and control fills (white text 5.7:1, AA), focus ring on light (5.7:1) |
| `--brand-text` | `#04509F` | Blue *text* on light: links, prices, active nav (7.9:1 white, 7.2:1 surface, AAA) |
| `--ink` | `#0B0F17` | Headings, logo black |
| `--muted` | `#4A5261` | Secondary body text (7.9:1 white, 7.2:1 surface, AAA) |
| `--ghost` | `#646E7D` | De-emphasised half of display headlines + placeholders (5.2:1 white, 4.7:1 surface, AAA large text) |
| `--control` | `#7D8796` | Borders that define inputs, radios, clickable cards, ghost buttons (3.6:1) |
| `--surface` / `--line` | `#F3F5F8` / `#E2E6EC` | Section backgrounds; decorative hairlines only (never a control edge) |
| `--abyss` / `--deep` | `#030A16` / `#071A33` | Deep-blue environment (tunnel, CTA, footer) |
| `--sky` / `--mist` | `#5EB0FA` / `#B4C3D6` | Accent + focus ring on dark (7.5–8.6:1) / body text on dark (11:1 abyss, ≥5.9:1 on the brightest blue) |
| Error | `#991B1B` | Error text and borders (8.3:1), always paired with a message and icon |

Rule: blue is reserved for the brand mark, the axis and interactive elements.

**Accessibility (WCAG 2.2):** all text meets AA; body, links, secondary text, errors and dark-section text meet AAA.
The one deliberate AA-only case is white text on the brand-blue buttons (5.7:1): the deeper AAA blue is used for text, not fills,
to keep the brand colour. Smallest text is 14px. Dark sections carry `.on-dark` (sky focus ring). Text over moving light
(the tunnel) sits on a dark backing; text over photos sits on a ≥92% navy fade.

## Typography

- **Display — Jura** (600–700): headlines, kinetic words, prices and figures. Tight tracking (−0.035 to −0.05em).
  Letter-spaced caps (`.tracked`, 0.32em) only for single kinetic words.
- **Text — Manrope** (400–700): navigation, body, forms, price tables, buttons.
- Chosen after comparing Jura, Manrope, Space Grotesk and Inter: Jura keeps the brand voice at display sizes
  but is weak in paragraphs; Manrope is the most legible and calm; Space Grotesk read as "AI start-up";
  Inter was too generic.
- Scale: `--step--1` … `--step-5` (fluid `clamp`). Two-tone headlines: emphasised words in ink, the rest in `.ghost`.
- No eyebrow labels above headings (removed site-wide at the owner's request).

## Axial grid

- 12 columns (6 ≤900px, 4 ≤560px), `--gap` 16–24px, `--margin` 16–56px, max 1360px. Use `.wrap` + `.grid`.
- The **axis** sits between columns 6 and 7. `.axis-line` draws it.
- **Axial** compositions centre on the axis: hero, tunnel, section titles, journey, CTA, footer wordmark.
- **Flank** compositions sit in one half: left 1–5/6, right 7/8–12 (forms, price tables, editorial rows).
  Alternate rows mirror across the axis (`[data-flip]`).

## Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16,1,0.3,1)` | Entrances, hovers (anime.js `outExpo`) |
| `--ease-in-out` | `cubic-bezier(0.65,0,0.35,1)` | Travel, panels (anime.js `inOutQuart`) |
| `--dur-micro` / `--dur-ui` / `--dur-reveal` | 160 / 320 / 900ms | Press, hover/state, reveals |

Libraries: **anime.js** (timelines, staggers, odometer, SVG draw) + **CSS** (scroll-linked transforms via `--p`)
+ **React Three Fiber** (hero TV only). One system per effect.

- Scroll-linked effects read `--p` (0–1) from `useScrollProgress` (modes: `through`, `sticky`, `enter`, `leave`).
  It only runs while the element is near the viewport. **Never hijack scrolling** — sticky sections only.
- Kinetic type: hero lines drift apart on scroll; tunnel words step with scroll; footer wordmark slides with scroll.
  Nothing loops on its own.
- Reduced motion: progress pinned to the settled state, intro skipped, tunnel becomes a static list, 3D TV still.

## Components (when to use)

- **`.btn`** primary (blue) for the one main action per view; `.btn--ghost` secondary; `.btn--light`/`--on-dark` on dark.
  `.btn-dot` adds the arrow knob. Minimum height 48px.
- **`.link`** inline text actions (underline grows on hover).
- **`PageHero`** opens every inner page (crumb, two-tone title, lead, optional actions) in one of three forms, so pages
  start differently inside one system: centred on the axis (Book, Partner, Contact), `media` split with a photo wiped in
  (About), or `tone="dark"` with a `strip` of facts (Services: the TV-size prices).
- **`SectionHead`** opens every section; `tone="dark"` inside `.on-dark` bands.
- **`Choices`** radio/checkbox cards for any decision with ≤10 options; **`Field`** for text input.
- **`SubmitOutcome`** for every form result. Success is only shown when the server confirms delivery.
- **`Odometer`** only for verified figures. **`LightTunnel`** only in the precision transition.

## States

- Focus: 2px `--brand-strong` outline (fields: blue border + soft ring).
- Error: red border, inline message linked via `aria-describedby`, an error summary (`role=alert`), focus moved to the first error.
- Loading: button shows "Sending…" with `aria-busy`. Success / fallback: `SubmitOutcome`.

## 3D scene

`src/components/hero/TvScene.tsx` — procedural TV (no model download), `RoomEnvironment` reflections,
renders only while visible, DPR capped at 1.75, swings in after the intro, follows the pointer and squares up on scroll.
It is a wall-mounted rig: a fixed wall plane (unlit shader that fades into the page and carries the TV's soft shadow), a
wall plate, and a two-link full-motion arm solved each frame. At rest the TV is pulled out and angled so the arm shows
past its edge; as the hero scrolls away it folds flush onto the wall.
A CSS poster of the same rig (wall hint, plate, arm, shadow) renders first. It remains the fallback when WebGL is
unavailable, and it is all that phones, Data Saver and low-memory devices get.

## Photography

All photos are TV Install Pro's own, taken from tvinstallpro.ca, in `public/images/`. No logos were taken, and photos
showing third-party brand marks were dropped or cropped. Each photo got one shared grade (gentle level stretch,
saturation 0.9, a touch cooler), a lanczos3 upscale to ~1800px on the long edge (max 2×) and a mild unsharp mask.
Classic upscaling cannot add detail, so the gain over the originals is modest; swap in the owner's full-resolution
originals when available. Captions describe only what is in the frame: no places, dates or clients. Laser TV uses the
site's product render.

## Hierarchy rules

1. **One headline leads each page.** `display-1` (H1) is the largest type on any page. Task pages
   (Book, Contact, Partner) use `PageHero size="compact"` so the form starts above the fold.
2. **Clear steps:** H1 up to 132px → finale (`display-finale`) up to 80px and figures up to 80px →
   section H2 (`display-2`) up to 56px → sub-heading (`display-3`) up to 34px → body 16–18px. Never skip upward.
3. **Two-tone (`.ghost`) is for openings and the finale only.** Section headings are one colour.
4. **Every section opens with `SectionHead`:** chapter hairline, heading left of the axis (cols 1–6),
   one or two sentences + optional action right of it (cols 8–12). No labels above headings.
   Axial (centred) compositions are reserved for the hero, the tunnel, the journey's steps and the finale.
5. **Rhythm:** standard sections `--space-9`; the tunnel and finale take more room.
6. **One action name per intent:** "Get an instant estimate" in page content (primary), "Book a Service" in
   navigation, phone as the secondary action.
7. **Header** (`src/components/layout/Header.tsx`): axial — logo left, text navigation centred on the axis
   (equal side columns), actions right. Exactly one pill (Book a Service); phone and nav are text links with the
   site's underline; every element is 44px tall. ≥1240px shows the links; below, one outline Menu button
   (the secondary-button style); ≤760px the bottom bar carries Call + Book. The bar takes the tone of the section
   underneath: mark full-width dark sections with `data-header="dark"` (light logo, sky accents, dark glass).
