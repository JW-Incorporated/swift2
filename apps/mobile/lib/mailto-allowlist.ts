import { isExternalUrl, isMailtoUrl } from '@swift2/ui';

// The only mail addresses the app opens: the LEGAL_FACTS privacy and legal
// aliases (packages/ui/src/reader/legal/lib/legal.ts). Exact match, defined once.
export const APP_MAILTO_ALLOWLIST: readonly string[] = ['mailto:privacy@longlivets.com', 'mailto:legal@longlivets.com'];

export const isAllowedMailto = (s: unknown): s is `mailto:${string}` =>
  isMailtoUrl(s) && APP_MAILTO_ALLOWLIST.includes(s);

/** What the app may hand to `Linking.openURL`: https, or an allow-listed mailto. Nothing else. */
export const isAppOpenableUrl = (s: unknown): boolean => isExternalUrl(s) || isAllowedMailto(s);
