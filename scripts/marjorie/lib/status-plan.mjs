// The weekly plan's `## Next up` section, split into its sub-sections (owner,
// 2026-10-01): `### To grow`, `### To make content better`, `### Other`. The
// weekly review writes them; the page just parses them. A plan with no
// sub-sections returns [] and the caller falls back to the flat bullet list.
import { neutralizeHtmlComments, stripHtmlComments } from './html-safe.mjs';

const HEADING = /^(#{1,6})\s*(.+?)\s*#*\s*$/;
const NEXT_UP = /^next up\b/i;
const BULLET = /^(?:[-*]|\d+[.)])\s+(\S.*)$/;
const BULLETS_PER_SECTION = 5;
const LINE_CAP = 200;
const ICONS = [[/grow/i, '🌱'], [/content/i, '🎨']];

const clean = (s) => neutralizeHtmlComments(s).replace(/\s+/g, ' ').trim();
const cap = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** `[{ title, icon, bullets }]` for each non-empty sub-heading under "Next up", in plan order. */
export function nextUpSections(body) {
  const lines = stripHtmlComments(body).split(/\r?\n/);
  let level = 0;
  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const h = HEADING.exec(lines[i].trim());
    if (h && NEXT_UP.test(h[2])) { level = h[1].length; start = i; break; }
  }
  if (start === -1) return [];
  const sections = [];
  let current = null;
  for (const line of lines.slice(start + 1)) {
    const t = line.trim();
    const h = HEADING.exec(t);
    if (h) {
      if (h[1].length <= level) break;
      current = { title: cap(clean(h[2]).replace(/[[\]`*_]/g, ''), 60), icon: (ICONS.find(([re]) => re.test(h[2])) || [])[1] || '', bullets: [] };
      sections.push(current);
      continue;
    }
    const b = current && BULLET.exec(t);
    if (b && current.bullets.length < BULLETS_PER_SECTION) current.bullets.push(cap(clean(b[1]), LINE_CAP));
  }
  return sections.filter((s) => s.title && s.bullets.length);
}

/** Quoted lines for the page: a bold sub-heading, then its bullets. */
export function renderNextUpSections(sections) {
  const out = [];
  for (const s of sections) {
    out.push(`> **${s.icon ? `${s.icon} ` : ''}${s.title}**`);
    for (const b of s.bullets) out.push(`> - ${b}`);
  }
  return out;
}
