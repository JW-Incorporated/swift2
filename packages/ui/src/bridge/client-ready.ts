import { READY_MAX_ATTEMPTS, readyBackoff } from './client-util';
import type { Envelope } from './envelope';
import { BRIDGE_VERSION } from './version';
import type { VersionRange } from './version';

/** A sent `ready` with no valid `readyAck` inside this window counts as a failed attempt. */
export const READY_ACK_TIMEOUT_MS = 2000;

type Timer = unknown;
export type ReadyDeps = {
  setT(fn: () => void, ms: number): Timer;
  clearT(h: Timer): void;
  now(): number;
  range: VersionRange;
  nextId(): string | null;
  /** False when the post threw synchronously; `onFail` covers async rejection. */
  post(env: Envelope, onFail: () => void): boolean;
  dead(): boolean;
  fatal(reason: string): void;
};

/**
 * The `ready` handshake: post, wait for `readyAck`, retry with backoff on a
 * failed post or a missing ack, fatal after READY_MAX_ATTEMPTS.
 */
export function createReady(d: ReadyDeps) {
  let done = false;
  let started = false;
  let inFlight = false;
  let failures = 0;
  let retryTimer: Timer | undefined;
  let ackTimer: Timer | undefined;

  const stop = () => {
    if (retryTimer !== undefined) d.clearT(retryTimer);
    if (ackTimer !== undefined) d.clearT(ackTimer);
    retryTimer = undefined;
    ackTimer = undefined;
  };
  const fail = () => {
    if (!inFlight) return;
    inFlight = false;
    stop();
    if (d.dead()) return;
    failures++;
    if (failures >= READY_MAX_ATTEMPTS) return d.fatal('ready-failed');
    retryTimer = d.setT(attempt, readyBackoff(failures));
  };
  function attempt() {
    retryTimer = undefined;
    if (d.dead() || done || inFlight) return;
    const id = d.nextId();
    if (id === null) return;
    inFlight = true;
    const env: Envelope = { v: BRIDGE_VERSION, id, kind: 'evt', type: 'ready', payload: { v: BRIDGE_VERSION, range: d.range }, ts: d.now() };
    ackTimer = d.setT(fail, READY_ACK_TIMEOUT_MS);
    if (!d.post(env, fail)) fail();
  }

  return {
    start() {
      if (d.dead() || done || inFlight) return;
      started = true;
      if (retryTimer !== undefined) d.clearT(retryTimer);
      attempt();
    },
    /** A valid `readyAck` arrived. True only for the transition that completes the handshake. */
    complete(): boolean {
      if (done || !started || d.dead()) return false;
      done = true;
      inFlight = false;
      stop();
      return true;
    },
    stop,
  };
}
