// The issuer test for the v4 tree-auto stamp: it mints only after the trusted
// check-drafts gate passes over ALL given files, signs a digest of the media
// bytes, refuses a draft scheduled > 48h after the stamp, scrubs credentials
// from the checker's env, and a refusal writes nothing.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { runCheckDrafts, scrubbedEnv, stampTreeAuto } from './stamp-tree-auto.mjs';
import { approvalStatus, mediaDigest } from './lib/queue.mjs';
import { buildDraftInputs } from './lib/draft-inputs.mjs';
import { igUsablePhotos } from './lib/photo-dimensions.mjs';
import { readJsonDir } from './lib/social-fs.mjs';

const KEY = 'test-key';
const AT = '2026-10-09T12:00:00.000Z';
const ITEM = { platform: 'x', body: 'hello', scheduledAt: '2026-10-10T00:00:00Z', campaign: 'c1' };
const readMedia = () => null;

function harness(item: Record<string, unknown> = ITEM, gate = { ok: true, output: '' }) {
  const writes = new Map<string, string>();
  const readFileImpl = vi.fn(() => JSON.stringify(item));
  const writeFileImpl = vi.fn((p: string, text: string) => void writes.set(String(p), text));
  const checkDraftsImpl = vi.fn(() => gate);
  return { writes, readFileImpl, writeFileImpl, checkDraftsImpl, readMediaImpl: readMedia };
}

describe('stampTreeAuto', () => {
  it('stamps a draft the gate passed with a v4 stamp that the verifier accepts (and only with the key)', () => {
    const h = harness();
    const r = stampTreeAuto(['2026-10-10-a-x.json'], { pr: 12, at: AT, message: 'run 1', key: KEY, root: '/r', ...h });
    expect(r).toEqual({ ok: true, stamped: ['social/queue/2026-10-10-a-x.json'] });
    expect(h.checkDraftsImpl).toHaveBeenCalledWith(['social/queue/2026-10-10-a-x.json'], { root: '/r' });
    const written = JSON.parse([...h.writes.values()][0]);
    expect(written.approval).toMatchObject({ v: 4, kind: 'tree-auto', by: 'tree:auto', pr: 12, at: AT });
    expect(written.approval.mediaDigest).toBe(mediaDigest(ITEM, readMedia));
    expect(approvalStatus(written, { key: KEY, readMedia })).toEqual({ ok: true, kind: 'tree-auto' });
    expect(approvalStatus(written, { key: 'other', readMedia }).ok).toBe(false);
  });

  it('signs a digest of the media BYTES: the stamp stops verifying if the image changes afterwards', () => {
    const withMedia = { ...ITEM, media: ['/social/library/a.png'] };
    const h = harness(withMedia);
    const bytes = { current: Buffer.from('png-bytes') };
    const r = stampTreeAuto(['a.json'], { pr: 12, at: AT, key: KEY, ...h, readMediaImpl: () => bytes.current });
    expect(r.ok).toBe(true);
    const written = JSON.parse([...h.writes.values()][0]);
    expect(approvalStatus(written, { key: KEY, readMedia: () => bytes.current }).ok).toBe(true);
    expect(approvalStatus(written, { key: KEY, readMedia: () => Buffer.from('<svg/>') }).ok).toBe(false);
  });

  it('refuses when a named media file cannot be read', () => {
    const h = harness({ ...ITEM, media: ['/social/library/missing.png'] });
    const r = stampTreeAuto(['a.json'], { pr: 12, at: AT, key: KEY, ...h, readMediaImpl: () => null });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/cannot be read/);
    expect(h.writeFileImpl).not.toHaveBeenCalled();
  });

  it('M6: refuses a draft scheduled more than 48h after the stamp time, accepts exactly 48h', () => {
    const far = harness({ ...ITEM, scheduledAt: '2026-10-11T12:00:01Z' });
    const r = stampTreeAuto(['a.json'], { pr: 12, at: AT, key: KEY, ...far });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/more than 48h/);
    expect(far.checkDraftsImpl).not.toHaveBeenCalled();
    expect(far.writeFileImpl).not.toHaveBeenCalled();
    const edge = harness({ ...ITEM, scheduledAt: '2026-10-11T12:00:00Z' });
    expect(stampTreeAuto(['a.json'], { pr: 12, at: AT, key: KEY, ...edge }).ok).toBe(true);
  });

  it('M6: refuses a draft with no parseable scheduledAt', () => {
    const h = harness({ ...ITEM, scheduledAt: 'soon' });
    expect(stampTreeAuto(['a.json'], { pr: 12, at: AT, key: KEY, ...h }).ok).toBe(false);
  });

  it('writes NOTHING when the trusted check-drafts fails, and says why', () => {
    const h = harness(ITEM, { ok: false, output: 'FAIL voice: ai-tell' });
    const r = stampTreeAuto(['a.json', 'b.json'], { pr: 12, at: AT, key: KEY, ...h });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/check-drafts did not pass/);
    expect(r.reason).toMatch(/ai-tell/);
    expect(h.writeFileImpl).not.toHaveBeenCalled();
  });

  it('runs the gate once over every file together (the pair rule needs both halves)', () => {
    const h = harness();
    stampTreeAuto(['a-x.json', 'a-ig.json'], { pr: 12, at: AT, key: KEY, ...h });
    expect(h.checkDraftsImpl).toHaveBeenCalledTimes(1);
    expect(h.checkDraftsImpl.mock.calls[0][0]).toEqual(['social/queue/a-x.json', 'social/queue/a-ig.json']);
    expect(h.writeFileImpl).toHaveBeenCalledTimes(2);
  });

  it('refuses without a signing key, a bad PR number, or no files — gate never even runs', () => {
    for (const bad of [{ key: '' }, { pr: 0 }, { pr: Number.NaN }, { files: [] as string[] }]) {
      const h = harness();
      const r = stampTreeAuto(bad.files ?? ['a.json'], { pr: 12, at: AT, key: KEY, ...h, ...bad });
      expect(r.ok).toBe(false);
      expect(h.checkDraftsImpl).not.toHaveBeenCalled();
      expect(h.writeFileImpl).not.toHaveBeenCalled();
    }
  });

  it('refuses path tricks: only a plain *.json basename under social/queue/', () => {
    for (const bad of ['a.txt', '.json', '-rf.json', 'a b.json', 'x/../../etc.json/', '../a.json']) {
      const h = harness();
      expect(stampTreeAuto([bad], { pr: 12, at: AT, key: KEY, ...h }).ok).toBe(false);
      expect(h.writeFileImpl).not.toHaveBeenCalled();
    }
  });

  it('refuses a draft that already carries any approval (never overwrites an owner stamp or a forgery)', () => {
    const h = harness({ ...ITEM, approval: { v: 3 } });
    const r = stampTreeAuto(['a.json'], { pr: 12, at: AT, key: KEY, ...h });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/already carries an approval/);
    expect(h.checkDraftsImpl).not.toHaveBeenCalled();
    expect(h.writeFileImpl).not.toHaveBeenCalled();
  });
});

