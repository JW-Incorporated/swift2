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
  /** Registers a resource for `cancel` / abort-all (ctx.own); returns the unregister. */
  own?: (id: string, cancel: () => void) => () => void;
  /** The opening command's id: an ownership alias until the DOM observes the head (its first apiRead). */
  alias?: string;
  /** Runs once when the stream terminates (clears the deadline timer). */
  onEnd: () => void;
};

type Stream = OpenStream & {
  id: string;
  dec: TextDecoder;
  queue: Uint8Array[];
  /** Unread bytes retained in `queue`: never above API_STREAM_BUFFER_BYTES. */
  queued: number;
  /**
   * Retention is bounded by maxBytes + API_STREAM_BUFFER_BYTES (~320 KB) because `total` caps what the source can deliver.
   * The tail of one source chunk that did not fit the buffer; the reader is not read again until it is moved over. */
  carry: Uint8Array | null;
  total: number;
  ended: boolean;
  dead: boolean;
  /** Why it ended, when not by a plain close; read once by an in-flight read. */
  error: ResResult<never> | null;
  pumping: boolean;
  reading: boolean;
  wake?: () => void;
  unown?: () => void;
  unalias?: () => void;
};

export function createStreamTable(deps: StreamTableDeps) {
  const pollMs = deps.pollMs ?? API_STREAM_POLL_MS;
  const streams = new Map<string, Stream>();
  let opening = false;
  let seq = 0;

  const hasOpen = () => opening || streams.size > 0;

  /** Terminal: removes the record at once and releases everything it held. */
  function finish(s: Stream, error: ResResult<never> | null) {
    if (s.dead) return;
    s.dead = true;
    streams.delete(s.id);
    s.error = error;
    s.abort();
    void s.reader.cancel().catch(() => {});
    s.queue = [];
    s.queued = 0;
    s.carry = null;
    s.unown?.();
    s.unalias?.();
    s.onEnd();
    s.wake?.();
  }

  function close(id: string) {
    const s = streams.get(id);
    if (s) finish(s, null);
  }

  function fill(s: Stream) {
    if (!s.carry) return;
    const take = s.carry.subarray(0, Math.max(0, API_STREAM_BUFFER_BYTES - s.queued));
    if (!take.byteLength) return;
    s.queue.push(take);
    s.queued += take.byteLength;
    s.carry = take.byteLength === s.carry.byteLength ? null : s.carry.subarray(take.byteLength);
    s.wake?.();
  }

  async function pump(s: Stream) {
    if (s.pumping || s.ended || s.dead) return;
    s.pumping = true;
    try {
      for (;;) {
        fill(s);
        if (s.dead || s.ended || s.carry || s.queued >= API_STREAM_BUFFER_BYTES) break;
        const { done, value } = await s.reader.read();
        if (s.dead) return;
        if (done) {
          s.ended = true;
          break;
        }
        s.total += value.byteLength;
        if (s.total > deps.maxBytes) return finish(s, resErr('failed', 'api response too large'));
        s.carry = value;
      }
    } catch {
      finish(s, resErr('failed', 'api stream failed'));
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
        carry: null,
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
      if (o.alias) s.unalias = o.own?.(o.alias, () => close(id));
      void pump(s);
      return { id, expire: () => finish(s, resErr('timeout', 'api request timed out')) };
    },
    close,
    size: () => streams.size,
    async read(id: string, signal: AbortSignal): Promise<ResResult<ApiStreamChunk>> {
      const s = streams.get(id);
      if (!s) return resErr('invalid', 'unknown stream');
      s.unalias?.();
      s.unalias = undefined;
      if (s.reading) return resErr('invalid', 'read already in flight');
      if (signal.aborted) return resErr('cancelled', 'cancelled');
      s.reading = true;
      try {
        void pump(s);
        if (!s.queued && !s.ended && !s.dead) await waitForData(s, signal);
        if (signal.aborted) return resErr('cancelled', 'cancelled');
        if (s.dead) return s.error ?? resErr('cancelled', 'stream closed');
        let chunk = s.queued ? s.dec.decode(drain(s), { stream: true }) : '';
        let done = false;
        if (s.ended && !s.queued && !s.carry) {
          chunk += s.dec.decode();
          done = true;
        }
        const result = resOk({ chunk, done });
        if (done) finish(s, null);
        else void pump(s);
        return result;
      } finally {
        s.reading = false;
      }
    },
  };
}
