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
const NOTE_BLOCK = /(<!-- marjorie-note:start date=)\S+( -->\n)[\s\S]*?(\n<!-- marjorie-note:end -->)/;
const PING_LINE = /\n*<!-- marjorie-ping date=\S+(?: msg=\d+)? -->\s*$/;

/** The canonical (oldest) open status issue, or null. */
export async function findStatusIssue(api, repo) {
  const rows = await listIssuesByLabels(api, { repo, labels: [STATUS_LABEL], state: 'open', limit: 20 });
  if (!rows.length) return null;
  return rows.sort((a, b) => a.number - b.number)[0];
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

/** Finds the status issue or creates it (and tries to pin it). */
export async function ensureStatusIssue({ api, gh, repo, log = () => {} }) {
  const found = await findStatusIssue(api, repo);
  if (found) return { issue: found, created: false, pinned: null };
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
