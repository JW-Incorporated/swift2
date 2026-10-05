// #4874 hardening: the durable claim table is a shared 100/day budget, so only
// build keys a real shipped build can produce may reach it. A key is
// `<nativeBuildVersion>:<updateId>`; the native part must be in this allow-list
// and the update part is `embedded` or a UUID (format enforced by
// parseWatchdogReport). UPDATE THIS SET AT EACH NATIVE RELEASE (it must contain
// ios.buildNumber from apps/mobile/app.json; a test asserts that). There is no
// reliable server-side list of published OTA update ids, so those stay
// format-only; the per-IP limit and the daily cap bound the rest.
export const KNOWN_NATIVE_BUILDS: ReadonlySet<string> = new Set(['1']);

export const isKnownBuildKey = (buildKey: string): boolean => {
  const i = buildKey.indexOf(':');
  return i > 0 && KNOWN_NATIVE_BUILDS.has(buildKey.slice(0, i));
};
