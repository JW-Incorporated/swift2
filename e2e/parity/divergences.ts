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
  { id: 'about-diagnostics' },
  { id: 'inbox' },
  { id: 'notification-onboarding' },
  { id: 'denied-hint-wording' },
  { id: 'legal-analytics-wording' },
];
