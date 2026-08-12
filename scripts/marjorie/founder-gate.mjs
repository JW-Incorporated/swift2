// Which asks are LEGITIMATELY founder-gated — and which have already been
// answered and should have stopped appearing.
//
// ─── THE BUG THIS REPLACES ────────────────────────────────────────────────
// Across the 11 briefs from 2026-07-31 to 2026-08-11 the founders were shown
// **26 checklist line-items that reduce to 5 distinct asks**, and **not one
// checkbox was ever ticked**. The reason is structural, not cosmetic: the
// brief only ever parsed the PREVIOUS BRIEF'S CHECKBOXES. A founder who
// answered on the ticket instead was invisible.
//
// The proof, from real data:
//   • #799 "turn on visitor analytics" — Joey commented **"Done"** on the
//     issue at 2026-08-01T14:19Z, and the issue was already closed on 07-29.
//     The brief asked for it again on 08-02, 08-03, 08-04, 08-05 and 08-06.
//     Five briefs, after the answer, on a closed ticket.
//   • #979 "turn on the security scanners" — asked in all 11 briefs. Twenty
//     days. Answered on the ticket, never in a checkbox.
//
// So a founder answering the way a founder naturally answers — on the thing
// itself — could not clear an item, and the checklist could only ever grow.
//
// ─── WHAT THIS MODULE DOES INSTEAD ────────────────────────────────────────
// An ask is resolved if ANY of these is true, in this order:
//   1. its issue is CLOSED;
//   2. a founder commented on it after the ask was last raised;
//   3. the previous brief's box was ticked *and* the brief body's last edit
//      was founder-authored (the old path, kept — it is still valid).
// Resolution is reported with its evidence so the journal can prove it.
//
// It also counts REPEATS. Any ask that has survived 3+ briefs stops being a
// polite checklist line and becomes an escalation: something that has been
// asked twenty times is not a task, it is a broken loop, and saying so is the
// only useful thing left to do with it.

const FOUNDER_LOGINS = ['sffan15-sys', 'wjduvall-cmd'];
const DAY_MS = 86_400_000;

export function isFounder(login) {
  return FOUNDER_LOGINS.includes(String(login || ''));
}

// Things no agent can perform, however willing: they need a human signed in to
// a third-party console, a payment instrument, or legal authority. These
// ENRICH the reason shown to the founders; they never decide gating on their
// own. A first cut let them decide, and immediately classified the brief issue
// "Founders' Brief — 2026-07-31" as needing legal sign-off (its body quotes
// the words "terms of service") and #1869, a build ticket, as needing a
// founder credential (its body says "token"). Keyword matching over arbitrary
// issue bodies is a false-positive machine; membership in the decision bank is
// a fact.
const GATE_HINTS = [
  [/\b(billing|payment method|invoice|budget cap|purchase|buy)\b/i, 'needs billing/payment access'],
  [/\b(vercel|supabase|gmail|slack|meta|instagram|tiktok)\b.{0,20}\b(dashboard|console|settings|account|toggle)\b/i, 'needs a third-party console login'],
  [/\b(app password|2fa|two-factor|rotate the secret)\b/i, 'needs a credential only a founder holds'],
  [/\b(counsel|lawyer|attorney|legal review)\b/i, 'needs legal sign-off'],
  [/\b(go\/no-go|launch decision|product direction|pricing)\b/i, 'non-ratchetable: founders-only by charter'],
];

/**
 * Is this genuinely founder-gated — i.e. can NO agent do it?
 *
 * The charter's own test (§ Brief format 2): "could an agent answer this
 * itself? Asks that agents can self-serve never reach the checklist." That is
 * a judgment call in prose; here it is a rule with named reasons, so the
 * classification is auditable and identical every run.
 *
 * Gating is decided by PROVABLE membership, not by prose:
 *   • the `founder-decision` label — the bank is the mechanism the charter
 *     defines, and filing into it is a deliberate act;
 *   • tier TX in the issue form — the form's own founder-only tier;
 *   • a launch-gate ticket whose TITLE names a founder-only act.
 * Everything else is a desk's job, whatever words its body happens to contain.
 */
