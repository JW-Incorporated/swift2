/* Long Live FB export — background service worker (FB-EXTENSION-1).
 *
 * The ONLY place that talks to the local receiver (http://127.0.0.1:<port>, header X-LLFB-Token).
 * An MV3 service worker can be killed at any moment, so every transition is persisted in
 * chrome.storage.session BEFORE its network call and resumed when the worker starts again
 * (never chrome.storage.local, never on a facebook.com URL).
 *
 *   state.phase   'next'     → GET /next is owed (re-asking is safe: the receiver re-serves the
 *                              current group)
 *                 'job'      → a job is out; the tab is (being) navigated to job.url
 *                 'deliver'  → state.outbox = {phase:'deliver', slug, pendingResult} is owed to
 *                              POST /result; it stays persisted until a 200 (or a 409 duplicate,
 *                              which means an earlier attempt already landed)
 *                 'finish'   → POST /finished {} is owed
 *                 'done'     → nothing left
 *
 * chrome.storage.session holds at most 10 MiB (QUOTA_BYTES) and REJECTS a larger set(). A real
 * group's result (full post HTML + comments) can exceed that, so only a result under
 * OUTBOX_MAX_CHARS is persisted to the outbox; a larger one is posted straight from memory and the
 * page keeps it and re-sends it (content.js) until this worker acknowledges it.
 *
 * When the receiver cannot be reached after the in-worker retries, a chrome.alarms wake-up
 * (WAKE_ALARM, every minute) re-runs advance() on the persisted phase; it is cleared only once a
 * transition has succeeded (or the run is over).
 *
 *   start page ──llfb-start──▶ save {port, token, tabId, phase:'next'} → advance()
 *   group page ──llfb-ready──▶ reply {job} if this tab has an active job, else {job:null}
 *   group page ──llfb-heartbeat──▶ POST /heartbeat
 *   group page ──llfb-result──▶ outbox (or straight from memory) → deliver → advance()
 *   tab lands off /groups/ (login, checkpoint redirect) → report that status for the job.
 *   worker (re)start / wake alarm → advance() picks up whatever phase was persisted.
 *
 * All transitions run one at a time (a promise chain), and every message handler awaits its
 * transition before answering.
 */
/* global chrome, importScripts, fetch, setTimeout, console */
importScripts('harvest-core.js');

