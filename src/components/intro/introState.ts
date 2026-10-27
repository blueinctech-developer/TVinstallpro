/*
 * Coordination for the branded site intro.
 *
 * An inline script in the root layout sets <html data-site-intro="play"> before first
 * paint when the intro should run (first page load of the session, landing on the
 * home page, motion allowed; `/?intro` forces a replay, `/?nointro` skips it). SiteIntro moves it to "revealing" as the curtain lifts
 * and "done" when it has gone. Page animations that would otherwise play hidden
 * underneath the overlay wait for the reveal via `afterSiteIntro`.
 */

export const SITE_INTRO_REVEAL = "tvip:intro-reveal";
const STORAGE_KEY = "tvip-intro-seen";

/** Runs in <head> before paint. Kept dependency-free and wrapped so it can never throw. */
export const siteIntroScript = `(function(){var d=document.documentElement;d.classList.add('js');try{var seen=sessionStorage.getItem('${STORAGE_KEY}');sessionStorage.setItem('${STORAGE_KEY}','1');var force=/[?&]intro\\b/.test(location.search);if(location.pathname==='/'&&(!seen||force)&&!/[?&]nointro\\b/.test(location.search)&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.setAttribute('data-site-intro','play');history.scrollRestoration='manual'}}catch(e){}})();`;

export function siteIntroPlaying() {
  return typeof document !== "undefined" && document.documentElement.dataset.siteIntro === "play";
}

/**
 * Calls `cb` once the intro starts revealing the page, immediately if no intro is
 * playing. A fallback timer guarantees the callback even if the intro never reports.
 * Returns a cleanup function.
 */
export function afterSiteIntro(cb: () => void, fallbackMs = 4000): () => void {
  if (!siteIntroPlaying()) {
    cb();
    return () => {};
  }
  let settled = false;
  const run = () => {
    if (settled) return;
    settled = true;
    window.removeEventListener(SITE_INTRO_REVEAL, run);
    window.clearTimeout(timer);
    cb();
  };
  window.addEventListener(SITE_INTRO_REVEAL, run);
  const timer = window.setTimeout(run, fallbackMs);
  return () => {
    settled = true;
    window.removeEventListener(SITE_INTRO_REVEAL, run);
    window.clearTimeout(timer);
  };
}
