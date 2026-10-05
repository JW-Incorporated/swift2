import { describe, expect, it } from 'vitest';
import { nativeSurface } from './recovery-surface';

describe('nativeSurface', () => {
  it('flag-off keeps the legacy native router (interim)', () => {
    expect(nativeSurface('native', 'flag-off')).toBe('legacy');
  });
  it.each(['dom-strike', 'watchdog-fallback', 'quarantine', 'pending-expired', 'attempt-failed', null] as const)(
    'watchdog outcome %s gets Recovery',
    (reason) => expect(nativeSurface('native', reason)).toBe('recovery'),
  );
  it('dom and pending mounts have no native surface', () => {
    expect(nativeSurface('dom', null)).toBeNull();
    expect(nativeSurface('pending', null)).toBeNull();
  });
});
