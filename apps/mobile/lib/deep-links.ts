// Notifications Phase 2 — thin re-export. The actual logic lives in
// @swift2/shared/notification-deep-links.ts (portable, covered by the root
// vitest suite); this file exists for call-site ergonomics inside
// apps/mobile only.
export { resolveDeepLink, settingsDestination, type DeepLinkDestination } from '@swift2/shared';
