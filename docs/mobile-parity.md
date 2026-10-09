# Web to native parity inventory

What the web app (`apps/web`) exposes, and whether the Expo app (`apps/mobile`)
has a native equivalent. Since One UI PR3 (2026-10-04) the shared-UI DOM host (`apps/mobile/dom/AppReader.tsx`)
handles every surface; the
legacy native screens and `resolve`/`openNativeScreen` routing were deleted.
Deep-link kinds still come from `destinationFor` in `packages/shared/src/notification-deep-links.ts`. That
function ignores the URL path and keys only on query params, so a web route
is "native" only if it is the home screen or a deep-link kind below.

`scripts/mobile/parity-inventory.test.ts` keeps this file complete: every
`apps/web/app/**/page.tsx` route and every `ShellDestination` kind must have a
row here, and every Native status must start with one of `native screen`,
`web-only` or `N/A`. Adding a page or a deep-link kind without a row fails
that test. Query-string rows are maintained by hand (the test does not parse
`apps/web` for them), so add one when a new `?param=` surface ships.

Native status values:

- `native screen`: a native component handles it (file named in the cell).
- `web-only`: no native screen; the shell shows a WebView (legal pages only,
  `isLegalPageUrl`) or degrades to the native home (era stream tab).
- `N/A`: not meant for the app.

| Surface | Kind | Native status | Notes |
|---|---|---|---|
| `/` | route | native screen (`apps/mobile/dom/AppReader.tsx`) | Home. Any non-legal URL that resolves to `web` degrades to the era tab (`openWebUrl` in App.tsx). |
| `/privacy` | route | web-only | Shown by the DOM host's legal overlay (`apps/mobile/dom/slots/legal.ts`, `legal-links.ts`); the native LegalPageScreen WebView was deleted in One UI PR3. |
| `/terms` | route | web-only | Same as `/privacy`. |
| `/support` | route | web-only | Same as `/privacy`. |
| `/desk` | route | web-only | Meet-the-desk page (persona authors, #462). Static, like `/support`; bylines in the reader link to it. |
| `/settings/notifications` | route | web-only | Path is not matched by `destinationFor`, so it degrades to the era tab. The native settings screen is reached via `?screen=settings` (see `settings` below), not this path. |
| `/internal/notifications` | route | N/A | Server-rendered internal metrics dashboard gated by `?secret=`; not linked from the public app. |
| `?item=<id>` | query | native screen (`apps/mobile/dom/AppReader.tsx`) | `destinationFor` returns kind `moment` for any non-empty id. Web also resolves non-moment ids as video slugs; native handling of a video slug is unverified. |
| `?song=<trackKey>` | query | web-only | Falls through to `web` then era tab. Native song screen needs `?screen=song&key=<trackKey>` instead. |
| `?guide=<eraId>` | query | web-only | Falls through to `web` then era tab. Native track guide needs `?screen=track-guide&era=<eraId>` instead. |
| `?theories=<eraId>` | query | web-only | No native theory guide found in `apps/mobile`; unverified beyond that search. |
| `?lens=love-story` | query | web-only | `destinationFor` does not read `lens`. Native ThreadsScreen holds the lens in local state and is reached via `?mode=threads`. |
| `?lens=fashion` | query | web-only | Same as `?lens=love-story`. |
| `?lens=taylors-version` | query | web-only | Same as `?lens=love-story`. |
| `?lens=easter-eggs` | query | web-only | Same as `?lens=love-story`. |
| `?lens=hidden-clues` | query | web-only | Same as `?lens=love-story`. |
| `?lens=the-proposal` | query | web-only | Same as `?lens=love-story`. |
| `?mode=threads` | query | native screen (`apps/mobile/dom/AppReader.tsx`) | `destinationFor` returns kind `threads`. |
| `?mode=community` | query | native screen (`apps/mobile/dom/AppReader.tsx`) | `destinationFor` returns kind `community`. |
| `?mode=merch` | query | native screen (`apps/mobile/dom/AppReader.tsx`) | `destinationFor` returns kind `merch`. |
| `?mode=clownbot` | query | web-only | `destinationFor` does not read this value, so the link degrades to the era tab. The native Clownbot screen is reached via `?screen=clownbot`. |
| `?mode=mood` | query | web-only | Not read by `destinationFor`. A native mood mode exists inside `apps/mobile/dom/AppReader.tsx` but has no deep link. |
| `?era=<eraId>` | query | web-only | Not read by `destinationFor` outside `?screen=track-guide`; degrades to the era tab. |
| `?current=inbox` | query | native screen (`apps/mobile/dom/AppReader.tsx`) | `destinationFor` returns kind `inbox`. |
| `?current=<other>` | query | web-only | Notification values such as `theories`, `merch`, `countdowns` or an event id. No reader found in `apps/web`, so what the site does with them is unverified. |
| `kind: 'web'` | deep-link kind | web-only | Handed to the WebView only for the three legal pages; anything else degrades to the era tab. |
| `kind: 'settings'` | deep-link kind | native screen (`apps/mobile/dom/AppReader.tsx`) | Reached via `?screen=settings`. |
| `kind: 'inbox'` | deep-link kind | native screen (`apps/mobile/dom/AppReader.tsx`) | Reached via `?current=inbox`. |
| `kind: 'era-stream'` | deep-link kind | native screen (`apps/mobile/dom/AppReader.tsx`) | Reached via `?screen=era-stream`. |
| `kind: 'threads'` | deep-link kind | native screen (`apps/mobile/dom/AppReader.tsx`) | Reached via `?mode=threads`. |
| `kind: 'community'` | deep-link kind | native screen (`apps/mobile/dom/AppReader.tsx`) | Reached via `?mode=community`. |
| `kind: 'merch'` | deep-link kind | native screen (`apps/mobile/dom/AppReader.tsx`) | Reached via `?mode=merch`. |
| `kind: 'track-guide'` | deep-link kind | native screen (`apps/mobile/dom/AppReader.tsx`) | Reached via `?screen=track-guide&era=<eraId>`. |
| `kind: 'song'` | deep-link kind | native screen (`apps/mobile/dom/AppReader.tsx`) | Reached via `?screen=song&key=<trackKey>`. |
| `kind: 'clownbot'` | deep-link kind | native screen (`apps/mobile/dom/AppReader.tsx`) | Reached via `?screen=clownbot`. |
| `kind: 'moment'` | deep-link kind | native screen (`apps/mobile/dom/AppReader.tsx`) | Reached via `?item=<id>`. |
