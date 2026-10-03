# HOST-ADAPTER

`packages/ui` never imports `next/*` or `react-native*`. Everything host-specific goes through `useHost()` (`src/host/types.ts`). The web adapter is `apps/web/lib/host-adapter.tsx`, mounted by `apps/web/lib/host-adapter-provider.tsx` (the adapter is built inside the provider with `useMemo`; `Link`/`Image` are module-level components, so their identity is stable and there is no module-global singleton).

## Members

| Member | Web | App (DOM host) |
|---|---|---|
| `Link`, `Image` | `next/link`, `next/image` | WP2.4+ |
| `navigate`, `onBack` | `next/navigation` router, `popstate` | WP2.3 |
| `apiFetch` | same-origin `fetch` (`webApiFetch`) | postMessage bridge to native fetch (the DOM host is a null origin) |
| `storage.local/session` | `localStorage`/`sessionStorage`, try/catch, SSR-safe | WP2.3 |
| `env.turnstileSiteKey` | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` or `null` | `null` (Turnstile cannot verify on a null origin) |
| `env.origin`, `insets` | `window.location.origin`, zeros | WP2.3 |
| `lazy`, `share`, `openExternal`, `haptic`, `notifications` | optional (`haptic` no-op) | WP2.4/2.5/2.12 |

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

## `Image` with `fill`

next/image `fill` applies inline styles (`position:absolute; height:100%; width:100%; inset:0; object-fit` from `className`). The app's `Image` must replicate those inline styles for pixel parity, and the parent needs `position: relative` and a size.
