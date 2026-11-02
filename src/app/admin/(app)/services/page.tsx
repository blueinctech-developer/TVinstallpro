import type { Metadata } from "next";
import Link from "next/link";
import type { IconName } from "@/components/Icon";
import { requireUser } from "@/lib/admin/auth";
import { listMedia } from "@/lib/media";
import { getAllServices, getSiteData } from "@/lib/site-data";
import styles from "../../admin.module.css";
import { PricesForm, ServicesForm } from "./forms";

export const metadata: Metadata = { title: "Services & prices" };

// Line icons that suit a service; the built-in nine use the same set.
const icons: IconName[] = ["tools", "tv", "fireplace", "projector", "frame", "appliance", "blinds", "shelf", "gazebo", "wallpaper", "speaker", "wifi", "network", "shield", "truck", "pin"];

export default async function ServicesAdmin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireUser("admin");
  const tab = (await searchParams).tab === "services" ? "services" : "prices";
  const [{ prices }, services, media] = await Promise.all([getSiteData(), getAllServices(), listMedia()]);

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>
            Services <span className="ghost">&amp; prices</span>
          </h1>
          <p className={styles.sub}>
            What the website and the booking form show. Requests already received keep the prices they were given.
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
          Services ({services.length})
        </Link>
      </nav>
      <div style={{ maxWidth: 900 }}>
        {tab === "prices" ? (
          <PricesForm p={prices} />
        ) : (
          <ServicesForm services={services} icons={icons} media={media.map((m) => ({ id: m.id, url: m.url, alt: m.alt, filename: m.filename }))} />
        )}
      </div>
    </>
  );
}
