// Bots v2 W8 regression: the drafter's documented happy path must pass
// check-drafts. Before this, lesson L001 ("never put the same photoId on both
// halves of a pair"), the pairing rule ("one image on both halves") and the
// checker ("X needs media") could not all be obeyed, so no valid draft existed
// and Tree posted nothing from 2026-09-22. The pair here is built exactly the
// way tree-daily-draft.md says to — from the pre-compute's pick — against the
// REAL photo library, calendar format and posted history.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkDraft, checkMedia, isWarningFinding } from './check-drafts.mjs';
import { buildDraftInputs } from './lib/draft-inputs.mjs';
import { checkPhotoReuse } from './lib/photo-reuse.mjs';
import { readJsonDir } from './lib/social-fs.mjs';
import { readFileSync } from 'node:fs';
import { igUsablePhotos } from './lib/photo-dimensions.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const library = JSON.parse(readFileSync(path.join(ROOT, 'social', 'photo-library.json'), 'utf8')).photos;
const CALENDAR = '## 2026-10-01 (Thu) — a Speak Now beat\n\n- **`23:00Z` · `heartbeat:era-deep-cut:speak-now-record`** — direction only.\n';
const critique = { v: 1, scores: { onStrategy: 5, onVoice: 4, specific: 5, mediaEarnsItsPlace: 4, notEmbarrassed: 5 }, total: 23, rationale: 'Executes the calendar slot with the record as the hook; the photo is the era it is about. A dated, checkable number carries it.', rulesChecked: ['L001'], revision: 1 };

async function pairFromPrecompute(extraPosted: Array<{ ref: string; data: Record<string, unknown> }> = []) {
  const posted = [...(await readJsonDir(path.join(ROOT, 'social', 'posted'))), ...extraPosted];
  const { usable: igUsable } = await igUsablePhotos(library, path.join(ROOT, 'apps', 'web', 'public'));
  const inputs = buildDraftInputs({ now: '2026-10-01T11:00:00Z', library, igUsable, calendarMd: CALENDAR, lessonsMd: readFileSync(path.join(ROOT, 'social', 'lessons.md'), 'utf8'), posted, queue: [], openDrafts: [], closedPrs: [], intents: [], intakeIssues: [] });
  const beat = inputs.beats[0];
  const photo = inputs.photos.eras.debut.next;
  expect(beat.needsDraft).toBe(true);
  const base = { lane: 'calendar', campaign: 'heartbeat:era-deep-cut:debut-2007-2026-10-01', scheduledAt: '2026-10-01T23:00:00Z', media: photo.media, mediaKind: 'photo', photoId: photo.photoId, photoEra: 'debut', mediaCredit: photo.mediaCredit, mediaSource: photo.mediaSource, altText: photo.altText, why: 'Calendar 10-01 beat; one never-used debut photo from the pre-compute on both halves of the pair.', critique };
  const ig = { ...base, platform: 'instagram', body: 'ok but the very first album was written by a sixteen year old in her bedroom and it still holds up. a debut that went platinum on her own songs, one very loud answer to everyone who doubted it. tag the friend who knows every word.\n\nlonglivets.com/?era=debut&utm_source=instagram&utm_medium=social&utm_campaign=debut-2007' };
  const x = { ...base, platform: 'x', body: 'Sixteen, a guitar, and a self-titled debut that went platinum. Every song still on the record is hers. https://longlivets.com/?era=debut&utm_source=x&utm_medium=social&utm_campaign=debut-2007' };
  return { ig, x, inputs, posted, photo };
}

const hard = (findings: string[]) => findings.filter((f) => !isWarningFinding(f));

describe('the drafter happy path passes check-drafts', () => {
  it('a pair built from the pre-compute pick — one never-used photo on BOTH halves — has no hard findings', async () => {
    const { ig, x, posted } = await pairFromPrecompute();
    const allQueue = [{ file: 'a-ig.json', data: ig }, { file: 'a-x.json', data: x }];
    for (const target of allQueue) {
      const findings = await checkDraft(target, { allQueue, allPosted: posted, openerContext: [], recentIg: [], activeLessonIds: ['L001'] });
      expect(hard(findings), target.file).toEqual([]);
    }
  });

  it('the pick is genuinely never-used: absent from every posted item', async () => {
    const { photo, posted } = await pairFromPrecompute();
    expect(posted.some((p) => p.data.photoId === photo.photoId)).toBe(false);
  });

  it('a sibling already posted under the SAME campaign is not reuse (IG posts first, X follows)', async () => {
    const { ig, x, photo } = await pairFromPrecompute();
    const igPosted = { ref: 'posted/a-ig.json', data: { ...ig, postedAt: '2026-10-01T23:00:00Z' } };
    expect(checkPhotoReuse('a-x.json', x, [], [igPosted], library)).toEqual([]);
    expect(photo.photoId).toBe(ig.photoId);
  });
});

