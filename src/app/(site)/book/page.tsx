import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { PageHero } from "@/components/page/PageHero";
import styles from "@/components/page/page.module.css";

export const metadata: Metadata = {
  title: "Book a Service",
  description: "Book TV mounting or any home installation. Get an instant, itemised TV-mounting estimate and send your request in minutes.",
  alternates: { canonical: "/book" },
};

export default async function BookPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  return (
    <>
      <PageHero
        size="compact"
        crumb="Book a Service"
        title="Book a"
        ghost="service."
        lead="Build an itemised TV-mounting estimate, or request a quote for any other installation. We'll contact you to confirm a time."
      />
      <section className={styles.section}>
        <div className="wrap">
          <BookingFlow initialService={service} />
        </div>
      </section>
    </>
  );
}
