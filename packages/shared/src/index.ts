// @swift2/shared — portable types + domain logic. No I/O; must stay
// platform-agnostic so both web and the future Expo app reuse it unchanged.

export * from './vault-types';
export * from './vault-nav';

/**
 * The aspects of Taylor's life the Vault classifies content into.
 * Kept here (shared, no I/O) so seed content, web, and mobile agree on the set.
 */
export const ASPECTS = [
  'music',
  'fashion',
  'travel',
  'tours',
  'relationship',
  'business',
] as const;

export type Aspect = (typeof ASPECTS)[number];

export function isAspect(value: string): value is Aspect {
  return (ASPECTS as readonly string[]).includes(value);
}