describe('runCheckDrafts — credentials never reach the checker (L8)', () => {
  it('scrubbedEnv drops the signing key, tokens and the PAT but keeps PATH/HOME-style variables', () => {
    const env = scrubbedEnv({
      SOCIAL_APPROVAL_KEY: 'k',
      GH_TOKEN: 't',
      GITHUB_TOKEN: 't2',
      SOCIAL_POSTER_PAT: 'p',
      ANTHROPIC_API_KEY: 'a',
      DISCORD_BOT_TOKEN: 'd',
      PATH: '/bin',
      HOME: '/h',
      GITHUB_RUN_ID: '1',
    });
    expect(Object.keys(env).sort()).toEqual(['GITHUB_RUN_ID', 'HOME', 'PATH']);
  });

  it('the child process is spawned with the scrubbed env', () => {
    const spawnImpl = vi.fn((..._args: unknown[]) => ({ status: 0, stdout: 'ok', stderr: '' }));
    const r = runCheckDrafts(['social/queue/a.json'], { spawnImpl, env: { SOCIAL_APPROVAL_KEY: 'k', GH_TOKEN: 't', PATH: '/bin' } });
    expect(r.ok).toBe(true);
    expect(spawnImpl.mock.calls[0][2]).toMatchObject({ env: { PATH: '/bin' } });
    expect(JSON.stringify(spawnImpl.mock.calls[0][2])).not.toMatch(/SOCIAL_APPROVAL_KEY|GH_TOKEN/);
  });

  it('the real runCheckDrafts fails closed on a file that does not exist under social/queue/', () => {
    expect(runCheckDrafts(['social/queue/zz-definitely-missing-p3a.json']).ok).toBe(false);
  });
});

