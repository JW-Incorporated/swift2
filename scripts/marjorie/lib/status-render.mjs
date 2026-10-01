// Composes the status page body (Bots v2 W4) from already-fetched data.
// Pure: same input, same output; the clock is a parameter.
import { parseHaEntries, renderNeedsYou } from './status-ha.mjs';
import { noiseRuleFor, renderShipped, selectShipped, SHIPPED_WINDOW_DAYS } from './status-shipped.mjs';
import { readHeldRegion, renderHeldSection } from './status-held.mjs';
import { renderGrowth, renderNextUp, renderNote, renderTree } from './status-sections.mjs';

export const PAGE_MARKER = '<!-- marjorie-status-page v1 -->';
export const BODY_LIMIT = 60_000; // GitHub's issue body cap is 65,536 characters
const NOTE_RE = /<!-- marjorie-note:start date=(\S+) -->\n([\s\S]*?)\n<!-- marjorie-note:end -->/;
const PING_RE = /<!-- marjorie-ping date=(\S+)(?: msg=(\d+))? -->/;
const PLACEHOLDER = /^_No note yet/;

/** Marjorie's note and delivery stamp, read back out of an existing body so a re-render keeps them. */
export function readPreserved(body) {
  const text = String(body || '').replace(/\r\n/g, '\n');
  const note = NOTE_RE.exec(text);
  const ping = PING_RE.exec(text);
  const noteText = note && !PLACEHOLDER.test(note[2].trim()) ? note[2].trim() : '';
  return {
    note: { text: noteText, date: note && note[1] !== 'none' ? note[1] : '' },
    ping: ping ? { date: ping[1], msg: ping[2] || '' } : null,
    held: readHeldRegion(text),
  };
}

/** Agent-written text is published to a public issue: no marker injection, no live @-mentions. */
export function sanitizeNote(text) {
  return String(text || '')
    .replace(/<!--|-->/g, '')
    .replace(/(^|[^\w`])@(?=\w)/g, '$1@​')
    .trim();
}

const pt = (now) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' }).format(now);

function glance({ items, shipped, prs }) {
  const blocking = items.filter((i) => i.tag === 'BLOCKING').length;
  const decide = items.filter((i) => i.tag === 'DECIDE').length;
  const other = items.length - blocking - decide;
  const bits = [`🔴 ${blocking} blocking`, `🟡 ${decide} to decide`];
  if (other) bits.push(`🟢 ${other} upgrade${other === 1 ? '' : 's'}`);
  bits.push(`🚢 ${shipped.length} shipped`, `🧭 ${prs.length} in flight`);
  return `${bits.join(' · ')}\n\n_Reply on this issue: \`done #N\` or \`decide #N <choice>\`. Updated every 3 hours and whenever human actions change._`;
}

function compose(data, now, repo, shippedLines) {
  const items = parseHaEntries(data.haMarkdown);
  const warnings = data.warnings || [];
  const windowMerged = data.mergedPrs.filter((pr) => pr.mergedAt && now - Date.parse(pr.mergedAt) <= SHIPPED_WINDOW_DAYS * 86_400_000);
  const shipped = selectShipped(data.mergedPrs, now);
  const pendingClose = new Map();
  for (const pr of data.openPrs) {
    const m = /^close ha #(\d+)/i.exec(pr.title);
    if (m) pendingClose.set(Number(m[1]), pr);
  }
  const inFlight = data.openPrs.filter((pr) => !pr.draft && !noiseRuleFor(pr));
  const updated = new Date(now);
  const parts = [
    PAGE_MARKER,
    '# 📋 Long Live — Status',
    `_Updated ${updated.toISOString().slice(0, 16).replace('T', ' ')} UTC · ${pt(updated)} PT_`,
    glance({ items, shipped, prs: inFlight }),
    ...(warnings.length ? [`⚠️ Couldn't read: ${warnings.join(', ')} — those sections may be incomplete.`] : []),
    warnings.includes('HUMAN-ACTIONS.md')
      ? '## 🙋 Needs you\n\n_Could not read HUMAN-ACTIONS.md this run — see the repo file directly._'
      : renderNeedsYou(items, { repo, now, pendingClose }),
    renderShipped(shipped, { hidden: windowMerged.length - shipped.length, maxLines: shippedLines }),
    renderNextUp({ plan: data.plan, prs: inFlight }, { now }),
    ...(renderHeldSection(data.held) ? [renderHeldSection(data.held)] : []),
    renderGrowth({ latest: data.metricsLatest, prior: data.metricsPrior }),
    renderTree({ published: data.posted, pending: data.draftPrs, pendingUrl: `https://github.com/${repo}/pulls?q=is%3Apr+is%3Aopen+label%3Asocial-draft` }),
    renderNote({ text: sanitizeNote(data.note?.text), date: data.note?.date }),
  ];
  if (data.ping) parts.push(`<!-- marjorie-ping date=${data.ping.date}${data.ping.msg ? ` msg=${data.ping.msg}` : ''} -->`);
  return `${parts.join('\n\n')}\n`;
}

/** Renders the page, trimming the Shipped list until it fits under BODY_LIMIT. */
export function renderStatusPage(data, { now = Date.now(), repo }) {
  for (const lines of [60, 30, 12, 4, 0]) {
    const body = compose(data, now, repo, lines);
    if (body.length <= BODY_LIMIT) return body;
  }
  return compose(data, now, repo, 0).slice(0, BODY_LIMIT);
}
