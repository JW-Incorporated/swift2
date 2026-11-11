import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { fetchCandidates } from './import-photo-library.mjs';
import { createRejectedLedger } from './lib/photo-qc-ledger.mjs';
import { QC_MODEL, QC_SCHEMA, createQcSession, kindFromId, qcPhoto } from './photo-qc.mjs';

const GOOD = {
  main_subject_is_single_prominent_person: true,
  consistent_with_caption: true,
  is_real_photograph: true,
  has_watermark_or_logo_overlay: false,
  sharp_and_well_lit: true,
  subject_fills_frame_enough: true,
  keep: true,
  reason: 'Sharp solo performer filling the frame.',
};
const ok = (verdict: object) => ({
  status: 'ok',
  data: verdict,
  usage: { inputTokens: 1000, outputTokens: 100 },
});
const down = (status = 'unavailable', reason = 'Claude CLI unavailable') => ({ status, reason });
const fakeCall = (...outcomes: unknown[]) => vi.fn().mockImplementation(async () => outcomes.shift() ?? down());
const quiet = () => {};
const jpeg = (seed: number) =>
  sharp({
    create: { width: 32 + seed, height: 24, channels: 3, background: { r: seed, g: 90, b: 140 } },
  })
    .jpeg()
    .toBuffer();
const input = async () => ({
  buffer: await jpeg(1),
  caption: 'Taylor Swift on stage',
  source: 'commons.wikimedia.org',
  kind: 'wikimedia',
});

describe('qcPhoto', () => {
  it('sends one downscaled image buffer through the wrapper at P3 with the schema', async () => {
    const call = fakeCall(ok(GOOD));
    const result = await qcPhoto(await input(), { call });
    expect(result).toMatchObject({ keep: true, usage: { inputTokens: 1000, outputTokens: 100 } });
    const req = call.mock.calls[0][0];
    expect(req).toMatchObject({ caller: 'photo-qc', priority: 'P3', model: QC_MODEL, schema: QC_SCHEMA });
    expect(req.model).toBe('claude-sonnet-5-5');
    expect(req.system).toMatch(/Never identify anyone/);
    expect(req.images).toHaveLength(1);
    expect(Buffer.isBuffer(req.images[0].buffer)).toBe(true);
    expect(req.images[0].mimeType).toBe('image/jpeg');
    expect(req.user).toMatch(/Taylor Swift on stage[\s\S]*commons\.wikimedia\.org[\s\S]*wikimedia/);
    expect(QC_SCHEMA.additionalProperties).toBe(false);
    expect(QC_SCHEMA.required).toHaveLength(8);
  });

  it('forces keep=false when the model says keep but a check failed or a watermark is present', async () => {
    const mixed = await qcPhoto(await input(), {
      call: fakeCall(ok({ ...GOOD, subject_fills_frame_enough: false })),
    });
    expect(mixed.keep).toBe(false);
    const marked = await qcPhoto(await input(), {
      call: fakeCall(ok({ ...GOOD, has_watermark_or_logo_overlay: true })),
    });
    expect(marked.keep).toBe(false);
  });

  it.each(['unavailable', 'capped', 'invalid'])('holds (error, never keep) on a %s wrapper outcome', async (status) => {
    const log = vi.fn();
    const result = await qcPhoto(await input(), { call: fakeCall(down(status, 'limit')), log });
    expect(result).toMatchObject({ keep: false, error: true });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('holding photo'));
  });

  it('holds when the wrapper throws, and never throws itself', async () => {
    const call = vi.fn().mockRejectedValue(new Error('boom'));
    expect(await qcPhoto(await input(), { call, log: quiet })).toMatchObject({ keep: false, error: true });
  });

  it('treats schema-violating output as held', async () => {
    const partial = await qcPhoto(await input(), { call: fakeCall(ok({ keep: true, reason: 'x' })) });
    expect(partial).toMatchObject({ keep: false, error: true });
  });

  it('holds an unreadable image without calling the wrapper', async () => {
    const call = fakeCall();
    const result = await qcPhoto({ buffer: Buffer.from('not an image'), caption: 'x' }, { call });
    expect(result).toMatchObject({ keep: false, error: true });
    expect(call).not.toHaveBeenCalled();
  });
});

describe('createQcSession', () => {
  it('holds every candidate when the wrapper is unavailable', async () => {
    const qc = createQcSession({ call: fakeCall(down(), down()), log: quiet });
    const a = await qc.check(await input());
    const b = await qc.check(await input());
    expect([a.status, b.status]).toEqual(['held', 'held']);
    expect(qc.summary()).toMatch(/2 held on unavailable\/error/);
  });

  it('defers candidates over the cap without calling the wrapper', async () => {
    const call = fakeCall(ok(GOOD), ok(GOOD));
    const qc = createQcSession({ call, maxChecks: 2 });
    const results = await Promise.all([
      qc.check(await input()),
      qc.check(await input()),
      qc.check(await input()),
    ]);
    expect(results.map((r) => r.status)).toEqual(['kept', 'kept', 'deferred']);
    expect(call).toHaveBeenCalledTimes(2);
    expect(call.mock.calls[0][0].maxCalls).toBe(2);
    expect(qc.summary()).toMatch(/2 checked.*1 deferred over the 2-check cap.*2000 in \/ 200 out tokens/);
  });

  it('reads the cap from QC_MAX_CHECKS_PER_RUN and defaults to 200', () => {
    expect(createQcSession({ call: fakeCall(), env: { QC_MAX_CHECKS_PER_RUN: '7' } }).summary()).toMatch(/7-check cap/);
    expect(createQcSession({ call: fakeCall(), env: {} }).summary()).toMatch(/200-check cap/);
  });

  it('counts the failing checks of rejected photos', async () => {
    const qc = createQcSession({ call: fakeCall(ok({ ...GOOD, keep: false, is_real_photograph: false })) });
    expect((await qc.check(await input())).status).toBe('rejected');
    expect(qc.totals.failures).toEqual({ is_real_photograph: 1 });
  });
});

