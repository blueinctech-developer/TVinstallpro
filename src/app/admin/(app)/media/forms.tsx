"use client";

import { useActionState, useState } from "react";
import styles from "../../admin.module.css";
import { Msg } from "../settings/forms";
import { updateMedia, uploadMedia, type MediaResult } from "./actions";

export function UploadForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState<MediaResult, FormData>(uploadMedia, {});
  return (
    <form action={action} className={styles.formRow} key={state.ok ?? "u"}>
      <label className={styles.control}>
        Add images (JPG, PNG, WebP, GIF, AVIF · up to 4 MB each, 10 at a time)
        <input className={styles.input} type="file" name="files" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple disabled={disabled} />
      </label>
      <button type="submit" className={`btn ${styles.btnSm}`} disabled={pending || disabled} aria-busy={pending || undefined}>
        {pending ? "Uploading…" : "Upload"}
      </button>
      <Msg state={state} />
    </form>
  );
}

export function MediaCard({ id, url, alt, filename, meta }: { id: number; url: string; alt: string; filename: string; meta: string }) {
  const [state, action, pending] = useActionState<MediaResult, FormData>(updateMedia, {});
  const [copied, setCopied] = useState(false);
  return (
    <figure className={styles.panel} style={{ margin: 0, overflow: "hidden", display: "grid" }}>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "block", aspectRatio: "4 / 3", background: "var(--surface)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </a>
      <figcaption style={{ padding: 12, display: "grid", gap: 8 }}>
        <span className={styles.small} style={{ overflowWrap: "anywhere" }}>
          <strong style={{ color: "var(--ink)" }}>{filename}</strong>
          <span className={styles.muted}> · {meta}</span>
        </span>
        <form action={action} className={styles.formRow}>
          <input type="hidden" name="id" value={id} />
          <input className={styles.input} name="alt" defaultValue={alt} placeholder="Describe the image (for accessibility)" aria-label="Alt text" style={{ flex: 1, minWidth: 0 }} />
          <button type="submit" className={`btn btn--ghost ${styles.btnSm}`} disabled={pending}>
            Save
          </button>
        </form>
        <div className={styles.formRow}>
          <button type="button" className={`btn btn--ghost ${styles.btnSm}`} onClick={() => navigator.clipboard.writeText(url).then(() => setCopied(true))}>
            {copied ? "Copied" : "Copy URL"}
          </button>
          <form action={action} onSubmit={(e) => !confirm("Delete this image? Pages using it will lose it.") && e.preventDefault()}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="op" value="delete" />
            <button type="submit" className={`btn btn--ghost ${styles.btnSm}`} disabled={pending}>
              Delete
            </button>
          </form>
        </div>
        <Msg state={state} />
      </figcaption>
    </figure>
  );
}
