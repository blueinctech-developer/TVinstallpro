// Customer matching keys. Plain TS (no imports) so the import script can share it.

export const emailKey = (email?: string | null) => {
  const e = (email ?? "").trim().toLowerCase();
  return e.includes("@") ? e : null;
};

/** Last 10 digits, so "+1 (613) 555-0100" and "6135550100" match. Fewer than 10 digits: no key. */
export const phoneKey = (phone?: string | null) => {
  const d = (phone ?? "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : null;
};

type Query = <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<T[]>;

/**
 * Links a request to a customer: the existing one with the same email or phone, or a new one.
 * Matching only groups requests; it never merges or overwrites what customers typed.
 */
export async function customerFor(
  query: Query,
  c: { name: string; email?: string | null; phone?: string | null; area?: string | null },
  at: Date = new Date(),
): Promise<number | null> {
  const ek = emailKey(c.email);
  const pk = phoneKey(c.phone);
  if (!ek && !pk && !c.name.trim()) return null;
  if (ek || pk) {
    const found = await query<{ id: number }>(
      `select id from customers
        where ($1::text is not null and email_key = $1) or ($2::text is not null and phone_key = $2)
        order by id limit 1`,
      [ek, pk],
    );
    if (found.length) {
      // Fill gaps only: a later request may add a phone or area the first one lacked.
      await query(
        `update customers set
           email = coalesce(email, $2), email_key = coalesce(email_key, $3),
           phone = coalesce(phone, $4), phone_key = coalesce(phone_key, $5),
           area = coalesce(area, $6), updated_at = greatest(updated_at, $7)
         where id = $1`,
        [found[0].id, ek ? c.email!.trim() : null, ek, pk ? c.phone!.trim() : null, pk, c.area?.trim() || null, at],
      );
      return found[0].id;
    }
  }
  const made = await query<{ id: number }>(
    `insert into customers (name, email, email_key, phone, phone_key, area, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $7) returning id`,
    [c.name.trim() || "(no name)", c.email?.trim() || null, ek, c.phone?.trim() || null, pk, c.area?.trim() || null, at],
  );
  return made[0].id;
}
