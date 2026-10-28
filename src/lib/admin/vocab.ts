// Labels shared by the admin UI and the server. Safe to import from client components.

export const kinds = {
  booking: "Booking",
  contact: "Contact",
  partner: "Partner",
} as const;
export type Kind = keyof typeof kinds;

/*
 * Request workflow. "legacy" marks requests imported from the old WordPress site, whose
 * outcome was never recorded; nothing is marked confirmed unless someone here confirms it.
 */
export const statuses = {
  new: { label: "New", tone: "brand" },
  contacted: { label: "Contacted", tone: "info" },
  quoted: { label: "Quoted", tone: "info" },
  scheduled: { label: "Scheduled", tone: "good" },
  completed: { label: "Completed", tone: "done" },
  closed: { label: "Closed, no job", tone: "muted" },
  spam: { label: "Spam", tone: "muted" },
  legacy: { label: "Old site", tone: "muted" },
} as const;
export type Status = keyof typeof statuses;
export const statusOrder = Object.keys(statuses) as Status[];
/** Statuses that still need someone to act. */
export const openStatuses: Status[] = ["new", "contacted", "quoted", "scheduled"];

export const roles = {
  admin: "Administrator",
  staff: "Staff",
  viewer: "Read-only",
} as const;
export type Role = keyof typeof roles;
const rank: Record<Role, number> = { viewer: 0, staff: 1, admin: 2 };
export const roleAtLeast = (role: Role, min: Role) => rank[role] >= rank[min];

export const isKind = (v: unknown): v is Kind => typeof v === "string" && v in kinds;
export const isStatus = (v: unknown): v is Status => typeof v === "string" && v in statuses;
