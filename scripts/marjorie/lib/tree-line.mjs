// The brief's **Tree** section (Marjorie Overhaul C2,
// docs/specs/marjorie-overhaul/c2-brief.md): one line from `social/lessons.md`
// plus one line from Tree's weekly scorecard. Read-only — this module never
// writes to either source, both of which Tree's own routines own.
//
// Import, don't reimplement: the lessons ledger already has a parser
// (`scripts/social/lib/lessons.mjs`, which `social/lessons.md` itself names
// as its reader) and the scorecard already has a builder
// (`scripts/social/weekly-scorecard.mjs`). Neither file currently computes a
// "median engagement %" or a week-over-week point delta anywhere (confirmed
// by reading both modules in full) — `renderScorecardLine` below reports
// only what `buildScorecard()` actually returns rather than inventing that
// math here, per the same "don't reimplement scorecard math" rule this
// module was scoped under.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLessons, findCodifiableRules } from '../../social/lib/lessons.mjs';
import { buildScorecard } from '../../social/weekly-scorecard.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const LESSONS_PATH = path.join(ROOT, 'social', 'lessons.md');

function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

/** `social/lessons.md`'s active rules, newest-fired-first — `null` when the
 * file is missing/unreadable (fresh checkout edge case) rather than throwing,
 * same soft-fail posture as this file's other reads. */
export function readActiveLessons(lessonsPath = LESSONS_PATH) {
  let markdown;
  try {
    markdown = readFileSync(lessonsPath, 'utf8');
  } catch {
    return [];
  }
  return parseLessons(markdown).active;
}

/**
 * The one Lessons line. Picks the rule with the most recent `Last fired`
 * date (ties broken by document order) — "the latest lesson" per the
 * spec's template, not merely the newest rule id. Flags `— codify` when the
 * rule is eligible for the Monday auto-codify check (`findCodifiableRules`,
 * already exported by lessons.mjs — reused rather than re-deriving the
 * `timesFired >= 3` threshold here).
 */
export function renderLessonsLine(active) {
  const rules = active || [];
  if (rules.length === 0) return '- Lessons: none logged yet.';
  const latest = [...rules].sort((a, b) => String(b.lastFired).localeCompare(String(a.lastFired)))[0];
  const times = Number(latest.timesFired) || 0;
  const codifiable = findCodifiableRules({ active: rules }).some((r) => r.id === latest.id);
  return `- Lessons: "${latest.youSaid ?? latest.title}" (${ordinal(times)} firing${codifiable ? ' — codify' : ''})`;
}

/**
 * The one Scorecard line. `docs/specs/marjorie-overhaul/c2-brief.md`'s
 * filled example shows a median-engagement percentage and a week-over-week
 * point delta; neither is a real field `buildScorecard()` returns today (no
 * function in `weekly-scorecard.mjs` or `post-metrics.mjs` computes an
 * engagement RATE or a week-over-week delta — only raw like/comment sums per
 * pillar). Reporting a real, already-computed count (posts this week) rather
 * than fabricating the other two numbers.
 */
export function renderScorecardLine(card) {
  if (!card || !card.posts) return '- Scorecard: no data yet this week.';
  const { total } = card.posts;
  return `- Scorecard: ${total} post${total === 1 ? '' : 's'} this week (\`weekly-scorecard.mjs\`); no engagement-rate metric published yet.`;
}

/** The two Tree-section lines, in order. */
export function buildTreeLines({ now = Date.now(), lessonsPath = LESSONS_PATH } = {}) {
  const active = readActiveLessons(lessonsPath);
  const card = buildScorecard({ now });
  return [renderLessonsLine(active), renderScorecardLine(card)];
}
