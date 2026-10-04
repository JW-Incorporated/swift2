// One UI W6-closure: machine-readable list of accepted platform divergences (docs/one-ui/parity-divergences.md).
// closure.spec.ts asserts this list, the doc bullets and the native routes in apps/mobile/dom/slots/host.routes.ts agree exactly.
export interface Divergence {
  readonly id: string;
  /** Web path the app renders natively instead of in the DOM host; set only for divergences that own one. */
  readonly nativeRoute?: string;
}

export const ACCEPTED_DIVERGENCES: readonly Divergence[] = [
  { id: 'share-fallback-toast' },
  { id: 'haptics' },
  { id: 'viewport-gestures' },
  { id: 'about-diagnostics', nativeRoute: '/settings/about' },
  { id: 'inbox', nativeRoute: '/inbox' },
  { id: 'notification-onboarding' },
  { id: 'denied-hint-wording' },
  { id: 'legal-analytics-wording' },
];
