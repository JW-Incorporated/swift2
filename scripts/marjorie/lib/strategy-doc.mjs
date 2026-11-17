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
export const CHANGELOG_ARCHIVE_FILE = 'docs/strategy/growth-strategy-changelog.md';
export const SUMMARY_MAX_BULLETS = 6;
/**
 * The size budget, and what it measures (#6893, 2026-11-16). It applies to the file
 * MINUS the `## Changelog` section, because that section is append-only by rule and
 * grows ~1k characters a week: counting it against a whole-file cap meant the cap and
 * the append-only rule collided, and the weekly rewrite would have failed the check
 * within a week or two. The Changelog instead stays bounded by rotation: lines older
 * than CHANGELOG_KEEP_WEEKS move to CHANGELOG_ARCHIVE_FILE, which is append-only too,
 * so history is never dropped — only relocated (see rotateChangelog).
 */
export const MAX_CHARS = 30000;
export const CHANGELOG_KEEP_WEEKS = 8;
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

/** The `- ` lines of the changelog archive file (its prose header is ignored). */
export const archiveLines = (archive) =>
  String(archive ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((l) => /^- /.test(l));

/**
 * Characters in everything except the `## Changelog` section — what MAX_CHARS budgets.
 * A file with no Changelog heading measures whole, so a malformed file is still capped.
 */
export function proseLength(text) {
  const { preamble, sections } = parseSections(text);
  const kept = sections.filter((s) => !s.heading.startsWith(CHANGELOG_HEADING));
  return [preamble, ...kept.map((s) => `${s.heading}\n${s.body}`)].join('\n').length;
}

/**
 * Problems with a proposed version of the file (empty = fine). `previous` is the version on main, if any.
 * Against a `previous`, the Owner direction bullet set must EQUAL it exactly (a Fable rewrite never adds,
 * edits or drops an owner line; only chat's `add-direction` appends, which passes `ownerAppend`).
 */
export function validateStrategy(text, previous = '', { ownerAppend = false, archive = '' } = {}) {
  const problems = [];
  const t = String(text);
  if (!t.trim()) return ['the file is empty'];
  const prose = proseLength(t);
  if (prose > MAX_CHARS) problems.push(`the file is ${prose} characters outside the Changelog; the cap is ${MAX_CHARS} (the append-only Changelog does not count toward it)`);
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
    const archived = new Set(archiveLines(archive));
    for (const heading of [OWNER_HEADING, CHANGELOG_HEADING]) {
      const kept = new Set(bulletsOf(sectionNamed(sections, heading)?.body ?? ''));
      // A rotated Changelog line still counts as kept while it sits in the archive file:
      // rotation relocates history, it never drops it. A line in neither file is lost.
      const rotatable = heading === CHANGELOG_HEADING;
      const held = rotatable ? (line) => kept.has(line) || archived.has(line) : (line) => kept.has(line);
      const why = rotatable ? `append-only; it is in neither the section nor ${CHANGELOG_ARCHIVE_FILE}` : 'append-only';
      for (const line of bulletsOf(sectionNamed(before, heading)?.body ?? '')) {
        if (!held(line)) problems.push(`${heading.slice(3)} lost a line it had (${why}): ${line.slice(0, 80)}`);
      }
      if (heading === OWNER_HEADING && !ownerAppend) {
        const had = new Set(bulletsOf(sectionNamed(before, heading)?.body ?? ''));
        for (const line of kept) if (!had.has(line)) problems.push(`${heading.slice(3)} has a line main lacks — only the owner's chat can add one: ${line.slice(0, 80)}`);
      }
    }
  }
  return problems;
}

/**
 * Re-applies main's current Owner direction and Changelog lines onto a rewrite Fable began from an older
 * copy (an owner steer can land while she works). Returns { text }, or { error } when the rewrite has an
 * owner line main lacks: that is a forgery or an edit, never a race, and must not land.
 */
