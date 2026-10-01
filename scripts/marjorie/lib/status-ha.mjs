// "Needs you" for the status page (Bots v2 W4). Reads HUMAN-ACTIONS.md
// (format v2: presence = open) and renders one phone-friendly block per open
// item. Deterministic, no LLM.
//
// The existing parser (human-actions.mjs) deliberately keeps only the heading
// fields; the status page also needs each entry's Why/Steps and, for a
// [DECIDE] item, its choices. The v2 format allows no other `**Label:**`, so
// choices live in a Steps line that reads
//   Decide: `accept` — raise the budget; `route` — send it to a desk.
// (or the older "reply with one word: `a`, `b`, or `c`"). An item with no such
// line accepts any short reply as its decision.
import { neutralizeHtmlComments } from './html-safe.mjs';

export const HA_HEADING =/^##\s+#(\d+)\s+(\S*)\s*\[(BLOCKING|DECIDE|UPGRADE)\]\s+(.*?)(?:\s+\(~([^)]*)\))?\s*$/;
const FIELD = /^\*\*([A-Za-z ]+):\*\*\s*(.*)$/;
const STEP_START = /^\s*(?:\d+[.)]|[-*])\s+/;
const OPTION_STEP = /^(?:decide|choose|options?)\s*:|one word/i;
const WHY_CAP = 160;
const WHY_FULL_CAP = 320;
const STEP_CAP = 200;
const OPTION_CAP = 120;

/** GitHub's heading-anchor slug (github-slugger): lowercase, drop everything but letters/digits/_/-/space, spaces to hyphens. */
export function haAnchor(headingLine) {
  const text = headingLine.replace(/^#+\s+/, '').trim().toLowerCase();
  return text.replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '').replace(/ /g, '-');
}

const squash = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const cap = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** First sentence of the Why text, capped to one short line. */
export function oneLineWhy(why) {
  const flat = squash(why).replace(/\*\*/g, '');
  const m = /^(.+?[.!?])(\s|$)/.exec(flat);
  return cap(m ? m[1] : flat, WHY_CAP);
}

/** Backticked choices on the decision line, each with the text after a dash up to the next `;`. */
function optionsFrom(step) {
  const out = [];
  for (const m of step.matchAll(/`([^`\s]+)`(?:\s*[—–-]+\s*([^;`|]*))?/g)) {
    out.push({ choice: m[1], text: cap(squash(m[2]).replace(/[.,]+$/, ''), OPTION_CAP) });
  }
  return out;
}

/** Every open item with its body fields. Pure; input is the file text. */
export function parseHaEntries(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const items = [];
  let cur = null;
  let field = null;
  const flush = () => {
    if (!cur) return;
    const steps = cur.stepLines.map((s) => squash(s.replace(STEP_START, ''))).filter(Boolean);
    const optionStep = cur.tag === 'DECIDE' ? steps.find((s) => OPTION_STEP.test(s)) : undefined;
    const options = optionStep ? optionsFrom(optionStep) : [];
    cur.options = options.length >= 2 ? options : [];
    cur.criteria = steps.filter((s) => !(cur.options.length && s === optionStep)).map((s) => cap(s, STEP_CAP));
    cur.why = oneLineWhy(cur.whyText);
    cur.whyFull = cap(squash(cur.whyText).replace(/\*\*/g, ''), WHY_FULL_CAP);
    cur.steps = steps.map((s) => cap(s, STEP_CAP));
    delete cur.whyText;
    delete cur.stepLines;
    items.push(cur);
  };
  for (const line of lines) {
    const h = HA_HEADING.exec(line);
    if (h) {
      flush();
      cur = {
        number: Number(h[1]), tag: h[3], title: h[4].trim(), eta: h[5] ? `~${h[5].trim()}` : '',
        anchor: haAnchor(line), whyText: '', stepLines: [], filed: null,
      };
      field = null;
      continue;
    }
    if (!cur) continue;
    const filed = /^<!--\s*ha filed=(\d{4}-\d{2}-\d{2})/.exec(line);
    if (filed) { cur.filed = filed[1]; continue; }
    if (/^<!--/.test(line.trim())) continue;
    const f = FIELD.exec(line);
    if (f) {
      field = f[1].toLowerCase();
      if (field === 'why') cur.whyText += ` ${f[2]}`;
      else if (field === 'steps' && f[2]) cur.stepLines.push(f[2]);
      continue;
    }
    if (field === 'why') cur.whyText += ` ${line}`;
    else if (field === 'steps' && line.trim()) {
      if (STEP_START.test(line) || !cur.stepLines.length) cur.stepLines.push(line);
      else cur.stepLines[cur.stepLines.length - 1] += ` ${line.trim()}`;
    }
  }
  flush();
  return items;
}

