import "server-only";
import { db } from "@/lib/db";

// Published content for the public site. Drafts are never selected here.

export type PublicPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  comments_open: boolean;
  seo_title: string | null;
  seo_description: string | null;
  published_at: Date | null;
  cover_url: string | null;
  cover_alt: string | null;
};

const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  // See getSetting(): a local build doesn't open the single-process PGlite database.
  if (process.env.NEXT_PHASE === "phase-production-build" && !process.env.DATABASE_URL) return fallback;
  try {
    return await fn();
  } catch (err) {
    console.error("[content] database unavailable:", (err as Error).message);
    return fallback;
  }
};

export const publishedPosts = () =>
  safe(
    async () =>
      (await db()).query<PublicPost>(
        `select p.*, m.url as cover_url, m.alt as cover_alt from posts p left join media m on m.id = p.cover_media_id
          where p.status = 'published' order by p.published_at desc nulls last, p.id desc`,
      ),
    [] as PublicPost[],
  );

export const postBySlug = (slug: string) =>
  safe(async () => {
    const [p] = await (await db()).query<PublicPost>(
      `select p.*, m.url as cover_url, m.alt as cover_alt from posts p left join media m on m.id = p.cover_media_id
        where p.status = 'published' and p.slug = $1`,
      [slug],
    );
    return p ?? null;
  }, null);

export const approvedComments = (postId: number) =>
  safe(
    async () =>
      (await db()).query<{ id: number; author_name: string; body: string; created_at: Date }>(
        "select id, author_name, body, created_at from comments where post_id = $1 and status = 'approved' order by created_at",
        [postId],
      ),
    [],
  );

export type PublicProject = { id: number; slug: string; title: string; description: string; service: string | null; photos: { url: string; alt: string }[] };

export const publishedPortfolio = () =>
  safe(
    async () =>
      (await db()).query<PublicProject>(
        `select p.id, p.slug, p.title, p.description, p.service,
                coalesce((select json_agg(json_build_object('url', m.url, 'alt', m.alt) order by array_position(p.media_ids, m.id))
                            from media m where m.id = any(p.media_ids)), '[]'::json) as photos
           from portfolio p where p.status = 'published' order by p.sort, p.id desc`,
      ),
    [] as PublicProject[],
  );
