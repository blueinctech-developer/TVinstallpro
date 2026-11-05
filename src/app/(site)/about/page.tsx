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
    description: `${site.name} delivers professional, dependable TV and home installation across ${site.area}.`,
    alternates: { canonical: "/about" },
  };
}

// Paraphrased from the live About page (see docs/audit.md).
const principlesFor = (site: SiteData["business"]) => [
  { word: "Quality", text: "Skilled technicians, quality hardware and modern tools on every job." },
  { word: "Fair", text: "Professional results at honest prices, with your estimate in front of you before you book." },
  { word: "On time", text: "We arrive when we say we will and leave your home as tidy as we found it." },
  { word: "Covered", text: `Every installation is backed by a ${site.warrantyMonths}-month warranty.` },
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
        lead={`A dedicated installation team serving ${site.area}, focused on getting every job right the first time.`}
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
              Your home deserves an expert.
            </h2>
            <p data-reveal="">
              Your TV, sound system and appliances are a real investment. They deserve more than a rushed job by
              whoever happens to be available.
            </p>
            <p data-reveal="">
              That&apos;s why we do things properly: experienced technicians, the right hardware for your wall and a clean,
              careful finish, delivered on time and at a fair price.
            </p>
            <p data-reveal="">
              Every standard TV installation includes connecting up to {site.componentsIncluded} of your existing devices, and
              every job ends with a full test before we leave.
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