describe('importer CLI', () => {
  it('refuses --write without --fetch unless --no-qc is explicit', () => {
    const script = path.resolve(__dirname, 'import-photo-library.mjs');
    const run = (...extra: string[]) =>
      spawnSync(process.execPath, [script, '--input', 'nope.json', '--write', ...extra], {
        encoding: 'utf8',
      });
    const refused = run();
    expect(refused.status).toBe(1);
    expect(refused.stderr).toMatch(/no vision QC/);
    expect(run('--no-qc').stderr).not.toMatch(/no vision QC/);
  });
});

describe('kindFromId', () => {
  it('maps id prefixes to source kinds', () => {
    expect(
      ['official-video-abc-t1', 'wikimedia-1', 'openverse-2', 'reddit-3', 'gnews-4'].map(
        kindFromId,
      ),
    ).toEqual(['video-frame', 'wikimedia', 'openverse', 'reddit', 'press']);
  });
});

describe('fetchCandidates with QC', () => {
  const cand = (n: number) => ({
    id: `wikimedia-${n}`,
    mediaPath: `/social/library/photos/wikimedia-${n}.jpg`,
    sourceUrl: `https://upload.wikimedia.org/${n}.jpg`,
    alt: 'Taylor Swift performing',
  });
  const run = async (
    candidates: ReturnType<typeof cand>[],
    qc: unknown,
    ledger = createRejectedLedger(),
  ) => {
    const photosDir = await mkdtemp(path.join(os.tmpdir(), 'qc-photos-'));
    const bytes = new Map<string, Buffer>();
    for (const c of candidates) bytes.set(c.sourceUrl, await jpeg(Number(c.id.split('-')[1])));
    const result = await fetchCandidates(candidates, {
      write: true,
      photosDir,
      seenHashes: new Map(),
      fetchImpl: (async (url: string) => ({
        ok: true,
        arrayBuffer: async () => bytes.get(url)!,
      })) as never,
      normalizeImpl: async (buf: Buffer) => buf,
      hashImpl: async () => null,
      sleepImpl: async () => {},
      qc: qc as never,
      ledger,
    });
    return { result, files: (await readdir(photosDir)).sort(), ledger };
  };

  it('writes a photo only when QC keeps it, and reports rejects with their hash', async () => {
    const qc = createQcSession({
      concurrency: 1,
      call: fakeCall(
        ok(GOOD),
        ok({ ...GOOD, keep: false, consistent_with_caption: false, reason: 'crowd' }),
      ),
    });
    const { result, files } = await run([cand(1), cand(2)], qc);
    expect(files).toEqual(['wikimedia-1.jpg']);
    expect(result.qcRejected).toEqual([
      expect.objectContaining({ id: 'wikimedia-2', reason: 'crowd', sha256: expect.any(String) }),
    ]);
  });

  it('holds wrapper-unavailable and capped photos without writing or ledgering as a verdict', async () => {
    const qc = createQcSession({
      concurrency: 1,
      call: fakeCall(down(), down('capped', 'per-run call cap reached')),
      log: quiet,
    });
    const { result, files } = await run([cand(1), cand(2)], qc);
    expect(files).toEqual([]);
    expect(result.qcRejected).toEqual([]);
    expect(result.qcHeld).toHaveLength(2);
  });

  it('holds everything when the wrapper is unavailable', async () => {
    const { result, files } = await run(
      [cand(1), cand(2)],
      createQcSession({ call: fakeCall(), log: quiet }),
    );
    expect(files).toEqual([]);
    expect(result.qcHeld).toHaveLength(2);
  });

  it('defers candidates over the cap', async () => {
    const qc = createQcSession({ call: fakeCall(ok(GOOD)), maxChecks: 1, concurrency: 1 });
    const { result, files } = await run([cand(1), cand(2), cand(3)], qc);
    expect(files).toEqual(['wikimedia-1.jpg']);
    expect(result.qcDeferred).toEqual(['wikimedia-2', 'wikimedia-3']);
  });

  it('does not re-check a candidate already in the rejected ledger (by id or by hash)', async () => {
    const call = fakeCall();
    const ledger = createRejectedLedger({
      rejected: [{ id: 'wikimedia-1', sha256: 'x', reason: 'old', date: '2026-10-06' }],
    });
    const first = await run([cand(1)], createQcSession({ call }), ledger);
    expect(first.result.qcRejected).toEqual([
      { id: 'wikimedia-1', reason: 'qc-ledger', cached: true },
    ]);
    const { createHash } = await import('node:crypto');
    const sha = createHash('sha256')
      .update(await jpeg(2))
      .digest('hex');
    const byHash = await run(
      [cand(2)],
      createQcSession({ call }),
      createRejectedLedger({ rejected: [{ id: 'other', sha256: sha, reason: 'old', date: 'd' }] }),
    );
    expect(byHash.result.qcRejected).toEqual([
      expect.objectContaining({ id: 'wikimedia-2', cached: true }),
    ]);
    expect(call).not.toHaveBeenCalled();
    expect(first.files).toEqual([]);
  });
});
