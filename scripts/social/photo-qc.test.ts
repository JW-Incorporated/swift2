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
const reply = (verdict: object, extra: object = {}) => ({
  stop_reason: 'end_turn',
  content: [{ type: 'text', text: JSON.stringify(verdict) }],
  usage: { input_tokens: 1000, output_tokens: 100 },
  ...extra,
});
const fakeClient = (...responses: unknown[]) => {
  const create = vi.fn();
  for (const r of responses) {
    if (r instanceof Error) create.mockRejectedValueOnce(r);
    else create.mockResolvedValueOnce(r);
  }
  return { messages: { create } };
};
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
const httpError = (status: number) => Object.assign(new Error(`http ${status}`), { status });
const noSleep = async () => {};

describe('qcPhoto', () => {
  it('sends one downscaled image plus caption with the structured-output request shape', async () => {
    const client = fakeClient(reply(GOOD));
    const result = await qcPhoto(await input(), { client });
    expect(result).toMatchObject({ keep: true, usage: { inputTokens: 1000, outputTokens: 100 } });
    const req = client.messages.create.mock.calls[0][0];
    expect(req.model).toBe(QC_MODEL);
    expect(req.max_tokens).toBe(400);
    expect(req.output_config).toEqual({
      effort: 'low',
      format: { type: 'json_schema', schema: QC_SCHEMA },
    });
    expect(req.system).toMatch(/Never identify anyone/);
    expect(req.thinking).toEqual({ type: 'between_tools' });
    expect(req.messages[0].content[0]).toMatchObject({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg' },
    });
    expect(req.messages[0].content[1].text).toMatch(
      /Taylor Swift on stage[\s\S]*commons\.wikimedia\.org[\s\S]*wikimedia/,
    );
    expect(QC_SCHEMA.additionalProperties).toBe(false);
    expect(QC_SCHEMA.required).toHaveLength(8);
  });

  it('forces keep=false when the model says keep but a check failed or a watermark is present', async () => {
    const mixed = await qcPhoto(await input(), {
      client: fakeClient(reply({ ...GOOD, subject_fills_frame_enough: false })),
    });
    expect(mixed.keep).toBe(false);
    const marked = await qcPhoto(await input(), {
      client: fakeClient(reply({ ...GOOD, has_watermark_or_logo_overlay: true })),
    });
    expect(marked.keep).toBe(false);
  });

  it('treats a refusal as not keep', async () => {
    const result = await qcPhoto(await input(), {
      client: fakeClient(reply(GOOD, { stop_reason: 'refusal' })),
    });
    expect(result).toMatchObject({ keep: false, reason: 'qc-refusal' });
  });

  it('treats a non end_turn stop reason as an error, not keep', async () => {
    const result = await qcPhoto(await input(), {
      client: fakeClient(reply(GOOD, { stop_reason: 'max_tokens' })),
    });
    expect(result).toMatchObject({ keep: false, error: true });
  });

  it('treats unparsable or schema-violating output as not keep', async () => {
    const junk = await qcPhoto(await input(), {
      client: fakeClient({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'not json' }],
        usage: {},
      }),
    });
    expect(junk).toMatchObject({ keep: false, error: true });
    const partial = await qcPhoto(await input(), {
      client: fakeClient(reply({ keep: true, reason: 'x' })),
    });
    expect(partial).toMatchObject({ keep: false, error: true });
  });

  it('retries 429/5xx up to twice then fails closed', async () => {
    const ok = fakeClient(httpError(429), httpError(503), reply(GOOD));
    expect((await qcPhoto(await input(), { client: ok, sleepImpl: noSleep })).keep).toBe(true);
    expect(ok.messages.create).toHaveBeenCalledTimes(3);
    const dead = fakeClient(httpError(500), httpError(500), httpError(500));
    expect(await qcPhoto(await input(), { client: dead, sleepImpl: noSleep })).toMatchObject({
      keep: false,
      error: true,
    });
    expect(dead.messages.create).toHaveBeenCalledTimes(3);
  });

  it('does not retry a 4xx and never throws', async () => {
    const client = fakeClient(httpError(400));
    expect(await qcPhoto(await input(), { client, sleepImpl: noSleep })).toMatchObject({
      keep: false,
      error: true,
    });
    expect(client.messages.create).toHaveBeenCalledTimes(1);
  });

  it('holds an unreadable image without calling the API', async () => {
    const client = fakeClient();
    const result = await qcPhoto({ buffer: Buffer.from('not an image'), caption: 'x' }, { client });
    expect(result).toMatchObject({ keep: false, error: true });
    expect(client.messages.create).not.toHaveBeenCalled();
  });
});

