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
| `apiStream` (optional; ClownChat) | web ROOT adapter only: real `fetch` + body reader, decoded text chunks, no buffering; cancels on abort/consumer stop; non-2xx throws `Error(String(status))`. Hosts without it get `bufferedFrom(apiFetch)` (whole body yielded once). | bridge `api` allow-list carries `/api/clown` (native-held session, 60 s timeout); the app adapter uses `createBridgeApiStream` (buffered) |
| `storage.local/session` | `localStorage`/`sessionStorage`, try/catch, SSR-safe | WP2.3 |
| `env.turnstileSiteKey` | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` or `null` | `null` (Turnstile cannot verify on a null origin) |
| `env.origin` | constant canonical origin `https://www.longlivets.com` (override: `NEXT_PUBLIC_SITE_ORIGIN`); identical on server and client, so hydration-stable | WP2.3 |
| `insets` | zeros | WP2.3 |
| `lazy`, `share`, `openExternal`, `haptic`, `notifications` | optional (`haptic` no-op) | WP2.4/2.5/2.12 |

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

`CurrentItemDetail` intake calls `useHost().apiFetch`. On mobile the app adapter takes `apiFetch` from `createBridgeApiFetch(client)` (`apps/mobile/dom/bridge/api-fetch.ts`), which sends the request over the bridge `api` command to the native handler (expo/fetch, allow-list, 256 KB caps, 8 s / 60 s clown timeouts); a bridge `cancelled` surfaces as `AbortError`. `apiStream` is `createBridgeApiStream(apiFetch)` = `bufferedFrom` (whole body once; the native reader is capped, not streamed). The spike adapter still inherits the web `apiFetch` until the app adapter adopts these.

## `Image` with `fill`

next/image `fill` applies inline styles (`position:absolute; height:100%; width:100%; inset:0; object-fit` from `className`). The app's `Image` must replicate those inline styles for pixel parity, and the parent needs `position: relative` and a size.
