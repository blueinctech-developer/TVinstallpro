import type { Metadata } from "next";
import Image from "next/image";
import { BookingCta } from "@/components/home/BookingCta";
import { Journey } from "@/components/home/Journey";
import { PageHero } from "@/components/page/PageHero";
import page from "@/components/page/page.module.css";
import { images } from "@/lib/content";
import { getSiteData } from "@/lib/site-data";
import type { SiteData } from "@/lib/site-defaults";
import styles from "./about.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const site = (await getSiteData()).business;
  return {
    title: "About",
    description: `${site.name} provides professional, affordable, on-time TV and home installation in ${site.area}.`,
    alternates: { canonical: "/about" },
  };
}

// Paraphrased from the live About page (see docs/audit.md).
const principlesFor = (site: SiteData["business"]) => [
  { word: "Quality", text: "Skilled technicians and the right hardware for the job, using current tools and equipment." },
  { word: "Affordable", text: "Professional installation without big-box pricing, with every option itemised up front." },
  { word: "On time", text: "We arrive when we say we will and finish with as little disruption to your home as possible." },
  { word: "Covered", text: `Installation work comes with a ${site.warrantyMonths}-month warranty.` },
];

export default async function AboutPage() {
  const site = (await getSiteData()).business;
  const principles = principlesFor(site);
  return (
    <>
      <PageHero
        crumb="About"
        title="Installation,"
        ghost="done right."
        lead={`${site.name} is a professional installation team serving ${site.area}.`}
        media={images.craft}
      />

      <section className={page.section} aria-labelledby="mission-title">
        <div className="wrap grid">
          <div className={styles.media} data-reveal="">
            <Image
              src={images.detail.src}
              alt={images.detail.alt}
              fill
              sizes="(max-width: 900px) 100vw, 45vw"
            />
          </div>
          <div className={styles.copy}>
            <h2 id="mission-title" className="display-3" data-reveal="">
              Your equipment deserves better than whoever is available.
            </h2>
            <p data-reveal="">
              Big-box retailers can be expensive, and they may send inexperienced staff to install equipment worth
              thousands of dollars. We think that&apos;s a risk you shouldn&apos;t have to take.
            </p>
            <p data-reveal="">
              Our mission is to provide exceptional, professional installation that is hassle-free, high quality,
              affordable and completed on time, so your TV, sound and appliances work exactly as they should.
            </p>
            <p data-reveal="">
              A standard TV installation includes connecting up to {site.componentsIncluded} of your existing components,
              and every job ends with a full test before we leave.
            </p>
          </div>
        </div>
      </section>

      <section className={`${page.section} ${styles.principles} on-dark`} data-header="dark" aria-labelledby="principles-title">
        <span className="axis-line" aria-hidden="true" />
        <div className="wrap">
          <h2 id="principles-title" className="sr-only">
            What we stand for
          </h2>
          <ol className={styles.list}>
            {principles.map((p, i) => (
              <li key={p.word} className={styles.item} data-side={i % 2 ? "right" : "left"} data-reveal="">
                <span className={`tracked ${styles.word}`}>{p.word}</span>
                <p>{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Journey />
      <BookingCta />
    </>
  );
}
