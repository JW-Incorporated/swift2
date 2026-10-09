// Founder-override discovery for marjorie-triage (#4231). An override is tracked
// by the specific comment it lives in, never by a chronological "after my last
// comment" boundary: every run scans ALL comments, and an override is settled
// only when one of Marjorie's own comments carries this marker for its url:
//
//   <!-- marjorie-override-actioned: <override comment url> -->
//
// Bot edits, later bot comments, or deleted comments can't move or hide it.
//
//   node scripts/marjorie/lib/fetch-issue-comments.mjs ... > .scratch/threads.json
//   node scripts/marjorie/lib/pending-overrides.mjs < .scratch/threads.json
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isFounder } from '../founder-gate.mjs';

export const OVERRIDE_WORDS = ['spam', 'bug', 'content', 'request', 'founder', 'close', 'reopen'];
// Pre-marker history is grandfathered: founder comments older than this predate
// the actioned-marker scheme and were handled (or deliberately ignored) under
// the old boundary, so they must never read as pending on the first run.
export const CUTOFF = '2026-10-09T00:00:00Z';
const MARKER = /<!--\s*marjorie-override-actioned:\s*(\S+?)\s*-->/g;

export function overrideWord(body) {
  const text = String(body || '');
  const found = OVERRIDE_WORDS.filter((w) => new RegExp(`(?<![\\w-])${w}(?![\\w-])`, 'i').test(text));
  return found.length === 1 ? found[0] : null;
}

export function actionedUrls(comments) {
  const urls = new Set();
  for (const c of comments || []) {
    if (!c.viewerDidAuthor) continue;
    for (const m of String(c.body || '').matchAll(MARKER)) urls.add(m[1]);
  }
  return urls;
}

export function pendingOverrides(issues, { founderCheck = isFounder } = {}) {
  const out = [];
  for (const issue of issues || []) {
    const comments = issue.comments || [];
    const done = actionedUrls(comments);
    for (const c of comments) {
      if (c.viewerDidAuthor || !founderCheck(c.author?.login)) continue;
      if (c.createdAt && Date.parse(c.createdAt) < Date.parse(CUTOFF)) continue;
      const word = overrideWord(c.body);
      if (!word || done.has(c.url)) continue;
      out.push({ number: issue.number, word, url: c.url, author: c.author.login, createdAt: c.createdAt });
    }
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(pendingOverrides(JSON.parse(readFileSync(0, 'utf8')).flat()))}\n`);
}
