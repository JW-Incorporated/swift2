// Preloaded (NODE_OPTIONS=--require) into the parity side-a `next build` and `next start`. The browsers' clock is
// frozen by the harness (page.clock.setFixedTime), but the server's was not: the current-era timeline scrubber's ridge
// is computed from Date.now() during SSR and React keeps that server-rendered attribute on hydration, so side a's
// ridge drifted with the real date while side b's stayed put. Keep this instant equal to FIXED_TIME in
// e2e/parity/env.ts (freeze-date.test.ts asserts it).
const FIXED_MS = Date.parse('2026-01-01T12:00:00Z');
const RealDate = Date;

class FrozenDate extends RealDate {
  constructor(...args) {
    if (args.length === 0) super(FIXED_MS);
    else super(...args);
  }

  static now() {
    return FIXED_MS;
  }
}

globalThis.Date = FrozenDate;