describe('L001 codified: reuse across campaigns is a hard finding', () => {
  it('fails a draft whose photo already shipped under another campaign', async () => {
    const { ig } = await pairFromPrecompute();
    const shipped = { file: 'old.json', data: { ...ig, campaign: 'thread:something:else', postedAt: '2026-09-01T00:00:00Z' } };
    const findings = checkPhotoReuse('a-ig.json', ig, [], [shipped], library);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatch(/already shipped in social\/posted\/old\.json.*L001/);
  });

  it('fails a draft whose photo another campaign has queued', async () => {
    const { ig } = await pairFromPrecompute();
    const other = { file: 'other.json', data: { ...ig, campaign: 'mood:chip-poll:2026-10' } };
    expect(checkPhotoReuse('a-ig.json', ig, [other], [], library)[0]).toMatch(/already queued in social\/queue\/other\.json/);
  });

  it('also catches a repeat identified only by its media path', async () => {
    const { ig } = await pairFromPrecompute();
    const byPath = { file: 'old.json', data: { platform: 'instagram', campaign: 'x:y', media: ig.media } };
    expect(checkPhotoReuse('a-ig.json', ig, [], [byPath], library)).toHaveLength(1);
  });

  it('the pre-compute would never hand out a photo that a posted item already used', async () => {
    const first = await pairFromPrecompute();
    const { usable: igUsable } = await igUsablePhotos(library, path.join(ROOT, 'apps', 'web', 'public'));
    const posted = [...first.posted, { ref: 'posted/a-ig.json', data: { ...first.ig, postedAt: '2026-10-01T23:00:00Z' } }];
    const inputs = buildDraftInputs({ now: '2026-10-01T11:00:00Z', library, igUsable, calendarMd: CALENDAR, lessonsMd: '', posted, queue: [], openDrafts: [], closedPrs: [], intents: [], intakeIssues: [] });
    const offered = [inputs.eventPhoto, ...inputs.beats.map((b: { photo: { photoId: string } | null }) => b.photo), ...Object.values(inputs.photos.eras).map((e) => (e as { next: { photoId: string } | null }).next)].filter(Boolean).map((p) => (p as { photoId: string }).photoId);
    expect(offered.length).toBeGreaterThan(0);
    expect(offered).not.toContain(first.photo.photoId);
  });
});

describe('no pre-computed pick can fail the Instagram aspect gate', () => {
  it('every drawable photo the pre-compute can offer passes the IG aspect-ratio check', async () => {
    const { inputs, ig } = await pairFromPrecompute();
    type Pick = { media: string[]; photoId: string; mediaCredit: string; mediaSource: string; altText: string[] };
    const picks = [...(Object.values(inputs.photos.eras) as Array<{ next: Pick | null }>).map((e) => e.next), ...(inputs.beats as Array<{ photo: Pick | null }>).map((b) => b.photo)].filter((p): p is Pick => p !== null);
    expect(picks.length).toBeGreaterThan(0);
    for (const p of picks) {
      const findings = await checkMedia('a.json', { ...ig, media: p.media, photoId: p.photoId, mediaCredit: p.mediaCredit, mediaSource: p.mediaSource, altText: p.altText, photoEra: undefined, campaign: 'mood:chip-poll:x' }, []);
      expect(findings.filter((f: string) => f.includes('aspect')), p.photoId).toEqual([]);
    }
  });
});

describe('text-only X is the single-platform case, not a loophole', () => {
  it('an X item with no media passes only with its own written singlePlatformReason', async () => {
    const { x, posted } = await pairFromPrecompute();
    const bare = { ...x, media: undefined, mediaKind: undefined, photoId: undefined, photoEra: undefined, mediaCredit: undefined, mediaSource: undefined, altText: undefined };
    const noReason = await checkDraft({ file: 'a-x.json', data: bare }, { allQueue: [], allPosted: posted, openerContext: [], recentIg: [], activeLessonIds: ['L001'] });
    expect(noReason.some((f) => f.includes('require at least one credited image'))).toBe(true);
    const reason = { ...bare, singlePlatformReason: 'No usable credited photo fits this story, so X goes first as text.' };
    const withReason = await checkDraft({ file: 'a-x.json', data: reason }, { allQueue: [], allPosted: posted, openerContext: [], recentIg: [], activeLessonIds: ['L001'] });
    expect(withReason.some((f) => f.includes('require at least one credited image'))).toBe(false);
  });
});
