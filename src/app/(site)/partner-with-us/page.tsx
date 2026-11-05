import type { Metadata } from "next";
import { PartnerForm } from "@/components/forms/EnquiryForms";
import { PageHero } from "@/components/page/PageHero";
import page from "@/components/page/page.module.css";
import { getSiteData } from "@/lib/site-data";
import styles from "../contact/contact.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const site = (await getSiteData()).business;
  return {
    title: "Partner With Us",
    description: `Partner with ${site.name} for complete, professional installations, from a single TV to full sound and gaming systems.`,
    alternates: { canonical: "/partner-with-us" },
  };
}

const steps = [
  { n: "01", title: "Tell us about your project", text: "Share who you are and what you have in mind." },
  { n: "02", title: "We'll give you a call", text: "At a time that suits you, to talk through the details." },
  { n: "03", title: "We plan it together", text: "From a single installation to a complete entertainment system." },
];

export default async function PartnerPage() {
  const site = (await getSiteData()).business;
  return (
    <>
      <PageHero
        size="compact"
        crumb="Partner With Us"
        title="Let's build"
        ghost="it together."
        lead="We work with partners to deliver complete, professional installations, from a single TV to a full entertainment system with sound and gaming."
      />
      <section className={page.section}>
        <div className="wrap grid">
          <aside className={styles.aside}>
            <h2 className="display-3" data-reveal="">
              How it works
            </h2>
            <ol className={styles.steps}>
              {steps.map((s) => (
                <li key={s.n} data-reveal="">
                  <span className={styles.stepNum}>{s.n}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className={styles.direct} data-reveal="">
              Prefer to talk now? <a href={site.phoneHref}>{site.phone}</a>
            </p>
          </aside>
          <div className={styles.formCol} data-reveal="">
            <h2 className={`display-3 ${styles.formTitle}`}>Partnership request</h2>
            <PartnerForm />
          </div>
        </div>
      </section>
    </>
  );
}
