// Claim-before-create for L1 ask filing (#4260).
//
// Issue LISTS lag a create by seconds, so list-then-create can double-file.
// The uniqueness store is instead a repo label `loop-claim:<key>`: label
// names are unique per repo and read back at once, so a repeat create is a
// 422 and exactly one caller wins. The label description is the claim's
// state: `claimed <ISO> run <owner>` while pending, `issue #N at <ISO>` once
// the winner has created the issue (the receipt).
//
// Stuck claims heal themselves (nobody deletes a label by hand):
//  - the winner releases its claim if `gh issue create` throws;
//  - a pending claim older than STALE_CLAIM_MS with no filing in the list is
//    taken over (PATCH own id, settle, re-read, own id must be present);
//  - receipts older than SWEEP_AFTER_MS are swept. Deleting right after the
//    create is NOT done: list visibility lag has no proven maximum, and the
//    claim is the only guard inside that window, so cleanup is a bounded
//    sweep (a few label pages, at most once per ask filed).
import { randomBytes } from 'node:crypto';
import { apiFor, listIssuesByLabels, toGhShape } from './issues-rest.mjs';

export const CLAIM_PREFIX = 'loop-claim:';
export const STALE_CLAIM_MS = 10 * 60_000;
export const SWEEP_AFTER_MS = 24 * 3_600_000;
const RECEIPT_RE = /^issue #(\d+)(?: at (\S+))?$/;
const PENDING_RE = /^claimed (\S+) run (\S+)$/;
const SWEEP_PAGES = 3;

/** Bounds a call so a hang can never eat a whole delivery's timeout budget. */
export function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const sleepMs = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
const labelPath = (repo, key) => `repos/${repo}/labels/${encodeURIComponent(CLAIM_PREFIX + key)}`;
const errText = (err) => [err?.message, err?.stdout, err?.stderr].map(String).join(' ');
const warn = (msg) => console.log(`::warning::loop-asks: ${msg}`);
const iso = (ms) => new Date(ms).toISOString();

export function newOwner() {
  return `${process.env.GITHUB_RUN_ID || 'local'}-${randomBytes(3).toString('hex')}`;
}

const pendingText = (owner, ms) => `claimed ${iso(ms)} run ${owner}`;

/** True for a pending claim older than `staleMs` (an unparsable one counts as stale); a receipt never is. */
export function isStale(description, nowMs, staleMs = STALE_CLAIM_MS) {
  const text = String(description ?? '');
  if (RECEIPT_RE.test(text)) return false;
  const ts = Date.parse(text.match(PENDING_RE)?.[1] ?? '');
  return Number.isNaN(ts) || nowMs - ts > staleMs;
}

/** Atomic claim: true when this caller won, false when the key was already claimed. */
export async function claimKey(gh, repo, key, { owner, nowMs, timeoutMs }) {
  const args = ['api', '-X', 'POST', `repos/${repo}/labels`, '-f', `name=${CLAIM_PREFIX}${key}`, '-f', 'color=ededed', '-f', `description=${pendingText(owner, nowMs)}`];
  try {
    await withTimeout(gh(args), timeoutMs, 'gh claim');
    return true;
  } catch (err) {
    if (/already_exists|HTTP 422|Validation Failed/i.test(errText(err))) return false;
    throw err;
  }
}

/** Writes the created issue number onto the claim, so a retry resolves it by exact number. */
export async function recordReceipt(gh, repo, key, number, { nowMs, timeoutMs }) {
  const args = ['api', '-X', 'PATCH', labelPath(repo, key), '-f', `description=issue #${number} at ${iso(nowMs)}`];
  await withTimeout(gh(args), timeoutMs, 'gh claim receipt');
}

/** Frees a claim. Never throws: a failed release just leaves a claim the stale takeover heals. */
export async function releaseClaim(gh, repo, key, timeoutMs = 30_000) {
  try {
    await withTimeout(gh(['api', '-X', 'DELETE', labelPath(repo, key)]), timeoutMs, 'gh claim release');
  } catch (err) {
    warn(`could not release claim ${CLAIM_PREFIX}${key}: ${errText(err).split('\n')[0].slice(0, 160)}`);
  }
}

/** The claim label, or null when it does not exist (404). */
async function readClaim(gh, repo, key, timeoutMs) {
  try {
    return await withTimeout(apiFor(gh)(`/${labelPath(repo, key)}`), timeoutMs, 'gh api claim');
  } catch (err) {
    if (/HTTP 404|Not Found/i.test(errText(err))) return null;
    throw err;
  }
}

const listRows = (gh, repo, side, timeoutMs) => withTimeout(
  listIssuesByLabels(apiFor(gh), { repo, labels: [side.filedLabel, side.deskLabel], state: 'all' }),
  timeoutMs, 'gh api issues',
);

/** Positive evidence of an existing filing: the receipt (verified by exact
 * issue number via `deps.verify`) or a list hit (`deps.find`). An empty list
 * is not evidence. */
