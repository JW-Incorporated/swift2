// Next up / Growth / Tree / Marjorie's note for the status page (Bots v2 W4).
// Pure renderers over already-fetched data; deterministic, no LLM.
const DAY_MS = 86_400_000;
const PR_CAP = 8;
const PLAN_LINES = 5;
const PLAN_CHARS = 700;

const LABELS = { x: 'X', instagram: 'Instagram', facebook: 'Facebook' };

const oneLine = (s, n) => {
  const flat = String(s || '').replace(/\s+/g, ' ').trim();
  return flat.length > n ? `${flat.slice(0, n - 1).trimEnd()}…` : flat;
};

const NEXT_UP_HEADING = /^#{1,6}\s*next up\b/i;
const NEXT_UP_BULLETS = 5;

/** The bullets under a plan's "Next up" heading (up to 5), or [] when the heading or its bullets are absent. */
function nextUpBullets(lines) {
  const start = lines.findIndex((l) => NEXT_UP_HEADING.test(l.trim()));
  if (start === -1) return [];
  const bullets = [];
  for (const line of lines.slice(start + 1)) {
    const t = line.trim();
    if (/^#{1,6}\s/.test(t)) break;
    if (/^(?:[-*]|\d+[.)])\s+\S/.test(t)) bullets.push(t.replace(/^\d+[.)]\s+/, '- ').replace(/^\*\s+/, '- '));
  }
  return bullets.slice(0, NEXT_UP_BULLETS);
}

/**
 * What the status page quotes from a weekly-plan issue: its `## Next up` bullets
 * when present, otherwise the first few meaningful lines (no HTML comments,
 * headings or rules).
 */
export function planSummary(body) {
  const all = String(body || '').replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/);
  const bullets = nextUpBullets(all);
  const lines = bullets.length ? bullets
    : all.map((l) => l.trim()).filter((l) => l && !/^#{1,6}\s/.test(l) && !/^[-*_]{3,}$/.test(l));
  let text = lines.slice(0, PLAN_LINES).join('\n');
  if (text.length > PLAN_CHARS) text = `${text.slice(0, PLAN_CHARS - 1).trimEnd()}…`;
  return text;
}

function ageDays(iso, now) {
  const d = Math.floor((now - Date.parse(iso)) / DAY_MS);
  return Number.isFinite(d) && d >= 0 ? d : null;
}

/** `plan` = { number, title, url, body } | null; `prs` = non-draft open PRs, newest activity first. */
export function renderNextUp({ plan, prs }, { now = Date.now() } = {}) {
  const out = ['## 🧭 Next up', ''];
  if (plan) {
    out.push(`🗓️ **This week's plan:** [${oneLine(plan.title, 90)}](${plan.url})`);
    const summary = planSummary(plan.body);
    if (summary) out.push(...summary.split('\n').map((l) => `> ${l}`));
  } else {
    out.push('🗓️ _No weekly plan filed yet._');
  }
  out.push('', '**In flight**');
  if (!prs.length) return [...out, '_No open PRs._'].join('\n');
  for (const pr of prs.slice(0, PR_CAP)) {
    const age = ageDays(pr.updatedAt, now);
    out.push(`- [#${pr.number} ${oneLine(pr.title, 90).replace(/[[\]`]/g, '')}](${pr.url})${age !== null && age >= 3 ? ` · idle ${age}d` : ''}`);
  }
  if (prs.length > PR_CAP) out.push(`_+${prs.length - PR_CAP} more open_`);
  return out.join('\n');
}

const delta = (n) => (n > 0 ? `+${n}` : n < 0 ? `${n}` : '±0');

/** `latest`/`prior` are social/metrics daily snapshots (or null). */
export function renderGrowth({ latest, prior }) {
  const out = ['## 📈 Growth', ''];
  if (!latest?.followers) return [...out, '_No growth snapshot yet._'].join('\n');
  const basis = prior ? `vs ${prior.date}` : 'no earlier snapshot to compare';
  out.push(`Followers as of ${latest.date} (${basis})`);
  for (const key of ['instagram', 'x', 'facebook']) {
    const now = latest.followers[key];
    if (typeof now !== 'number') continue;
    const before = prior?.followers?.[key];
    out.push(`- ${LABELS[key]}: **${now}**${typeof before === 'number' ? ` (${delta(now - before)})` : ''}`);
  }
  const day = latest.postsLast24h?.total;
  if (typeof day === 'number') out.push(`- Posts in last 24h: ${day}`);
  return out.join('\n');
}

/** `published` = posted/*.json rows within 7d; `pending` = open social-draft PRs. */
export function renderTree({ published, pending, pendingUrl }) {
  const out = ['## 🌳 Tree', ''];
  const byPlatform = {};
  for (const p of published) byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1;
  const split = Object.entries(byPlatform).map(([k, n]) => `${LABELS[k] || k} ${n}`).join(' · ');
  out.push(published.length ? `📣 **${published.length}** posts published in 7 days${split ? ` (${split})` : ''}` : '📣 No posts published in the last 7 days.');
  for (const p of published.slice(0, 3)) if (p.url) out.push(`- [${LABELS[p.platform] || p.platform} · ${p.postedAt.slice(0, 10)}](${p.url})`);
  if (pending.length) {
    out.push(`⏳ **${pending.length}** draft${pending.length === 1 ? '' : 's'} awaiting your ✅ — [review](${pendingUrl})`);
    for (const pr of pending.slice(0, 3)) out.push(`- [#${pr.number} ${oneLine(pr.title, 80).replace(/[[\]`]/g, '')}](${pr.url})`);
  } else {
    out.push('✅ No drafts waiting on approval.');
  }
  return out.join('\n');
}

export const NOTE_PLACEHOLDER = "_No note yet — Marjorie adds one each morning._";

/** The note sits between marker comments so the brief routine can rewrite it without touching the rest. */
export function renderNote({ text, date }) {
  const body = String(text || '').trim() || NOTE_PLACEHOLDER;
  return ['## 🗒️ Marjorie\'s note', '', `<!-- marjorie-note:start date=${date || 'none'} -->`, body, '<!-- marjorie-note:end -->'].join('\n');
}
