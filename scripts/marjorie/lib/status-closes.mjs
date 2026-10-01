// One rolling PR carries every pending human-action close from the status page
// (issue #4665). Two owner replies a minute apart used to open two PRs that
// each rewrote the same "N open" header line, so the second sat CONFLICTING for
// good. Now there is a single bot-owned branch, `status-page/ha-closes`, that is
// always rebuilt from the tip of `main` plus the full list of pending closes:
// the list lives in the PR body (hidden `<!-- ha-close {json} -->` markers), the
// branch is a pure function of (main, list), and a force-push of that branch is
// the only force-push anywhere (never main, never a human's branch).
//
// `syncCloses` is the one entry point: the reply job calls it with `add` (the
// new close); the heal job calls it with none, hourly and on a push to main
// touching HUMAN-ACTIONS.md, so a branch main has moved under is rebuilt before it ever sits dirty.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { closeHumanAction } from '../ha-close.mjs';
import { HUMAN_ACTIONS_DONE_PATH, HUMAN_ACTIONS_PATH } from '../human-actions.mjs';

export const CLOSES_BRANCH = 'status-page/ha-closes';
export const NOTE_CAP = 450;
const SUMMARY_CAP = 140;
const MARKER = /<!-- ha-close (\{[^\n]*?\}) --!?>/g;
const MAX_PENDING = 40;
const TRUSTED_AUTHORS = new Set(['sffan15-sys', 'github-actions[bot]', 'github-actions', 'app/github-actions']);
const LEGACY_BRANCH = /^(?:status-page|marjorie)\/ha-close-\d+/;
const refMain = 'refs/remotes/origin/main';
const refBranch = `refs/remotes/origin/${CLOSES_BRANCH}`;

