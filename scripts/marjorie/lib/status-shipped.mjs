// "Shipped (last 7 days)" for the status page (Bots v2 W4): merged PRs grouped
// by Pacific day, with housekeeping PRs filtered out. The filter list is
// explicit data (NOISE_RULES) so it can be argued with and is tested rule by
// rule — a rule that matches nothing real is dead weight, a rule that matches
// real work hides it.
const DAY_MS = 86_400_000;
export const SHIPPED_WINDOW_DAYS = 7;
const TITLE_CAP = 110;

// A rule matches on the PR title or the head branch; either alone is enough.
const title = (re) => (pr) => re.test(pr.title);
const branch = (re) => (pr) => re.test(pr.branch || '');
const either = (a, b) => (pr) => a(pr) || b(pr);

export const NOISE_RULES = [
  { id: 'dependabot-author', why: 'dependency bumps', test: (pr) => /^(app\/)?dependabot(-preview)?(\[bot\])?$/i.test(pr.author || '') },
  { id: 'dependabot-branch', why: 'dependency bumps', test: branch(/^dependabot\//) },
  { id: 'deps-title', why: 'dependency bumps', test: title(/^(chore|build)\(deps(-dev)?\):/i) },
  { id: 'growth-snapshot', why: 'growth-snapshot.yml data commits', test: either(title(/^growth-snapshot:/i), branch(/^growth-snapshot\//)) },
  { id: 'cie-scan', why: 'cie scan reports', test: either(title(/^cie: (deterministic )?scan report/i), branch(/^cie-scan\//)) },
  { id: 'social-ledger-fold', why: 'social-feedback ledger fold-backs', test: either(title(/^social-feedback: fold ledger/i), branch(/^social-approval-poll\/feedback-/)) },
  { id: 'social-poster-run', why: 'poster queue/state fold-backs', test: either(title(/^social-poster: queue/i), branch(/^social-poster\//)) },
  { id: 'social-event-status', why: 'event-status fold-backs', test: title(/^social-event-status:/i) },
  { id: 'social-draft', why: 'Tree drafts (shown under Tree)', test: (pr) => pr.labels.includes('social-draft') || /^tree\/draft\//.test(pr.branch || '') },
  { id: 'output-sampling', why: 'routine output sampling logs', test: either(title(/^routine-output-sampling:/i), branch(/^routine-output-sampling\//)) },
  {
    id: 'ha-ledger',
    why: 'human-action filing/closing bookkeeping',
    test: (pr) => /^(docs\(human-actions\)|chore\(human-actions\)|human-actions|human action #\d+|ha #\d+:|close ha #\d+)/i.test(pr.title)
      || /^(docs\/ha-close|marjorie\/(ha-|chase-ha-))/.test(pr.branch || ''),
  },
  { id: 'marjorie-chase', why: 'Marjorie chase bookkeeping', test: title(/^(chore\()?marjorie\)?: (file )?chase/i) },
  { id: 'merch-automation', why: 'weekly revenue report and official-store sync plans', test: either(title(/^chore\(merch\): refresh weekly revenue report/i), branch(/^merch-(revenue|official-sync)\//)) },
];

export function noiseRuleFor(pr) {
  return NOISE_RULES.find((rule) => rule.test(pr)) || null;
}

/** Normalizes one REST pull row. */
export function toPr(row) {
  return {
    number: row.number,
    title: String(row.title || '').replace(/\s+/g, ' ').trim(),
    url: row.html_url,
    author: row.user?.login || '',
    branch: row.head?.ref || '',
    labels: (row.labels || []).map((l) => (typeof l === 'string' ? l : l.name)),
    mergedAt: row.merged_at || null,
    updatedAt: row.updated_at || null,
    draft: Boolean(row.draft),
    body: String(row.body || ''),
  };
}

export function selectShipped(prs, now = Date.now()) {
  const cutoff = now - SHIPPED_WINDOW_DAYS * DAY_MS;
  return prs
    .filter((pr) => pr.mergedAt && Date.parse(pr.mergedAt) >= cutoff && Date.parse(pr.mergedAt) <= now)
    .filter((pr) => !noiseRuleFor(pr))
    .sort((a, b) => Date.parse(b.mergedAt) - Date.parse(a.mergedAt));
}

const dayKey = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date(iso));
const dayLabel = (key) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${key}T12:00:00Z`));
const plain = (title) => {
  const clean = title.replace(/\s*\(#\d+\)\s*$/, '').replace(/[[\]`]/g, '');
  return clean.length > TITLE_CAP ? `${clean.slice(0, TITLE_CAP - 1).trimEnd()}…` : clean;
};

export function renderShipped(shipped, { hidden = 0, maxLines = 60, heading = `## 🚢 Shipped (last ${SHIPPED_WINDOW_DAYS} days)`, collapse = false } = {}) {
  const out = [heading];
  if (!shipped.length) return [...out, '', '_Nothing merged in the window._'].join('\n');
  let lines = 0;
  let day = '';
  let trimmed = 0;
  for (const pr of shipped) {
    const key = dayKey(pr.mergedAt);
    if (lines >= maxLines) { trimmed += 1; continue; }
    if (key !== day) { day = key; out.push('', `**${dayLabel(key)}**`); }
    out.push(`- [${plain(pr.title)}](${pr.url})`);
    lines += 1;
  }
  const notes = [];
  if (trimmed) notes.push(`${trimmed} older not shown`);
  if (hidden) notes.push(`${hidden} housekeeping PRs filtered`);
  if (notes.length) out.push('', `_${notes.join(' · ')}_`);
  if (!collapse) return out.join('\n');
  const [head, ...rest] = out;
  return [head, '', '<details>', `<summary>${shipped.length} merged — tap to expand</summary>`, ...rest, '', '</details>'].join('\n');
}
