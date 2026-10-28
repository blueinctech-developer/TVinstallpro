import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { requireUser } from "@/lib/admin/auth";
import { fmtDate } from "@/lib/admin/format";
import { blobConfigured, listMedia } from "@/lib/media";
import styles from "../../admin.module.css";
import { Empty } from "../../ui";
import { MediaCard, UploadForm } from "./forms";

export const metadata: Metadata = { title: "Media" };

const kb = (n: number | null) => (n ? (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`) : "");

export default async function MediaPage() {
  await requireUser("staff");
  const items = await listMedia();
  const ready = blobConfigured();
  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>
            Media <span className="ghost">{items.length}</span>
          </h1>
          <p className={styles.sub}>Images for posts, portfolio and team. Add alt text so screen readers and search engines understand them.</p>
        </div>
      </div>
      {!ready && (
        <p className={styles.notice} data-kind="warn">
          <Icon name="alert" size={18} />
          <span>
            Uploads aren&apos;t connected yet. In Vercel, open <strong>Storage → Create → Blob</strong>, connect it to this project (this adds{" "}
            <code>BLOB_READ_WRITE_TOKEN</code>), then redeploy.
          </span>
        </p>
      )}
      <section className={styles.panel}>
        <div className={styles.panelBody}>
          <UploadForm disabled={!ready} />
        </div>
      </section>
      {items.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16 }}>
          {items.map((m) => (
            <MediaCard
              key={m.id}
              id={m.id}
              url={m.url}
              alt={m.alt}
              filename={m.filename}
              meta={[kb(m.size), fmtDate(m.created_at), m.source === "wordpress" ? "old site" : ""].filter(Boolean).join(" · ")}
            />
          ))}
        </div>
      ) : (
        <section className={styles.panel}>
          <Empty title="No images yet">Uploaded images and the old site&apos;s media library will appear here.</Empty>
        </section>
      )}
    </>
  );
}
