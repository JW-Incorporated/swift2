import { describe, expect, it } from 'vitest';
// The generator only writes files when invoked directly; importing it here
// just pulls in its pure normalization functions.
import { buildTrackGuide, normalizeTrack, sortTracks } from './sync-longlive-tracks.mjs';

describe('normalizeTrack', () => {
  it('normalizes a seed-shape track into the UI TrackNote shape', () => {
    const t = normalizeTrack({
      trackNumber: 3,
      trackTitle: '  Anti-Hero ',
      note: '  A confessional single about self-doubt.  ',
      sourceUrl: 'https://en.wikipedia.org/wiki/Anti-Hero_(song)',
      sources: [
        {
          source_title: 'Anti-Hero — Wikipedia',
          source_url: 'https://en.wikipedia.org/wiki/Anti-Hero_(song)',
          publisher: 'Wikipedia',
        },
        { outlet: 'Rolling Stone', url: 'https://rollingstone.com/anti-hero' },
      ],
    });
    expect(t).toEqual({
      trackNumber: 3,
      title: 'Anti-Hero',
      note: 'A confessional single about self-doubt.',
      sources: [
        // Rich §5 shape maps to {name,url}; the top-level sourceUrl duplicate
        // is de-duped by url instead of appended twice.
        { name: 'Anti-Hero — Wikipedia', url: 'https://en.wikipedia.org/wiki/Anti-Hero_(song)' },
        { name: 'Rolling Stone', url: 'https://rollingstone.com/anti-hero' },
      ],
    });
  });

  it('falls back to the source hostname when a citation has no name', () => {
    const t = normalizeTrack({
      trackNumber: 1,
      trackTitle: 'Tim McGraw',
      note: 'The debut single.',
      sourceUrl: 'https://www.example.com/article',
      sources: [],
    });
    expect(t?.sources).toEqual([{ name: 'example.com', url: 'https://www.example.com/article' }]);
  });

  it('drops tracks without a renderable note or title (no empty placeholders)', () => {
    expect(normalizeTrack({ trackNumber: 1, trackTitle: 'Untitled', note: '   ' })).toBeNull();
    expect(normalizeTrack({ trackNumber: 1, trackTitle: 'Untitled', note: undefined })).toBeNull();
    expect(normalizeTrack({ trackNumber: 1, trackTitle: '', note: 'A note.' })).toBeNull();
  });

  it('coerces missing/invalid track numbers to null', () => {
    // sourceUrl matters here: normalizeTrack drops unsourced tracks outright
    // (codex finding on T1), which would make every assertion vacuous.
    const base = { trackTitle: 'Song', note: 'A note.', sourceUrl: 'https://example.com/a' };
    expect(normalizeTrack({ ...base, trackNumber: undefined })?.trackNumber).toBeNull();
    expect(normalizeTrack({ ...base, trackNumber: 0 })?.trackNumber).toBeNull();
    expect(normalizeTrack({ ...base, trackNumber: 2.5 })?.trackNumber).toBeNull();
    expect(normalizeTrack({ ...base, trackNumber: '7' })?.trackNumber).toBe(7);
  });

  it('auto-derives discussion from summary/inspiration/easterEggs using the track sources', () => {
    const t = normalizeTrack({
      trackTitle: 'willow',
      note: 'The lead single.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Willow_(song)',
      summary: 'Devotion cast as a spell.',
      inspiration: 'Written to a Dessner instrumental in minutes.',
      easterEggs: 'The video picks up where cardigan left off.',
    });
    expect(t?.discussion).toEqual([
      'Devotion cast as a spell.',
      'Written to a Dessner instrumental in minutes.',
      'The video picks up where cardigan left off.',
    ]);
    expect(t?.quotedLines).toEqual([]);
    expect(t?.discussionSources).toEqual(t?.sources);
  });

  it('skips missing summary/inspiration/easterEggs fields rather than inserting blanks', () => {
    const t = normalizeTrack({
      trackTitle: 'Song',
      note: 'A note.',
      sourceUrl: 'https://example.com/a',
      inspiration: 'Only this field is present.',
    });
    expect(t?.discussion).toEqual(['Only this field is present.']);
  });

  it('does not add a discussion field when there is no summary/inspiration/easterEggs/discussion at all', () => {
    const t = normalizeTrack({
      trackTitle: 'Song',
      note: 'A note.',
      sourceUrl: 'https://example.com/a',
    });
    expect(t?.discussion).toBeUndefined();
    expect(t?.quotedLines).toBeUndefined();
    expect(t?.discussionSources).toBeUndefined();
  });

  it('prefers an explicit discussion + its own citation over the auto-derived fields', () => {
    const t = normalizeTrack({
      trackTitle: 'Song',
      note: 'A note.',
      sourceUrl: 'https://example.com/a',
      summary: 'Would have been auto-derived.',
      discussion: ['A hand-written paragraph.', 'A second paragraph.'],
      quotedLines: ['A short illustrative line.'],
      discussionSourceUrl: 'https://example.com/deep-dive',
    });
    expect(t?.discussion).toEqual(['A hand-written paragraph.', 'A second paragraph.']);
    expect(t?.quotedLines).toEqual(['A short illustrative line.']);
    expect(t?.discussionSources).toEqual([{ name: 'example.com', url: 'https://example.com/deep-dive' }]);
  });

  it('drops an explicit discussion with no citation at all (never ships unsourced)', () => {
    const t = normalizeTrack({
      trackTitle: 'Song',
      note: 'A note.',
      sourceUrl: 'https://example.com/a',
      discussion: ['A hand-written paragraph with no citation.'],
    });
    expect(t?.discussion).toBeUndefined();
  });
});

