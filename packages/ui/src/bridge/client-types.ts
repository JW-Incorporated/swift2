import type { Envelope, ResResult } from './envelope';
import type { DomCommandType, EventPayloadOf, NativeEventType, PayloadOf, ResultOf } from './messages';
import type { BackResponder } from './client-back';
import type { QueuedEventType } from './client-events';
import type { IdSource } from './client-util';

export type TimerHandle = unknown;
export type ClientOptions = {
  /** May return a promise (an Expo action): its rejection fails the call, its value is fed to `receive`. */
  post(env: Envelope): void | PromiseLike<unknown>;
  now(): number;
  /** Default: `monotonicIds(now())`. A custom source must stay strictly increasing; give it `reseed` to honour `readyAck`. */
  idGen?: IdSource;
  setTimer?(fn: () => void, ms: number): TimerHandle;
  clearTimer?(h: TimerHandle): void;
  defaultTimeoutMs?: number;
  /** Hold calls made before `ready` is posted, flushing them in order after. */
  queueUntilReady?: boolean;
  /** `ready` exhausted its retries, or the id space ran out: the watchdog path. Fires once. */
  onFatal?(reason: string): void;
  /** Non-fatal anomalies: `readyAck-invalid`, `inbox-dropped` (count in `detail`). */
  onSignal?(kind: string, detail?: number): void;
};
export type CallOptions = { signal?: AbortSignal; timeoutMs?: number };

export type BridgeClient = {
  call<T extends DomCommandType>(type: T, payload: PayloadOf<T>, opts?: CallOptions): Promise<ResResult<ResultOf<T>>>;
  on<T extends NativeEventType>(type: T, fn: (payload: EventPayloadOf<T>) => void): () => void;
  handle(type: 'back', fn: BackResponder): () => void;
  /** Feed one raw inbound message (a `res`, or a native `evt`/`cmd`; seq-bearing ones take the inbox path). */
  receive(raw: unknown): boolean;
  /** Process up to MAX_BATCH `seq > lastSeq` in ascending order, then ack the last; the rest stays held for the next consume. */
  consumeInbox(inbox: readonly unknown[]): void;
  sendDiag(stage: string, detail?: string): void;
  /** Fire-and-forget DOM events beyond ready/diag/ack (navReady, navigated, theme). Before the handshake completes they queue with calls (theme coalesces); see client-events.ts. */
  sendEvent<T extends QueuedEventType>(type: T, payload: EventPayloadOf<T>): void;
  sendReady(): void;
  /** Resolves pending as cancelled; every later call resolves `failed`. */
  dispose(): void;
};