const GLYPH = { BLOCKING: '🔴', DECIDE: '🟡', UPGRADE: '🟢' };
const AGE_MS = 86_400_000;
const CRITERIA_LINES = 3;

function ageText(filed, now) {
  if (!filed) return '';
  const days = Math.floor((now - Date.parse(`${filed}T00:00:00Z`)) / AGE_MS);
  return Number.isFinite(days) && days >= 0 ? `${days}d` : '';
}

/** Blocking first, then decisions, then upgrades; oldest first within a kind. */
export function sortNeedsYou(items) {
  const rank = { BLOCKING: 0, DECIDE: 1, UPGRADE: 2 };
  return [...items].sort((a, b) => rank[a.tag] - rank[b.tag] || String(a.filed).localeCompare(String(b.filed)) || a.number - b.number);
}

/** `closing` lists items the owner already answered whose close PR has not landed yet: { number, title, summary, pr: { number, url } }. */
export function renderNeedsYou(items, { repo, now = Date.now(), closing = [] } = {}) {
  const base = `https://github.com/${repo}/blob/main/HUMAN-ACTIONS.md`;
  const out = ['## 🙋 Needs you'];
  if (!items.length) out.push('', '_Nothing waiting on you._');
  for (const it of sortNeedsYou(items)) {
    const age = ageText(it.filed, now);
    const meta = [it.eta, age && `waiting ${age}`].filter(Boolean).join(' · ');
    out.push('', `${GLYPH[it.tag]} **#${it.number} — ${it.title}**${meta ? ` · ${meta}` : ''}`);
    const why = it.tag === 'DECIDE' ? it.whyFull : it.why;
    if (why) out.push(why);
    out.push(`📖 [Full instructions](${base}#${it.anchor})`);
    if (it.tag === 'DECIDE') {
      if (it.criteria.length) {
        out.push('How to decide:');
        for (const c of it.criteria.slice(0, CRITERIA_LINES)) out.push(`- ${c}`);
      }
      if (it.options.length) {
        out.push('Options:');
        for (const o of it.options) out.push(`- \`${o.choice}\`${o.text ? ` — ${o.text}` : ''}`);
      }
      out.push(`💬 Reply: \`decide #${it.number} ${it.options[0]?.choice ?? '<your choice>'}\` — or your own words, or \`close #${it.number} <why>\` if it's the wrong question.`);
    } else {
      out.push(`💬 Reply \`done #${it.number}\` when finished, or \`skip #${it.number} <why>\`.`);
    }
  }
  if (closing.length) {
    out.push('', '✅ **Closing — merging now**');
    // The summary is the owner's own words carried through a PR body: no markers, backticks or live mentions.
    const safe = (s) => neutralizeHtmlComments(s).replace(/`/g, "'").replace(/(^|[^\w`])@(?=\w)/g, '$1@​');
    for (const c of closing) out.push(`- #${c.number} — ${c.title}${c.summary ? ` · your answer: ${safe(c.summary)}` : ''} · [PR #${c.pr.number}](${c.pr.url})`);
  }
  return out.join('\n');
}