describe('sortTracks', () => {
  it('orders by track number ascending with unnumbered tracks last, ties alphabetical', () => {
    const sorted = sortTracks([
      { trackNumber: null, title: 'Zeta (bonus)', note: 'n', sources: [] },
      { trackNumber: 13, title: 'Thirteen', note: 'n', sources: [] },
      { trackNumber: null, title: 'Alpha (bonus)', note: 'n', sources: [] },
      { trackNumber: 2, title: 'Two', note: 'n', sources: [] },
    ]);
    expect(sorted.map((t) => t.title)).toEqual([
      'Two',
      'Thirteen',
      'Alpha (bonus)',
      'Zeta (bonus)',
    ]);
  });
});

describe('buildTrackGuide', () => {
  const src = 'https://en.wikipedia.org/wiki/Example';

  it('maps seed era slugs to LongLive EraIds and passes matching slugs through', () => {
    const byEra = buildTrackGuide([
      { eraSlug: 'tortured-poets', trackNumber: 1, trackTitle: 'Fortnight', note: 'n', sourceUrl: src },
      { eraSlug: 'the-life-of-a-showgirl', trackNumber: 1, trackTitle: 'The Fate of Ophelia', note: 'n', sourceUrl: src },
      { eraSlug: 'midnights', trackNumber: 1, trackTitle: 'Lavender Haze', note: 'n', sourceUrl: src },
    ]);
    expect(Object.keys(byEra).sort()).toEqual(['midnights', 'tloas', 'ttpd']);
  });

  it('de-dupes repeated titles within an era (first wins) and drops noteless tracks', () => {
    const byEra = buildTrackGuide([
      { eraSlug: 'red', trackNumber: 1, trackTitle: 'State of Grace', note: 'first', sourceUrl: src },
      { eraSlug: 'red', trackNumber: 30, trackTitle: 'state of grace', note: 'dupe', sourceUrl: src },
      { eraSlug: 'red', trackNumber: 2, trackTitle: 'Red', note: '', sourceUrl: src },
    ]);
    expect(byEra.red).toEqual([
      { trackNumber: 1, title: 'State of Grace', note: 'first', sources: [{ name: 'en.wikipedia.org', url: src }] },
    ]);
  });

  it('returns each era sorted by track number', () => {
    const byEra = buildTrackGuide([
      { eraSlug: 'lover', trackNumber: 18, trackTitle: 'Daylight', note: 'n', sourceUrl: src },
      { eraSlug: 'lover', trackNumber: 1, trackTitle: 'I Forgot That You Existed', note: 'n', sourceUrl: src },
    ]);
    expect(byEra.lover.map((t) => t.trackNumber)).toEqual([1, 18]);
  });

  it('drops tracks with no source at all', () => {
    const byEra = buildTrackGuide([
      { eraSlug: 'red', trackNumber: 1, trackTitle: 'State of Grace', note: 'unsourced' },
    ]);
    expect(byEra.red).toBeUndefined();
  });
});
