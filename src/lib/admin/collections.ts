// Content types managed in Admin → Content. One editor and one set of actions serve them all;
// each type is just its table, fields and labels. Safe to import in client components.

export type FieldType = "text" | "slug" | "textarea" | "markdown" | "image" | "images" | "checkbox" | "number" | "service";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  max?: number;
  min?: number;
  hint?: string;
};

export type Collection = {
  label: string;
  singular: string;
  table: "posts" | "portfolio" | "team" | "testimonials";
  titleField: string;
  /** Where a published item appears on the website, if it does. */
  publicPath?: (row: Record<string, unknown>) => string;
  /** Shown in the list under the title. */
  subtitle?: (row: Record<string, unknown>) => string;
  order: string;
  fields: Field[];
};

export const collections: Record<"posts" | "portfolio" | "team" | "testimonials", Collection> = {
  posts: {
    label: "Posts",
    singular: "post",
    table: "posts",
    titleField: "title",
    publicPath: (r) => `/blog/${r.slug}`,
    subtitle: (r) => String(r.excerpt ?? "").slice(0, 90),
    order: "coalesce(published_at, updated_at) desc, id desc",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 160 },
      { name: "slug", label: "Web address", type: "slug", hint: "Lowercase words and dashes. Leave empty to make one from the title." },
      { name: "excerpt", label: "Summary", type: "textarea", max: 400, hint: "One or two sentences shown in the post list." },
      { name: "body", label: "Article", type: "markdown", max: 100000 },
      { name: "cover_media_id", label: "Cover image", type: "image" },
      { name: "comments_open", label: "Allow comments (each one waits for approval)", type: "checkbox" },
      { name: "seo_title", label: "Search title (optional)", type: "text", max: 70 },
      { name: "seo_description", label: "Search description (optional)", type: "textarea", max: 170 },
    ],
  },
  portfolio: {
    label: "Portfolio",
    singular: "project",
    table: "portfolio",
    titleField: "title",
    publicPath: () => `/our-work`,
    subtitle: (r) => String(r.description ?? "").slice(0, 90),
    order: "sort, id desc",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 120 },
      { name: "slug", label: "Web address", type: "slug" },
      { name: "service", label: "Service", type: "service" },
      { name: "description", label: "Description", type: "textarea", max: 2000 },
      { name: "media_ids", label: "Photos", type: "images" },
      { name: "sort", label: "Order (lower shows first)", type: "number", min: -1000, max: 1000 },
    ],
  },
  team: {
    label: "Team",
    singular: "team member",
    table: "team",
    titleField: "name",
    subtitle: (r) => String(r.role_title ?? ""),
    order: "sort, id",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 120 },
      { name: "role_title", label: "Role", type: "text", max: 120 },
      { name: "bio", label: "About them", type: "textarea", max: 2000 },
      { name: "photo_media_id", label: "Photo", type: "image" },
      { name: "sort", label: "Order (lower shows first)", type: "number", min: -1000, max: 1000 },
    ],
  },
  testimonials: {
    label: "Testimonials",
    singular: "testimonial",
    table: "testimonials",
    titleField: "author",
    subtitle: (r) => String(r.body ?? "").slice(0, 90),
    order: "sort, id desc",
    fields: [
      { name: "author", label: "Customer name", type: "text", required: true, max: 120 },
      { name: "location", label: "Area", type: "text", max: 120 },
      { name: "body", label: "What they said", type: "textarea", required: true, max: 2000 },
      { name: "rating", label: "Stars (1–5, optional)", type: "number", min: 1, max: 5 },
      { name: "source", label: "Where it's from (e.g. Google review)", type: "text", max: 120, hint: "Only publish real reviews you can point to." },
      { name: "sort", label: "Order (lower shows first)", type: "number", min: -1000, max: 1000 },
    ],
  },
};

export type CollectionKey = keyof typeof collections;
export const isCollection = (v: unknown): v is CollectionKey => typeof v === "string" && v in collections;

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
