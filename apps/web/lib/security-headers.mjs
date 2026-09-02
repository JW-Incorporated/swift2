/**
 * Security response headers for the web app.
 *
 * Consumed by `next.config.mjs` → `headers()`, which applies them to every
 * route (pages, /api, /vault, static assets) on Vercel. Plain `.mjs` so the
 * Next config — which cannot import TypeScript — can share one source of truth
 * with the unit tests in `security-headers.test.ts`.
 *
 * ---------------------------------------------------------------------------
 * WHY THE CSP IS SPLIT IN TWO
 * ---------------------------------------------------------------------------
 * This site is embed-heavy (YouTube, Spotify, Instagram) and hotlinks images
 * from ~500 distinct third-party hosts that grow every time content lands. A
 * single strict enforced policy would blank out pages silently the first time
 * a new image host appears in a content PR. So we ship two headers:
 *
 *   1. `Content-Security-Policy` (ENFORCING) — only the directives that cannot
 *      break a page load no matter what content is added later:
 *      frame-ancestors / base-uri / form-action / object-src. These are the
 *      clickjacking + injection-pivot controls, and they are worth having on
 *      day one. None of them govern loading a resource, so no image host, no
 *      embed and no script can be affected by them.
 *
 *   2. `Content-Security-Policy-Report-Only` — the full resource policy
 *      (script/style/img/frame/connect/...). Browsers report violations to
 *      `/api/csp-report` without blocking anything, so we learn what the real
 *      site actually pulls before we make it fatal.
 *
 * The resource policy is enforced by `proxy.ts`, which creates one fresh nonce
 * per page request and passes it to Next's server renderer. That lets Next put
 * the nonce on its generated inline scripts and styles without weakening the
 * policy for arbitrary injected markup.
 *
 * EXPECTED NOISE when reading those reports: PREVIEW deployments inject the
 * Vercel toolbar from `https://vercel.live`, which will report against
 * script-src / frame-src / connect-src. That is preview-only tooling, absent
 * from production, and is deliberately NOT allowlisted here — do not widen the
 * production policy for it. Judge readiness to enforce from PRODUCTION reports.
 */

/** Hosts we mount in an <iframe>. Keep in sync with the embed components. */
export const FRAME_SRC = [
  // MomentVideo / MoodSongCard — privacy-enhanced player.
  'https://www.youtube-nocookie.com',
  // Some youtube-nocookie embeds hand off to the main host mid-session.
  'https://www.youtube.com',
  // EraMedia / SpotifyCompare album players.
  'https://open.spotify.com',
  // MomentSocialPost — Instagram post embed (both host spellings; the embed
  // redirects between them).
  'https://www.instagram.com',
  'https://instagram.com',
];

/**
 * Vercel Analytics. In production the script and its beacon are same-origin
 * (`/_vercel/insights/script.js` → `/_vercel/insights/event`, proxied by
 * Vercel), so 'self' covers it. Local dev + preview load the debug build from
 * this host instead, which is why it is listed.
 */
const VERCEL_ANALYTICS = 'https://va.vercel-scripts.com';

/** Where browsers POST CSP violation reports. */
export const CSP_REPORT_PATH = '/api/csp-report';

/**
 * Directives that do not need the per-request nonce.
 * @returns {string[]}
 */
function enforcedDirectives() {
  return [
    // Nobody may frame us. This is the clickjacking control and the reason an
    // enforcing header exists at all — `frame-ancestors` is IGNORED in a
    // report-only policy, so it has to live here.
    "frame-ancestors 'none'",
    // An injected <base> can silently repoint every relative script URL.
    "base-uri 'self'",
    // No form on this site posts anywhere but our own origin.
    "form-action 'self'",
    // We use no <object>/<embed>/<applet>; Flash-era plugin vectors stay shut.
    "object-src 'none'",
  ];
}

