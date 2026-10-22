// The single `status-page` issue (Bots v2 W4): find it, create it once, pin it
// (best effort), rewrite its body, and edit Marjorie's note/ping regions in
// place. `api(path)` reads and `gh(args)` writes are both injected so tests
// never touch GitHub; production passes scripts/lib/gh.mjs's `ghApi` and `gh`.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { listIssuesByLabels } from './issues-rest.mjs';
import { PAGE_MARKER, sanitizeNote } from './status-render.mjs';
import { NOTE_PLACEHOLDER } from './status-sections.mjs';

export const STATUS_LABEL = 'status-page';
export const STATUS_TITLE = '📋 Long Live — Status';
const NOTE_BLOCK = /(<!-- marjorie-note:start date=)\S+( --!?>\n)[\s\S]*?(\n<!-- marjorie-note:end --!?>)/;
const PING_LINE = /\n*<!-- marjorie-ping date=\S+(?: msg=\d+)? --!?>\s*$/;

const EMPTY_LOOKUP_BACKOFF_MS = 200;

/**
 * The canonical (oldest) open status issue, or null. Empty results are
 * retried (default 3 attempts, short backoff) so a transient lookup miss —
 * e.g. search-index lag right after a create — is not mistaken for "no
 * status issue exists". `sleep` is injectable so tests can skip the backoff.
 */
export async function findStatusIssue(api, repo, {
  attempts = 3,
  backoffMs = EMPTY_LOOKUP_BACKOFF_MS,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const rows = await listIssuesByLabels(api, { repo, labels: [STATUS_LABEL], state: 'open', limit: 20 });
    if (rows.length) return rows.sort((a, b) => a.number - b.number)[0];
    if (attempt < attempts) await sleep(backoffMs);
  }
  return null;
}

async function withBodyFile(body, fn) {
  const dir = mkdtempSync(path.join(tmpdir(), 'status-body-'));
  const file = path.join(dir, 'body.md');
  try {
    writeFileSync(file, body);
    return await fn(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Best-effort pin. Never throws; returns whether GitHub accepted it. */
export async function pinIssue(gh, nodeId) {
  try {
    await gh(['api', 'graphql', '-f', 'query=mutation($id: ID!) { pinIssue(input: {issueId: $id}) { issue { number } } }', '-f', `id=${nodeId}`]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Finds the status issue. Only creates (and tries to pin) a new one when
 * `bootstrap` is true; with the empty-after-retry result and no bootstrap flag
 * it throws so a run fails loudly instead of silently duplicating the issue
 * (the 2026-10-22 dup: a transient empty label lookup raced a create that
 * already happened).
 */
export async function ensureStatusIssue({ api, gh, repo, log = () => {}, bootstrap = false, sleep, attempts, backoffMs }) {
  const found = await findStatusIssue(api, repo, { sleep, attempts, backoffMs });
  if (found) return { issue: found, created: false, pinned: null };
  if (!bootstrap) {
    throw new Error('status issue lookup came back empty after retries; pass bootstrap: true to create a new one');
  }
  const initial = `${PAGE_MARKER}\n\n_First render pending._\n`;
  const created = await withBodyFile(initial, (file) => gh([
    'api', '-X', 'POST', `repos/${repo}/issues`, '-F', `title=${STATUS_TITLE}`, '-F', `body=@${file}`, '-f', `labels[]=${STATUS_LABEL}`,
  ]));
  const row = JSON.parse(created.stdout);
  const pinned = await pinIssue(gh, row.node_id);
  log(pinned ? 'status issue created and pinned' : 'status issue created; pinning failed (pin it once by hand)');
  return { issue: { number: row.number, url: row.html_url, body: initial, title: STATUS_TITLE }, created: true, pinned };
}

export async function updateBody({ gh, repo, number, body }) {
  return withBodyFile(body, (file) => gh(['api', '-X', 'PATCH', `repos/${repo}/issues/${number}`, '-F', `body=@${file}`]));
}

/** Replaces Marjorie's note region (adds the section when absent). Pure. */
export function replaceNote(body, { text, date }) {
  const clean = sanitizeNote(text) || NOTE_PLACEHOLDER;
  const src = String(body || '').replace(/\r\n/g, '\n');
  if (NOTE_BLOCK.test(src)) return src.replace(NOTE_BLOCK, (_m, a, b, c) => `${a}${date}${b}${clean}${c}`);
  const section = `## 🗒️ Marjorie's note\n\n<!-- marjorie-note:start date=${date} -->\n${clean}\n<!-- marjorie-note:end -->`;
  return `${src.replace(/\s+$/, '')}\n\n${section}\n`;
}

/** Records that today's Discord ping went out (the brief guard reads this). Pure. */
export function stampPing(body, { date, msg }) {
  const stamp = `<!-- marjorie-ping date=${date}${/^\d+$/.test(msg || '') ? ` msg=${msg}` : ''} -->`;
  return `${String(body || '').replace(/\r\n/g, '\n').replace(PING_LINE, '').replace(/\s+$/, '')}\n\n${stamp}\n`;
}
