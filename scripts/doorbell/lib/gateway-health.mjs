// Gateway health for the systemd watchdog (#5014). Pure state machine with an
// injectable clock: the gateway reports events, `shouldFeed()` says whether
// WATCHDOG=1 may be sent. Healthy = READY or RESUMED since the last close AND a
// heartbeat ACK (or that READY/RESUMED) within ACK_INTERVALS heartbeat
// intervals, and the clock has ticked within CLOCK_STALE_MS (a hung clock stops
// the feed too). Unhealthy for longer than GRACE_MS (< WatchdogSec=180) stops the
// feed so systemd restarts the unit. The clock plays no part here.
export const GRACE_MS = 120_000;
export const ACK_INTERVALS = 2;
export const CONNECT_TIMEOUT_MS = 45_000;
// The clock ticks every minute; two intervals plus a minute of slack.
export const CLOCK_STALE_MS = 180_000;
const DEFAULT_INTERVAL_MS = 41_250;

export function createGatewayHealth({ now = Date.now, graceMs = GRACE_MS, clockStaleMs = CLOCK_STALE_MS } = {}) {
  let ready = false;
  let interval = DEFAULT_INTERVAL_MS;
  let lastAck = -Infinity;
  // Process start counts as healthy, so a slow first connect gets the grace too.
  let lastHealthy = now();
  let lastTick = now();

  const healthyAt = (time) => ready && time - lastAck <= ACK_INTERVALS * interval;

  return {
    hello(ms) {
      if (Number.isFinite(ms) && ms > 0) interval = ms;
    },
    ready() {
      ready = true;
      lastAck = now();
    },
    ack() {
      if (ready) lastAck = now();
    },
    tick() {
      lastTick = now();
    },
    closed() {
      ready = false;
    },
    isHealthy: () => healthyAt(now()),
    shouldFeed() {
      const time = now();
      if (time - lastTick > clockStaleMs) return false;
      if (healthyAt(time)) {
        lastHealthy = time;
        return true;
      }
      return time - lastHealthy <= graceMs;
    },
    state: () => ({ ready, interval, lastAck, lastHealthy }),
  };
}
