// Bots v2 W8: the deterministic pre-compute Tree's daily run reads instead of searching.
import { describe, expect, it } from 'vitest';
import { BACKLOG_SKIP_AT, activeRules, buildDraftInputs, filledBeats, parseCalendarBeats, parsePhotoHints, recentRejections, summarizeInputs, uncoveredEvents } from './lib/draft-inputs.mjs';
import { assignBeatPhotos, buildPhotoLedger, eraAvailability, eraTagsOf, photoIdOf } from './lib/photo-ledger.mjs';

const photo = (id: string, tags: string[] = ['eras-tour'], credit = 'Real Person (CC BY 2.0)') => ({
  id, mediaPath: `/social/library/photos/${id}.jpg`, credit, source: `https://example.com/${id}`, alt: `alt ${id}`, tags,
});
const LIB = [
  photo('a-red-1', ['red', 'eras-tour']), photo('a-red-2', ['red', 'eras-tour']), photo('b-fan-1', ['fan-photo', 'eras-tour']),
  photo('b-fan-2', ['fan-photo', 'eras-tour'], 'u/unknown via r/TaylorSwiftPictures'), photo('c-lover-1', ['lover', 'eras-tour']),
];
const item = (platform: string, photoId: string, campaign: string, scheduledAt = '2026-10-01T23:00:00Z') => ({ platform, photoId, campaign, scheduledAt, body: 'b', why: 'w' });
const entry = (ref: string, data: Record<string, unknown>) => ({ ref, data });

describe('photo ledger', () => {
  it('treats posted, queued and open-PR photos as ineligible and reports where each is held', () => {
    const ledger = buildPhotoLedger(LIB, { posted: [entry('p', item('x', 'a-red-1', 'c1'))], queue: [entry('q', item('x', 'b-fan-1', 'c2'))], openDrafts: [entry('PR #1', item('x', 'c-lover-1', 'c3'))] });
    expect(ledger.eligible.map((e: { id: string }) => e.id)).toEqual(['a-red-2', 'b-fan-2']);
    expect(ledger.used.get('c-lover-1')).toEqual([{ kind: 'open-pr', ref: 'PR #1' }]);
  });

  it('identifies a used photo by its media path when photoId is absent', () => {
    expect(photoIdOf({ media: ['/social/library/photos/a-red-2.jpg'] }, LIB)).toBe('a-red-2');
    expect(photoIdOf({}, LIB)).toBeNull();
  });

  it('drops photos Instagram cannot accept when told which ids are usable, and counts them', () => {
    const ledger = buildPhotoLedger(LIB, {}, { igUsable: new Set(['a-red-1', 'b-fan-1']) });
    expect(ledger.eligible.map((e: { id: string }) => e.id)).toEqual(['a-red-1', 'b-fan-1']);
    expect(ledger.igBlockedUnused).toBe(3);
  });

  it('hands every beat a DISTINCT photo: real credit first, then the calendar hint, then untagged-by-era', () => {
    const ledger = buildPhotoLedger(LIB);
    const out = assignBeatPhotos([{ date: 'd1' }, { date: 'd2', hintId: 'a-red-2' }, { date: 'd3' }], ledger);
    const ids = out.map((o: { photo: { photoId: string } | null }) => o.photo?.photoId);
    expect(new Set(ids).size).toBe(3);
    expect(ids[0]).toBe('b-fan-1'); // strong credit, no era tag
    expect(ids[1]).toBe('a-red-2'); // hint breaks the tie among the remaining strong credits
    expect(out[1].fromCalendar).toBe(true);
    expect(ids).not.toContain('b-fan-2'); // the weak credit is last, so only taken when nothing better remains
  });

  it('gives a beat photo: null (never a repeat) once the pool is spent, and flags a weak credit', () => {
    const ledger = buildPhotoLedger(LIB.slice(3, 4));
    const [first, second] = assignBeatPhotos([{ date: 'd1' }, { date: 'd2' }], ledger);
    expect(first.photo.creditWeak).toBe(true);
    expect(second.photo).toBeNull();
  });

  it('reports era availability, exhausted eras and the next pick per era', () => {
    const ledger = buildPhotoLedger(LIB, { posted: [entry('p', item('x', 'c-lover-1', 'c1'))] });
    const eras = eraAvailability(LIB, ledger);
    expect(eras.lover).toMatchObject({ total: 1, unused: 0, exhausted: true, next: null });
    expect(eras.red).toMatchObject({ total: 2, unused: 2, exhausted: false });
    expect(eras.red.next.photoId).toBe('a-red-1');
    expect(eraAvailability(LIB, ledger, ['a-red-1']).red.next.photoId).toBe('a-red-2');
    expect(eraTagsOf(LIB[2])).toEqual([]);
  });
});

const CALENDAR = `# Social calendar

## 🟢 THE CHANGE
text
### Photo assignment
| Day | IG tile |
|---|---|
| 10-01 | \`b-fan-2\` | u/unknown |
| 10-02 | \`a-red-2\` | named |

## 2026-10-01 (Thu) — Blank Spaces timeline
- **23:00Z** the beat

## 2026-10-02 (Fri) — The Decode
- **23:00Z** the next beat

## Ledger
- not a day
`;

