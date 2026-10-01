// "Held" items on the status page (Bots v2 W4): dispatched issues whose chase
// Marjorie stopped because a human action was closed/skipped or the issue was
// deferred. Showing them on the page IS the report, and the hidden
// `marjorie-held` markers beside each line are what dispatch-chase-state.mjs
// reads (as `reportedHeld`) so the brief never re-announces the same item.
//
// These markers are written only by status-note.mjs (stamp-held), never by the
// agent: sanitizeNote strips every comment marker out of agent text.
const REGION = /<!-- marjorie-held:start -->\n([\s\S]*?)\n<!-- marjorie-held:end -->/;
const MARKER = /<!--\s*marjorie-held:\s*issue=(\d+)\s+ha=(\d+)\s*-->/g;
export const HELD_HEADING = '## ⏸️ Held — chase stopped';
const TITLE_CAP = 80;
const MAX_ENTRIES = 20;

/** Issue titles are public input: no markers, mentions, or markdown link syntax. */
function plainTitle(title) {
  const flat = String(title || '').replace(/<!--|-->/g, '').replace(/[[\]`]/g, '').replace(/(^|[^\w`])@(?=\w)/g, '$1@​').replace(/\s+/g, ' ').trim();
  return flat.length > TITLE_CAP ? `${flat.slice(0, TITLE_CAP - 1).trimEnd()}…` : flat;
}

/** Entries from evaluateDispatchChase's items: the ones whose verdict is `held`. */
export function heldEntries(items) {
  return (items || []).filter((item) => item?.verdict === 'held').slice(0, MAX_ENTRIES).map((item) => ({
    issue: Number(item.number),
    ha: Number(item.held?.number || 0),
    status: item.held?.status || 'deferred',
    title: plainTitle(item.issue?.title),
  }));
}

const reason = (e) => (e.ha ? `HA #${e.ha} ${e.status === 'skip' ? 'skipped' : 'closed'}` : 'deferred');

export function renderHeldRegion(entries) {
  if (!entries.length) return '';
  const lines = entries.map((e) => `- #${e.issue} ${e.title} (${reason(e)}) <!-- marjorie-held: issue=${e.issue} ha=${e.ha} -->`);
  return ['<!-- marjorie-held:start -->', ...lines, '<!-- marjorie-held:end -->'].join('\n');
}

/** The region's inner text, kept verbatim across re-renders ('' when there is none). */
export function readHeldRegion(body) {
  const m = REGION.exec(String(body || '').replace(/\r\n/g, '\n'));
  return m ? m[1] : '';
}

/** Every held marker anywhere in a body: what the chase has already reported. */
export function readHeldMarkers(body) {
  return [...String(body || '').matchAll(MARKER)].map((m) => ({ issue: Number(m[1]), ha: Number(m[2]) }));
}

/** The page section: the preserved region under a plain heading, or nothing. */
export function renderHeldSection(regionText) {
  if (!String(regionText || '').trim()) return '';
  return `${HELD_HEADING}\n\n<!-- marjorie-held:start -->\n${regionText}\n<!-- marjorie-held:end -->`;
}

/** Replaces (or removes) the held section of a body. Pure. */
export function replaceHeld(body, entries) {
  const src = String(body || '').replace(/\r\n/g, '\n');
  const section = entries.length ? renderHeldSection(renderHeldRegion(entries).split('\n').slice(1, -1).join('\n')) : '';
  const existing = new RegExp(`${HELD_HEADING}\\n\\n<!-- marjorie-held:start -->\\n[\\s\\S]*?\\n<!-- marjorie-held:end -->`);
  if (existing.test(src)) return src.replace(existing, section).replace(/\n{3,}/g, '\n\n');
  if (!section) return src;
  const noteAt = src.indexOf("## 🗒️ Marjorie's note");
  if (noteAt === -1) return `${src.replace(/\s+$/, '')}\n\n${section}\n`;
  return `${src.slice(0, noteAt)}${section}\n\n${src.slice(noteAt)}`;
}
