/**
 * Long Live — the Community section's data (item 4b,
 * docs/definition-of-done.md:136-142).
 *
 * OS-037: moved to `packages/experience/src/communities.ts` so the native
 * app's Community screen can import the same curated data with zero
 * `apps/web` dependency (the same "move to the headless core" pattern
 * OS-021..OS-025 already applied to eras/doorways/feeds/threads/track
 * guide). Re-exported here unchanged so every existing caller/test of this
 * module keeps working without touching an import path.
 */
export * from '@swift2/experience';
export type { Community, CommunityPlatform, CommunityVerification, VerificationStatus } from '@swift2/experience';
