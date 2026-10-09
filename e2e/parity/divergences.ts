// One UI W6-closure: machine-readable list of accepted platform divergences (docs/one-ui/parity-divergences.md).
// closure.spec.ts asserts this list and the doc bullets agree exactly, and that no native routes remain in
// apps/mobile/dom/slots/host.routes.ts.
export interface Divergence {
  readonly id: string;
}

export const ACCEPTED_DIVERGENCES: readonly Divergence[] = [
  { id: 'share-fallback-toast' },
  { id: 'haptics' },
  { id: 'viewport-gestures' },
  { id: 'phones-portrait-only' },
  { id: 'submit-link-external' },
  { id: 'about-diagnostics' },
  { id: 'inbox' },
  { id: 'notification-onboarding' },
  { id: 'denied-hint-wording' },
  { id: 'analytics-web-only' },
  { id: 'app-state-screens' },
  { id: 'external-links' },
  { id: 'embed-wrapper' },
  { id: 'web-only-services' },
  { id: 'content-adoption-lag' },
];
