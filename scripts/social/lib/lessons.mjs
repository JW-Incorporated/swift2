// social/lessons.md — the founder-feedback ledger (Tree Overhaul T5,
// docs/specs/tree-overhaul/t5-lessons-ledger.md). Human-first Markdown with a
// fixed, parseable shape: one `### L### — <title>` block per rule, newest
// first, active rules first and retired ones in a trailing `## Retired`
// section. This module is pure (no fs, no network) so it is unit-testable —
// the Monday run (docs/agents/runner-prompts/tree-weekly-plan.md) is what
// actually reads/writes social/lessons.md on disk, through these helpers, so
// the format can never drift out from under a hand edit.
//
// `renderLessons(parseLessons(x)) === x` byte-for-byte is the load-bearing
// property (spec AC#1): parse and render only ever need to agree with each
// other, not with any other source of truth, so keep every field a raw,
// opaque string round-tripped verbatim — never reformat a value on the way
// through.

const RULE_HEADING_RE = /^### (L\d+) — (.+)$/;
const RETIRED_HEADING = '## Retired';

const FIELD_LABELS = ['Status', 'First seen', 'Times fired', 'Last fired', 'Evidence', 'Codify', 'Superseded by'];

function fieldRegex(label) {
  return new RegExp(`^- \\*\\*${label}:\\*\\* (.*)$`);
}

function proseRegex(label) {
  return new RegExp(`^\\*\\*${label}:\\*\\* (.*)$`);
}

function findMatch(lines, re) {
  for (const line of lines) {
    const m = re.exec(line);
    if (m) return m[1];
  }
  return undefined;
}

/** Parses one rule block's body (the lines after its `### L### — <title>`
 * heading, up to but not including the next heading). */
function parseRuleBody(id, title, bodyLines) {
  const [status, firstSeen, timesFiredRaw, lastFired, evidence, codify, supersededBy] = FIELD_LABELS.map((label) =>
    findMatch(bodyLines, fieldRegex(label)),
  );
  const rule = {
    id,
    title,
    status,
    firstSeen,
    timesFired: Number(timesFiredRaw),
    lastFired,
    evidence,
    codify,
    youSaid: findMatch(bodyLines, proseRegex('You said')),
    soI: findMatch(bodyLines, proseRegex('So I')),
  };
  if (supersededBy !== undefined) rule.supersededBy = supersededBy;
  return rule;
}

function parseRegion(lines) {
  const headingIdx = [];
  lines.forEach((line, i) => {
    if (RULE_HEADING_RE.test(line)) headingIdx.push(i);
  });
  return headingIdx.map((start, k) => {
    const end = k + 1 < headingIdx.length ? headingIdx[k + 1] : lines.length;
    const [, id, title] = RULE_HEADING_RE.exec(lines[start]);
    return parseRuleBody(id, title, lines.slice(start + 1, end));
  });
}

/**
 * `markdown` → `{ active: Rule[], retired: Rule[] }`. Any content before the
 * first `### L### — <title>` heading (a leading format comment, say) is
 * skipped rather than preserved — `renderLessons` never emits one either, so
 * the two stay in agreement without a third "preamble" field to keep in sync.
 */
export function parseLessons(markdown) {
  const lines = markdown.split('\n');
  const retiredAt = lines.indexOf(RETIRED_HEADING);
  const activeLines = retiredAt === -1 ? lines : lines.slice(0, retiredAt);
  const retiredLines = retiredAt === -1 ? [] : lines.slice(retiredAt + 1);
  return { active: parseRegion(activeLines), retired: parseRegion(retiredLines) };
}

function renderRule(rule) {
  const lines = [
    `### ${rule.id} — ${rule.title}`,
    '',
    `- **Status:** ${rule.status}`,
    `- **First seen:** ${rule.firstSeen}`,
    `- **Times fired:** ${rule.timesFired}`,
    `- **Last fired:** ${rule.lastFired}`,
    `- **Evidence:** ${rule.evidence}`,
    `- **Codify:** ${rule.codify}`,
  ];
  if (rule.supersededBy !== undefined) lines.push(`- **Superseded by:** ${rule.supersededBy}`);
  lines.push('', `**You said:** ${rule.youSaid}`, '', `**So I:** ${rule.soI}`);
  return lines.join('\n');
}

/** `{ active, retired }` → markdown, the exact inverse of `parseLessons` over
 * the rule-block shape (see the module header for what "exact" excludes).
 * Omits the `## Retired` heading entirely when there is nothing retired yet,
 * so a ledger with no retirements never carries an empty trailing section. */
export function renderLessons({ active = [], retired = [] } = {}) {
  const blocks = active.map(renderRule);
  if (retired.length > 0) blocks.push(RETIRED_HEADING, ...retired.map(renderRule));
  return blocks.join('\n\n');
}

/** The next sequential id after the highest one in the ledger, across BOTH
 * active and retired rules (spec AC#2) — ids are never reused or renumbered,
 * so a retired L003 still counts when the next active rule mints L005 after
 * L004. An empty ledger starts at L001. */
export function nextId({ active = [], retired = [] } = {}) {
  const max = [...active, ...retired].reduce((m, rule) => {
    const n = Number(String(rule.id).replace(/^L/, ''));
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `L${String(max + 1).padStart(3, '0')}`;
}

/**
 * Active rules eligible for Monday's codification check (spec AC#5, §The
 * codification issue): `Times fired >= 3` and not yet filed (`Codify` still
 * `—`). Filing the issue is the Monday run's job (it needs `gh`); this is
 * only the threshold arithmetic, deterministic over already-parsed ledger
 * fields — round 2 review + owner ruling: this is mechanical counting, not
 * the semantic judgment spec's "done by the Opus weekly run rather than by
 * a matcher" line is about, so it is code (CLAUDE.md rule 8), not prose. A
 * rule already carrying a real `Codify` value (`#n` or `done (#n)`) never
 * matches again, which is what keeps a second run over the same ledger from
 * filing a second issue.
 */
export function findCodifiableRules({ active = [] } = {}) {
  return active.filter((rule) => rule.timesFired >= 3 && rule.codify === '—');
}

/**
 * Active rules eligible for Monday retirement as "stale" (spec AC#6,
 * §Retirement): no firing in >= 8 consecutive weeks AND >= 10 briefs sent in
 * that window — the brief-count half is what stops a posting freeze from
 * silently retiring the rule set. `windows` is keyed by rule id; computing
 * `weeksQuiet`/`briefsInWindow` needs real posting history (the weekly-plan
 * PR list) this module has no access to, so the Monday run supplies it —
 * this function is only the threshold arithmetic, the same division of
 * labor `nextId` already has (it takes the parsed ledger rather than
 * reading social/lessons.md itself).
 */
export function findRetirableRules({ active = [] } = {}, windows = {}) {
  return active.filter((rule) => {
    const w = windows[rule.id];
    return !!w && w.weeksQuiet >= 8 && w.briefsInWindow >= 10;
  });
}
