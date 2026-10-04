// Canonical site origin for the app (no trailing slash). `EXPO_PUBLIC_SITE_URL`
// overrides the production default for preview builds.
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://www.longlivets.com').replace(
  /\/$/,
  '',
);
