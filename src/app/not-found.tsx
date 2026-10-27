import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <section
      style={{
        minHeight: "80svh",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: "calc(var(--header-h) + 48px) var(--margin) 64px",
        background: "radial-gradient(90% 70% at 50% 0%, #fff 30%, var(--surface) 100%)",
      }}
    >
      <div style={{ display: "grid", justifyItems: "center", gap: 24 }}>
        <h1 className="display-1">
          No <span className="ghost">signal.</span>
        </h1>
        <p className="lead">The page you&apos;re looking for isn&apos;t here. It may have moved when we rebuilt the site.</p>
        <Link href="/" className="btn">
          Back to home
          <span className="btn-dot" aria-hidden="true">
            <Icon name="arrow" size={14} strokeWidth={2} />
          </span>
        </Link>
      </div>
    </section>
  );
}
