import type { Metadata } from "next";
import { PartnerForm } from "@/components/forms/EnquiryForms";
import { PageHero } from "@/components/page/PageHero";
import page from "@/components/page/page.module.css";
import { site } from "@/lib/site";
import styles from "../contact/contact.module.css";

export const metadata: Metadata = {
  title: "Partner With Us",
  description: `Send ${site.name} a partnership request: complete installations, from TVs to sound and gaming systems.`,
  alternates: { canonical: "/partner-with-us" },
};

const steps = [
  { n: "01", title: "Send your request", text: "Tell us who you are and what you have in mind." },
  { n: "02", title: "We call you", text: "At the time you choose, to talk it through." },
  { n: "03", title: "We plan the work", text: "Together, from a single install to a complete entertainment system." },
];

export default function PartnerPage() {
  return (
    <>
      <PageHero
        size="compact"
        crumb="Partner With Us"
        title="Let's build"
        ghost="it together."
        lead="We work with partners to create the ideal installation, from a single TV to a complete entertainment system with sound and gaming."
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
              Rather talk now? <a href={site.phoneHref}>{site.phone}</a>
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