describe('createQcSession', () => {
  it('holds every candidate with one warning when the key is missing', async () => {
    const warn = vi.fn();
    const qc = createQcSession({ env: {}, warn });
    const a = await qc.check(await input());
    const b = await qc.check(await input());
    expect([a.status, b.status]).toEqual(['held', 'held']);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('defers candidates over the cap without calling the API', async () => {
    const client = fakeClient(reply(GOOD), reply(GOOD));
    const qc = createQcSession({ client, maxChecks: 2 });
    const results = await Promise.all([
      qc.check(await input()),
      qc.check(await input()),
      qc.check(await input()),
    ]);
    expect(results.map((r) => r.status)).toEqual(['kept', 'kept', 'deferred']);
    expect(client.messages.create).toHaveBeenCalledTimes(2);
    expect(qc.summary()).toMatch(
      /2 checked.*1 deferred over the 2-check cap.*2000 in \/ 200 out tokens, ~\$0\.006/,
    );
  });

  it('reads the cap from QC_MAX_CHECKS_PER_RUN and defaults to 200', () => {
    expect(
      createQcSession({ client: fakeClient(), env: { QC_MAX_CHECKS_PER_RUN: '7' } }).summary(),
    ).toMatch(/7-check cap/);
    expect(createQcSession({ client: fakeClient(), env: {} }).summary()).toMatch(/200-check cap/);
  });

  it('counts the failing checks of rejected photos', async () => {
    const qc = createQcSession({
      client: fakeClient(reply({ ...GOOD, keep: false, is_real_photograph: false })),
    });
    expect((await qc.check(await input())).status).toBe('rejected');
    expect(qc.totals.failures).toEqual({ is_real_photograph: 1 });
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
      client: fakeClient(
        reply(GOOD),
        reply({ ...GOOD, keep: false, consistent_with_caption: false, reason: 'crowd' }),
      ),
    });
    const { result, files } = await run([cand(1), cand(2)], qc);
    expect(files).toEqual(['wikimedia-1.jpg']);
    expect(result.qcRejected).toEqual([
      expect.objectContaining({ id: 'wikimedia-2', reason: 'crowd', sha256: expect.any(String) }),
    ]);
  });

  it('skips a refusal and an API error without writing or ledgering as a verdict', async () => {
    const qc = createQcSession({
      concurrency: 1,
      client: fakeClient(reply(GOOD, { stop_reason: 'refusal' }), httpError(400)),
    });
    const { result, files } = await run([cand(1), cand(2)], qc);
    expect(files).toEqual([]);
    expect(result.qcRejected).toEqual([
      expect.objectContaining({ id: 'wikimedia-1', reason: 'qc-refusal' }),
    ]);
    expect(result.qcHeld).toEqual([expect.objectContaining({ id: 'wikimedia-2' })]);
  });

  it('holds everything when the key is missing', async () => {
    const { result, files } = await run(
      [cand(1), cand(2)],
      createQcSession({ env: {}, warn: () => {} }),
    );
    expect(files).toEqual([]);
    expect(result.qcHeld).toHaveLength(2);
  });

  it('defers candidates over the cap', async () => {
    const qc = createQcSession({ client: fakeClient(reply(GOOD)), maxChecks: 1, concurrency: 1 });
    const { result, files } = await run([cand(1), cand(2), cand(3)], qc);
    expect(files).toEqual(['wikimedia-1.jpg']);
    expect(result.qcDeferred).toEqual(['wikimedia-2', 'wikimedia-3']);
  });

  it('does not re-check a candidate already in the rejected ledger (by id or by hash)', async () => {
    const client = fakeClient();
    const ledger = createRejectedLedger({
      rejected: [{ id: 'wikimedia-1', sha256: 'x', reason: 'old', date: '2026-10-06' }],
    });
    const first = await run([cand(1)], createQcSession({ client }), ledger);
    expect(first.result.qcRejected).toEqual([
      { id: 'wikimedia-1', reason: 'qc-ledger', cached: true },
    ]);
    const { createHash } = await import('node:crypto');
    const sha = createHash('sha256')
      .update(await jpeg(2))
      .digest('hex');
    const byHash = await run(
      [cand(2)],
      createQcSession({ client }),
      createRejectedLedger({ rejected: [{ id: 'other', sha256: sha, reason: 'old', date: 'd' }] }),
    );
    expect(byHash.result.qcRejected).toEqual([
      expect.objectContaining({ id: 'wikimedia-2', cached: true }),
    ]);
    expect(client.messages.create).not.toHaveBeenCalled();
    expect(first.files).toEqual([]);
  });
});
