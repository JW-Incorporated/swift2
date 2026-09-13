// L1 — the Tree/Marjorie loop (docs/specs/marjorie-overhaul/l1-loop.md).
//
// Asks travel between Tree's Monday brief and Marjorie's daily brief as
// GitHub issues. An agent only ever writes an ask into its fixed slot
// (`needsFromMarjorie` in calendar.brief.json; the `- For Tree:` line in the
// brief issue body). Everything after that — parsing the slot, finding a
// prior filing, filing, rendering brief lines — is this module, run from a
// plain `run:` step on the workflow token. Never an agent judging a marker.
import { createHash } from 'node:crypto';
import { gh as ghRun } from '../../lib/gh.mjs';
import { listIssuesByLabels } from './issues-rest.mjs';

export const REPO = 'JW-Incorporated/swift2';
const DAY_MS = 86_400_000;
const MAX_ASK_CHARS = 300;

export const SIDES = {
  tree: {
    from: 'Tree', to: 'Marjorie', filedLabel: 'tree-filed', deskLabel: 'desk:ops', max: 2,
    trailer: 'Tier-2: Tree — weekly social plan',
  },
  marjorie: {
    from: 'Marjorie', to: 'Tree', filedLabel: 'marjorie-filed', deskLabel: 'desk:tree', max: 1,
    trailer: "Tier-2: Marjorie — 6 AM Founders' Brief",
  },
};

// Asks addressed TO a bot were filed by the other side.
const ADDRESSED_TO = { marjorie: SIDES.tree, tree: SIDES.marjorie };

// Both filers are `run:` steps on `secrets.GITHUB_TOKEN`, so a filing's
// author is one absolute login whichever credential later reads it —
// unlike `viewerDidAuthor`, which is relative to the reader and cost M2/M3
// three fixes (#4225, #4238). `gh --json author` reports `app/github-actions`;
// the REST fallback in scripts/lib/gh.mjs reports `github-actions[bot]`.
export const FILER_LOGINS = new Set(['app/github-actions', 'github-actions[bot]', 'github-actions']);

