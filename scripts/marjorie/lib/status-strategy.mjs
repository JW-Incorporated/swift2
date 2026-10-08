// The "🧭 Strategy" block near the top of the page (owner, 2026-10-01): the
// `## Summary` of docs/strategy/growth-strategy.md on main (<= 6 bullets), when
// that file last changed, a link to the whole thing, and how to steer it. The
// file is written by another agent; an absent file or summary simply omits the
// section.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { neutralizeHtmlComments } from './html-safe.mjs';

export const STRATEGY_PATH = 'docs/strategy/growth-strategy.md';
const MAX_BULLETS = 6;
const LINE_CAP = 240;
const BULLET = /^(?:[-*]|\d+[.)])\s+(\S.*)$/;

const clean = (s) => neutralizeHtmlComments(s).replace(/(^|[^\w`])@(?=\w)/g, '$1@​').replace(/\s+/g, ' ').trim();
const cap = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** The bullets (or, failing that, first lines) of the `## Summary` section; [] when there is none. */
export function summaryBullets(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((l) => /^##\s+summary\b/i.test(l.trim()));
  if (start === -1) return [];
  const section = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,2}\s/.test(line.trim())) break;
    if (line.trim()) section.push(line.trim());
  }
  const bullets = section.map((l) => BULLET.exec(l)?.[1]).filter(Boolean);
  return (bullets.length ? bullets : section.filter((l) => !/^#{3,6}\s|^---+$/.test(l)))
    .slice(0, MAX_BULLETS).map((l) => cap(clean(l), LINE_CAP));
}

export function readStrategy(root) {
  try {
    return summaryBullets(readFileSync(path.join(root, STRATEGY_PATH), 'utf8'));
  } catch {
    return [];
  }
}

/** ISO date of the newest commit that touched the strategy file, or '' when unknown. */
export async function strategyChangedAt(api, repo) {
  try {
    const rows = await api(`/repos/${repo}/commits?path=${encodeURIComponent(STRATEGY_PATH)}&sha=main&per_page=1`);
    return String(rows?.[0]?.commit?.committer?.date || rows?.[0]?.commit?.author?.date || '').slice(0, 10);
  } catch {
    return '';
  }
}

export function renderStrategy({ bullets, changedAt = '' }, { repo }) {
  if (!bullets?.length) return '';
  const link = `https://github.com/${repo}/blob/main/${STRATEGY_PATH}`;
  return [
    '## 🧭 Strategy', '',
    ...bullets.map((b) => `- ${b}`), '',
    `_${changedAt ? `Last changed ${changedAt} — ` : ''}[full strategy](${link}) — challenge or steer it by talking to Marjorie in #longlive-marjorie._`,
  ].join('\n');
}