// One REAL draft pair through the REAL check-drafts CLI. Built the way
// tree-daily-draft.md says to (the pre-compute's never-used photo on BOTH
// halves), written briefly into the real social/queue/, stamped with the real
// runCheckDrafts, then removed. The stamper's own writes are captured, not applied.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const critique = { v: 1, scores: { onStrategy: 5, onVoice: 4, specific: 5, mediaEarnsItsPlace: 4, notEmbarrassed: 5 }, total: 23, rationale: 'Executes the calendar slot with the record as the hook; the photo is the era it is about. A dated, checkable number carries it.', rulesChecked: ['L001'], revision: 1 };
const CALENDAR = '## 2026-10-01 (Thu) — a Speak Now beat\n\n- **`23:00Z` · `heartbeat:era-deep-cut:speak-now-record`** — direction only.\n';

describe('stampTreeAuto — a real passing draft through the real check-drafts', () => {
  it('stamps a drafter-happy-path pair, and the stamp verifies against the real media bytes', async () => {
    const library = JSON.parse(readFileSync(path.join(ROOT, 'social', 'photo-library.json'), 'utf8')).photos;
    const posted = await readJsonDir(path.join(ROOT, 'social', 'posted'));
    const { usable } = await igUsablePhotos(library, path.join(ROOT, 'apps', 'web', 'public'));
    const inputs = buildDraftInputs({ now: '2026-10-01T11:00:00Z', library, igUsable: usable, calendarMd: CALENDAR, lessonsMd: readFileSync(path.join(ROOT, 'social', 'lessons.md'), 'utf8'), posted, queue: [], openDrafts: [], closedPrs: [], intents: [], intakeIssues: [] });
    const photo = inputs.photos.eras.debut.next;
    const base = { lane: 'calendar', campaign: 'heartbeat:era-deep-cut:debut-2007-2026-10-01', scheduledAt: '2026-10-01T23:00:00Z', media: photo.media, mediaKind: 'photo', photoId: photo.photoId, photoEra: 'debut', mediaCredit: photo.mediaCredit, mediaSource: photo.mediaSource, altText: photo.altText, why: 'Calendar 10-01 beat; one never-used debut photo from the pre-compute on both halves of the pair.', critique };
    const ig = { ...base, platform: 'instagram', body: 'ok but the very first album was written by a sixteen year old in her bedroom and it still holds up. a debut that went platinum on her own songs, one very loud answer to everyone who doubted it. tag the friend who knows every word.\n\nlonglivets.com/?era=debut&utm_source=instagram&utm_medium=social&utm_campaign=debut-2007' };
    const x = { ...base, platform: 'x', body: 'Sixteen, a guitar, and a self-titled debut that went platinum. Every song still on the record is hers. https://longlivets.com/?era=debut&utm_source=x&utm_medium=social&utm_campaign=debut-2007' };
    const names = ['zz-p3a-real-ig.json', 'zz-p3a-real-x.json'];
    const queueDir = path.join(ROOT, 'social', 'queue');
    mkdirSync(queueDir, { recursive: true });
    try {
      writeFileSync(path.join(queueDir, names[0]), JSON.stringify(ig, null, 2) + '\n');
      writeFileSync(path.join(queueDir, names[1]), JSON.stringify(x, null, 2) + '\n');
      const writes = new Map<string, string>();
      const result = stampTreeAuto(names, { pr: 99, at: '2026-10-01T12:00:00.000Z', message: 'test', key: KEY, writeFileImpl: (p: string, t: string) => void writes.set(path.basename(p), t) });
      expect(result.reason ?? '').toBe('');
      expect(result.ok).toBe(true);
      expect([...writes.keys()].sort()).toEqual([...names].sort());
      const stamped = JSON.parse(writes.get(names[1]) as string);
      const readReal = (m: string) => {
        try {
          return readFileSync(path.join(ROOT, 'apps', 'web', 'public', m));
        } catch {
          return null;
        }
      };
      expect(approvalStatus(stamped, { key: KEY, readMedia: readReal })).toEqual({ ok: true, kind: 'tree-auto' });
    } finally {
      for (const n of names) rmSync(path.join(queueDir, n), { force: true });
    }
  });
});
