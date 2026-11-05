import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { PageHero } from "@/components/page/PageHero";
import styles from "@/components/page/page.module.css";

export const metadata: Metadata = {
  title: "Book a Service",
  description: "Book TV mounting or any home installation online in about two minutes. See your estimate before you send, and we'll confirm a time that suits you.",
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
        lead="Answer a few quick questions and we'll take care of the rest. It takes about two minutes."
      />
      <section className={styles.section}>
        <div className="wrap">
          <BookingFlow initialService={service} />
        </div>
      </section>
    </>
  );
}
