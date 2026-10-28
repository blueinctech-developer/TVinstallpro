import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import page from "@/components/page/page.module.css";
import { fmtDate } from "@/lib/admin/format";
import { renderMarkdown } from "@/lib/markdown";
import { approvedComments, postBySlug } from "@/lib/public-content";
import styles from "../blog.module.css";
import { CommentForm } from "./CommentForm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await postBySlug((await params).slug);
  if (!p) return {};
  return {
    title: p.seo_title || p.title,
    description: p.seo_description || p.excerpt || undefined,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: "article", title: p.seo_title || p.title, images: p.cover_url ? [p.cover_url] : undefined },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await postBySlug((await params).slug);
  if (!p) notFound();
  const comments = await approvedComments(p.id);
  return (
    <section className={page.section} style={{ paddingTop: "calc(var(--header-h) + 48px)" }}>
      <article className={`wrap ${styles.article}`}>
        <Link href="/blog" className="link">
          <Icon name="arrowLeft" size={16} /> Tips & news
        </Link>
        <header style={{ display: "grid", gap: 12 }}>
          <h1 className="display-2" style={{ fontSize: "var(--step-4)" }}>{p.title}</h1>
          <span className={styles.meta}>{fmtDate(p.published_at)}</span>
        </header>
        {p.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.cover} src={p.cover_url} alt={p.cover_alt ?? ""} />
        )}
        <div className={styles.body} dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />

        {(p.comments_open || comments.length > 0) && (
          <section className={styles.comments} aria-labelledby="comments-title">
            <h2 id="comments-title">
              {comments.length ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : "Comments"}
            </h2>
            {comments.map((c) => (
              <div key={c.id} className={styles.comment}>
                <span className={styles.meta}>
                  <strong style={{ color: "var(--ink)" }}>{c.author_name}</strong> · {fmtDate(c.created_at)}
                </span>
                <p>{c.body}</p>
              </div>
            ))}
            {p.comments_open && <CommentForm postId={p.id} />}
          </section>
        )}
      </article>
    </section>
  );
}
