import "server-only";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/** Post Markdown → safe HTML. Anything outside this allowlist (scripts, iframes, event handlers) is dropped. */
export function renderMarkdown(md: string) {
  const html = marked.parse(md, { async: false, gfm: true, breaks: false }) as string;
  return sanitizeHtml(html, {
    allowedTags: ["h2", "h3", "h4", "p", "br", "hr", "strong", "em", "b", "i", "u", "s", "a", "ul", "ol", "li", "blockquote", "code", "pre", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td"],
    allowedAttributes: { a: ["href", "title", "rel", "target"], img: ["src", "alt", "title", "loading", "width", "height"] },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    transformTags: {
      a: (tag, attribs) => ({
        tagName: "a",
        attribs: /^https?:/.test(attribs.href ?? "") && !attribs.href.includes("tvinstallpro.ca") ? { ...attribs, rel: "noopener noreferrer nofollow", target: "_blank" } : attribs,
      }),
      img: (tag, attribs) => ({ tagName: "img", attribs: { ...attribs, loading: "lazy" } }),
      h1: "h2",
    },
  });
}
