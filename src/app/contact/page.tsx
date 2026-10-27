import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/forms/EnquiryForms";
import { Faq } from "@/components/home/Faq";
import { Icon } from "@/components/Icon";
import { PageHero } from "@/components/page/PageHero";
import page from "@/components/page/page.module.css";
import { faqs } from "@/lib/content";
import { site } from "@/lib/site";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description: `Call ${site.phone}, message us on WhatsApp, or send ${site.name} a message.`,
  alternates: { canonical: "/contact" },
};

const channels = [
  { icon: "phone" as const, label: "Call", value: site.phone, href: site.phoneHref },
  { icon: "whatsapp" as const, label: "WhatsApp", value: "Message a technician", href: site.whatsapp, external: true },
  { icon: "mail" as const, label: "Email", value: site.email, href: `mailto:${site.email}` },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        size="compact"
        crumb="Contact"
        title="Talk to"
        ghost="a technician."
        lead={`Serving ${site.area}. Same-day installation is often available. Call to check.`}
      >
        {/* The fastest route first: the phone number is the page's opening action. */}
        <a href={site.phoneHref} className="btn">
          <Icon name="phone" size={16} />
          {site.phone}
        </a>
        <a href={site.whatsapp} className="btn btn--ghost" target="_blank" rel="noopener noreferrer">
          WhatsApp us
        </a>
      </PageHero>
      <section className={page.section}>
        <div className="wrap grid">
          <aside className={styles.aside}>
            <ul className={styles.channels}>
              {channels.map((c) => (
                <li key={c.label} data-reveal="">
                  <a href={c.href} className={styles.channel} {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    <span className={styles.channelIcon}>
                      <Icon name={c.icon} size={20} />
                    </span>
                    <span>
                      <span className={styles.channelLabel}>{c.label}</span>
                      <span className={styles.channelValue}>{c.value}</span>
                    </span>
                    <Icon name="arrow" size={18} className={styles.channelArrow} />
                  </a>
                </li>
              ))}
            </ul>
            <p className={styles.direct} data-reveal="">
              Want a price first? <Link href="/book">Build an instant TV-mounting estimate</Link>.
            </p>
          </aside>
          <div className={styles.formCol} data-reveal="">
            <h2 className={`display-3 ${styles.formTitle}`}>Send a message</h2>
            <ContactForm />
          </div>
        </div>
      </section>
      <Faq items={faqs.slice(0, 6)} title="Before you ask." />
    </>
  );
}
