// "🎉 For fans — what changed on the site (7 days)" (owner, 2026-10-01): the
// page's fan-eye view, deterministic, built only from what the repo and GitHub
// already say. Four feeds plus Marjorie's own plain-language recap:
//   content   merged content-desk PRs (new moments on an era; links to the era
//             on the site when the changed seed file maps to one)
//   site      merged PRs that change what a visitor sees: apps/web/** or
//             packages/experience/** (not tests/docs/CI), else a feat/fix title
//             scoped to the site when the file list is unavailable
//   app       merged PRs touching apps/mobile/**
//   posts     social/posted/ rows published in the window, with links
//   feedback  open+closed `user-feedback` issues from the site's Feedback button
// The recap lives between `<!-- fan-recap:start -->` markers that only the
// daily brief routine writes (status-note.mjs write-recap).
import { eraLink, erasTouched, isContentPR } from '../content-shipped.mjs';

const SECTION_CAP = 6;
const TITLE_CAP = 90;
const RECAP_LINES = 6;
const RECAP_LINE_CAP = 220;
const RECAP_PLACEHOLDER = "_Marjorie writes a short, plain-language recap from a fan's point of view each morning._";
const RECAP_RE = /<!-- fan-recap:start -->\n([\s\S]*?)\n<!-- fan-recap:end -->/;
const LABELS = { x: 'X', instagram: 'Instagram', facebook: 'Facebook' };
const CONVENTIONAL = /^(\w+)(?:\(([^)]*)\))?!?:/;
const NON_FAN_TYPES = new Set(['docs', 'test', 'tests', 'ci', 'chore', 'build', 'style', 'refactor', 'deps', 'revert']);
const FAN_TYPES = new Set(['feat', 'fix', 'perf']);
const SITE_SCOPE = /\b(web|site|ui|ux|experience|longlive|app)\b/i;
const APP_SCOPE = /\b(mobile|ios|android|native)\b/i;
const NOT_VISIBLE = /(\.test\.|\.spec\.|__tests__|\/e2e\/|\.md$|\.stories\.)/;

const defang = (s) => String(s ?? '').replace(/<!--|-->/g, '').replace(/(^|[^\w`])@(?=\w)/g, '$1@​');
/** Issue titles and PR titles are public input: no markup, links, mentions or autolinked refs. */
const plain = (s, n = TITLE_CAP) => {
  const flat = defang(s).replace(/\s*\(#\d+\)\s*$/, '').replace(/[[\]`<>|]/g, '').replace(/#(?=\d)/g, '#​').replace(/\s+/g, ' ').trim();
  return flat.length > n ? `${flat.slice(0, n - 1).trimEnd()}…` : flat;
};
const strip = (title) => String(title || '').replace(/^\w+(?:\([^)]*\))?!?:\s*/, '');
const typeOf = (title) => CONVENTIONAL.exec(String(title || ''))?.[1]?.toLowerCase() || '';

/** Is it worth asking GitHub which files this merged PR changed? */
export const needsFiles = (pr) => isContentPR({ headRefName: pr.branch, labels: pr.labels }) || !NON_FAN_TYPES.has(typeOf(pr.title));

/**
 * Splits shipped (already noise-filtered) PRs into fan-facing groups; the rest
 * is "behind the scenes". `files` maps PR number to its changed paths (absent
 * when the lookup failed, in which case the title decides).
 */
export function classifyFans(shipped, files = new Map()) {
  const out = { content: [], app: [], site: [] };
  for (const pr of shipped) {
    const paths = files.get(pr.number);
    const type = typeOf(pr.title);
    const scope = CONVENTIONAL.exec(pr.title)?.[2] || '';
    if (isContentPR({ headRefName: pr.branch, labels: pr.labels })) { out.content.push({ pr, paths: paths || [] }); continue; }
    if (NON_FAN_TYPES.has(type)) continue;
    if (paths) {
      const visible = paths.filter((p) => !NOT_VISIBLE.test(p));
      if (visible.some((p) => p.startsWith('apps/mobile/'))) out.app.push({ pr });
      else if (visible.some((p) => p.startsWith('apps/web/') || p.startsWith('packages/experience/'))) out.site.push({ pr });
    } else if (FAN_TYPES.has(type) && APP_SCOPE.test(scope)) out.app.push({ pr });
    else if (FAN_TYPES.has(type) && SITE_SCOPE.test(scope)) out.site.push({ pr });
  }
  return out;
}

