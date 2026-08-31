// Server-only notifications barrel — router + FCM sender. Split from
// `./index.ts` because they use Node-only globals (Buffer, node:crypto)
// that apps/mobile's Expo/RN typecheck can't resolve, and the root barrel
// is imported transitively by apps/mobile (App.tsx imports VaultSkeleton
// from `@swift2/core`). Only server code (the Next.js API route) should
// import this subpath.
export * from './notification-router';
export * from './notification-sender';
