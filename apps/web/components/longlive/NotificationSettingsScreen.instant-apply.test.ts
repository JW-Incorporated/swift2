import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// NotificationSettingsScreen (mobile) has no jsdom/testing-library render
// harness in this repo (same constraint FeedbackButton.test.ts and
// TimelineScrubber.test.ts document for their own components) — these are
// source-level regression pins proving Phase 1's acceptance criterion:
// "a component-level test proving instant-apply with no save button."
const src = readFileSync(
  join(__dirname, '../../../mobile/components/NotificationSettingsScreen.tsx'),
  'utf8',
);

describe('NotificationSettingsScreen — instant apply, no save button', () => {
  it('never renders a Save/Apply/Submit control', () => {
    expect(src).not.toMatch(/>Save</);
    expect(src).not.toMatch(/>Apply</);
    expect(src).not.toMatch(/>Submit</);
    expect(src).not.toMatch(/onPress=\{.*[Ss]ave/);
  });

  it('every cadence pill change writes through setCategoryCadence immediately, in its own onChange handler', () => {
    // onCadenceChange fires setCategoryCadence synchronously on selection —
    // no staged local-only state, no separate commit step.
    expect(src).toContain(
      'function onCadenceChange(category: AnyNotificationCategory, cadence: NotificationCadence) {',
    );
    expect(src).toMatch(
      /function onCadenceChange[\s\S]{0,120}withPending\(`cadence:\$\{category\}`, \(\) => setCategoryCadence\(\{ category, cadence \}\)\)/,
    );
    // The pill row's onChange prop is wired directly to that handler — no
    // intermediate "pending edits" object collected for a later save call.
    expect(src).toMatch(/onChange=\{\(c\) => onCadenceChange\(def\.id, c\)\}/);
  });

  it('the master switch toggles and writes on the same press, no confirm step', () => {
    expect(src).toMatch(
      /onPress=\{\(\) =>\s*withPending\('settings:masterEnabled', \(\) =>\s*setDeviceSetting\(\{ masterEnabled: !settings\.masterEnabled \}\),\s*\)\s*\}/,
    );
  });

  it('device-level fields each write on their own change via setDeviceSetting, not a batched form submit', () => {
    const setDeviceSettingCalls = src.match(/setDeviceSetting\(/g) ?? [];
    // masterEnabled, snooze24h, snooze1wk, snoozeClear, dailyCap, quietStart,
    // quietEnd, digestHour = 8 independent call sites.
    expect(setDeviceSettingCalls.length).toBeGreaterThanOrEqual(7);
    // No single setDeviceSetting call bundles more than one field — each
    // call site's object literal has exactly one key.
    const calls = src.match(/setDeviceSetting\(\{[^}]*\}\)/g) ?? [];
    expect(calls.length).toBeGreaterThanOrEqual(7);
    for (const call of calls) {
      const keyCount = (call.match(/:/g) ?? []).length;
      expect(keyCount).toBe(1);
    }
  });

  it('applies the server round-trip result directly to render state (optimistic-but-reconciled, not a local draft)', () => {
    expect(src).toMatch(/const result = await run\(\);\s*setState\(result\);/);
  });
});
