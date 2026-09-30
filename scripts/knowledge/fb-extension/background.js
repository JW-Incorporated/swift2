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
 *                 'deliver'  → state.outbox = {phase:'deliver', pendingResult} is owed to
 *                              POST /result; it stays persisted until a 200 (or a 409 duplicate,
 *                              which means an earlier attempt already landed)
 *                 'finish'   → POST /finished {} is owed
 *                 'done'     → nothing left
 *
 *   start page ──llfb-start──▶ save {port, token, tabId, phase:'next'} → advance()
 *   group page ──llfb-ready──▶ reply {job} if this tab has an active job, else {job:null}
 *   group page ──llfb-heartbeat──▶ POST /heartbeat
 *   group page ──llfb-result──▶ persist outbox → deliver → advance()
 *   tab lands off /groups/ (login, checkpoint redirect) → report that status for the job.
 *   worker (re)start → resume() picks up whatever phase was persisted.
 *
 * All transitions run one at a time (a promise chain), and every message handler awaits its
 * transition before answering.
 */
/* global chrome, importScripts, fetch, setTimeout, console */
importScripts('harvest-core.js');

const SESSION_KEY = 'llfb';
const GROUP_URL = /^https:\/\/www\.facebook\.com\/groups\//;
const OFF_GROUP_GRACE_MS = 8_000;
const OUTBOX_BACKOFF_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000];

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

async function request(state, method, path, body) {
  return fetch(`http://127.0.0.1:${state.port}${path}`, {
    method,
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
    coverage: null,
    collectedAt: new Date().toISOString(),
  };
}

function resultBody(result) {
  return { ...result, v: 1, extVersion: chrome.runtime.getManifest().version };
}

// POST the persisted outbox until the receiver acknowledges it. 200 → delivered; 409 → an
// earlier attempt (before a worker restart) already landed → delivered. 403 → stop for good.
// Anything else → back off and retry; when the retries run out the outbox stays persisted and
// the next worker start (resume) tries again.
async function deliverOutbox() {
  for (const delayMs of [0, ...OUTBOX_BACKOFF_MS]) {
    if (delayMs) await sleep(delayMs);
    const state = await loadState();
    const pending = state?.outbox?.pendingResult;
    if (!pending) return true;
    let status = 0;
    try {
      status = (await request(state, 'POST', '/result', pending)).status;
    } catch (error) {
      console.warn('[llfb] /result failed', String(error?.message ?? error));
    }
    if (status === 200 || status === 409) {
      await patchState({ outbox: null, phase: 'next' });
      return true;
    }
    if (status === 403) {
      console.warn('[llfb] /result refused the token (403); stopping');
      await patchState({ outbox: null, phase: 'done', finished: true });
      return false;
    }
  }
  return false;
}

async function finishRun(state) {
  await saveState({ ...state, job: null, phase: 'finish' });
  await api(state, 'POST', '/finished', {}).then(
    () => patchState({ phase: 'done', finished: true }),
    (error) => console.warn('[llfb] /finished failed', String(error?.message ?? error)),
  );
}

// Walks the persisted phase forward until it needs the page (phase 'job') or the run is over.
async function advance() {
  for (;;) {
    const state = await loadState();
    if (!state || state.finished || state.phase === 'done') return;
    if (state.phase === 'deliver') {
      if (!(await deliverOutbox())) return;
      continue;
    }
    if (state.phase === 'finish') return finishRun(state);
    if (state.phase !== 'next') return; // 'job': waiting for the page
    let job;
    try {
      job = await api(state, 'GET', '/next');
    } catch (error) {
      console.warn('[llfb] /next failed', String(error?.message ?? error));
      return; // phase stays 'next'; resume() retries on the next worker start
    }
    if (!job || job.done) return finishRun(state);
    if (!GROUP_URL.test(String(job.url))) {
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
    return;
  }
}

// The job's result is persisted to the outbox (and the job cleared) in ONE write, before any
// network I/O, so a worker restart after this point still delivers it.
async function finishJob(result) {
  const state = await loadState();
  if (!state?.job) return;
  await saveState({
    ...state,
    job: null,
    phase: 'deliver',
    outbox: { phase: 'deliver', pendingResult: resultBody(result) },
  });
  await advance();
}

async function onStart(message, sender) {
  if (!/^http:\/\/127\.0\.0\.1:\d+\/start/.test(String(sender.url ?? sender.tab?.url ?? '')))
    return { ok: false };
  if (!Number.isInteger(message.port) || !/^[0-9a-f]{32,128}$/i.test(String(message.token)))
    return { ok: false };
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
  if (!state?.job || sender.tab?.id !== state.tabId) return { ok: false };
  if (message.result?.slug !== state.job.slug) return { ok: false };
  await finishJob(message.result);
  return { ok: true };
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
