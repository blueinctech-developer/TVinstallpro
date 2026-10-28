"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { roleAtLeast, type Role } from "@/lib/admin/vocab";
import styles from "../admin.module.css";

type Item = { href: string; label: string; icon: IconName; min?: Role; count?: "requests" | "comments" };

const sections: { title?: string; items: Item[] }[] = [
  {
    items: [
      { href: "/admin", label: "Overview", icon: "tv" },
      { href: "/admin/requests", label: "Requests", icon: "mail", count: "requests" },
      { href: "/admin/customers", label: "Customers", icon: "user" },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/admin/content/posts", label: "Posts", icon: "quote" },
      { href: "/admin/comments", label: "Comments", icon: "mail", count: "comments" },
      { href: "/admin/content/portfolio", label: "Portfolio", icon: "frame" },
      { href: "/admin/content/team", label: "Team", icon: "user" },
      { href: "/admin/content/testimonials", label: "Testimonials", icon: "star" },
      { href: "/admin/media", label: "Media", icon: "wallpaper" },
      { href: "/admin/services", label: "Services & prices", icon: "tools", min: "admin" },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/admin/settings", label: "Settings", icon: "shield", min: "admin" },
      { href: "/admin/users", label: "Users", icon: "user", min: "admin" },
    ],
  },
];

export function AdminNav({ role, counts }: { role: Role; counts: { requests: number; comments: number } }) {
  const path = usePathname();
  return (
    <nav className={styles.nav} aria-label="Admin">
      {sections.map((s, i) => {
        const items = s.items.filter((it) => !it.min || roleAtLeast(role, it.min));
        if (!items.length) return null;
        return (
          <div key={i} className={styles.navGroup}>
            {s.title && <span className={styles.navTitle}>{s.title}</span>}
            {items.map((it) => {
              const active = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
              const n = it.count ? counts[it.count] : 0;
              return (
                <Link key={it.href} href={it.href} className={styles.navLink} aria-current={active ? "page" : undefined}>
                  <Icon name={it.icon} size={18} />
                  {it.label}
                  {n > 0 && (
                    <span className={styles.navCount} aria-label={`${n} waiting`}>
                      {n}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
