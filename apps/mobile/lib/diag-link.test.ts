import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTapGate } from './notification-tap-gate';
import { closeDiagPanel, isDiagLink, isDiagPanelOpen } from './diag-link';
import { startDeepLinkIntake, type DeepLinkPorts } from './use-deep-links';
import { createHandlers } from './bridge-handlers-ui';

const bad = (v: unknown) => v as never;

const SITE = 'https://www.longlivets.com';
const flush = () => new Promise((r) => setTimeout(r, 0));

function setup(initial: string | null) {
  let emit: (url: string) => void = () => {};
  const ports: DeepLinkPorts = { getInitialURL: async () => initial, listen: (cb) => ((emit = cb), () => {}) };
  const gate = createTapGate({ siteUrl: SITE });
  const opened: string[] = [];
  gate.setNativeNavigator((u) => opened.push(u));
  startDeepLinkIntake(gate, ports);
  return { opened, emit: (u: string) => emit(u) };
}

afterEach(closeDiagPanel);

describe('diagnostics deep link', () => {
  it('matches only the exact diag link', () => {
    for (const ok of ['longlive://diag', 'longlive:///diag', 'longlive://diag/']) expect(isDiagLink(ok)).toBe(true);
    for (const no of ['longlive://diag?x=1', 'longlive://diag/x', 'longlive://diagnostics', `${SITE}/diag`, 'longlive://', 5, null])
      expect(isDiagLink(no)).toBe(false);
  });

  it('cold-start URL opens the panel and is not queued', async () => {
    const s = setup('longlive://diag');
    await flush();
    expect(isDiagPanelOpen()).toBe(true);
    expect(s.opened).toEqual([]);
  });

  it('warm URL opens the panel', async () => {
    const s = setup(null);
    await flush();
    expect(isDiagPanelOpen()).toBe(false);
    s.emit('longlive://diag');
    expect(isDiagPanelOpen()).toBe(true);
    expect(s.opened).toEqual([]);
  });

  it('an unknown path is unaffected and does not open the panel', async () => {
    const s = setup(null);
    s.emit('longlive://support');
    await flush();
    expect(isDiagPanelOpen()).toBe(false);
    expect(s.opened).toEqual([`${SITE}/support`]);
  });

  it('the DOM bridge cannot trigger it (openExternal and navigate refuse the link, panel stays closed)', async () => {
    const deps = { navigate: vi.fn(), isNativeRoute: () => true, log: vi.fn(), openURL: vi.fn(async () => {}), share: vi.fn(async () => {}), haptic: vi.fn() };
    const h = createHandlers(deps);
    const ctx = { signal: new AbortController().signal };
    expect(await h.openExternal({ url: bad('longlive://diag') }, ctx)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(await h.navigate({ path: bad('longlive://diag') }, ctx)).toMatchObject({ ok: false });
    expect(deps.openURL).not.toHaveBeenCalled();
    expect(deps.navigate).not.toHaveBeenCalled();
    expect(isDiagPanelOpen()).toBe(false);
  });
});