const flat = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const mentionSafe = (s) => String(s).replace(/(^|[^\w`])@(?=\w)/g, '$1@​');

/** A record read back from a PR body is untrusted text until it passes here. */
export function cleanRecord(r) {
  if (!r || !Number.isInteger(r.n) || r.n < 1) return null;
  if (!['done', 'skip'].includes(r.o)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.d || '')) return null;
  const note = flat(r.note, NOTE_CAP);
  if (!note) return null;
  return { n: r.n, o: r.o, d: r.d, note, by: flat(r.by || 'status page', 40), s: flat(r.s, SUMMARY_CAP) };
}

const marker = (r) => `<!-- ha-close ${JSON.stringify(r).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')} -->`;

/** Pending closes carried by a PR body, in order, de-duplicated by item number. */
export function recordsFromBody(body) {
  const out = [];
  for (const m of String(body || '').matchAll(MARKER)) {
    let rec = null;
    try { rec = cleanRecord(JSON.parse(m[1])); } catch { /* not ours */ }
    if (rec && !out.some((r) => r.n === rec.n)) out.push(rec);
  }
  return out.slice(0, MAX_PENDING);
}

export const closesTitle = (records) => `Close HA ${records.map((r) => `#${r.n}`).join(', ')} — owner replied on the status page`;

export function closesBody(records) {
  return [
    'The owner replied on the status page. This one rolling PR carries every pending close; it is rebuilt from `main` whenever main moves, so it never needs a hand-merge.',
    records.map((r) => `- #${r.n} — ${mentionSafe(r.s || r.o)}`).join('\n'),
    records.map(marker).join('\n'),
    'Tier-2: Marjorie — status page',
  ].join('\n\n');
}

/**
 * Is this open PR one of ours? The repo is PUBLIC: a title proves nothing, and a
 * fork can reuse a branch name. Accepted: a same-repo PR from the rolling branch,
 * or from an older per-item close branch (`status-page/ha-close-*`,
 * `marjorie/ha-close-*`) authored by the workflow bot or the owner.
 */
export function isOurClosePr(pr) {
  if (!pr || pr.fork) return false;
  if (pr.branch === CLOSES_BRANCH) return true;
  return LEGACY_BRANCH.test(pr.branch || '') && TRUSTED_AUTHORS.has(String(pr.author || '').toLowerCase());
}

/**
 * HA number -> { pr: { number, url }, summary } for every open close PR of ours:
 * the rolling one (records in its body) and any older per-item `Close HA #N` PR
 * (title only). Shape: { number, url, title, body, branch, author, fork }. Pure.
 */
export function pendingCloses(openPrs) {
  const out = new Map();
  for (const pr of openPrs || []) {
    if (!isOurClosePr(pr) || !/^close ha #\d+/i.test(pr.title || '')) continue;
    const ref = { number: pr.number, url: pr.url };
    const recs = recordsFromBody(pr.body);
    if (recs.length) {
      for (const r of recs) if (!out.has(r.n)) out.set(r.n, { pr: ref, summary: r.s });
      continue;
    }
    for (const m of String(pr.title).split(/\s+—\s+/)[0].matchAll(/#(\d+)/g)) {
      if (!out.has(Number(m[1]))) out.set(Number(m[1]), { pr: ref, summary: '' });
    }
  }
  return out;
}

/** The text a record shows on the page and in the ledger, built from the reply's verdict. */
export function recordFor({ number, outcome, verb, choice, date, url, by = 'status page' }) {
  const said = choice ? ` "${choice}"` : '';
  const how = verb === 'decided' ? `owner ${outcome === 'skip' ? 'skipped' : 'decided'}${said}`
    : verb === 'done' ? `owner said done${choice ? `: "${choice}"` : ''}`
    : `owner ${verb}${said}`;
  const summary = `${verb === 'decided' && outcome === 'skip' ? 'skipped' : verb}${choice ? `: ${choice}` : ''}`;
  return cleanRecord({ n: number, o: outcome, d: date, note: `status page ${url} — ${how}`, by, s: summary });
}

const tryRun = (run, cmd, args, opts) => {
  try { return String(run(cmd, args, opts) ?? ''); } catch { return null; }
};

/**
 * Rebuilds the rolling branch from main + every pending close (plus `add`) and
 * makes the PR match. `run(cmd, args, { env })` executes git/gh and returns
 * stdout (throws on failure). Returns
 *   { ok: true, number, url, merge, changed, records }   queued / refreshed
 *   { ok: true, duplicate: true, number, url }            `add` is already queued
 *   { ok: true, nothing: true }                           nothing pending
 *   { ok: false, reason }                                 `add` cannot be applied
 * and throws when git/gh keep failing, after `attempts` rebuilds (a concurrent
 * writer to the branch loses the force-with-lease and the loser just rebuilds).
 */
export async function syncCloses({ root, run, repo, prToken = '', add = null, log = console.log, io = { readFileSync, writeFileSync }, attempts = 3 }) {
  const prEnv = prToken ? { env: { GH_TOKEN: prToken } } : undefined;
  const openPath = path.join(root, HUMAN_ACTIONS_PATH);
  const donePath = path.join(root, HUMAN_ACTIONS_DONE_PATH);
  const files = [HUMAN_ACTIONS_PATH, HUMAN_ACTIONS_DONE_PATH];

  const once = async () => {
    run('git', ['fetch', '--quiet', '--depth=1', 'origin', `+refs/heads/main:${refMain}`]);
    if (tryRun(run, 'git', ['fetch', '--quiet', '--depth=1', 'origin', `+refs/heads/${CLOSES_BRANCH}:${refBranch}`]) === null) {
      tryRun(run, 'git', ['update-ref', '-d', refBranch]);
    }
    const listed = JSON.parse(String(run('gh', ['pr', 'list', '--repo', repo, '--state', 'open', '--json', 'number,url,title,body,headRefName,isCrossRepository,author', '--limit', '100'])).trim() || '[]')
      .map((p) => ({ number: p.number, url: p.url, title: p.title, body: p.body, branch: p.headRefName, author: p.author?.login || '', fork: Boolean(p.isCrossRepository) }));
    let pr = listed.find((p) => p.branch === CLOSES_BRANCH && !p.fork) || null;
    const existing = pr ? recordsFromBody(pr.body) : [];
    const queued = add && pendingCloses(listed).get(add.n);
    if (queued) return { ok: true, duplicate: true, number: queued.pr.number, url: queued.pr.url };
    const wanted = add ? [...existing, add] : existing;
    if (!wanted.length) return { ok: true, nothing: true };

    run('git', ['checkout', '--quiet', '-B', CLOSES_BRANCH, refMain]);
    let open = io.readFileSync(openPath, 'utf8');
    let done = io.readFileSync(donePath, 'utf8');
    const kept = [];
    for (const r of wanted) {
      const res = closeHumanAction(open, done, { number: r.n, date: r.d, note: r.note, by: r.by, outcome: r.o, noteCap: NOTE_CAP });
      if (!res.ok) {
        if (add && r.n === add.n) return { ok: false, reason: res.reason };
        log(`status closes: dropping #${r.n} — ${res.reason}`);
        continue;
      }
      open = res.open;
      done = res.done;
      io.writeFileSync(openPath, open);
      io.writeFileSync(donePath, done);
      run('git', ['add', ...files]);
      run('git', ['commit', '--quiet', '-m', `Close HA #${r.n} — owner replied on the status page`, '-m', r.note]);
      kept.push(r);
    }
    if (!kept.length) {
      if (pr) {
        // A reply may have added a close since we listed; closing now would drop it. Re-read, and leave the PR alone if anything is new (or unreadable).
        const fresh = tryRun(run, 'gh', ['pr', 'view', String(pr.number), '--repo', repo, '--json', 'body']);
        let seen = null;
        try { seen = recordsFromBody(JSON.parse(fresh).body); } catch { /* cannot verify: do not close */ }
        if (!seen || seen.some((r) => !existing.some((e) => e.n === r.n))) return { ok: true, nothing: true, raced: true };
        tryRun(run, 'gh', ['pr', 'close', String(pr.number), '--repo', repo, '--comment', 'Every item this PR carried is already closed on main.'], prEnv);
      }
      return { ok: true, nothing: true };
    }

    const tip = (tryRun(run, 'git', ['rev-parse', '--verify', '--quiet', refBranch]) || '').trim();
    const differs = !tip || String(run('git', ['diff', '--name-only', 'HEAD', refBranch, '--', ...files])).trim() !== '';
    const title = closesTitle(kept);
    const body = closesBody(kept);
    if (pr && (body !== closesBody(existing) || title !== closesTitle(existing))) {
      // Body first, push second: a writer that reads the list between the two sees
      // the new close and rebuilds it into the branch, so the two can never disagree for good.
      try {
        run('gh', ['pr', 'edit', String(pr.number), '--repo', repo, '--title', title, '--body', body], prEnv);
      } catch {
        pr = null;
      }
    }
    if (differs || !pr) {
      try {
        run('git', ['push', `--force-with-lease=refs/heads/${CLOSES_BRANCH}:${tip}`, 'origin', `HEAD:refs/heads/${CLOSES_BRANCH}`]);
      } catch (err) {
        err.retry = true;
        throw err;
      }
    }
    let merge = 'auto-merges when checks pass';
    const enableAutoMerge = (target) => {
      try {
        run('gh', ['pr', 'merge', target, '--repo', repo, '--squash', '--auto'], prEnv);
      } catch {
        merge = 'auto-merge was refused — merge it by hand';
      }
    };
    if (!pr) {
      const url = String(run('gh', ['pr', 'create', '--repo', repo, '--head', CLOSES_BRANCH, '--base', 'main', '--title', title, '--body', body], prEnv)).trim().split(/\s+/).pop();
      enableAutoMerge(url);
      return { ok: true, url, merge, changed: true, records: kept };
    }
    enableAutoMerge(String(pr.number));
    return { ok: true, number: pr.number, url: pr.url, merge, changed: differs, records: kept };
  };

  for (let attempt = 1; ; attempt += 1) {
    try {
      return await once();
    } catch (err) {
      if (!err?.retry || attempt >= attempts) throw err;
      log(`status closes: push lost a race, rebuilding (attempt ${attempt + 1} of ${attempts})`);
    }
  }
}