const SESSION_KEY = 'llfb';
const GROUP_URL = /^https:\/\/www\.facebook\.com\/groups\//;
// A job from /next must be exactly a facebook.com group URL (no other host, no path tricks; a
// dots-only segment like `..` is refused too).
const JOB_URL = /^https:\/\/www\.facebook\.com\/groups\/(?!\.+(?:[/?]|$))[0-9A-Za-z._-]+(\/|\?|$)/;
const START_URL = /^http:\/\/127\.0\.0\.1:(\d{1,5})\/start(?:[/?#]|$)/;
const OFF_GROUP_GRACE_MS = 8_000;
const OUTBOX_BACKOFF_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000];
// JSON characters, not bytes: even all-3-byte UTF-8 (6 MiB) stays under the 10 MiB quota.
const OUTBOX_MAX_CHARS = 2 * 1024 * 1024;
const WAKE_ALARM = 'llfb-resume';

async function loadState() {
  const stored = await chrome.storage.session.get(SESSION_KEY);
  return stored[SESSION_KEY] ?? null;
}

async function saveState(state) {
  await chrome.storage.session.set({ [SESSION_KEY]: state });
}

async function patchState(patch) {
  const state = await loadState();
  if (!state) return null;
  const next = { ...state, ...patch };
  await saveState(next);
  return next;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Serialize every state transition inside this worker instance.
let chain = Promise.resolve();
function serialized(task) {
  const run = chain.then(task, task);
  chain = run.catch(() => {});
  return run;
}

async function scheduleWake() {
  await chrome.alarms.create(WAKE_ALARM, { delayInMinutes: 1, periodInMinutes: 1 });
}

async function clearWake() {
  await chrome.alarms.clear(WAKE_ALARM);
}

// Only ever the 127.0.0.1 port the /start page came from; a redirect is refused, not followed.
async function request(state, method, path, body) {
  return fetch(`http://127.0.0.1:${state.port}${path}`, {
    method,
    redirect: 'error',
    cache: 'no-store',
    headers: {
      'X-LLFB-Token': state.token,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function api(state, method, path, body) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await request(state, method, path, body);
      if (response.status === 403) throw new Error('receiver refused the token (403)');
      if (!response.ok) throw new Error(`receiver ${method} ${path} → ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (String(error?.message).includes('403')) break;
      await sleep(1_000 * (attempt + 1));
    }
  }
  throw lastError;
}

function failedResult(job, message) {
  return {
    v: 1,
    slug: job.slug,
    status: 'failed',
    stopReason: null,
    message,
    units: [],
    comments: [],
    commentCoverage: null,
    coverage: null,
    collectedAt: new Date().toISOString(),
  };
}

function resultBody(result) {
  return { ...result, v: 1, extVersion: chrome.runtime.getManifest().version };
}

// POST one result with backoff. 200 → 'ok'; 409 → an earlier attempt (before a worker restart)
// already landed → 'ok'; 403 → 'refused' (stop for good); anything else, retries spent → 'failed'.
// `current()` re-reads the payload before each attempt (null → someone else delivered it).
async function postWithBackoff(state, current) {
  for (const delayMs of [0, ...OUTBOX_BACKOFF_MS]) {
    if (delayMs) await sleep(delayMs);
    const body = await current();
    if (!body) return 'ok';
    let status = 0;
    try {
      status = (await request(state, 'POST', '/result', body)).status;
    } catch (error) {
      console.warn('[llfb] /result failed', String(error?.message ?? error));
    }
    if (status === 200 || status === 409) return 'ok';
    if (status === 403) {
      console.warn('[llfb] /result refused the token (403); stopping');
      return 'refused';
    }
  }
  return 'failed';
}

// Deliver the persisted outbox. true → delivered (phase 'next'); false → not (yet).
async function deliverOutbox() {
  const state = await loadState();
  const slug = state?.outbox?.pendingResult?.slug ?? null;
  const outcome = await postWithBackoff(
    state,
    async () => (await loadState())?.outbox?.pendingResult ?? null,
  );
  if (outcome === 'ok') {
    await patchState({ outbox: null, phase: 'next', lastDelivered: slug });
    return true;
  }
  if (outcome === 'refused') await patchState({ outbox: null, phase: 'done', finished: true });
  return false;
}

// Not reachable now: keep the persisted phase and let the wake alarm retry it — unless the run
// is over.
async function retryLater() {
  const state = await loadState();
  if (!state || state.finished || state.phase === 'done') return clearWake();
  return scheduleWake();
}

async function finishRun(state) {
  await saveState({ ...state, job: null, phase: 'finish' });
  try {
    await api(state, 'POST', '/finished', {});
  } catch (error) {
    console.warn('[llfb] /finished failed', String(error?.message ?? error));
    return retryLater();
  }
  await patchState({ phase: 'done', finished: true });
  return clearWake();
}

// Walks the persisted phase forward until it needs the page (phase 'job') or the run is over.
async function advance() {
  for (;;) {
    const state = await loadState();
    if (!state || state.finished || state.phase === 'done' || state.phase === 'job')
      return clearWake(); // nothing owed by this worker (the page drives phase 'job')
    if (state.phase === 'deliver') {
      if (!(await deliverOutbox())) return retryLater();
      continue;
    }
    if (state.phase === 'finish') return finishRun(state);
    if (state.phase !== 'next') return clearWake();
    let job;
    try {
      job = await api(state, 'GET', '/next');
    } catch (error) {
      console.warn('[llfb] /next failed', String(error?.message ?? error));
      return retryLater(); // phase stays 'next'
    }
    if (!job || job.done) return finishRun(state);
    if (typeof job.slug !== 'string' || !job.slug) {
      console.warn('[llfb] /next returned a job without a slug; stopping');
      await patchState({ phase: 'done', finished: true });
      return clearWake();
    }
    if (!JOB_URL.test(String(job.url))) {
      // Refused: the tab is never sent there; the group is reported failed.
      await saveState({
        ...state,
        job: null,
        phase: 'deliver',
        outbox: {
          phase: 'deliver',
          pendingResult: resultBody(failedResult(job, 'job url is not a facebook group url')),
        },
      });
      continue;
    }
    await saveState({
      ...state,
      phase: 'job',
      job: { ...job, dispatched: false, startedAtMs: null },
    });
    await chrome.tabs.update(state.tabId, { url: job.url });
    return clearWake();
  }
}

// The job's result → the persisted outbox (job cleared in the same write, before any network I/O)
// when it fits in storage.session; else straight from memory, with the page holding it and
// re-sending until it gets {ok:true}. Answers {ok:true} once the result is durable or delivered.
async function finishJob(result) {
  const state = await loadState();
  if (!state?.job) return { ok: false };
  const body = resultBody(result);
  let persisted = false;
  if (JSON.stringify(body).length <= OUTBOX_MAX_CHARS) {
    persisted = await saveState({
      ...state,
      job: null,
      phase: 'deliver',
      outbox: { phase: 'deliver', pendingResult: body },
    }).then(
      () => true,
      (error) => (console.warn('[llfb] outbox not stored', String(error?.message)), false),
    );
  }
  if (persisted) {
    await advance();
    return { ok: true };
  }
  const outcome = await postWithBackoff(state, async () => body);
  if (outcome === 'failed') return { ok: false, retry: true }; // job stays; the page re-sends
  await saveState({
    ...state,
    job: null,
    outbox: null,
    lastDelivered: body.slug,
    ...(outcome === 'refused' ? { phase: 'done', finished: true } : { phase: 'next' }),
  });
  await advance();
  return { ok: true };
}

async function onStart(message, sender) {
  const match = START_URL.exec(String(sender.url ?? sender.tab?.url ?? ''));
  if (!match || !sender.tab) return { ok: false };
  // Only the port this /start page was served from — never one the message merely claims.
  if (!Number.isInteger(message.port) || message.port !== Number(match[1])) return { ok: false };
  if (!/^[0-9a-f]{32,128}$/i.test(String(message.token))) return { ok: false };
  await saveState({
    port: message.port,
    token: message.token,
    tabId: sender.tab.id,
    job: null,
    outbox: null,
    phase: 'next',
    finished: false,
  });
  await advance();
  return { ok: true };
}

async function onReady(sender) {
  const state = await loadState();
  const job = state?.job;
  if (!job || sender.tab?.id !== state.tabId) return { job: null };
  // A full page reload mid-harvest re-dispatches the job; the wall budget still counts from the
  // first dispatch (startedAtMs).
  const startedAtMs = job.startedAtMs ?? Date.now();
  await saveState({ ...state, job: { ...job, dispatched: true, startedAtMs } });
  const payload = { ...job, startedAtMs };
  delete payload.dispatched;
  return { job: payload };
}

async function onHeartbeat(message, sender) {
  const state = await loadState();
  if (!state?.job || sender.tab?.id !== state.tabId) return { ok: false };
  await api(state, 'POST', '/heartbeat', {
    slug: state.job.slug,
    scrolls: message.scrolls,
    slotCount: message.slotCount,
  }).catch(() => {});
  return { ok: true };
}

async function onResult(message, sender) {
  const state = await loadState();
  if (!state || sender.tab?.id !== state.tabId) return { ok: false };
  const slug = message.result?.slug;
  if (!state.job) {
    // A re-send of a result this worker already took (persisted or delivered): acknowledge it.
    const taken = state.outbox?.pendingResult?.slug ?? state.lastDelivered;
    return { ok: typeof slug === 'string' && slug === taken };
  }
  if (slug !== state.job.slug) return { ok: false };
  return finishJob(message.result);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handlers = {
    'llfb-start': () => serialized(() => onStart(message, sender)),
    'llfb-ready': () => serialized(() => onReady(sender)),
    'llfb-heartbeat': () => onHeartbeat(message, sender),
    'llfb-result': () => serialized(() => onResult(message, sender)),
  };
  const handler = handlers[message?.type];
  if (!handler) return false;
  handler().then(sendResponse, (error) =>
    sendResponse({ ok: false, error: String(error?.message ?? error) }),
  );
  return true; // async sendResponse
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm?.name !== WAKE_ALARM) return;
  serialized(() => advance()).catch((error) =>
    console.warn('[llfb] wake failed', String(error?.message ?? error)),
  );
});

// The group URL can redirect off /groups/ (login wall, checkpoint), where the content script does
// not run. Report that as the job's status instead of waiting for the receiver's stall watchdog.
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status !== 'complete') return;
  const state = await loadState();
  if (!state?.job || state.job.dispatched || tabId !== state.tabId) return;
  const url = String(tab.url ?? '');
  if (GROUP_URL.test(url)) return;
  const slug = state.job.slug;
  setTimeout(() => {
    serialized(async () => {
      const latest = await loadState();
      if (!latest?.job || latest.job.dispatched || latest.job.slug !== slug) return;
      const status = globalThis.LLFB.classifyPage({ url });
      const host = url.replace(/[?#].*$/, '');
      if (status === 'ready')
        await finishJob(failedResult(latest.job, `landed off-group: ${host}`));
      else await finishJob({ ...failedResult(latest.job, `redirected: ${host}`), status });
    }).catch((error) => console.warn('[llfb] off-group report failed', String(error?.message)));
  }, OFF_GROUP_GRACE_MS);
});

// Worker (re)start: resume whatever transition was in flight when the previous instance died.
const resumed = serialized(() => advance()).catch((error) =>
  console.warn('[llfb] resume failed', String(error?.message ?? error)),
);
globalThis.LLFB.backgroundReady = resumed;
