// Read-only view of the open `social-draft` PRs — the one place a draft that
// is not yet on main exists. Shared by the daily pre-compute (the photo ledger
// must see these drafts) and the stale-draft sweep (retire-stale-drafts.mjs).
// `runGh(args) -> stdout` is injected so tests never spawn `gh`.

export const DRAFT_LABEL = 'social-draft';
export const STALE_DRAFT_HOURS = 48;
const QUEUE_PATH_RE = /^social\/queue\/[A-Za-z0-9_.-]+\.json$/;

function parse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

const FIELDS = 'number,createdAt,headRefOid,labels,files,statusCheckRollup,state';

const toDraftPr = (pr) => ({
  number: pr.number,
  createdAt: pr.createdAt,
  headRefOid: pr.headRefOid,
  state: pr.state ?? 'OPEN',
  labels: (pr.labels ?? []).map((l) => l.name),
  queuePaths: (pr.files ?? []).map((f) => f.path).filter((p) => QUEUE_PATH_RE.test(p)),
  failingChecks: (pr.statusCheckRollup ?? []).filter((c) => (c.conclusion ?? c.state) === 'FAILURE').map((c) => c.name ?? c.context),
});

/** Open social-draft PRs with their changed files and head commit. */
export function listOpenDraftPrs(runGh) {
  return parse(runGh(['pr', 'list', '--label', DRAFT_LABEL, '--state', 'open', '--limit', '60', '--json', FIELDS]), []).map(toDraftPr);
}

/** One PR re-read fresh (labels, head, files, checks); null when it is gone, closed or unreadable. */
export function readDraftPr(runGh, number) {
  const pr = parse(runGh(['pr', 'view', String(number), '--json', FIELDS]), null);
  return pr && pr.state === 'OPEN' ? toDraftPr(pr) : null;
}

/** Parsed queue items of one PR, read at its head commit; `data: null` when unreadable. */
export function readPrQueueItems(runGh, repo, pr) {
  return pr.queuePaths.map((path) => {
    try {
      const raw = parse(runGh(['api', `repos/${repo}/contents/${path}?ref=${pr.headRefOid}`]), null);
      const data = raw?.content ? parse(Buffer.from(raw.content, 'base64').toString('utf8'), null) : null;
      return { ref: `PR #${pr.number} ${path}`, path, data };
    } catch {
      return { ref: `PR #${pr.number} ${path}`, path, data: null };
    }
  });
}

/**
 * Why `pr` should be retired, or null. Three dead shapes, all found on the six
 * drafts open 2026-09-30 (W8), all older than `hours`, none on hold:
 *  - nothing left: every queue file was removed from the PR (all rejected);
 *  - never approved: no file carries a signed `approval`;
 *  - approved but stranded: every file is stamped, the newest stamp is older than
 *    `hours`, and a check is red — a rejected sibling's removal leaves a lone
 *    half that check-drafts' pair rule refuses, so the poll can never merge it.
 * A partly-stamped PR, or any file unreadable, is left to the poll (fail closed).
 * Mirrors the poster's 48h rule, which never reaches an UNMERGED draft.
 */
export function staleReason(pr, items, nowMs, hours = STALE_DRAFT_HOURS) {
  if (pr.labels.includes('hold')) return null;
  const ageH = Math.floor((nowMs - Date.parse(pr.createdAt)) / 3_600_000);
  if (!(ageH > hours)) return null;
  if (pr.queuePaths.length === 0) return `open ${ageH}h and every draft was removed from it (all rejected) — nothing is left to approve`;
  if (items.length === 0 || items.some((i) => i.data === null)) return null;
  const stamped = items.filter((i) => i.data.approval);
  if (stamped.length === 0) return `open ${ageH}h with no founder approval stamp`;
  if (stamped.length < items.length) return null;
  const newestStamp = Math.max(...stamped.map((i) => Date.parse(i.data.approval.at)));
  const stampAgeH = Math.floor((nowMs - newestStamp) / 3_600_000);
  if (Number.isFinite(stampAgeH) && stampAgeH > hours && pr.failingChecks.length > 0) {
    return `approved ${stampAgeH}h ago but still unmerged (${pr.failingChecks.join(', ')} failing — typically a rejected sibling left a lone half the pair rule refuses)`;
  }
  return null;
}
