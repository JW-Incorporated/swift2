import { describe, expect, it } from 'vitest';
import { fingerprintMarker, videoIdsIn, planFilings } from './dedupe.mjs';

const cand = (videoId: string, extra = {}) => ({ videoId, title: 't', published: '2026-08-10T00:00:00+00:00', ...extra });

describe('videoIdsIn', () => {
  it('finds ids via the machine marker', () => {
    const ids = videoIdsIn([`filed earlier\n${fingerprintMarker('dQw4w9WgXcQ')}`]);
    expect(ids.has('dQw4w9WgXcQ')).toBe(true);
  });

  it('finds ids via plain watch/short/embed/youtu.be URLs, so hand-filed intake issues dedupe too', () => {
    const ids = videoIdsIn([
      'see https://www.youtube.com/watch?v=AAAAAAAAAAA for the clip',
      'short: https://youtube.com/shorts/BBBBBBBBBBB trailing',
      'embed https://www.youtube.com/embed/CCCCCCCCCCC?rel=0',
      'link https://youtu.be/DDDDDDDDDDD?t=42',
      'with params https://www.youtube.com/watch?app=desktop&v=EEEEEEEEEEE&t=1s',
    ]);
    expect([...ids].sort()).toEqual(['AAAAAAAAAAA', 'BBBBBBBBBBB', 'CCCCCCCCCCC', 'DDDDDDDDDDD', 'EEEEEEEEEEE']);
  });

  it('ignores null bodies and non-YouTube urls', () => {
    const ids = videoIdsIn([null, undefined, 'https://vimeo.com/12345678901']);
    expect(ids.size).toBe(0);
  });

  // The seed corpus stores videos as a bare id in a keyed field far more often
  // than as a URL, so URL-only extraction left the "already in seed" guard
  // seeing a small minority of the corpus.
  it('finds ids in the keyed id fields the seed corpus actually uses', () => {
    const ids = videoIdsIn([
      'video: { youtubeId: "nfWlot6h_JM", title: "Taylor Swift - Shake It Off" },',
      "video: { youtubeId: 'e-ORhEE9VVg' },",
      '"video_id": "QcIy9NiNbmo"',
    ]);
    expect([...ids].sort()).toEqual(['QcIy9NiNbmo', 'e-ORhEE9VVg', 'nfWlot6h_JM'].sort());
  });

  // The reason this is a KEYED match and not a substring scan: an 11-character
  // run inside a longer token must not register as a reference, or a genuine
  // new appearance gets silently skipped as "already-in-seed".
  it('does not treat a bare 11-char run inside a longer token as a reference', () => {
    const ids = videoIdsIn([
      'sha256: 7f3aAAAAAAAAAAAbb91c0d',
      'spotifyTrackId: "1234567890abcdefghij"',
    ]);
    expect(ids.size).toBe(0);
  });
});

describe('planFilings — stateless, fail-closed dedupe (#2008 / #2031 lessons)', () => {
  const ledger = (ids: string[], complete = true) => ({ ids: new Set(ids), complete });

  it('files only unknown ids, skipping already-filed and already-in-seed', () => {
    const plan = planFilings(
      [cand('AAAAAAAAAAA'), cand('BBBBBBBBBBB'), cand('CCCCCCCCCCC')],
      { ledger: ledger(['AAAAAAAAAAA']), seedIds: videoIdsIn(['officialUrl: "https://www.youtube.com/watch?v=BBBBBBBBBBB"']) },
    );
    expect(plan.refuse).toBeNull();
    expect(plan.toFile.map((c) => c.videoId)).toEqual(['CCCCCCCCCCC']);
    expect(plan.skipped.map((s) => s.reason).sort()).toEqual(['already-filed', 'already-in-seed']);
  });

  it('REFUSES to file when the ledger is unavailable — an error is an unknown, never a "no"', () => {
    const plan = planFilings([cand('AAAAAAAAAAA')], { ledger: null });
    expect(plan.refuse).toMatch(/fail closed/);
    expect(plan.toFile).toHaveLength(0);
  });

  it('REFUSES to file when the issue listing may be truncated', () => {
    const plan = planFilings([cand('AAAAAAAAAAA')], { ledger: ledger([], false) });
    expect(plan.refuse).toMatch(/truncated/);
    expect(plan.toFile).toHaveLength(0);
  });

  it('caps filings per run and reports the overflow as skipped, not lost', () => {
    const cands = ['AAAAAAAAAAA', 'BBBBBBBBBBB', 'CCCCCCCCCCC'].map((id) => cand(id));
    const plan = planFilings(cands, { ledger: ledger([]), max: 2 });
    expect(plan.toFile).toHaveLength(2);
    expect(plan.skipped.map((s) => s.reason)).toEqual(['over-per-run-cap']);
  });

  it('never files a malformed id', () => {
    const plan = planFilings([cand('short')], { ledger: ledger([]) });
    expect(plan.toFile).toHaveLength(0);
    expect(plan.skipped[0].reason).toBe('malformed-id');
  });

  // Codex review, 2026-08-12: the ledger only knows what PREVIOUS runs filed.
  // Without in-run tracking, one video reaching the planner twice files twice —
  // dedupe that only looks backwards is not dedupe.
  it('never files the same id twice within a single run', () => {
    const plan = planFilings(
      [cand('AAAAAAAAAAA'), cand('AAAAAAAAAAA'), cand('BBBBBBBBBBB')],
      { ledger: ledger([]) },
    );
    expect(plan.toFile.map((c) => c.videoId)).toEqual(['AAAAAAAAAAA', 'BBBBBBBBBBB']);
    expect(plan.skipped.map((s) => s.reason)).toEqual(['duplicate-in-run']);
  });
});
