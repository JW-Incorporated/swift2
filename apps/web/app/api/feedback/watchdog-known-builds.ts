// #4874 hardening: the durable claim table is a shared 100/day budget, so only
// build keys a real shipped build can produce get a durable claim. A key is
// `<nativeBuildVersion>:<updateId>` (apps/mobile/lib/watchdog-store.ts), where
// nativeBuildVersion is what the DEVICE reports: iOS CFBundleVersion / Android
// versionCode, managed remotely by EAS (`appVersionSource: remote` +
// `autoIncrement`), so it is NOT app.json's buildNumber. The values below are
// the ones seen in real reports on #4791 ("Build 1.0.0 (18)", "(17)", "(38)").
// UPDATE THIS CONSTANT AT EACH STORE RELEASE. An unknown build is not rejected:
// watchdog-lifecycle.ts routes it through a small separate in-memory bucket
// with no durable claim, so a forgotten update degrades dedupe, never drops
// reports. The update part stays UUID-format only (no reliable server-side
// list of published OTA update ids).
export const KNOWN_NATIVE_BUILDS: Readonly<Record<'ios' | 'android', ReadonlySet<string>>> = {
  ios: new Set(['38']),
  android: new Set(['17', '18']),
};

export const isKnownBuildKey = (platform: 'ios' | 'android', buildKey: string): boolean => {
  const i = buildKey.indexOf(':');
  return i > 0 && KNOWN_NATIVE_BUILDS[platform].has(buildKey.slice(0, i));
};
