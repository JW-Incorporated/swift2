// The doorbell's Discord gateway connection (m7-doorbell.md Mechanics 1):
// identify, heartbeat, resume after a drop, reconnect with capped backoff.
// Node ≥22's global WebSocket; `WebSocketImpl` and `timers` are injected so
// `doorbell.test.ts` drives it with no network. It never logs the token.
export const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';
export const BACKOFF_CAP_MS = 60_000;
// Discord says never to reconnect on these: a bad token, bad sharding, or
// invalid or disallowed intents. Reconnecting would re-identify with the same
// fault every few seconds, and too many identifies in a day resets the token.
export const FATAL_CLOSE = new Set([4004, 4010, 4011, 4012, 4013, 4014]);
// The session is gone, so the next connect identifies instead of resuming.
const NO_RESUME_CLOSE = new Set([4007, 4009]);
// Any 4000–4999 code other than 1000/1001 keeps the session resumable.
const RECONNECT_CODE = 4000;

export function backoffMs(attempt) {
  return Math.min(1000 * 2 ** attempt, BACKOFF_CAP_MS);
}

export function connectGateway({
  token, intents, onDispatch, onFatal = () => {}, log = console.log,
  WebSocketImpl = globalThis.WebSocket, timers = globalThis, random = Math.random, url = GATEWAY_URL,
}) {
  let ws = null;
  let seq = null;
  let sessionId = null;
  let resumeUrl = null;
  let heartbeat = null;
  let reconnect = null;
  let acked = true;
  let attempt = 0;
  let stopped = false;

  const send = (payload) => {
    try {
      ws?.send(JSON.stringify(payload));
    } catch (err) {
      log(`gateway: send failed: ${err.message}`);
    }
  };
  const stopHeartbeat = () => {
    if (heartbeat) timers.clearTimeout(heartbeat);
    heartbeat = null;
  };

  function beatAfter(interval, delay) {
    heartbeat = timers.setTimeout(() => {
      if (!acked) {
        log('gateway: no heartbeat ack — reconnecting');
        drop(RECONNECT_CODE);
        return;
      }
      acked = false;
      send({ op: 1, d: seq });
      beatAfter(interval, interval);
    }, delay);
  }

  function retry(code) {
    const wait = backoffMs(attempt);
    attempt += 1;
    log(`gateway: closed${code ? ` (${code})` : ''}; reconnecting in ${Math.round(wait / 1000)}s`);
    reconnect = timers.setTimeout(() => {
      reconnect = null;
      open();
    }, wait);
  }

  function closed(code) {
    stopHeartbeat();
    if (stopped) return;
    if (FATAL_CLOSE.has(code)) {
      stopped = true;
      log(`gateway: closed (${code}) — not reconnecting; check the bot token and its intents, then restart the service`);
      onFatal(code);
      return;
    }
    if (NO_RESUME_CLOSE.has(code)) {
      sessionId = null;
      seq = null;
    }
    retry(code);
  }

  // Close and move on at once: a zombie socket's close event may never come.
  function drop(code) {
    const socket = ws;
    ws = null;
    try {
      socket?.close(code);
    } catch {
      // already closed
    }
    closed(code);
  }

  function onFrame(raw, resuming) {
    let p;
    try {
      p = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (p.s !== null && p.s !== undefined) seq = p.s;
    if (p.op === 10) {
      const interval = Number(p.d?.heartbeat_interval) || 41_250;
      stopHeartbeat();
      acked = true;
      beatAfter(interval, Math.floor(interval * random()));
      if (resuming) send({ op: 6, d: { token, session_id: sessionId, seq } });
      else send({ op: 2, d: { token, intents, properties: { os: 'linux', browser: 'longlive-doorbell', device: 'longlive-doorbell' } } });
    } else if (p.op === 11) {
      acked = true;
    } else if (p.op === 1) {
      send({ op: 1, d: seq });
    } else if (p.op === 7) {
      log('gateway: Discord asked for a reconnect');
      drop(RECONNECT_CODE);
    } else if (p.op === 9) {
      log(`gateway: invalid session${p.d ? ', resuming' : ', identifying again'}`);
      if (!p.d) {
        sessionId = null;
        seq = null;
      }
      drop(RECONNECT_CODE);
    } else if (p.op === 0) {
      if (p.t === 'READY') {
        sessionId = p.d?.session_id || null;
        resumeUrl = p.d?.resume_gateway_url || null;
        attempt = 0;
      }
      if (p.t === 'RESUMED') {
        attempt = 0;
        log('gateway: resumed');
      }
      try {
        onDispatch(p.t, p.d);
      } catch (err) {
        log(`gateway: ${p.t} handler failed: ${err.message}`);
      }
    }
  }

  function open() {
    if (stopped) return;
    const resuming = Boolean(sessionId && resumeUrl);
    const target = resuming ? `${resumeUrl.replace(/\/+$/, '')}/?v=10&encoding=json` : url;
    log(`gateway: ${resuming ? 'resuming' : 'connecting'}`);
    let socket;
    try {
      socket = new WebSocketImpl(target);
    } catch (err) {
      log(`gateway: connect failed: ${err.message}`);
      retry();
      return;
    }
    ws = socket;
    socket.addEventListener('message', (event) => {
      if (socket === ws) onFrame(event.data, resuming);
    });
    socket.addEventListener('close', (event) => {
      if (socket !== ws) return;
      ws = null;
      closed(event.code);
    });
    socket.addEventListener('error', () => {}); // a close event follows
  }

  open();
  return {
    stop() {
      stopped = true;
      stopHeartbeat();
      if (reconnect) timers.clearTimeout(reconnect);
      const socket = ws;
      ws = null;
      try {
        socket?.close(1000);
      } catch {
        // already closed
      }
    },
    state: () => ({ connected: Boolean(ws), sessionId, seq, attempt, stopped }),
  };
}