describe('calendar parsing', () => {
  it('extracts exactly the requested day sections, stopping at the next heading', () => {
    const [one, two, three] = parseCalendarBeats(CALENDAR, ['2026-10-01', '2026-10-02', '2026-10-09']);
    expect(one.heading).toBe('2026-10-01 (Thu) — Blank Spaces timeline');
    expect(one.text).toBe('- **23:00Z** the beat');
    expect(two.text).toBe('- **23:00Z** the next beat'); // the "## Ledger" heading ends it
    expect(three).toEqual({ date: '2026-10-09', heading: null, text: null });
  });

  it('reads the photo-assignment table as hints keyed by MM-DD', () => {
    expect([...parsePhotoHints(CALENDAR)]).toEqual([['10-01', 'b-fan-2'], ['10-02', 'a-red-2']]);
  });

  it('groups what already covers a day by campaign with its platforms', () => {
    const items = [entry('PR #1 a', item('instagram', 'a-red-1', 'c1')), entry('PR #1 b', item('x', 'a-red-1', 'c1')), entry('q', item('x', 'b-fan-1', 'c2', '2026-10-02T23:00:00Z'))];
    expect(filledBeats(items, '2026-10-01')).toEqual([{ campaign: 'c1', platforms: ['instagram', 'x'], where: 'PR #1 a' }]);
  });
});

describe('rules, rejections and events', () => {
  it('lists active rules only, with their operative text', () => {
    const md = '### L001 — Never re-use\n\n- **Status:** active\n- **First seen:** 2026-09-21 (PR #1)\n- **Times fired:** 2\n- **Last fired:** 2026-09-22 (PR #2)\n- **Evidence:** [x](u)\n- **Codify:** —\n\n**You said:** "no"\n\n**So I:** do the thing\n';
    expect(activeRules(md)).toEqual([{ id: 'L001', title: 'Never re-use', rule: 'do the thing', timesFired: 2 }]);
  });

  it('keeps reject: reasons from the last 14 days and ignores retired: closes and silent ones', () => {
    const now = Date.parse('2026-10-01T11:00:00Z');
    const prs = [
      { number: 1, closedAt: '2026-09-29T00:00:00Z', comments: [{ body: 'reject: a.json — repeat photos' }, { body: 'nice' }] },
      { number: 2, closedAt: '2026-09-29T00:00:00Z', comments: [{ body: 'retired: open 111h with no founder approval stamp' }] },
      { number: 3, closedAt: '2026-08-01T00:00:00Z', comments: [{ body: 'reject: old' }] },
    ];
    expect(recentRejections(prs, now)).toEqual([{ pr: 1, closedAt: '2026-09-29T00:00:00Z', reasons: ['reject: a.json — repeat photos'] }]);
  });

  it('reports only intake events from the last 48h that no social item covers', () => {
    const now = Date.parse('2026-10-01T11:00:00Z');
    const issues = [
      { number: 10, title: "intake: Taylor Swift's 'Patient Zero' video premieres", createdAt: '2026-09-30T20:00:00Z' },
      { number: 11, title: 'intake: Dior designer confirmed for the wedding dress', createdAt: '2026-09-30T20:00:00Z' },
      { number: 12, title: "intake: Old news about 'Opalite'", createdAt: '2026-09-20T20:00:00Z' },
      { number: 13, title: 'codify: L001', createdAt: '2026-09-30T20:00:00Z' },
    ];
    const social = [entry('p', { body: "the 'Patient Zero' video is here", campaign: 'c', why: 'w' })];
    const out = uncoveredEvents(issues, social, now);
    expect(out.considered).toBe(2);
    expect(out.uncovered.map((e: { number: number }) => e.number)).toEqual([11]);
  });
});

describe('buildDraftInputs', () => {
  const base = {
    now: '2026-10-01T11:00:00Z', library: LIB, calendarMd: CALENDAR, lessonsMd: '', posted: [], queue: [], openDrafts: [], closedPrs: [], intents: [], intakeIssues: [],
  };

  it('assigns each unfilled beat its own never-used photo and leaves a filled beat alone', () => {
    const openDrafts = [entry('PR #1 a', item('instagram', 'a-red-1', 'c1')), entry('PR #1 b', item('x', 'a-red-1', 'c1'))];
    const inputs = buildDraftInputs({ ...base, openDrafts });
    expect(inputs.beats[0]).toMatchObject({ date: '2026-10-01', needsDraft: false, photo: null });
    expect(inputs.beats[1]).toMatchObject({ date: '2026-10-02', needsDraft: true });
    expect(inputs.beats[1].photo.photoId).not.toBe('a-red-1'); // the open-PR draft's photo is spent
    expect(inputs.photos.heldInOpenPrs).toEqual(['a-red-1']);
  });

  it('reserves a spare photo for an event draft, distinct from every beat', () => {
    const inputs = buildDraftInputs(base);
    const beatIds = inputs.beats.map((b: { photo: { photoId: string } | null }) => b.photo?.photoId);
    expect(inputs.eventPhoto).not.toBeNull();
    expect(beatIds).not.toContain(inputs.eventPhoto.photoId);
  });

  it('tells the model to skip calendar drafting at the backlog threshold, counting open-PR drafts', () => {
    const many = Array.from({ length: BACKLOG_SKIP_AT }, (_, i) => entry(`PR #${i}`, item('x', 'a-red-1', `c${i}`)));
    expect(buildDraftInputs({ ...base, openDrafts: many }).backlog).toMatchObject({ heldItems: BACKLOG_SKIP_AT, skipCalendarDrafting: true });
    expect(buildDraftInputs(base).backlog.skipCalendarDrafting).toBe(false);
  });

  it('marks a day with no calendar entry as nothing to draft, never an invented slot', () => {
    const inputs = buildDraftInputs({ ...base, now: '2026-10-08T11:00:00Z' });
    expect(inputs.beats.map((b: { needsDraft: boolean }) => b.needsDraft)).toEqual([false, false]);
  });

  it('summarises itself in a few lines, naming a beat with no photo left', () => {
    const inputs = buildDraftInputs({ ...base, library: [], warnings: ['x was unreadable'] });
    const out = summarizeInputs(inputs);
    expect(out).toContain('NO never-used photo left');
    expect(out).toContain('! x was unreadable');
  });
});
