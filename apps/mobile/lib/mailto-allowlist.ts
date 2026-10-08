import { isComposeMailtoUrl, isExternalUrl, isMailtoUrl } from '@swift2/ui';

// The only mail addresses the app opens: the LEGAL_FACTS privacy and legal
// aliases (packages/ui/src/reader/legal/lib/legal.ts), exact match, plus the share
// fallback's recipient-less compose link (`mailto:?subject=&body=`, length-bounded,
// no other params: `isComposeMailtoUrl`). Defined once.
export const APP_MAILTO_ALLOWLIST: readonly string[] = ['mailto:privacy@longlivets.com', 'mailto:legal@longlivets.com'];

export const isAllowedMailto = (s: unknown): s is `mailto:${string}` =>
  (isMailtoUrl(s) && APP_MAILTO_ALLOWLIST.includes(s)) || isComposeMailtoUrl(s);

/** What the app may hand to `Linking.openURL`: https, or an allow-listed mailto. Nothing else. */
export const isAppOpenableUrl = (s: unknown): s is string => isExternalUrl(s) || isAllowedMailto(s);
