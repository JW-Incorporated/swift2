import { describe, expect, it } from 'vitest';
import appConfig from './app.json';
import packageJson from './package.json';

// Regression guard for the 2026-09-15 release-train break (EAS run
// 34986002764). `release.yml`'s `publish_update_both` job runs `eas update`
// with no `platform` param, so Expo exports every platform in this config's
// `platforms` array. Expo's default array includes "web", and this app has
// never carried `react-native-web`/`react-dom`, so the export died with
// "It looks like you're trying to use web support but don't have the
// required dependencies installed" and no OTA update could reach a phone.
// The single-platform update jobs pass `platform`, which is why the
// 2026-09-12 iOS-only update succeeded and hid the problem.
//
// Two ways to keep that fixed: pin the platforms here, or add the web
// dependencies. This asserts whichever is true stays true together.
describe('apps/mobile Expo config platforms', () => {
  const platforms = appConfig.expo.platforms as string[] | undefined;

  it('pins the platforms this app actually ships', () => {
    expect(platforms).toEqual(['ios', 'android']);
  });

  it('never lists web without the dependencies a web export needs', () => {
    const deps = packageJson.dependencies as Record<string, string>;
    const hasWebDeps = 'react-native-web' in deps && 'react-dom' in deps;
    if (platforms?.includes('web')) {
      expect(hasWebDeps).toBe(true);
    }
  });
});
