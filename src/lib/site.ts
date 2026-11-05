// Business details used across the site. Verified against tvinstallpro.ca (see docs/audit.md).
export const site = {
  name: "TV Install Pro",
  url: "https://tvinstallpro.ca",
  description:
    "Professional TV mounting and home installation across Ottawa, Gatineau and surrounding areas. Clean, secure installations with same-day appointments often available.",
  phone: "(418) 334-7761",
  phoneHref: "tel:+14183347761",
  whatsapp: "https://wa.link/71bpsm",
  // TODO(owner): the live site only shows a template placeholder. Set the real inbox before launch.
  email: "info@tvinstallpro.ca",
  // The live marketing copy says Ottawa/Gatineau; the live forms list regions Canada-wide. Owner to confirm.
  area: "Ottawa, Gatineau & surrounding areas",
  warrantyMonths: 12,
  componentsIncluded: 2,
} as const;

export const nav = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/partner-with-us", label: "Partner With Us" },
  { href: "/contact", label: "Contact" },
] as const;

/** The menu, plus optional sections once they have published content. */
export const navWith = (links: { blog: boolean; work: boolean }): { href: string; label: string }[] => [
  ...nav,
  ...(links.work ? [{ href: "/our-work", label: "Our Work" }] : []),
  ...(links.blog ? [{ href: "/blog", label: "Tips" }] : []),
];

export const bookHref = "/book";