/**
 * The nonce-based resource policy enforced by proxy.ts.
 * @param {{ nonce: string, dev?: boolean }} opts
 * @returns {string[]}
 */
export function contentSecurityPolicy({ nonce, dev = false }) {
  const script = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", VERCEL_ANALYTICS];
  // Next's dev bundler uses eval-based source maps. Production builds do not.
  if (dev) script.push("'unsafe-eval'");

  const connect = ["'self'", VERCEL_ANALYTICS];
  // Dev server HMR socket.
  if (dev) connect.push('ws:', 'wss:');

  return [
    ...enforcedDirectives(),
    "default-src 'self'",

    // Next reads the nonce from the request CSP and attaches it to its hydration
    // bootstrap and generated styles. `strict-dynamic` keeps a nonce-authorized
    // bootstrap from becoming an origin-wide script trust grant.
    `script-src ${script.join(' ')}`,

    // Next attaches the nonce to generated <style> tags. The app also has many
    // dynamic React style attributes (timeline coordinates, era colors and
    // responsive geometry), which CSP nonces cannot authorize. They remain the
    // bounded exception while the nonce removes arbitrary inline JavaScript.
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",

    // DELIBERATELY PERMISSIVE. Content hotlinks images from ~500 distinct
    // hosts (Wikimedia largest, plus Billboard, CloudFront, Cloudinary, imgix,
    // dozens of press CDNs) and every content PR can add more. An allowlist
    // here would be a maintenance trap that silently blanks images the moment
    // it drifts — and it would buy little, since an image URL is not a code
    // execution vector. `https:` keeps the one guarantee that matters: no
    // plaintext image loads. See docs/decisions.md.
    "img-src 'self' data: blob: https:",

    // next/font/google self-hosts at build time — no third-party font origin.
    "font-src 'self' data:",

    // We host no audio/video; players live inside third-party iframes, which
    // CSP does not reach into.
    "media-src 'self'",

    `connect-src ${connect.join(' ')}`,
    `frame-src ${FRAME_SRC.join(' ')}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",

    // No `upgrade-insecure-requests`: there are no http:// subresources to fix
    // (mixed content is already blocked by the browser), and content carries a
    // handful of http:// *source links* to old archives that we do not want to
    // risk rewriting.

    `report-uri ${CSP_REPORT_PATH}`,
    'report-to csp-endpoint',
  ];
}

/**
 * @param {{ dev?: boolean }} [opts]
 * @returns {{ key: string, value: string }[]}
 */
export function securityHeaders() {
  return [
    // Modern reporting transport for the enforcing policy generated in proxy.ts.
    { key: 'Reporting-Endpoints', value: `csp-endpoint="${CSP_REPORT_PATH}"` },

    // Vercel already sends `max-age=63072000` with no includeSubDomains; this
    // makes it explicit and covers subdomains. `preload` is deliberately NOT
    // set — submitting to the browser preload list is effectively irreversible
    // and is Wyatt's call, not a side effect of this change.
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },

    { key: 'X-Content-Type-Options', value: 'nosniff' },

    // Legacy backstop for `frame-ancestors 'none'` (pre-CSP2 browsers).
    { key: 'X-Frame-Options', value: 'DENY' },

    // Send only the origin cross-site: third-party image hosts and embeds stop
    // learning which moment page a visitor is reading.
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

    // Deny-list ONLY features the app never uses.
    //
    // CAREFUL: Permissions-Policy also gates what an <iframe>'s `allow=`
    // attribute can grant. Denying autoplay / encrypted-media / fullscreen /
    // picture-in-picture / clipboard-write / accelerometer / gyroscope here
    // would silently break the YouTube and Spotify players, whose `allow=`
    // lists exactly those. They are omitted on purpose — do not "tighten" this
    // by adding them.
    {
      key: 'Permissions-Policy',
      value: [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'midi=()',
        'browsing-topics=()',
      ].join(', '),
    },
  ];
}
