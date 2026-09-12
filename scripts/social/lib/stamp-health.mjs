// The safety axis of the S3 approval mechanism (docs/decisions.md
// 2026-09-12), in one place: does a v3 stamp still COVER what is on the
// branch at `head`? Two callers, one implementation, on purpose:
//   - social-approval-poll.mjs, WITH the signing key — decides what may
//     mint and what may merge;
//   - filter-already-stamped.mjs (social-approval-notify.yml), WITHOUT the
//     key (shape+id+hash only, as that workflow always checked) — decides
//     which drafts still need a brief. "Has this exact content already
//     been shown?" and "does this content's stamp still cover it?" are
//     different questions; the notifier used to ask only the first, and
//     when every draft was content-valid it suppressed the whole prompt —
//     header included — which starved the poll's own recovery path (a
//     fresh ✅ on the newest header). PR #4139 round 4.
// Plumbing only (`git show`, `git diff`): never checks anything out, never
// disturbs whatever branch the caller has or hasn't checked out.
import { pollOwnFieldChange } from './feedback.mjs';
import { approvalStatus, stampedSha } from './queue.mjs';

export function isQueueJson(p) {
  return p.startsWith('social/queue/') && p.endsWith('.json');
}

export function parseJson(text) {
  if (text === null || text === undefined || text === '') return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function short(sha) {
  return String(sha).slice(0, 7);
}

/**
 * One instance per PR per run. A shallow CI checkout (actions/checkout's
 * default) may not hold an older commit's objects yet, so history is
 * fetched lazily, once, bounded (`--depth=100` of the PR's own head ref; a
 * single-SHA fetch as the fallback); anything still unreadable FAILS
 * CLOSED — "can't read it" is "can't clear it", never a crash and never a
 * pass. (For the notifier that direction is fail-OPEN for briefing: an
 * unreadable stamp is re-briefed, which is the harmless way to be wrong.)
 */
export function makeGitState(execGit, pr) {
  let historyFetched = null;
  const diffCache = new Map();
  const showCache = new Map();

  function ensureHistory() {
    if (historyFetched === null) {
      try {
        execGit(['fetch', '--depth=100', 'origin', `pull/${pr}/head`]);
        historyFetched = true;
      } catch (err) {
        console.error(`::warning::stamp-health: PR #${pr} — could not fetch history (pull/${pr}/head): ${err.message}`);
        historyFetched = false;
      }
    }
    return historyFetched;
  }

  /** `<sha>:<relPath>` or null when absent/unreadable. */
  function show(sha, relPath) {
    const key = `${sha}:${relPath}`;
    if (showCache.has(key)) return showCache.get(key);
    let content = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        content = execGit(['show', `${sha}:${relPath}`]);
        break;
      } catch {
        if (attempt === 0 && historyFetched === null) ensureHistory();
        else break;
      }
    }
    showCache.set(key, content);
    return content;
  }

  /** `git diff --name-only from to` as a path list, or null if unreadable. */
  function changedPaths(from, to) {
    if (from === to) return [];
    const key = `${from}..${to}`;
    if (diffCache.has(key)) return diffCache.get(key);
    let paths;
    const attempt = () => execGit(['diff', '--name-only', from, to]).split('\n').filter(Boolean);
    ensureHistory();
    try {
      paths = attempt();
    } catch {
      try {
        execGit(['fetch', '--depth=1', 'origin', from]);
        paths = attempt();
      } catch {
        paths = null;
      }
    }
    diffCache.set(key, paths);
    return paths;
  }

  /** Every path changed between `from` and `to` must be a queue file that is
   * absent at `to` (a deletion cannot publish unseen content) or validly
   * stamped at `to`. `offending` names every path that isn't.
   * `statusOptions` is passed straight to approvalStatus — with `key` for
   * the poll, without it for the notifier. */
  function cleanSince(from, to, statusOptions) {
    const changed = changedPaths(from, to);
    if (changed === null) {
      return { ok: false, changed: null, offending: [{ path: `${short(from)}..${short(to)}`, why: 'history unreadable this run — nothing is cleared on an unreadable diff' }] };
    }
    const offending = [];
    for (const p of changed) {
      if (!isQueueJson(p)) {
        offending.push({ path: p, why: 'changed on the branch but is not a social/queue/**.json draft — nobody approved it' });
        continue;
      }
      const content = show(to, p);
      if (content === null) continue; // deleted — safe by construction
      const item = parseJson(content);
      const status = item ? approvalStatus(item, statusOptions) : { ok: false, reason: 'unparseable' };
      if (!status.ok) offending.push({ path: p, why: `changed on the branch and is not validly stamped there (${status.reason})` });
    }
    return { ok: offending.length === 0, changed, offending };
  }

  /** F's own bytes at `from` vs `to` differ only in approval/body/edit. */
  function selfClean(relPath, from, to) {
    if (from === to) return { ok: true };
    const fromItem = parseJson(show(from, relPath));
    const toItem = parseJson(show(to, relPath));
    if (!fromItem || !toItem) return { ok: false, why: `${relPath} could not be read at both ${short(from)} and ${short(to)} — nothing is cleared on an unreadable file` };
    if (!pollOwnFieldChange(fromItem, toItem)) return { ok: false, why: `${relPath} changed outside approval/body/edit since its stamp at ${short(from)} — nobody approved that change` };
    return { ok: true };
  }

  return { show, changedPaths, cleanSince, selfClean };
}

/** Is F's current stamp good to merge as-is? `stamped` distinguishes "no
 * stamp yet" (normal, nothing to report) from "has a stamp that can't
 * merge" (worth a notice / a fresh brief). */
export function stampHealth(gitState, relPath, item, head, statusOptions) {
  if (!item?.approval) return { ok: false, stamped: false, problems: [] };
  const status = approvalStatus(item, statusOptions);
  if (!status.ok) return { ok: false, stamped: true, problems: [{ path: relPath, why: `its approval is invalid (${status.reason})` }] };
  const sha = stampedSha(item);
  if (!sha) return { ok: false, stamped: true, problems: [{ path: relPath, why: 'its approval predates the SHA-signed (v3) stamp format — a fresh ✅ re-mints it' }] };
  const since = gitState.cleanSince(sha, head, statusOptions);
  if (!since.ok) return { ok: false, stamped: true, problems: since.offending };
  const self = gitState.selfClean(relPath, sha, head);
  if (!self.ok) return { ok: false, stamped: true, problems: [{ path: relPath, why: self.why }] };
  return { ok: true, stamped: true, problems: [] };
}

/**
 * The notifier's filter: which manifest drafts (`{ file: <relPath>, ...
 * fields, approval }`) still need a brief. A draft is dropped only when its
 * stamp still COVERS `head` (content-valid AND clean-since AND self-clean);
 * everything else — unstamped, v2, drifted in an unhashed field, a
 * non-queue path changed, history unreadable — is kept, so the founder
 * sees a fresh header to ✅. Without `head`/`gitState` (a caller that
 * cannot reach git) it degrades to the content-only check, which is the
 * pre-2026-09-12 behaviour and cannot see drift.
 */
export function filterAlreadyStamped(drafts, { head, gitState, approvers }) {
  const statusOptions = { approvers };
  if (!head || !gitState) return drafts.filter((d) => !approvalStatus(d, statusOptions).ok);
  return drafts.filter((d) => !stampHealth(gitState, d.file, d, head, statusOptions).ok);
}
