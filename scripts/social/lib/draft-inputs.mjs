// Pure half of Tree's daily-draft pre-compute (Bots v2 W8). Everything the
// model used to FIND with searches and PR diffs — today's calendar slots, which
// are already drafted, the never-used photo for each, the active rules, the
// owner's recent rejection reasons, uncovered time-sensitive events — is
// computed here before the model starts and handed over as one JSON file, so
// the model selects and writes instead of searching. I/O lives in
// ../prepare-draft-inputs.mjs.
import { keywordsOf, textMatches } from '../../marjorie/lib/growth-coverage.mjs';
import { parseLessons } from './lessons.mjs';
import { assignBeatPhotos, buildPhotoLedger, eraAvailability } from './photo-ledger.mjs';

export const DAY_MS = 86_400_000;
/** Step 3 of the prompt: at this many queued/open items the calendar has runway — skip calendar drafting. */
export const BACKLOG_SKIP_AT = 8;
export const EVENT_WINDOW_HOURS = 48;
const BEAT_TEXT_MAX = 2800;
const EVENTS_MAX = 5;

export const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10);

/** `## YYYY-MM-DD (Dow) — …` sections of social/calendar.md for the requested days. */
export function parseCalendarBeats(markdown, days) {
  const lines = String(markdown ?? '').split('\n');
  const starts = [];
  lines.forEach((line, i) => {
    const m = /^## (\d{4}-\d{2}-\d{2}) \(/.exec(line);
    if (m) starts.push({ day: m[1], i });
    else if (/^## /.test(line)) starts.push({ day: null, i });
  });
  return days.map((day) => {
    const k = starts.findIndex((s) => s.day === day);
    if (k === -1) return { date: day, heading: null, text: null };
    const end = k + 1 < starts.length ? starts[k + 1].i : lines.length;
    const text = lines.slice(starts[k].i + 1, end).join('\n').trim();
    return { date: day, heading: lines[starts[k].i].replace(/^## /, ''), text: text.length > BEAT_TEXT_MAX ? `${text.slice(0, BEAT_TEXT_MAX)} …[truncated]` : text };
  });
}

/**
 * Re-draft requests Tree left in social/calendar.md while answering a Marjorie ask
 * (docs/agents/runner-prompts/tree-ask-response.md): one line per ask, anywhere in the
 * file, `RE-DRAFT ask #<N> by <YYYY-MM-DD>: <items to draft again>` (a leading `> `,
 * `- ` or bold is fine). Read here, not from the day sections, so a long section's
 * truncation can never hide one. Past its `by` day a request is dropped; one whose
 * ask is already named (`ask #<N>`) in a held or posted item's `why` is marked drafted.
 */
export function parseRedraftNotes(markdown, today, social = []) {
  const notes = [];
  for (const line of String(markdown ?? '').split('\n')) {
    const m = /^\s*(?:[>*-]\s*)*\**RE-DRAFT\**\s+ask\s+#(\d+)\s+by\s+(\d{4}-\d{2}-\d{2})\s*:\s*(.+?)\s*\**\s*$/i.exec(line);
    if (!m || m[2] < today) continue;
    const ask = Number(m[1]);
    const named = new RegExp(`ask #${ask}\\b`, 'i');
    notes.push({ ask, by: m[2], items: m[3].slice(0, 400), alreadyDrafted: social.some(({ data }) => named.test(String(data?.why ?? ''))) });
  }
  return notes;
}

/** The calendar's `| MM-DD | \`photoId\` | …` assignment table → Map<MM-DD, photoId> (a hint, never a command). */
export function parsePhotoHints(markdown) {
  const hints = new Map();
  for (const line of String(markdown ?? '').split('\n')) {
    const m = /^\|\s*(\d{2}-\d{2})\s*\|\s*`([a-z0-9][a-z0-9-]*)`/.exec(line);
    if (m) hints.set(m[1], m[2]);
  }
  return hints;
}

/** Which items already cover `day` (UTC): grouped by campaign with their platforms. */
export function filledBeats(items, day) {
  const byCampaign = new Map();
  for (const { ref, data } of items) {
    if (typeof data?.scheduledAt !== 'string' || data.scheduledAt.slice(0, 10) !== day) continue;
    const key = data.campaign ?? ref;
    if (!byCampaign.has(key)) byCampaign.set(key, { campaign: data.campaign ?? null, platforms: [], where: ref });
    byCampaign.get(key).platforms.push(data.platform);
  }
  return [...byCampaign.values()];
}

/** Active rules the drafter must obey, in the words that matter (not the whole ledger). */
export function activeRules(lessonsMarkdown) {
  return parseLessons(String(lessonsMarkdown ?? '')).active.map((r) => ({ id: r.id, title: r.title, rule: r.soI, timesFired: r.timesFired }));
}

/**
 * The owner's `reject:` reasons on social-draft PRs closed in the last 14 days.
 * A `retired:` close (the stale-draft sweep) is NOT a rejection and carries no reason.
 */
export function recentRejections(closedPrs, nowMs, days = 14) {
  const out = [];
  for (const pr of closedPrs ?? []) {
    if (!(Date.parse(pr.closedAt) >= nowMs - days * DAY_MS)) continue;
    const reasons = (pr.comments ?? []).map((c) => String(c.body ?? '')).filter((b) => b.startsWith('reject:')).map((b) => b.slice(0, 400));
    if (reasons.length) out.push({ pr: pr.number, closedAt: pr.closedAt, reasons });
  }
  return out;
}

/** Intake issues from the last 48h that no posted/queued/open-PR social item already covers. */
export function uncoveredEvents(intakeIssues, socialItems, nowMs, hours = EVENT_WINDOW_HOURS) {
  const events = (intakeIssues ?? [])
    .filter((i) => /^intake:/i.test(i.title ?? '') && Date.parse(i.createdAt) >= nowMs - hours * 3_600_000)
    .map((issue) => {
      const keywords = keywordsOf(issue.title);
      const covered = socialItems.some(({ data }) => textMatches(`${data?.body ?? ''} ${data?.campaign ?? ''} ${data?.why ?? ''}`, keywords));
      return { number: issue.number, headline: String(issue.title).replace(/^intake:\s*/i, '').slice(0, 140), createdAt: issue.createdAt, covered };
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return { uncovered: events.filter((e) => !e.covered).slice(0, EVENTS_MAX), considered: events.length };
}

/** Fast-lane intents from social/inbox/: which are open, which have already passed their deadline. */
export function inboxSummary(intents, nowMs) {
  return (intents ?? [])
    .filter(({ data }) => data?.status === 'open')
    .map(({ file, data }) => ({ file, id: data.id, lane: data.lane, deadline: data.deadline, expired: Date.parse(data.deadline) < nowMs }));
}

/**
 * Assembles the model's inputs. `data`: `{ now, library, calendarMd, lessonsMd,
 * posted, queue, openDrafts, closedPrs, intents, intakeIssues, eventStatus,
 * igUsable (Set of Instagram-acceptable photo ids, or null = unchecked), warnings }` — each of posted/queue/openDrafts an array of `{ ref, data }`.
 */
export function buildDraftInputs(d) {
  const nowMs = Date.parse(d.now);
  const today = utcDay(nowMs);
  const days = [today, utcDay(nowMs + DAY_MS)];
  const ledger = buildPhotoLedger(d.library, { posted: d.posted, queue: d.queue, openDrafts: d.openDrafts }, { igUsable: d.igUsable ?? null });
  const held = [...d.queue, ...d.openDrafts];
  const hints = parsePhotoHints(d.calendarMd);
  const beats = parseCalendarBeats(d.calendarMd, days).map((b) => {
    const filled = filledBeats(held, b.date);
    const complete = filled.some((f) => f.platforms.includes('x') && f.platforms.includes('instagram'));
    return { ...b, filled, needsDraft: b.text !== null && !complete };
  });
  // One extra, hint-less slot: the spare photo a same-day EVENT draft takes, distinct from every calendar beat's.
  const assignedAll = assignBeatPhotos([...beats.filter((b) => b.needsDraft).map((b) => ({ date: b.date, hintId: hints.get(b.date.slice(5)) })), { date: 'event' }], ledger);
  const assigned = assignedAll.filter((a) => a.date !== 'event');
  const eventPhoto = assignedAll.find((a) => a.date === 'event')?.photo ?? null;
  const photoByDate = new Map(assigned.map((a) => [a.date, a]));
  const outBeats = beats.map((b) => ({ ...b, photo: photoByDate.get(b.date)?.photo ?? null, photoFromCalendar: photoByDate.get(b.date)?.fromCalendar ?? false }));
  const assignedIds = assignedAll.map((a) => a.photo?.photoId).filter(Boolean);
  const backlog = held.length;
  const social = [...d.posted, ...d.queue, ...d.openDrafts];
  return {
    v: 1,
    generatedAt: d.now,
    today,
    budget: { maxToolCalls: 30, maxNewItems: 4, note: 'Every fact below was computed before you started — do not re-derive it. Open the PR as soon as the checker passes; the listening scan comes AFTER the PR.' },
    backlog: { heldItems: backlog, skipCalendarDrafting: backlog >= BACKLOG_SKIP_AT, skipAt: BACKLOG_SKIP_AT },
    beats: outBeats,
    redrafts: parseRedraftNotes(d.calendarMd, today, social),
    eventPhoto,
    photos: {
      library: ledger.total,
      neverUsed: ledger.eligible.length,
      neverUsedButNotInstagramSized: ledger.igBlockedUnused,
      heldInOpenPrs: [...ledger.used.entries()].filter(([, w]) => w.some((x) => x.kind === 'open-pr')).map(([id]) => id),
      eras: eraAvailability(d.library, ledger, assignedIds),
    },
    rules: activeRules(d.lessonsMd),
    rejections: recentRejections(d.closedPrs, nowMs),
    events: { status: d.eventStatus ?? null, ...uncoveredEvents(d.intakeIssues, social, nowMs) },
    inbox: inboxSummary(d.intents, nowMs),
    warnings: d.warnings ?? [],
  };
}

/** One-screen summary of the inputs, for the job log and the failure receipt. */
export function summarizeInputs(inputs) {
  const beatLine = (b) => `${b.date}: ${b.text === null ? 'no calendar entry' : b.needsDraft ? `needs a pair${b.photo ? ` · photo ${b.photo.photoId}${b.photo.mediaCredit ? '' : ' (no credit line)'}` : ' · NO never-used photo left'}` : 'already drafted'}`;
  const exhausted = Object.entries(inputs.photos.eras).filter(([, e]) => e.exhausted).map(([era]) => era);
  return [
    `tree-inputs ${inputs.today}: held ${inputs.backlog.heldItems}/${inputs.backlog.skipAt}${inputs.backlog.skipCalendarDrafting ? ' (calendar drafting skipped)' : ''}`,
    ...inputs.beats.map((b) => `  ${beatLine(b)}`),
    ...inputs.redrafts.map((r) => `  re-draft ask #${r.ask} by ${r.by}: ${r.alreadyDrafted ? 'already drafted' : r.items.slice(0, 80)}`),
    `  photos: ${inputs.photos.neverUsed}/${inputs.photos.library} drawable (never used AND Instagram-sized; ${inputs.photos.neverUsedButNotInstagramSized} more never-used are outside IG's 0.8-1.91 aspect window); held by open PRs: ${inputs.photos.heldInOpenPrs.join(', ') || 'none'}; era-exhausted: ${exhausted.join(', ') || 'none'}`,
    `  rules: ${inputs.rules.map((r) => r.id).join(', ') || 'none'} · recent rejections: ${inputs.rejections.length} · uncovered events: ${inputs.events.uncovered.length} · open intents: ${inputs.inbox.length}`,
    ...inputs.warnings.map((w) => `  ! ${w}`),
  ].join('\n');
}