export const FOR_TREE_PLACEHOLDER = '- For Tree: —';
const TREE_HEADING = '**Tree**';
const FOR_TREE_RE = /^- For Tree: ?(.*)$/;
const EMPTY_ASK_RE = /^(—|-|none\.?|nothing( today)?\.?)?$/i;
const CONTRADICTS_RE = /\s*\(contradicts #(\d+)\)\s*$/i;
// Only the exact suffix rewriteForTreeLine generates, anchored at end of
// line — arrow text inside an ask (e.g. "#4200 → #4300") must never read as
// already filed.
const FILED_RE = / → \[#(\d+)\]\(<[^()<>]+\/issues\/\1>\)(?: ⚠️ contradicts #\d+ — your call)?$/;
const MARKER_RE = /<!-- loop-ask: ([a-z0-9-]+)(?: contradicts=(\d+))? -->/g;
const TITLE_PREFIX_RE = /^(Tree|Marjorie) → (Tree|Marjorie): /;

/** The `- For Tree:` line's index, but only inside the **Tree** section (the
 * heading until the next `**`-heading line) — a "- For Tree:" quoted
 * elsewhere in the body (an earlier day's ask, a different section) must
 * never be mistaken for the real slot. Shared so parseMarjorieAsk and
 * rewriteForTreeLine always agree on which line that is. */
function forTreeSlotIndex(lines) {
  const start = lines.findIndex((l) => stripCr(l) === TREE_HEADING);
  if (start === -1) return -1;
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = stripCr(lines[i]);
    if (line.startsWith('**')) return -1;
    if (FOR_TREE_RE.test(line)) return i;
  }
  return -1;
}

// A brief body can arrive with CRLF endings (Codex round 2): match on the
// line without its CR, and keep the CR when rewriting so endings don't change.
const CR = String.fromCharCode(13);
function stripCr(line) {
  return line.endsWith(CR) ? line.slice(0, -1) : line;
}

/** Ask/why text is rendered into an issue body BEFORE the canonical marker
 * this module appends after it — neutralizing a comment opener keeps ask
 * text from forging an earlier `<!-- loop-ask: ... -->` that `parseMarker`
 * could pick up instead of the real one. */
function neutralizeMarker(text) {
  return String(text ?? '').replace(/<!--/g, '&lt;!--');
}

/** Bounds a `gh` call so a hang can never eat a whole delivery's timeout
 * budget — `gh()` in scripts/lib/gh.mjs has no timeout on its REST fallback
 * path, so this races the call itself rather than passing one through. */
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  // Cleared on settle: a pending 30 s timer would otherwise hold the process
  // open long after a fast filing finished (Codex round 2).
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function clean(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

function positiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** `@login` → `@` + zero-width space + `login`, so quoting a login in an ask never pings it. */
export function neutralizeAt(text) {
  return String(text ?? '').replace(/@(?=[A-Za-z0-9-])/g, '@\u200b');
}

/** Tree's asks from calendar.brief.json. Entries without ask text are
 * counted as `invalid`; valid ones past the cap are counted as `overCap`
 * and not filed — the brief says so rather than dropping them silently. */
export function parseTreeAsks(plan) {
  const raw = Array.isArray(plan?.needsFromMarjorie) ? plan.needsFromMarjorie : [];
  const valid = [];
  let invalid = 0;
  for (const entry of raw) {
    const ask = truncate(clean(entry?.ask), MAX_ASK_CHARS);
    if (!ask) {
      invalid += 1;
      continue;
    }
    valid.push({ ask, why: truncate(clean(entry?.why), MAX_ASK_CHARS), contradicts: positiveInt(entry?.contradicts) });
  }
  const { max } = SIDES.tree;
  return { asks: valid.slice(0, max), overCap: Math.max(valid.length - max, 0), invalid };
}

/** Marjorie's ask from the brief body's first `- For Tree:` line.
 * `filed` is set when the line was already rewritten with an issue number. */
export function parseMarjorieAsk(body) {
  const lines = String(body ?? '').split('\n');
  const idx = forTreeSlotIndex(lines);
  if (idx === -1) return { line: null, ask: null, filed: null };
  const line = stripCr(lines[idx]);
  const rest = line.match(FOR_TREE_RE)[1].trim();
  const filed = rest.match(FILED_RE);
  if (filed) return { line, ask: null, filed: Number(filed[1]) };
  const contradicts = rest.match(CONTRADICTS_RE);
  const text = truncate(clean(contradicts ? rest.slice(0, contradicts.index) : rest), MAX_ASK_CHARS);
  if (EMPTY_ASK_RE.test(text)) return { line, ask: null, filed: null };
  return { line, ask: { ask: text, why: '', contradicts: contradicts ? Number(contradicts[1]) : null }, filed: null };
}

/** Stable per source + ask text: a re-dispatch refiles nothing, an edited
 * ask files anew. */
export function askKey(side, sourceNumber, askText) {
  const hash = createHash('sha1').update(clean(askText).toLowerCase()).digest('hex').slice(0, 8);
  return `${side}-${Number(sourceNumber) || 0}-${hash}`;
}

export function renderMarker(key, contradicts) {
  return `<!-- loop-ask: ${key}${contradicts ? ` contradicts=${contradicts}` : ''} -->`;
}

export function parseMarker(body) {
  // The canonical marker is always rendered LAST (after all ask/why text),
  // so the last match in the body is the real one — never the first, which
  // ask text could forge.
  const matches = [...String(body ?? '').matchAll(MARKER_RE)];
  const m = matches[matches.length - 1];
  return m ? { key: m[1], contradicts: m[2] ? Number(m[2]) : null } : null;
}

function isLoopFiling(issue) {
  return FILER_LOGINS.has(issue?.author?.login) && parseMarker(issue?.body) !== null;
}

/** The prior filing for `key`, trusted only when the workflow token wrote it. */
export function findFiled(issues, key) {
  return (issues || []).find((i) => isLoopFiling(i) && parseMarker(i.body).key === key) || null;
}

function contradictsSuffix(n) {
  return n ? ` ⚠️ contradicts #${n} — your call` : '';
}

export function renderIssue(sideName, ask, { key, sourceUrl }) {
  const side = SIDES[sideName];
  const text = neutralizeMarker(neutralizeAt(ask.ask));
  const body = [
    `**${side.from} asks ${side.to}:** ${text}`,
    ask.why ? `**Why:** ${neutralizeMarker(neutralizeAt(ask.why))}` : null,
    ask.contradicts
      ? `⚠️ **Contradicts #${ask.contradicts}.** Neither bot settles this — a founder decides which one stands.`
      : null,
    `From: ${sourceUrl}`,
    `**${side.to}:** if it's inside your charter, do it, comment what you did, and close this. If you can't or shouldn't, comment why in one sentence and leave it open — it keeps showing in both briefs until it closes.`,
    renderMarker(key, ask.contradicts),
    side.trailer,
  ].filter(Boolean).join('\n\n');
  return { title: `${side.from} → ${side.to}: ${truncate(text, 90)}`, body, labels: [side.filedLabel, side.deskLabel] };
}

/** Files one ask, or returns the existing filing for the same key. */
export async function fileAsk(sideName, ask, { sourceNumber, sourceUrl, repo = REPO, gh = ghRun, timeoutMs = 30_000 }) {
  const side = SIDES[sideName];
  const key = askKey(sideName, sourceNumber, ask.ask);
  // Both labels, 200-issue window, and the REST issues list rather than
  // `gh issue list` — that reads the search index, which missed a 1 s-old
  // filing live and let a duplicate through (#4253).
  const rows = await withTimeout(
    listIssuesByLabels(gh, { repo, labels: [side.filedLabel, side.deskLabel], state: 'all' }),
    timeoutMs, 'gh api issues',
  );
  const existing = findFiled(rows, key);
  if (existing) return { number: existing.number, url: existing.url, created: false, ask };

  const { title, body, labels } = renderIssue(sideName, ask, { key, sourceUrl });
  const args = ['issue', 'create', '--repo', repo, '--title', title, '--body', body];
  for (const label of labels) args.push('--label', label);
  const created = await withTimeout(gh(args), timeoutMs, 'gh issue create');
  const url = String(created.stdout ?? '').trim().split(/\s+/).pop() ?? '';
  const number = Number(url.match(/\/issues\/(\d+)$/)?.[1]);
  if (!number) throw new Error(`gh issue create printed no issue URL: ${created.stdout}`);
  return { number, url, created: true, ask };
}

/** `- For Tree: <ask> → [#N](<url>)`, idempotent under parseMarjorieAsk.
 * Rewrites the same section-bounded slot parseMarjorieAsk reads — never a
 * global first match. */
export function rewriteForTreeLine(body, filing) {
  const lines = String(body).split('\n');
  const idx = forTreeSlotIndex(lines);
  if (idx === -1) return String(body);
  lines[idx] = `- For Tree: ${neutralizeAt(filing.ask.ask)} → [#${filing.number}](<${filing.url}>)${contradictsSuffix(filing.ask.contradicts)}${lines[idx].endsWith(CR) ? CR : ''}`;
  return lines.join('\n');
}

export const INCOMING_JSON_FIELDS = 'number,title,url,body,author,labels,state,createdAt,closedAt';

/** Loop asks addressed to `bot` ('tree' | 'marjorie'), oldest first: open
 * ones, plus ones closed within `closedWithinDays` when that is > 0. Only
 * real loop filings count — a `marjorie-filed` build-desk ticket never
 * shows up as an ask for Tree. */
export function selectAsksFor(bot, issues, { now = Date.now(), closedWithinDays = 0 } = {}) {
  const side = ADDRESSED_TO[bot];
  return (issues || [])
    .filter((i) => (i.labels || []).some((l) => l.name === side.deskLabel))
    .filter(isLoopFiling)
    .filter((i) => {
      if (String(i.state).toUpperCase() === 'OPEN') return true;
      return closedWithinDays > 0 && i.closedAt && now - Date.parse(i.closedAt) <= closedWithinDays * DAY_MS;
    })
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export async function fetchAsksFor(bot, { repo = REPO, gh = ghRun, state = 'open', timeoutMs = 30_000 } = {}) {
  const side = ADDRESSED_TO[bot];
  return withTimeout(
    listIssuesByLabels(gh, { repo, labels: [side.filedLabel, side.deskLabel], state }),
    timeoutMs, 'gh api issues',
  );
}

function ageDays(issue, now) {
  return Math.max(0, Math.floor((now - Date.parse(issue.createdAt)) / DAY_MS));
}

function askTitle(issue) {
  return String(issue.title ?? '').replace(TITLE_PREFIX_RE, '');
}

/** Marjorie's brief, Tree section: the oldest open ask from Tree. */
export function renderFromTreeLine(asks, now = Date.now()) {
  if (!asks || asks.length === 0) return '- From Tree: no open asks.';
  const [first] = asks;
  const more = asks.length > 1 ? ` (+${asks.length - 1} more open)` : '';
  const flag = contradictsSuffix(parseMarker(first.body)?.contradicts);
  return `- From Tree: [#${first.number}](<${first.url}>) ${truncate(askTitle(first), 70)} · ${ageDays(first, now)}d${flag}${more}`;
}

/** Tree's Monday brief header: this week's asks + Marjorie's asks of Tree. */
export function renderTreeBriefBlock({ filed = [], failed = 0, overCap = 0, incoming = [] } = {}) {
  const lines = ['**Needs from Marjorie**'];
  if (filed.length === 0 && failed === 0) lines.push('- Nothing this week.');
  for (const f of filed) {
    lines.push(`- [#${f.number}](<${f.url}>) — ${neutralizeAt(f.ask.ask)}${contradictsSuffix(f.ask.contradicts)}`);
  }
  if (failed > 0) lines.push(`- ${failed} ask${failed === 1 ? '' : 's'} couldn't be filed as issues this run — see the send-brief log.`);
  if (overCap > 0) lines.push(`- ${overCap} more over the two-ask cap, not filed.`);

  lines.push('', '**From Marjorie**');
  if (incoming.length === 0) lines.push('- No asks from Marjorie this week.');
  for (const i of incoming.slice(0, 3)) {
    const status = String(i.state).toUpperCase() === 'OPEN' ? 'still open' : 'closed';
    const flag = contradictsSuffix(parseMarker(i.body)?.contradicts);
    lines.push(`- [#${i.number}](<${i.url}>) — ${truncate(askTitle(i), 90)} · ${status}${flag}`);
  }
  if (incoming.length > 3) lines.push(`- +${incoming.length - 3} more`);
  return lines;
}
