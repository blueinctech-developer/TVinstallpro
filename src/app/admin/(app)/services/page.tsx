import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/admin/auth";
import { services as defaultServices } from "@/lib/content";
import { getSetting, getSiteData } from "@/lib/site-data";
import { mergeServices, type ServiceEdit } from "@/lib/site-defaults";
import styles from "../../admin.module.css";
import { PricesForm, ServicesForm } from "./forms";

export const metadata: Metadata = { title: "Services & prices" };

export default async function ServicesAdmin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireUser("admin");
  const tab = (await searchParams).tab === "services" ? "services" : "prices";
  const [{ prices }, edits] = await Promise.all([getSiteData(), getSetting<ServiceEdit[]>("services")]);
  // Show every service, including hidden ones, with their saved wording.
  const all = defaultServices.map((d) => mergeServices([{ ...(edits?.find((e) => e.slug === d.slug) ?? { slug: d.slug }), hidden: false }]).find((s) => s.slug === d.slug)!);
  const hidden = (edits ?? []).filter((e) => e.hidden).map((e) => e.slug);

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>
            Services <span className="ghost">&amp; prices</span>
          </h1>
          <p className={styles.sub}>
            What the website and the booking estimator show. Customers&apos; past estimates keep the prices they were given.
          </p>
        </div>
        <Link href="/services" target="_blank" className={`btn btn--ghost ${styles.btnSm}`}>
          View on the website
        </Link>
      </div>
      <nav className={styles.tabs} aria-label="Sections" style={{ justifySelf: "start" }}>
        <Link href="/admin/services" className={styles.tab} aria-current={tab === "prices" ? "page" : undefined}>
          TV mounting prices
        </Link>
        <Link href="/admin/services?tab=services" className={styles.tab} aria-current={tab === "services" ? "page" : undefined}>
          Services
        </Link>
      </nav>
      <div style={{ maxWidth: 900 }}>{tab === "prices" ? <PricesForm p={prices} /> : <ServicesForm services={all} hidden={hidden} />}</div>
    </>
  );
}