export async function resolveClaim(gh, repo, key, side, deps, timeoutMs) {
  const label = await readClaim(gh, repo, key, timeoutMs);
  const n = Number(String(label?.description ?? '').match(RECEIPT_RE)?.[1]);
  if (n) {
    const issue = toGhShape(await withTimeout(apiFor(gh)(`/repos/${repo}/issues/${n}`), timeoutMs, 'gh api issue'));
    if (deps.verify(issue)) return { found: issue, label };
  }
  return { found: deps.find(await listRows(gh, repo, side, timeoutMs)), label };
}

/** Last writer wins, so write our id, let a concurrent taker settle, re-read, and require our id. */
export async function takeOver(gh, repo, key, { owner, nowMs, timeoutMs, settleMs, sleep }) {
  await withTimeout(gh(['api', '-X', 'PATCH', labelPath(repo, key), '-f', `description=${pendingText(owner, nowMs)}`]), timeoutMs, 'gh claim takeover');
  await sleep(settleMs);
  const label = await readClaim(gh, repo, key, timeoutMs);
  return String(label?.description ?? '').match(PENDING_RE)?.[2] === owner;
}

/** Acquire the right to create: `{ owner }` when this caller must create, `{ existing }` when a
 * filing already exists. Throws when a held claim cannot be resolved yet (callers warn). */
export async function acquireClaim(gh, repo, key, side, deps, opts) {
  const { timeoutMs, claimWaitMs, sleep = sleepMs, now = Date.now, staleClaimMs = STALE_CLAIM_MS, settleMs = 1_500 } = opts;
  const owner = newOwner();
  if (await claimKey(gh, repo, key, { owner, nowMs: now(), timeoutMs })) return { owner };
  const deadline = now() + claimWaitMs;
  for (;;) {
    const { found, label } = await resolveClaim(gh, repo, key, side, deps, timeoutMs);
    if (found) return { existing: found };
    if (!label) {
      if (await claimKey(gh, repo, key, { owner, nowMs: now(), timeoutMs })) return { owner };
    } else if (isStale(label.description, now(), staleClaimMs)) {
      const again = deps.find(await listRows(gh, repo, side, timeoutMs));
      if (again) return { existing: again };
      if (await takeOver(gh, repo, key, { owner, nowMs: now(), timeoutMs, settleMs, sleep })) return { owner };
    }
    if (now() >= deadline) break;
    await sleep(2_000);
  }
  throw new Error(`claim ${CLAIM_PREFIX}${key} is held and no filing is visible yet; not creating a possible duplicate (it is taken over automatically once it is ${Math.round(staleClaimMs / 60_000)} min old)`);
}

/** Runs `gh issue create` for the claim holder, then records the receipt. A create that throws
 * releases the claim so the next run files it; a timeout leaves the outcome unknown (the issue
 * may exist), so that claim is kept and the stale takeover re-checks the list. */
export async function createFiling(gh, repo, key, args, { nowMs, timeoutMs }) {
  let created;
  try {
    created = await withTimeout(gh(args), timeoutMs, 'gh issue create');
  } catch (err) {
    if (!/timed out/.test(String(err?.message))) await releaseClaim(gh, repo, key, timeoutMs);
    throw err;
  }
  const url = String(created.stdout ?? '').trim().split(/\s+/).pop() ?? '';
  const number = Number(url.match(/\/issues\/(\d+)$/)?.[1]);
  if (!number) throw new Error(`gh issue create printed no issue URL: ${created.stdout}`);
  try {
    await recordReceipt(gh, repo, key, number, { nowMs, timeoutMs });
  } catch (err) {
    warn(`filed #${number} but could not record its receipt: ${errText(err).split('\n')[0].slice(0, 160)}`);
  }
  return { number, url };
}

/** Deletes receipts older than SWEEP_AFTER_MS whose issue exists. Best effort, never throws. */
export async function sweepClaims(gh, repo, { nowMs, timeoutMs }) {
  try {
    const api = apiFor(gh);
    for (let page = 1; page <= SWEEP_PAGES; page += 1) {
      const batch = (await withTimeout(api(`/repos/${repo}/labels?per_page=100&page=${page}`), timeoutMs, 'gh api labels')) || [];
      for (const label of Array.isArray(batch) ? batch : []) {
        if (!String(label?.name).startsWith(CLAIM_PREFIX)) continue;
        const m = String(label.description ?? '').match(RECEIPT_RE);
        if (!m?.[2] || nowMs - Date.parse(m[2]) <= SWEEP_AFTER_MS) continue;
        const issue = await withTimeout(api(`/repos/${repo}/issues/${m[1]}`), timeoutMs, 'gh api issue');
        if (Number(issue?.number) === Number(m[1])) await releaseClaim(gh, repo, label.name.slice(CLAIM_PREFIX.length), timeoutMs);
      }
      if (!Array.isArray(batch) || batch.length < 100) break;
    }
  } catch (err) {
    warn(`claim sweep skipped: ${errText(err).split('\n')[0].slice(0, 160)}`);
  }
}
