import { describe, expect, it } from 'vitest';
import { drillTable, runDrill, type DrillFailure } from './watchdog-drill';

// G4 drill (simulated): prints the launch table for each forced failure mode.
describe('G4 watchdog drill', () => {
  it.each(['hang', 'throw', 'terminated', 'render-gone', 'protocol', 'abandon'] as DrillFailure[])(
    '%s: falls back, then quarantines, then stays native',
    (mode) => {
      const rows = runDrill(mode, { launches: 14 });
      console.log(`--- ${mode}\n${drillTable(rows).join('\n')}`);
      const first = rows.findIndex((r) => r.skipped);
      expect(first).toBeGreaterThan(0);
      expect(rows.some((r) => r.state === 'quarantined' && r.skipped)).toBe(true);
      expect(rows.slice(-4).every((r) => r.mount === 'native' && r.skipped)).toBe(true);
    },
  );

  it('reset (a fresh record) brings the DOM back; a clean DOM never falls back', () => {
    const quarantined = runDrill('hang', { launches: 8 });
    expect(quarantined[7].state).toBe('quarantined');
    const after = runDrill('none', { launches: 3 });
    expect(after.every((r) => r.mount === 'dom' && r.outcome === 'ready')).toBe(true);
  });

  it('a new buildKey (OTA) lifts quarantine', () => {
    const rows = runDrill('hang', { launches: 4, buildKey: '2:new' });
    expect(rows[0].skipped).toBe(false);
  });
});
