import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const gate = readFileSync(new URL('./watchdog-gate.ts', import.meta.url), 'utf8');

describe('launch reads (default-on shared UI)', () => {
  it('App feeds the mount decision from the last-good cache only', () => {
    expect(app).toContain('loadLaunchFlags().then((flags) => setLaunchInputs(flags))');
    expect(app).not.toMatch(/diagnostics-override|getForceSharedUi|SecureStore/);
  });

  it('the gate reads the watchdog record and nothing else from storage on the decision path', () => {
    expect(gate).toContain('await loadWatchdogRecord()');
    expect(gate).not.toMatch(/getForceSharedUi|setForceSharedUi|SecureStore/);
    expect(Object.keys(gate.match(/export interface LaunchInputs \{[\s\S]*?\n\}/)![0].match(/^\s{2}(\w+):/gm) ?? [])).toHaveLength(3);
  });
});