export function rebaseOntoMain(proposal, current) {
  const src = String(proposal).replace(/\r\n/g, '\n');
  const base = parseSections(current).sections;
  const mainOwner = bulletsOf(sectionNamed(base, OWNER_HEADING)?.body ?? '');
  const mainLog = bulletsOf(sectionNamed(base, CHANGELOG_HEADING)?.body ?? '');
  const mine = parseSections(src).sections;
  if (mine.length !== HEADINGS.length) return { text: src };
  const extra = bulletsOf(sectionNamed(mine, OWNER_HEADING)?.body ?? '').filter((l) => !mainOwner.includes(l));
  if (extra.length > 0) return { error: `Owner direction has a line main lacks (forged or edited): ${extra[0].slice(0, 80)}` };
  const lines = src.split('\n');
  const range = (heading) => {
    const start = lines.findIndex((l) => l.startsWith(heading));
    const next = lines.findIndex((l, i) => i > start && /^## /.test(l));
    return [start, next === -1 ? lines.length : next];
  };
  const trimEnd = (from, to) => {
    let end = to;
    while (end > from + 1 && lines[end - 1].trim() === '') end -= 1;
    return end;
  };
  let [start, stop] = range(OWNER_HEADING);
  const prose = lines.slice(start + 1, stop).filter((l) => !/^- /.test(l));
  let at = prose.length;
  while (at > 0 && prose[at - 1].trim() === '') at -= 1;
  prose.splice(at, 0, ...mainOwner);
  lines.splice(start + 1, stop - start - 1, ...prose);
  [start, stop] = range(CHANGELOG_HEADING);
  const have = new Set(lines.slice(start + 1, stop));
  lines.splice(trimEnd(start, stop), 0, ...mainLog.filter((l) => !have.has(l)));
  return { text: lines.join('\n') };
}

const todayUtc = () => new Date().toISOString().slice(0, 10);

const ARCHIVE_TITLE = '# Growth strategy changelog archive';

/** The archive file's prose header — rewritten every time, so the explanation cannot rot. */
const archiveHeader = () => [
  ARCHIVE_TITLE,
  '',
  `Changelog lines rotated out of \`${STRATEGY_FILE}\` once they are more than`,
  `${CHANGELOG_KEEP_WEEKS} weeks old. Written only by \`rotateChangelog\` in`,
  '`scripts/marjorie/lib/strategy-doc.mjs`, which `strategy-doc.mjs open-pr` runs on every',
  'strategy rewrite — nobody edits this file by hand.',
  '',
  'Append-only, exactly like the live section: a line that leaves the strategy file arrives',
  'here unchanged and is never edited or removed. `validateStrategy` treats the two files as',
  'one history and refuses a rewrite that loses a line from both (#6893).',
  '',
];

/** The archive file's full text for `lines` (oldest first). */
export const renderArchive = (lines) => `${[...archiveHeader(), ...lines].join('\n').replace(/\n+$/, '')}\n`;

/** A dated Changelog bullet, matching validateStrategy's own `dated line` rule. */
const isDated = (line) => /^- (\d{4}-\d{2}-\d{2})\b/.exec(line);

/**
 * Moves `## Changelog` lines older than `keepWeeks` into the archive, bounding the live
 * section while the file's own cap (MAX_CHARS, prose only) stays generous. Returns
 * `{ text, archive, moved }`; `moved` is empty and both texts are untouched when nothing
 * has aged out. The newest dated line is never moved, so the live section always keeps the
 * dated line `validateStrategy` requires, even on a week that adds none.
 */
export function rotateChangelog(text, archive = '', { keepWeeks = CHANGELOG_KEEP_WEEKS, today = todayUtc() } = {}) {
  const src = String(text).replace(/\r\n/g, '\n');
  const before = String(archive ?? '');
  const unchanged = { text: src, archive: before, moved: [] };
  const cut = new Date(`${today}T00:00:00Z`);
  if (Number.isNaN(cut.getTime())) throw new Error('today must be YYYY-MM-DD');
  cut.setUTCDate(cut.getUTCDate() - Math.max(0, keepWeeks) * 7);
  const cutoff = cut.toISOString().slice(0, 10);
  const lines = src.split('\n');
  const start = lines.findIndex((l) => l.startsWith(CHANGELOG_HEADING));
  if (start === -1) return unchanged;
  let stop = lines.findIndex((l, i) => i > start && /^## /.test(l));
  if (stop === -1) stop = lines.length;
  const body = lines.slice(start + 1, stop);
  const dated = body.map((l, i) => (isDated(l) ? i : -1)).filter((i) => i >= 0);
  const newest = dated.length > 0 ? dated[dated.length - 1] : -1;
  const ageOut = (line, i) => i !== newest && Boolean(isDated(line)) && isDated(line)[1] < cutoff;
  const moved = body.filter((l, i) => ageOut(l, i));
  if (moved.length === 0) return unchanged;
  const have = new Set(archiveLines(before));
  return {
    text: [...lines.slice(0, start + 1), ...body.filter((l, i) => !ageOut(l, i)), ...lines.slice(stop)].join('\n'),
    archive: renderArchive([...archiveLines(before), ...moved.filter((l) => !have.has(l))]),
    moved,
  };
}

/** Problems with a proposed archive file (empty = fine): it may only ever gain lines. */
export function validateArchive(next, previous = '') {
  const have = new Set(archiveLines(next));
  const problems = archiveLines(previous)
    .filter((l) => !have.has(l))
    .map((l) => `${CHANGELOG_ARCHIVE_FILE} lost a line it had (append-only): ${l.slice(0, 80)}`);
  if (String(next ?? '').trim() && !String(next).startsWith(ARCHIVE_TITLE)) problems.push(`${CHANGELOG_ARCHIVE_FILE} must start with \`${ARCHIVE_TITLE}\``);
  return problems;
}

/** Appends one dated owner steer (verbatim, whitespace collapsed to one line) and a changelog line. */
export function addOwnerDirection(text, { direction, date = todayUtc(), author = '' }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('--date must be YYYY-MM-DD');
  const clean = String(direction ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) throw new Error('the message is empty');
  if (clean.length > MAX_DIRECTION_CHARS) throw new Error(`the direction is ${clean.length} characters; the cap is ${MAX_DIRECTION_CHARS} (ask the owner to send it shorter or in parts)`);
  const label = String(author ?? '').replace(/[^\p{L}\p{N} ._-]/gu, '').trim().slice(0, 32);
  const bullet = `- **${date}**${label ? ` (${label})` : ''} — ${clean}`;
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
