// Pure mechanics for docs/strategy/growth-strategy.md, the living growth strategy
// Marjorie's weekly Fable review owns and the owner steers (docs/agents/marjorie.md,
// "Visible strategy and owner steering"). No I/O here: the CLI (../strategy-doc.mjs)
// reads and writes files; this module only parses, validates and edits text.
//
// The file lands on main with no human review (content-automerge-allowlist.txt),
// so the shape is enforced in code, three times over: the CLI's `check` before a
// PR opens, `open-pr` refusing a bad rewrite, and a test that validates the file
// on main (strategy-doc.test.ts). The two rules that matter most are append-only
// on purpose: a rewrite may never drop an `Owner direction (standing)` line or a
// `Changelog` line the previous version had.

export const STRATEGY_FILE = 'docs/strategy/growth-strategy.md';
export const SUMMARY_MAX_BULLETS = 6;
export const MAX_CHARS = 30000;
export const MAX_DIRECTION_CHARS = 1200;
export const OWNER_HEADING = '## Owner direction (standing)';
export const CHANGELOG_HEADING = '## Changelog';

/** Required `##` headings, in order. A heading matches when the line starts with the entry. */
export const HEADINGS = [
  '## Summary',
  '## Audience',
  '## How we grow',
  '## Content strategy',
  '## What we stopped and why',
  OWNER_HEADING,
  CHANGELOG_HEADING,
];

/** Splits into the preamble (title) and `## ` sections, ignoring headings inside code fences. */
export function parseSections(text) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const sections = [];
  let preamble = [];
  let current = null;
  let fenced = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    if (!fenced && /^## /.test(line)) {
      current = { heading: line.trimEnd(), lines: [] };
      sections.push(current);
    } else if (current) current.lines.push(line);
    else preamble.push(line);
  }
  return { preamble: preamble.join('\n'), sections: sections.map((s) => ({ heading: s.heading, body: s.lines.join('\n') })) };
}

const bulletsOf = (body) => body.split('\n').filter((l) => /^- /.test(l));
const sectionNamed = (sections, prefix) => sections.find((s) => s.heading.startsWith(prefix));

/** Problems with a proposed version of the file (empty = fine). `previous` is the version on main, if any. */
export function validateStrategy(text, previous = '') {
  const problems = [];
  const t = String(text);
  if (!t.trim()) return ['the file is empty'];
  if (t.length > MAX_CHARS) problems.push(`the file is ${t.length} characters; the cap is ${MAX_CHARS}`);
  const { preamble, sections } = parseSections(t);
  if (!/^# \S/m.test(preamble.trim().split('\n')[0] ?? '')) problems.push('the first line must be a `# ` title');
  const found = sections.map((s) => s.heading);
  const ordered = HEADINGS.every((h, i) => found[i]?.startsWith(h)) && found.length === HEADINGS.length;
  if (!ordered) problems.push(`the \`##\` headings must be exactly, in order: ${HEADINGS.map((h) => h.slice(3)).join(' | ')} (found: ${found.map((h) => h.slice(3)).join(' | ') || 'none'})`);
  if (!ordered) return problems;
  const summary = sections[0];
  const bullets = bulletsOf(summary.body);
  if (bullets.length < 1 || bullets.length > SUMMARY_MAX_BULLETS) problems.push(`Summary must have 1 to ${SUMMARY_MAX_BULLETS} bullets (found ${bullets.length})`);
  if (summary.body.split('\n').some((l) => l.trim() && !/^- /.test(l))) problems.push('Summary may contain only bullets');
  for (const s of sections.slice(1)) if (s.heading !== OWNER_HEADING && !s.body.trim()) problems.push(`${s.heading} is empty`);
  if (!bulletsOf(sections[6].body).some((l) => /^- \d{4}-\d{2}-\d{2}\b/.test(l))) problems.push('Changelog needs at least one dated line (`- YYYY-MM-DD — what changed and why`)');
  if (previous.trim()) {
    const before = parseSections(previous).sections;
    for (const heading of [OWNER_HEADING, CHANGELOG_HEADING]) {
      const kept = new Set(bulletsOf(sectionNamed(sections, heading)?.body ?? ''));
      for (const line of bulletsOf(sectionNamed(before, heading)?.body ?? '')) {
        if (!kept.has(line)) problems.push(`${heading.slice(3)} lost a line it had (append-only): ${line.slice(0, 80)}`);
      }
    }
  }
  return problems;
}

const todayUtc = () => new Date().toISOString().slice(0, 10);

/** Appends one dated owner steer (verbatim, whitespace collapsed to one line) and a changelog line. */
export function addOwnerDirection(text, { direction, date = todayUtc() }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('--date must be YYYY-MM-DD');
  const clean = String(direction ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) throw new Error('--text is required');
  if (clean.length > MAX_DIRECTION_CHARS) throw new Error(`the direction is ${clean.length} characters; the cap is ${MAX_DIRECTION_CHARS} (ask the owner to split it)`);
  const bullet = `- **${date}** — ${clean}`;
  const { sections } = parseSections(text);
  if (!sectionNamed(sections, OWNER_HEADING) || !sectionNamed(sections, CHANGELOG_HEADING)) throw new Error('the file lacks the Owner direction or Changelog section');
  if (bulletsOf(sectionNamed(sections, OWNER_HEADING).body).includes(bullet)) return { text: String(text), added: false };
  const log = `- ${date} — Owner direction added; the sections it touches are rewritten by Fable the same day or at the next weekly review, and every later rewrite must honour it.`;
  const insert = (src, heading, line) => {
    const lines = src.split('\n');
    const start = lines.findIndex((l) => l.startsWith(heading));
    let end = lines.findIndex((l, i) => i > start && /^## /.test(l));
    if (end === -1) end = lines.length;
    let at = end;
    while (at > start + 1 && lines[at - 1].trim() === '') at -= 1;
    lines.splice(at, 0, line);
    return lines.join('\n');
  };
  const withDirection = insert(String(text).replace(/\r\n/g, '\n'), OWNER_HEADING, bullet);
  return { text: insert(withDirection, CHANGELOG_HEADING, log), added: true };
}
