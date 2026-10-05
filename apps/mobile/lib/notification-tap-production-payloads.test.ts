import { describe, expect, it } from 'vitest';
import { setup, tick } from './bridge-host.test-kit';
import { resolveDestination } from './destination-resolver';
import { createTapGate } from './notification-tap-gate';
import { isDomOwnedTapPath } from './tap-paths';
import { isNativeRoute } from '../dom/slots/routes';

const SITE = 'https://www.longlivets.com';
// The deepLink strings the backend really emits: packages/core/src/notification-cooldown.ts (settings quick action)
// and notification-digest.ts (digest -> inbox).
const PRODUCTION_LINKS = [
  ['?screen=settings (notification-cooldown.ts)', `${SITE}/?screen=settings`, '/settings'],
  ['?current=inbox (notification-digest.ts)', `${SITE}/?current=inbox`, '/inbox'],
] as const;

describe.each(PRODUCTION_LINKS)('production payload %s', (_name, link, domPath) => {
  it('resolves to a DOM destination', () => {
    expect(resolveDestination(link, { isHostRoute: isNativeRoute })).toEqual({ kind: 'dom', path: domPath });
  });

  it('is delivered to the DOM host and acked: nothing stays queued', async () => {
    const gate = createTapGate({ siteUrl: SITE });
    expect(gate.enqueue({ id: 'prod', deepLink: link })).toBe('queued');
    const s = setup();
    s.makeReady();
    gate.bindHost(s.host);
    await tick();
    const nav = s.sent.filter((e) => e.kind === 'evt' && e.type === 'navigate');
    expect(nav).toHaveLength(1);
    // The tap target consumes the emitted path through the same resolver: the DOM owns it.
    expect(isDomOwnedTapPath((nav[0].payload as { path: string }).path, isNativeRoute)).toBe(true);
    s.host.receive({ v: 1, id: 'ack0', kind: 'evt', type: 'ack', payload: { seq: nav[0].seq }, ts: 1 });
    await tick();
    expect(gate.size()).toBe(0);
  });
});
