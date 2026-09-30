/* Long Live FB export — background service worker (FB-EXTENSION-1).
 *
 * The ONLY place that talks to the local receiver (http://127.0.0.1:<port>, header X-LLFB-Token).
 * Event-driven so a service-worker restart loses nothing: port, token, tab and the current job
 * live in chrome.storage.session (never in chrome.storage.local, never on a facebook.com URL).
 *
 *   start page ──llfb-start──▶ save {port, token, tabId} → nextJob()
 *   nextJob(): GET /next → {done:true} → POST /finished {}
 *                        → job        → save job, navigate the same tab to job.url
 *   group page ──llfb-ready──▶ reply {job} if this tab has an active job, else {job:null}
 *   group page ──llfb-heartbeat──▶ POST /heartbeat
 *   group page ──llfb-result──▶ POST /result → nextJob()
 *   tab lands off /groups/ (login, checkpoint redirect) → report that status for the job.
 */
/* global chrome, importScripts, fetch, setTimeout, console */
importScripts('harvest-core.js');

const SESSION_KEY = 'llfb';
const GROUP_URL = /^https:\/\/www\.facebook\.com\/groups\//;
const OFF_GROUP_GRACE_MS = 8_000;

async function loadState() {
  const stored = await chrome.storage.session.get(SESSION_KEY);
  return stored[SESSION_KEY] ?? null;
}

async function saveState(state) {
  await chrome.storage.session.set({ [SESSION_KEY]: state });
}

async function api(state, method, path, body) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${state.port}${path}`, {
        method,
        headers: {
          'X-LLFB-Token': state.token,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (response.status === 403) throw new Error('receiver refused the token (403)');
      if (!response.ok) throw new Error(`receiver ${method} ${path} → ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (String(error?.message).includes('403')) break;
      await new Promise((resolve) => setTimeout(resolve, 1_000 * (attempt + 1)));
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

async function postResult(state, result) {
  const body = { ...result, v: 1, extVersion: chrome.runtime.getManifest().version };
  await api(state, 'POST', '/result', body);
}

async function nextJob() {
  const state = await loadState();
  if (!state || state.finished) return;
  let job;
  try {
    job = await api(state, 'GET', '/next');
  } catch (error) {
    console.warn('[llfb] /next failed', String(error?.message ?? error));
    return;
  }
  if (!job || job.done) {
    await saveState({ ...state, job: null, finished: true });
    await api(state, 'POST', '/finished', {}).catch((error) =>
      console.warn('[llfb] /finished failed', String(error?.message ?? error)),
    );
    return;
  }
  if (!GROUP_URL.test(String(job.url))) {
    await postResult(state, failedResult(job, 'job url is not a facebook group url')).catch(
      () => {},
    );
    return nextJob();
  }
  await saveState({ ...state, job: { ...job, dispatched: false, startedAtMs: null } });
  await chrome.tabs.update(state.tabId, { url: job.url });
}

async function finishJob(result) {
  const state = await loadState();
  if (!state?.job) return;
  await saveState({ ...state, job: null });
  try {
    await postResult(state, result);
  } catch (error) {
    console.warn('[llfb] /result failed', String(error?.message ?? error));
  }
  await nextJob();
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
    finished: false,
  });
  nextJob();
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
  finishJob(message.result);
  return { ok: true };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handlers = {
    'llfb-start': () => onStart(message, sender),
    'llfb-ready': () => onReady(sender),
    'llfb-heartbeat': () => onHeartbeat(message, sender),
    'llfb-result': () => onResult(message, sender),
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
  setTimeout(async () => {
    const latest = await loadState();
    if (!latest?.job || latest.job.dispatched || latest.job.slug !== slug) return;
    const status = globalThis.LLFB.classifyPage({ url });
    const host = url.replace(/[?#].*$/, '');
    if (status === 'ready') await finishJob(failedResult(latest.job, `landed off-group: ${host}`));
    else
      await finishJob({
        ...failedResult(latest.job, `redirected: ${host}`),
        status,
      });
  }, OFF_GROUP_GRACE_MS);
});
