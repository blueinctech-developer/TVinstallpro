import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { requireUser } from "@/lib/admin/auth";
import { collections, isCollection } from "@/lib/admin/collections";
import { getItem } from "@/lib/admin/content";
import { roleAtLeast } from "@/lib/admin/vocab";
import { services } from "@/lib/content";
import { listMedia } from "@/lib/media";
import styles from "../../../../admin.module.css";
import { deleteContent } from "../../actions";
import { ConfirmSubmit, Editor } from "./Editor";

export const metadata: Metadata = { title: "Edit" };

export default async function EditContent({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const { type, id } = await params;
  if (!isCollection(type)) notFound();
  const c = collections[type];
  const isNew = id === "new";
  const row = isNew ? null : await getItem(type, Number(id));
  if (!isNew && !row) notFound();
  const media = (await listMedia()).map((m) => ({ id: m.id, url: m.url, alt: m.alt, filename: m.filename }));
  const canEdit = roleAtLeast(user.role, "staff");
  const { saved } = await searchParams;
  const title = row ? String(row[c.titleField] || "(untitled)") : `New ${c.singular}`;
  const href = row && row.status === "published" && c.publicPath ? c.publicPath(row) : null;

  return (
    <>
      <div>
        <Link href={`/admin/content/${type}`} className={styles.back}>
          <Icon name="arrowLeft" size={16} /> {c.label}
        </Link>
        <div className={styles.head}>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.formRow}>
            {href && (
              <Link href={href} target="_blank" className={`btn btn--ghost ${styles.btnSm}`}>
                View on the website
              </Link>
            )}
            {row && canEdit && (
              <form action={deleteContent}>
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="id" value={row.id} />
                <DeleteButton singular={c.singular} />
              </form>
            )}
          </div>
        </div>
        {row?.legacy_id ? (
          <p className={styles.notice} data-kind="warn" style={{ marginTop: 12 }}>
            <Icon name="alert" size={18} /> Imported from the old WordPress site. Check it&apos;s about TV Install Pro before publishing: much of the old
            theme&apos;s content was demo material.
          </p>
        ) : null}
      </div>
      <Editor
        type={type}
        id={row ? String(row.id) : "new"}
        fields={c.fields}
        values={row ?? { status: "draft", comments_open: true, sort: 0 }}
        media={media}
        services={services.map((s) => ({ slug: s.slug, title: s.title }))}
        readOnly={!canEdit}
        justSaved={!!saved}
      />
    </>
  );
}

function DeleteButton({ singular }: { singular: string }) {
  return <ConfirmSubmit label="Delete" message={`Delete this ${singular}? This can't be undone.`} />;
}
