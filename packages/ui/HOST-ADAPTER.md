# HOST-ADAPTER

`packages/ui` never imports `next/*` or `react-native*`. Everything host-specific goes through `useHost()` (`src/host/types.ts`). The web adapter is `apps/web/lib/host-adapter.tsx`, mounted by `apps/web/lib/host-adapter-provider.tsx` (the adapter is built inside the provider with `useMemo`; `Link`/`Image` are module-level components, so their identity is stable and there is no module-global singleton).

## Members

| Member | Web | App (DOM host) |
|---|---|---|
| `Link`, `Image` | `next/link`, `next/image` | WP2.4+ |
| `resolveUrl` (optional; `useResolveUrl()`) | omitted: the path is used unchanged (same-origin) | `https://www.longlivets.com` + path (canonical origin, overridable). Era art (`/eras/*.png`) goes over the network like content photos. **S4: offline/airplane-mode era art must be checked on device.** |
| `currentUrl` (optional) | web root adapter only: `window.location.href`; omitted in `createWebAdapter`. The reader reads `?era`/`?item` deep links from it; absent = no deep link | in-DOM web path (not `file://`) |
| `clipboard` (optional) | web root adapter only: wraps `navigator.clipboard.writeText`; absent = the `navigator.clipboard` fallback | native clipboard |
| `navigate`, `onBack` | `next/navigation` router, `popstate` | WP2.3 |
| `apiFetch` | same-origin `fetch` (`webApiFetch`) | postMessage bridge to native fetch (the DOM host is a null origin) |
| `apiStream` (optional; ClownChat) | web ROOT adapter only: real `fetch` + body reader, decoded text chunks, no buffering; cancels on abort/consumer stop; non-2xx throws `Error(String(status))`. Hosts without it get `bufferedFrom(apiFetch)` (whole body yielded once). | bridge `api` allow-list carries `/api/clown` (native-held session, 60 s timeout); the app adapter uses `createBridgeApiStream` (pull-based over the bridge, W6-stream) |
| `storage.local/session` | `localStorage`/`sessionStorage`, try/catch, SSR-safe | WP2.3 |
| `embedOrigin` (optional) | omitted: YouTube embeds go direct to youtube-nocookie.com | `https://www.longlivets.com`: embeds frame `<embedOrigin>/embed/youtube/<id>` (a real-origin wrapper page), because a null origin sends no Referer and YouTube refuses with error 153 (#4954) |
| `env.turnstileSiteKey` | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` or `null` | `null` (Turnstile cannot verify on a null origin) |
| `env.origin` | constant canonical origin `https://www.longlivets.com` (override: `NEXT_PUBLIC_SITE_ORIGIN`); identical on server and client, so hydration-stable | WP2.3 |
| `insets` | zeros | WP2.3 |
| `lazy`, `share`, `openExternal`, `haptic`, `notifications` | optional (`haptic` no-op) | WP2.4/2.5/2.12 |
| `openExternal` and `mailto:` | absent on web: `MailtoLink` (legal/support) is a plain `<a href="mailto:…">` | `openExternal` accepts `https:` and the two allow-listed `mailto:` aliases (`apps/mobile/lib/mailto-allowlist.ts`; `isMailtoUrl` itself: lowercase scheme, bare address, no query/fragment/escapes); `MailtoLink` routes the click through it. Anything else is `invalid`. |

Note: the web adapter's `onBack` does not consume the handler's boolean return; `popstate` cannot be cancelled, so the handler runs for its side effects only. The app host honours the boolean (consumed = swallow the native back).

`HostImageProps` covers exactly the `next/image` props apps/web uses (`unoptimized`, `loading`, `draggable`, `style`, `onLoad`, plus the basics). `onLoad` is a function and never crosses the bridge; the DOM host implements it natively in-DOM.

`HostLinkProps` is the anchor attributes plus `href`, `prefetch`, `external`. A host `Link` must pass every other prop through to the anchor and forward its `ref` (`React.forwardRef`), because a Radix `Slot` (`<Button asChild><Link>`) merges `className`, `aria-*`, `title`, handlers and a ref onto it.

## X3: web-only side effects

| Web-only side effect | Adapter member, or "off in app" | Owner |
|---|---|---|
| `@vercel/analytics` (`<Analytics />` in the root layout) | off in app | WP2.3 |
| Web push / notification UI (`web-push-client.ts`, service worker registration) | `notifications.*`; the app uses native push | WP2.12 |
| `next/image` optimisation (remote patterns, srcset) | `Image`; the app image may not optimise | WP2.4 |
| Service worker | off in app | WP2.12 |
| `localStorage`/`sessionStorage` assumptions | `storage.local` / `storage.session` | WP2.3 |
| `popstate` / `useBackDismiss` history-stack back handling | `onBack` | WP2.3 |
| Turnstile (`SubmitLinkForm`) | `env.turnstileSiteKey` (`null` hides the widget) | WP2.10 |

## Mobile `apiFetch` status

`CurrentItemDetail` intake calls `useHost().apiFetch`. On mobile the app adapter takes `apiFetch` from `createBridgeApiFetch(client)` (`apps/mobile/dom/bridge/api-fetch.ts`), which sends the request over the bridge `api` command to the native handler (expo/fetch, allow-list, 8 s default / 60 s clown timeouts). Limits: a request body is capped at 64 KB at the bridge boundary (`sanitizeApiRequest`; the native handler keeps a 256 KB backstop), and a response body is capped at 256 KB by the native reader; a bridge `cancelled` surfaces as `AbortError`. `apiStream` is `createBridgeApiStream(apiFetch)`: **pull-based streaming (Fable ruling 2026-10-04, revising the buffered G12 ruling; the app matches the website).** `api { req, stream: true }` (ClownChat `POST /api/clown` only) answers at headers with `{ status, headers, streamId }`; the DOM then loops `apiRead { streamId }` -> `{ chunk, done }` (native holds the expo/fetch reader and a bounded buffer; nothing is pushed). Caps: one open stream per host instance (a second is `invalid`); 256 KB cumulative (`MAX_API_BYTES`); at most 64 KB is ever retained unread (oversized source chunks are split; the reader is not read again until the remainder is moved over: backpressure); an `apiRead` long-polls at most 1 s (`API_STREAM_POLL_MS`) then answers `{ chunk: '', done: false }`, one in flight at a time; a chunk is at most 32 KB (an escaped worst case of 192 KB, inside the 256 KB payload cap); `CLOWN_TIMEOUT_MS` is the total stream deadline from request start; a per-stream `TextDecoder({ stream: true })`. `cancel { targetId: streamId }` (or cancelling the in-flight `apiRead`) aborts the fetch and reader; host shutdown or a DOM re-handshake drops the stream table, so a stale streamId is `invalid`; the opening command id also cancels the stream until the DOM has observed the head; terminal streams are deleted at once and any transport ambiguity (a timed-out or lost read) fails the stream: there is no replay. A non-2xx answers the buffered shape (no streamId) and the stream throws `Error(String(status))`; an apiFetch not made by `createBridgeApiFetch` keeps `bufferedFrom`. The live investigation trail therefore arrives as it happens. ClownChat shows its pending state while waiting (`busy`: spinner on the send button, `aria-busy` on the stream). The spike adapter still inherits the web `apiFetch` until the app adapter adopts these.

## `Image` with `fill`

next/image `fill` applies inline styles (`position:absolute; height:100%; width:100%; inset:0; object-fit` from `className`). The app's `Image` must replicate those inline styles for pixel parity, and the parent needs `position: relative` and a size.
