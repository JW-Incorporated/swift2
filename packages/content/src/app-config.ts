/**
 * Remote app config (docs/mobile-release.md, "Kill switch"): a tiny JSON file
 * published next to `current.json` (never inside a bundleVersion, never a
 * manifest entry) that lets a broken native screen be turned off without an
 * app release. Forward-compatible by construction: unknown keys are stripped,
 * never rejected, so a newer config cannot break an older installed app.
 */
import { z } from 'zod';

/**
 * Every native-screen route flag the installed apps understand. The single
 * source of truth for the key list; apps/mobile has a test asserting it equals
 * `Object.keys(DEFAULT_ROUTE_FLAGS)` (packages/content cannot import from
 * apps/mobile).
 */
export const ROUTE_FLAG_KEYS = [
  'settings',
  'inbox',
  'eraStream',
  'threads',
  'community',
  'merch',
  'trackGuide',
  'song',
  'moment',
  'clownbot',
  'sharedUi',
  'sharedUiIos',
] as const;

export type RouteFlagKey = (typeof ROUTE_FLAG_KEYS)[number];

const routeFlagsShape = Object.fromEntries(
  ROUTE_FLAG_KEYS.map((key) => [key, z.boolean()]),
) as Record<RouteFlagKey, z.ZodBoolean>;

export const appConfigSchema = z.object({
  routeFlags: z.object(routeFlagsShape).partial(),
  /** WP2.14: remote gate for category-only watchdog fallback/quarantine reports. Absent = off; only an explicit true turns reports on. */
  watchdogReports: z.boolean().optional(),
  minNativeBuild: z
    .object({
      ios: z.number().int().positive().optional(),
      android: z.number().int().positive().optional(),
    })
    .optional(),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