export function classifyFounderGate(issue) {
  const labels = (issue.labels || []).map((l) => (typeof l === 'string' ? l : l.name));
  const body = issue.body || '';
  const title = issue.title || '';
  const reasons = [];

  // Briefs quote every open ask by construction; they are never asks themselves.
  if (labels.includes('founders-brief')) return { gated: false, reasons: [] };

  if (labels.includes('founder-decision')) reasons.push('banked as a founder-decision');
  if (/###\s*Tier[^\n]*\n+\s*TX\b/i.test(body) || /\bTX\s*—\s*founder-only/i.test(body)) reasons.push('tier TX — founder-only');
  if (labels.includes('launch-gate')) {
    for (const [re, why] of GATE_HINTS) if (re.test(title)) { reasons.push(why); break; }
  }
  if (reasons.length === 0) return { gated: false, reasons: [] };

  // Now that gating is established, add colour from the body.
  for (const [re, why] of GATE_HINTS) {
    if (!reasons.includes(why) && re.test(`${title}\n${body}`)) reasons.push(why);
  }
  return { gated: true, reasons };
}

/**
 * Every `#NNN` a brief body links or mentions, with the checkbox state of the
 * line it appeared on. Used to count how many briefs have carried each ask.
 */
export function asksInBrief(body) {
  const out = [];
  for (const line of String(body || '').split('\n')) {
    const m = line.match(/^\s*[-*]\s*\[([ xX])\]\s*(.*)$/);
    if (!m) continue;
    const ticked = m[1].toLowerCase() === 'x';
    const nums = [...m[2].matchAll(/(?:issues|pull)\/(\d+)|#(\d+)/g)]
      .map((x) => Number(x[1] || x[2]))
      .filter((n) => Number.isFinite(n));
    out.push({ ticked, text: m[2].trim(), issues: [...new Set(nums)] });
  }
  return out;
}

/**
 * How many consecutive briefs have carried each ask, and since when.
 * `briefs` is newest-first: `[{ number, createdAt, body }]`.
 */
export function askHistory(briefs) {
  const hist = new Map();
  for (const b of briefs) {
    for (const ask of asksInBrief(b.body)) {
      for (const n of ask.issues) {
        const prev = hist.get(n) || { issue: n, timesAsked: 0, firstAskedAt: b.createdAt, lastAskedAt: b.createdAt, everTicked: false, briefs: [] };
        prev.timesAsked += 1;
        prev.everTicked = prev.everTicked || ask.ticked;
        prev.briefs.push(b.number);
        // briefs arrive newest-first, so each later entry is older
        prev.firstAskedAt = b.createdAt;
        if (new Date(b.createdAt) > new Date(prev.lastAskedAt)) prev.lastAskedAt = b.createdAt;
        hist.set(n, prev);
      }
    }
  }
  return hist;
}

/**
 * Resolve one ask against its OWN state. `issue` carries `state`, `closedAt`
 * and `comments: [{ author, createdAt, body }]`.
 *
 * `raisedAt` is when the ask was last put in front of the founders; a founder
 * comment older than that was already seen and is not a new answer.
 */
export function resolveAsk(issue, { raisedAt = null, previousBrief = null } = {}) {
  if (String(issue.state || '').toLowerCase() === 'closed') {
    return { resolved: true, how: 'closed', at: issue.closedAt, evidence: `issue #${issue.number} is closed` };
  }

  const since = raisedAt ? new Date(raisedAt).getTime() : 0;
  const founderComments = (issue.comments || [])
    .filter((c) => isFounder(c.author?.login ?? c.author))
    .filter((c) => new Date(c.createdAt).getTime() >= since)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (founderComments.length > 0) {
    const c = founderComments[0];
    return {
      resolved: true,
      how: 'answered-on-ticket',
      at: c.createdAt,
      by: c.author?.login ?? c.author,
      evidence: `${c.author?.login ?? c.author} commented on #${issue.number}: "${String(c.body).replace(/\s+/g, ' ').trim().slice(0, 120)}"`,
    };
  }

  // The legacy path, still valid: a ticked box on a brief whose body was last
  // edited by a founder. Charter § Decision processing.
  if (previousBrief?.founderEditedBody) {
    const ticked = asksInBrief(previousBrief.body).find((a) => a.ticked && a.issues.includes(issue.number));
    if (ticked) {
      return { resolved: true, how: 'ticked-in-brief', at: previousBrief.createdAt, evidence: `box ticked on brief #${previousBrief.number} (body last edited by a founder)` };
    }
  }

  return { resolved: false };
}

/** 3+ briefs without an answer means the loop is broken, not the founder slow. */
export const ESCALATE_AFTER = 3;

/**
 * …and so does an item that has sat in the bank this long WITHOUT ever being
 * asked. On 2026-08-11 six founder-decision issues were open; four of them
 * (#459 at 31 days, #530 at 29, #725 and #710 at 25) had never once appeared
 * on a brief checklist. The old brief showed one ask a day and quietly grew a
 * backlog behind it. Age alone is an escalation trigger.
 */
export const ESCALATE_AGE_DAYS = 21;

/**
 * The founder-gated section of the brief, fully decided before any prose.
 *
 * Returns `{ open, resolved, escalated, phantom }`:
 *   open      — genuinely still needs a founder, asked < ESCALATE_AFTER times
 *   escalated — still needs a founder, asked ESCALATE_AFTER+ times. These get
 *               one loud line, not a polite checkbox.
 *   resolved  — answered since the last brief; drop from the checklist and say
 *               so once, with the evidence
 *   phantom   — was on the checklist but its issue is closed: proof the loop
 *               leaked, kept so the journal can count them
 */
export function partitionAsks(issues, { briefs = [], now = Date.now(), freshDays = 3 } = {}) {
  const hist = askHistory(briefs);
  const previousBrief = briefs[0] || null;
  const open = [];
  const resolved = [];
  const escalated = [];
  const phantom = [];

  for (const issue of issues) {
    const h = hist.get(issue.number);
    const gate = classifyFounderGate(issue);
    const res = resolveAsk(issue, { raisedAt: h?.lastAskedAt ?? null, previousBrief });
    const item = {
      number: issue.number,
      title: issue.title,
      url: issue.url,
      gated: gate.gated,
      gateReasons: gate.reasons,
      timesAsked: h?.timesAsked ?? 0,
      firstAskedAt: h?.firstAskedAt ?? null,
      daysOpen: issue.createdAt ? Math.floor((now - new Date(issue.createdAt).getTime()) / DAY_MS) : null,
      resolution: res,
    };
    if (res.resolved) {
      // Only report clearing something the founders were actually asked for,
      // and only while it is still news. Otherwise "cleared since the last
      // brief" fills with every ticket the org has ever closed.
      const askedRecently = (h?.timesAsked ?? 0) > 0
        && (!h.lastAskedAt || now - new Date(h.lastAskedAt).getTime() <= freshDays * DAY_MS);
      const resolvedRecently = res.at && now - new Date(res.at).getTime() <= freshDays * DAY_MS;
      if ((h?.timesAsked ?? 0) > 0 && (askedRecently || resolvedRecently)) {
        resolved.push(item);
        // Closed, yet still being asked for: the loop leaked. Count it.
        if (res.how === 'closed' && askedRecently) phantom.push(item);
      }
      continue;
    }
    if (!gate.gated) continue; // an agent can do it: it is not a founder ask
    item.escalateReason = item.timesAsked >= ESCALATE_AFTER
      ? `asked ${item.timesAsked}× and still open`
      : (item.daysOpen ?? 0) >= ESCALATE_AGE_DAYS
        ? `banked ${item.daysOpen}d ago${item.timesAsked === 0 ? ', never once put in front of you' : ''}`
        : null;
    (item.escalateReason ? escalated : open).push(item);
  }

  const byAge = (a, b) => (b.timesAsked - a.timesAsked) || ((b.daysOpen ?? 0) - (a.daysOpen ?? 0));
  return { open: open.sort(byAge), escalated: escalated.sort(byAge), resolved, phantom };
}
