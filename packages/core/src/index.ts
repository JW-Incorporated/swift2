// @swift2/core — reader-side data access over Supabase. Portable (no view code),
// so web and the future Expo app share it.

export * from './vault-types';
export * from './map';
export * from './current-map';
export * from './knowledge';
export * from './devices';
export * from './notification-prefs';
export * from './notification-governor';
export * from './notification-events';
export * from './notification-inbox';
// notification-router.ts / notification-sender.ts are deliberately NOT
// re-exported here: they use Node-only globals (Buffer, node:crypto) that
// apps/mobile's Expo/RN typecheck can't resolve, and this barrel is
// imported by mobile (App.tsx imports VaultSkeleton from here). Both
// modules are server-only (the dispatch API route is their only caller) —
// import them via the `@swift2/core/notifications-server` subpath instead.
