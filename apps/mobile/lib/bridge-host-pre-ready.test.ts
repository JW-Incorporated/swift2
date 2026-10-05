import { describe, expect, it } from 'vitest';
import { body, setup, tick } from './bridge-host.test-kit';

describe('bridge-host rejects commands before ready', () => {
  it('a pre-ready cmd answers invalid and never moves the high-water mark', async () => {
    const s = setup();
    s.rawCmd('1', 'haptic', { kind: 'light' });
    await tick();
    expect(body(s.resFor('1')[0]!)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    s.makeReady();
    expect(s.readyAcks[0]!.payload).toEqual({ hwm: 0 });
  });

  it('a huge-id cmd before ready cannot starve a small legit id afterwards', async () => {
    const s = setup();
    s.rawCmd('999999999999999', 'haptic', { kind: 'light' });
    s.makeReady();
    s.cmd('5', 'haptic', { kind: 'light' });
    await tick();
    expect(body(s.resFor('5')[0]!)).toMatchObject({ ok: true });
  });
});