const more = (n, cap = SECTION_CAP) => (n > cap ? [`_+${n - cap} more_`] : []);
const prLine = ({ pr }) => `- [${plain(strip(pr.title))}](${pr.url})`;

function contentLine({ pr, paths }) {
  const { eras } = erasTouched(paths);
  const era = eras.length ? ` — [see ${eras.slice(0, 2).join(', ')} on the site](${eraLink(eras[0])})` : '';
  return `- [${plain(strip(pr.title))}](${pr.url})${era}`;
}

const day = (iso) => String(iso).slice(0, 10);

/**
 * `feedback` is { count, latest: [{ number, title, url }] } or null when the
 * issues could not be read. Returns the section text.
 */
export function renderForFans({ fans, posted, feedback, recap }) {
  const out = ['## 🎉 For fans — what changed on the site (7 days)', '', '<!-- fan-recap:start -->', sanitizeRecap(recap) || RECAP_PLACEHOLDER, '<!-- fan-recap:end -->'];
  let any = false;
  const block = (title, rows, lineOf) => {
    if (!rows.length) return;
    any = true;
    out.push('', `**${title}** (${rows.length})`, ...rows.slice(0, SECTION_CAP).map(lineOf), ...more(rows.length));
  };
  block('📚 New content', fans.content, contentLine);
  block('📣 Posts that went live', posted, (p) => `- ${p.url ? `[${LABELS[p.platform] || plain(p.platform, 20)} · ${day(p.postedAt)}](${p.url})` : `${LABELS[p.platform] || plain(p.platform, 20)} · ${day(p.postedAt)}`}`);
  block('✨ Features & fixes', fans.site, prLine);
  block('📱 App updates', fans.app, prLine);
  if (feedback === null) out.push('', '💬 _Feedback from the site isn\'t readable this run._');
  else if (feedback.count) {
    any = true;
    out.push('', `💬 **${feedback.count}** piece${feedback.count === 1 ? '' : 's'} of feedback from fans in 7 days`,
      ...feedback.latest.map((f) => `- [#${f.number} ${plain(f.title, 70)}](${f.url})`));
  } else out.push('', '💬 No feedback from fans in the last 7 days.');
  if (!any) out.push('', '_Nothing changed for fans in the last 7 days._');
  return out.join('\n');
}

export function readRecap(body) {
  const m = RECAP_RE.exec(String(body || '').replace(/\r\n/g, '\n'));
  const text = m?.[1]?.trim() || '';
  return text === RECAP_PLACEHOLDER ? '' : text;
}

/** The recap as the brief routine may write it: short lines, no markers, no live mentions. */
export function sanitizeRecap(text) {
  return String(text || '').split(/\r?\n/).map((l) => defang(l).trim()).filter(Boolean)
    .slice(0, RECAP_LINES).map((l) => (l.length > RECAP_LINE_CAP ? `${l.slice(0, RECAP_LINE_CAP - 1).trimEnd()}…` : l)).join('\n');
}

/** Replaces the recap region (appends one when the body has none; the next render files it in place). Pure. */
export function replaceRecap(body, text) {
  const clean = sanitizeRecap(text) || RECAP_PLACEHOLDER;
  const src = String(body || '').replace(/\r\n/g, '\n');
  if (RECAP_RE.test(src)) return src.replace(RECAP_RE, () => `<!-- fan-recap:start -->\n${clean}\n<!-- fan-recap:end -->`);
  return `${src.replace(/\s+$/, '')}\n\n<!-- fan-recap:start -->\n${clean}\n<!-- fan-recap:end -->\n`;
}
