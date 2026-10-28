import { NextResponse, type NextRequest } from "next/server";

/*
 * 1. /admin: keep every admin URL out of search engines (X-Robots-Tag), signed in or not,
 *    and send visitors with no session cookie at all to the sign-in page. The real check
 *    (session valid, user enabled, role allowed) happens in requireUser() on every admin
 *    page, action and route.
 * 2. The old WordPress theme's demo URLs (dry-cleaning posts, sample team, portfolio items):
 *    410 Gone, so search engines drop it. It has no real replacement, so it isn't
 *    redirected to the home page. Moved pages are redirected in next.config.ts.
 */

const gone =
  /^\/(portfolio|service|team-member|testimonial|category|tag|author)(\/|$)|^\/(blog-2|home-01|home-03|sample-page|elementor-7780|our-team|how-to-clean-your-woolens-and-cashmere-items-in-your-home|wedding-suit-deserves-special-treatment-in-dry-clening|we-wash-clothes-with-the-best-detergent|10-reasons-to-hire-professional-dry-cleaner-services|we-wash-shirts-and-pantsdrying-with-the-best-detergent)\/?$/;

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (gone.test(pathname)) {
    return new NextResponse(
      '<!doctype html><meta charset="utf-8"><title>Page removed · TV Install Pro</title><meta name="robots" content="noindex">' +
        '<p style="font-family:system-ui;padding:48px">This page was removed when TV Install Pro rebuilt its website. ' +
        '<a href="/">Go to the home page</a> or <a href="/services">see our services</a>.</p>',
      { status: 410, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  // Sign-in and the one-time password-link page must open without a session.
  const isPublic = pathname === "/admin/login" || pathname === "/admin/setup";
  const res =
    !isPublic && !req.cookies.has("tvip_admin") ? NextResponse.redirect(new URL("/admin/login", req.url)) : NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  // Password links carry a token in the URL: never send it to other sites as a Referer.
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/portfolio/:path*",
    "/service/:path*",
    "/team-member/:path*",
    "/testimonial/:path*",
    "/category/:path*",
    "/tag/:path*",
    "/author/:path*",
    "/blog-2",
    "/home-01",
    "/home-03",
    "/sample-page",
    "/elementor-7780",
    "/our-team",
    "/how-to-clean-your-woolens-and-cashmere-items-in-your-home",
    "/wedding-suit-deserves-special-treatment-in-dry-clening",
    "/we-wash-clothes-with-the-best-detergent",
    "/10-reasons-to-hire-professional-dry-cleaner-services",
    "/we-wash-shirts-and-pantsdrying-with-the-best-detergent",
  ],
};
