// Composes the status page body (Bots v2 W4) from already-fetched data.
// Pure: same input, same output; the clock is a parameter.
import { neutralizeHtmlComments } from './html-safe.mjs';
import { renderForFans } from './status-fans.mjs';
import { renderNeedsYou } from './status-ha.mjs';
import { pingMarker } from './status-ping.mjs';
import { renderShipped, SHIPPED_WINDOW_DAYS } from './status-shipped.mjs';
import { readHeldRegion, renderHeldSection } from './status-held.mjs';
import { renderGrowth, renderNextUp, renderNote, renderTree } from './status-sections.mjs';
import { renderStrategy } from './status-strategy.mjs';
import { trafficMarker } from './status-traffic.mjs';
import { buildView } from './status-view.mjs';

export const PAGE_MARKER = '<!-- marjorie-status-page v1 -->';
export const BODY_LIMIT = 60_000; // GitHub's issue body cap is 65,536 characters
const NOTE_RE = /<!-- marjorie-note:start date=(\S+) --!?>\n([\s\S]*?)\n<!-- marjorie-note:end --!?>/;
const PING_RE = /<!-- marjorie-ping date=(\S+)(?: msg=(\d+))? --!?>/;
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
  return neutralizeHtmlComments(text)
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
  return `${bits.join(' · ')}\n\n_Reply on this issue: \`done #N\`, \`skip #N <why>\`, \`close #N <why>\` or \`decide #N <anything>\`. Updated hourly and whenever human actions change._`;
}

function compose(data, now, repo, behindLines) {
  const view = buildView(data, now);
  const { items, closing, shipped, fans, behind, inFlight } = view;
  const warnings = data.warnings || [];
  const updated = new Date(now);
  const strategy = renderStrategy({ bullets: data.strategy?.bullets, changedAt: data.strategy?.changedAt }, { repo });
  const markers = [PAGE_MARKER, ...(data.pingState ? [pingMarker(data.pingState)] : []), ...(data.traffic ? [trafficMarker(data.traffic)] : [])];
  const parts = [
    markers.join('\n'),
    '# 📋 Long Live — Status',
    `_Updated ${updated.toISOString().slice(0, 16).replace('T', ' ')} UTC · ${pt(updated)} PT_`,
    glance({ items, shipped, prs: inFlight }),
    ...(warnings.length ? [`⚠️ Couldn't read: ${warnings.join(', ')} — those sections may be incomplete.`] : []),
    warnings.includes('HUMAN-ACTIONS.md')
      ? '## 🙋 Needs you\n\n_Could not read HUMAN-ACTIONS.md this run — see the repo file directly._'
      : renderNeedsYou(items, { repo, now, closing }),
    ...(strategy ? [strategy] : []),
    renderForFans({ fans, posted: data.posted || [], feedback: data.feedback ?? null, recap: data.recap || '' }),
    renderShipped(behind, {
      hidden: view.filtered, maxLines: behindLines, collapse: true,
      heading: `## 🔧 Behind the scenes (last ${SHIPPED_WINDOW_DAYS} days)`,
    }),
    renderNextUp({ plan: data.plan, prs: inFlight }, { now }),
    ...(renderHeldSection(data.held) ? [renderHeldSection(data.held)] : []),
    renderGrowth({ latest: data.metricsLatest, prior: data.metricsPrior, traffic: data.traffic || null }),
    renderTree({ published: data.posted, pending: data.draftPrs, pendingUrl: `https://github.com/${repo}/pulls?q=is%3Apr+is%3Aopen+label%3Asocial-draft` }),
    renderNote({ text: sanitizeNote(data.note?.text), date: data.note?.date }),
  ];
  if (data.ping) parts.push(`<!-- marjorie-ping date=${data.ping.date}${data.ping.msg ? ` msg=${data.ping.msg}` : ''} -->`);
  return `${parts.join('\n\n')}\n`;
}

/** What the change-ping compares: the page's meaningful content, never its timestamp. */
export const statusSnapshot = (data, now) => buildView(data, now).snapshot;

/** Renders the page, trimming the Behind-the-scenes list until it fits under BODY_LIMIT. */
export function renderStatusPage(data, { now = Date.now(), repo }) {
  for (const lines of [60, 30, 12, 4, 0]) {
    const body = compose(data, now, repo, lines);
    if (body.length <= BODY_LIMIT) return body;
  }
  return compose(data, now, repo, 0).slice(0, BODY_LIMIT);
}
