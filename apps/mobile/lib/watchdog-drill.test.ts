import { describe, expect, it } from 'vitest';
import { drillTable, runDrill, type DrillFailure } from './watchdog-drill';

// G4 drill (simulated): prints the launch table for each forced failure mode.
describe('G4 watchdog drill', () => {
  it.each(['hang', 'throw', 'terminated', 'render-gone', 'protocol'] as DrillFailure[])(
    '%s (in-launch failure): Recovery every launch, never a fallback launch, never quarantined',
    (mode) => {
      const rows = runDrill(mode, { launches: 14 });
      console.log(mode, drillTable(rows).join('\n'));
      expect(rows.every((r) => !r.skipped && r.outcome === 'strike' && r.state === 'failed' && r.strikes === 0 && r.fallbackCycles === 0)).toBe(true);
    },
  );

  it('abandon (cross-launch death): falls back, then quarantines, then stays native', () => {
    const rows = runDrill('abandon', { launches: 14 });
    console.log('abandon', drillTable(rows).join('\n'));
    expect(rows.findIndex((r) => r.skipped)).toBeGreaterThan(0);
    expect(rows.some((r) => r.state === 'quarantined' && r.skipped)).toBe(true);
    expect(rows.slice(-4).every((r) => r.mount === 'native' && r.skipped)).toBe(true);
  });

  it('reset (a fresh record) brings the DOM back; a clean DOM never falls back', () => {
    const quarantined = runDrill('abandon', { launches: 12 });
    expect(quarantined[11].state).toBe('quarantined');
    const after = runDrill('none', { launches: 3 });
    expect(after.every((r) => r.mount === 'dom' && r.outcome === 'ready')).toBe(true);
  });

  it('a new buildKey (OTA) lifts quarantine', () => {
    const rows = runDrill('abandon', { launches: 12, buildKey: '2:new' });
    expect(rows[0].skipped).toBe(false);
  });
});
