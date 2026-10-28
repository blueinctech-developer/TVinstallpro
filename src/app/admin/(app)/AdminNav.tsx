"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import styles from "../admin.module.css";

const items: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Overview", icon: "tv" },
  { href: "/admin/requests", label: "Requests", icon: "mail" },
  { href: "/admin/customers", label: "Customers", icon: "user" },
];

export function AdminNav({ newCount }: { newCount: number }) {
  const path = usePathname();
  return (
    <nav className={styles.nav} aria-label="Admin">
      {items.map((it) => {
        const active = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={styles.navLink} aria-current={active ? "page" : undefined}>
            <Icon name={it.icon} size={18} />
            {it.label}
            {it.href === "/admin/requests" && newCount > 0 && (
              <span className={styles.navCount} aria-label={`${newCount} new`}>
                {newCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
