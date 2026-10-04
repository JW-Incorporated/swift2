import { API_STREAM_BUFFER_BYTES, API_STREAM_CHUNK_BYTES, API_STREAM_POLL_MS, resErr, resOk } from '@swift2/ui';
import type { ApiStreamChunk, ResResult } from '@swift2/ui';

// Native stream table for the pull-based `api { stream: true }` / `apiRead` pair (W6-stream). Pure and
// transport-neutral like bridge-handlers-api.ts: the reader, timers and caps are injected. Native holds the
// expo/fetch reader and a bounded buffer; the DOM pulls decoded chunks, so nothing is ever pushed.
export type StreamTableDeps = {
  /** Cumulative cap on bytes read from the body (MAX_API_BYTES). */
  maxBytes: number;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (handle: unknown) => void;
  pollMs?: number;
};

export type OpenStream = {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  /** Aborts the underlying fetch. */
  abort: () => void;
  /** Registers the stream for `cancel` / abort-all (ctx.own); returns the unregister. */
  own?: (id: string, cancel: () => void) => () => void;
  /** Runs once when the stream terminates (clears the deadline timer). */
  onEnd: () => void;
};

type Stream = OpenStream & {
  id: string;
  dec: TextDecoder;
  queue: Uint8Array[];
  queued: number;
  total: number;
  ended: boolean;
  /** Terminated by an error or the deadline; the next `apiRead` reports it, then the entry is dropped. */
  dead: boolean;
  error: ResResult<never> | null;
  pumping: boolean;
  reading: boolean;
  wake?: () => void;
  unown?: () => void;
};

export function createStreamTable(deps: StreamTableDeps) {
  const pollMs = deps.pollMs ?? API_STREAM_POLL_MS;
  const streams = new Map<string, Stream>();
  let opening = false;
  let seq = 0;

  const hasOpen = () => opening || [...streams.values()].some((s) => !s.dead);

  function release(s: Stream) {
    s.unown?.();
    s.unown = undefined;
    s.onEnd();
    s.wake?.();
  }

  function kill(s: Stream, error: ResResult<never> | null) {
    if (s.dead) return;
    s.dead = true;
    s.error = error;
    s.abort();
    void s.reader.cancel().catch(() => {});
    release(s);
  }

  function close(id: string) {
    const s = streams.get(id);
    if (!s) return;
    streams.delete(id);
    kill(s, null);
  }

  async function pump(s: Stream) {
    if (s.pumping || s.ended || s.dead) return;
    s.pumping = true;
    try {
      while (!s.dead && !s.ended && s.queued < API_STREAM_BUFFER_BYTES) {
        const { done, value } = await s.reader.read();
        if (s.dead) return;
        if (done) {
          s.ended = true;
          break;
        }
        s.total += value.byteLength;
        if (s.total > deps.maxBytes) return kill(s, resErr('failed', 'api response too large'));
        s.queue.push(value);
        s.queued += value.byteLength;
        s.wake?.();
      }
    } catch {
      if (!s.dead) kill(s, resErr('failed', 'api stream failed'));
    } finally {
      s.pumping = false;
      s.wake?.();
    }
  }

  function drain(s: Stream): Uint8Array {
    const out = new Uint8Array(Math.min(s.queued, API_STREAM_CHUNK_BYTES));
    let off = 0;
    while (off < out.length) {
      const head = s.queue[0];
      const n = Math.min(head.byteLength, out.length - off);
      out.set(head.subarray(0, n), off);
      off += n;
      if (n === head.byteLength) s.queue.shift();
      else s.queue[0] = head.subarray(n);
    }
    s.queued -= out.length;
    return out;
  }

  function waitForData(s: Stream, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      const done = () => {
        deps.clearTimer(timer);
        signal.removeEventListener('abort', done);
        s.wake = undefined;
        resolve();
      };
      const timer = deps.setTimer(done, pollMs);
      s.wake = done;
      signal.addEventListener('abort', done, { once: true });
    });
  }

  return {
    /** True while a stream is open or being opened: one open stream per host instance. */
    hasOpen,
    /** Claims the single slot before the (async) fetch; false when a stream is already open. */
    reserve(): boolean {
      if (hasOpen()) return false;
      opening = true;
      return true;
    },
    unreserve() {
      opening = false;
    },
    /** Registers the reader under a fresh id and frees the reservation. `expire` is the total-deadline hook. */
    open(o: OpenStream): { id: string; expire: () => void } {
      const id = `s${++seq}`;
      const s: Stream = {
        ...o,
        id,
        dec: new TextDecoder(),
        queue: [],
        queued: 0,
        total: 0,
        ended: false,
        dead: false,
        error: null,
        pumping: false,
        reading: false,
      };
      streams.set(id, s);
      opening = false;
      s.unown = o.own?.(id, () => close(id));
      void pump(s);
      return { id, expire: () => kill(s, resErr('timeout', 'api request timed out')) };
    },
    close,
    size: () => streams.size,
    async read(id: string, signal: AbortSignal): Promise<ResResult<ApiStreamChunk>> {
      const s = streams.get(id);
      if (!s) return resErr('invalid', 'unknown stream');
      if (s.reading) return resErr('invalid', 'read already in flight');
      if (signal.aborted) return resErr('cancelled', 'cancelled');
      s.reading = true;
      try {
        void pump(s);
        if (!s.queued && !s.ended && !s.dead) await waitForData(s, signal);
        if (signal.aborted) {
          close(id);
          return resErr('cancelled', 'cancelled');
        }
        if (s.dead && !s.error) return resErr('cancelled', 'stream closed');
        if (s.error) {
          streams.delete(id);
          return s.error;
        }
        let chunk = s.queued ? s.dec.decode(drain(s), { stream: true }) : '';
        if (s.ended && !s.queued) {
          chunk += s.dec.decode();
          streams.delete(id);
          release(s);
          return resOk({ chunk, done: true });
        }
        void pump(s);
        return resOk({ chunk, done: false });
      } finally {
        s.reading = false;
      }
    },
  };
}
