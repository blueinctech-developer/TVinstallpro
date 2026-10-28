import Link from "next/link";
import { kinds, statuses, type Kind, type Status } from "@/lib/admin/vocab";
import styles from "./admin.module.css";

export function StatusBadge({ status }: { status: Status }) {
  const s = statuses[status] ?? { label: status, tone: "muted" };
  return (
    <span className={styles.badge} data-tone={s.tone}>
      {s.label}
    </span>
  );
}

export const kindLabel = (k: Kind) => kinds[k] ?? k;

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className={styles.empty}>
      <strong>{title}</strong>
      {children}
    </div>
  );
}

/** Previous / next links that keep the current filters. */
export function Pager({ page, pages, total, href }: { page: number; pages: number; total: number; href: (p: number) => string }) {
  return (
    <div className={styles.pager}>
      <span>
        {total} {total === 1 ? "result" : "results"} · page {page} of {pages}
      </span>
      {pages > 1 && (
        <nav aria-label="Pages">
          {page > 1 && (
            <Link className={`btn btn--ghost ${styles.btnSm}`} href={href(page - 1)}>
              Previous
            </Link>
          )}
          {page < pages && (
            <Link className={`btn btn--ghost ${styles.btnSm}`} href={href(page + 1)}>
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

/** Builds a URL from the current filters, dropping empty ones. */
export function withParams(base: string, params: Record<string, string | number | undefined | null>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}
