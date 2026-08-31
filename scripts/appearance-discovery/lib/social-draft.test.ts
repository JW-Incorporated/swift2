import { describe, expect, it, vi } from 'vitest';
import {
  buildSocialDraftPair,
  fetchAppearanceThumbnail,
  verifyTaylorPresence,
  MAX_VERIFY_CALLS_PER_PROCESS,
  _resetVerifyCallCountForTests,
} from './social-draft.mjs';
import { validateQueueItem } from '../../social/lib/queue-schema.mjs';
import { checkSchema, checkOpeners, checkCrossPostCopy, checkLength } from '../../social/check-drafts.mjs';
import { weightedTweetLength } from '../../social/lib/x-length.mjs';

const NOW = new Date('2026-08-25T13:40:00Z');

const candidate = (overrides = {}) => ({
  videoId: 'dQw4w9WgXcQ',
  title: 'Taylor Swift Performs "Fortnight" Live at the VMAs',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  channelName: 'Republic Records',
  channelWhy: "Taylor's label",
  published: '2026-08-25T12:00:00Z',
  rule: 'taylor-swift',
  ...overrides,
});

const buildSocialDraft = (...args: Parameters<typeof buildSocialDraftPair>) => {
  const pair = buildSocialDraftPair(...args);
  const x = pair.drafts.find(({ item }) => item.platform === 'x');
  if (!x) throw new Error('pair missing X item');
  return x;
};

describe('buildSocialDraft', () => {
  it('authors X and Instagram together with one campaign and schedule', () => {
    const { drafts, media } = buildSocialDraftPair(candidate(), { now: NOW });
    expect(drafts.map(({ item }) => item.platform).sort()).toEqual(['instagram', 'x']);
    expect(new Set(drafts.map(({ item }) => item.campaign))).toEqual(new Set(['appearance:dQw4w9WgXcQ']));
    expect(new Set(drafts.map(({ item }) => item.scheduledAt)).size).toBe(1);
    expect(drafts.find(({ item }) => item.platform === 'instagram')?.item.media).toEqual([media.sitePath]);
  });

  it('produces two items that both pass the real queue schema gate', () => {
    const { drafts } = buildSocialDraftPair(candidate(), { now: NOW });
    expect(drafts.flatMap(({ item }) => validateQueueItem(item))).toEqual([]);
    expect(drafts.flatMap(({ item }) => [...checkSchema(item), ...checkLength(item)])).toEqual([]);
  });

  it('keeps the pair platform-native and gives each sibling a distinct opener', () => {
    const { drafts } = buildSocialDraftPair(candidate(), { now: NOW });
    const queue = drafts.map(({ filename, item }) => ({ file: filename, data: item }));
    const x = queue.find(({ data }) => data.platform === 'x');
    if (!x) throw new Error('pair missing X item');

    expect(checkCrossPostCopy(x.file, x.data, queue)).toEqual([]);
    for (const draft of queue) {
      expect(checkOpeners(draft.file, draft.data, queue.map(({ file, data }) => ({ file, body: data.body })))).toEqual([]);
    }
  });

  it('names the file <scheduledDay>-appearance-<videoId>-x.json', () => {
    const { filename, item } = buildSocialDraft(candidate(), { now: NOW });
    expect(filename).toBe(`${item.scheduledAt.slice(0, 10)}-appearance-dQw4w9WgXcQ-x.json`);
  });

  it('schedules exactly 72 hours out from `now`', () => {
    const { item } = buildSocialDraft(candidate(), { now: NOW });
    const deltaMs = new Date(item.scheduledAt).getTime() - NOW.getTime();
    expect(deltaMs).toBe(72 * 60 * 60 * 1000);
  });

  it('tags the campaign with the video id, for dedupe/idempotency', () => {
    const { item } = buildSocialDraft(candidate(), { now: NOW });
    expect(item.campaign).toBe('appearance:dQw4w9WgXcQ');
  });

  it('platform is x — no photo/site-screen media to source for an unverified drop', () => {
    const { item } = buildSocialDraft(candidate(), { now: NOW });
    expect(item.platform).toBe('x');
    expect(item.media).toBeUndefined();
  });

  it('carries the real watch URL and the video\'s own title, never a fabricated claim about content', () => {
    const { item } = buildSocialDraft(candidate(), { now: NOW });
    expect(item.body).toContain('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(item.body.toLowerCase()).toContain('fortnight');
  });

  // The opener rule (check-drafts.mjs's checkOpeners) fails a draft whose
  // first 6 words match any other post from the last 14 days or any other
  // queue item — a channel-name-FIRST template would collide with itself on
  // that same channel's very next upload. Title-first avoids that because
  // each video's own title is what makes it a distinct, already-deduped item.
  it('does not collide on the opener rule across two different uploads from the SAME channel', () => {
    const a = buildSocialDraft(candidate({ videoId: 'aaaaaaaaaaa', title: 'Taylor Swift Surprises Fans at the VMAs' }), { now: NOW });
    const b = buildSocialDraft(candidate({ videoId: 'bbbbbbbbbbb', title: 'Taylor Swift Debuts New Eras Tour Outfit' }), { now: NOW });
    const findings = checkOpeners(b.filename, b.item, [{ file: a.filename, body: a.item.body }]);
    expect(findings).toEqual([]);
  });

  it('never opens with the banned "did you know" formula', () => {
    const { item } = buildSocialDraft(candidate(), { now: NOW });
    expect(checkOpeners('x.json', item, [])).toEqual([]);
  });

  it('truncates an implausibly long title and stays under X\'s weighted limit', () => {
    const longTitle = `Taylor Swift ${'performs a very long segment title '.repeat(15)}live`;
    const { item } = buildSocialDraft(candidate({ title: longTitle }), { now: NOW });
    expect(weightedTweetLength(item.body)).toBeLessThanOrEqual(280);
    expect(checkLength(item)).toEqual([]);
  });

  it('sanitizes an embedded double-quote in the title so it cannot break the body\'s own quoting', () => {
    const { item } = buildSocialDraft(candidate({ title: 'She said "hi" to fans' }), { now: NOW });
    // Exactly the two quotes this template itself wraps the title in — none
    // from the title should survive as a raw `"`.
    expect(item.body.split('"').length - 1).toBe(2);
  });

  it('keeps "Taylor" capitalized (house style) even though the rest of the body is lowercase', () => {
    const { item } = buildSocialDraft(candidate({ title: 'Taylor Swift performs' }), { now: NOW });
    expect(item.body).toContain('Taylor');
    expect(item.body).not.toMatch(/\btaylor\b/); // no accidentally-lowercased occurrence
  });

  // Regression: a real live feed during testing produced "Taylor swift" —
  // the full-name phrase was split word-by-word, so "Taylor" alone kept its
  // capital but the "Swift" immediately after it got lowercased anyway.
  it('keeps "Taylor Swift" as a properly capitalized two-word unit, not "Taylor swift"', () => {
    const { item } = buildSocialDraft(
      candidate({ title: "The Icon Sessions with Taylor Swift — Presented by the Recording Academy" }),
      { now: NOW },
    );
    expect(item.body).toContain('Taylor Swift');
    expect(item.body).not.toContain('Taylor swift');
  });
});

// Real photo-content verification (2026-08-31, kanban t_ac1281ef) — a
// thumbnail must pass a vision-model check that Taylor is actually IN the
// frame before it can ship as `mediaKind: "photo"`. This is the gate that
// would have caught `appearance-XwCWKSO0F8s`'s Taylor-free animated
// thumbnail before it ever reached the queue.
function pngBytes(width, height) {
  const buf = Buffer.alloc(24);
  buf.write('\x89PNG\r\n\x1a\n', 0, 'binary');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

function fakeThumbnailFetch({ status = 200, width = 1280, height = 720, contentType = 'image/jpeg' } = {}) {
  return vi.fn(async () => ({
    ok: status === 200,
    status,
    headers: { get: (name) => (name.toLowerCase() === 'content-type' ? contentType : null) },
    arrayBuffer: async () => pngBytes(width, height).buffer,
  }));
}

describe('verifyTaylorPresence', () => {
  it('throws (fails closed) when no API key is configured', async () => {
    await expect(verifyTaylorPresence(Buffer.from('x'), 'image/jpeg', { apiKey: undefined })).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });

  it('throws on a non-ok response', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 500 }));
    await expect(verifyTaylorPresence(Buffer.from('x'), 'image/jpeg', { apiKey: 'k', fetchImpl })).rejects.toThrow(/vision request failed/);
  });

  it('throws on a malformed tool response', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ content: [] }) }));
    await expect(verifyTaylorPresence(Buffer.from('x'), 'image/jpeg', { apiKey: 'k', fetchImpl })).rejects.toThrow(/malformed/);
  });

  it('throws on a schema-invalid confidence value (model-generated tool input is not trusted)', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        content: [{ type: 'tool_use', name: 'record_taylor_presence', input: { taylor_present: true, confidence: 2, reason: 'looks right' } }],
      }),
    }));
    await expect(verifyTaylorPresence(Buffer.from('x'), 'image/jpeg', { apiKey: 'k', fetchImpl })).rejects.toThrow(/malformed/);
  });

  it('passes an abort signal so a hung Anthropic request cannot consume the whole run', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        content: [{ type: 'tool_use', name: 'record_taylor_presence', input: { taylor_present: true, confidence: 0.9, reason: 'ok' } }],
      }),
    }));
    await verifyTaylorPresence(Buffer.from('x'), 'image/jpeg', { apiKey: 'k', fetchImpl });
    const init = fetchImpl.mock.calls[0][1];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('returns the parsed judgment on a well-formed tool response', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        content: [{ type: 'tool_use', name: 'record_taylor_presence', input: { taylor_present: true, confidence: 0.92, reason: 'clear photo' } }],
      }),
    }));
    const result = await verifyTaylorPresence(Buffer.from('x'), 'image/jpeg', { apiKey: 'k', fetchImpl });
    expect(result).toEqual({ taylor_present: true, confidence: 0.92, reason: 'clear photo' });
  });

  it('hard-caps total calls per process, independent of caller input (codex review round 2)', async () => {
    _resetVerifyCallCountForTests();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        content: [{ type: 'tool_use', name: 'record_taylor_presence', input: { taylor_present: true, confidence: 0.9, reason: 'ok' } }],
      }),
    }));
    for (let i = 0; i < MAX_VERIFY_CALLS_PER_PROCESS; i += 1) {
      await verifyTaylorPresence(Buffer.from('x'), 'image/jpeg', { apiKey: 'k', fetchImpl });
    }
    expect(fetchImpl).toHaveBeenCalledTimes(MAX_VERIFY_CALLS_PER_PROCESS);
    await expect(verifyTaylorPresence(Buffer.from('x'), 'image/jpeg', { apiKey: 'k', fetchImpl })).rejects.toThrow(
      /vision call cap/,
    );
    // The (MAX_VERIFY_CALLS_PER_PROCESS + 1)th attempt must fail closed WITHOUT
    // spending a call — the network mock's call count must not have advanced.
    expect(fetchImpl).toHaveBeenCalledTimes(MAX_VERIFY_CALLS_PER_PROCESS);
    _resetVerifyCallCountForTests();
  });
});

describe('fetchAppearanceThumbnail (with content verification)', () => {
  const c = { videoId: 'abc123' };

  it('returns the maxresdefault thumbnail when verification confirms Taylor is present', async () => {
    const fetchImpl = fakeThumbnailFetch();
    const verify = vi.fn(async () => ({ taylor_present: true, confidence: 0.95, reason: 'ok' }));
    const result = await fetchAppearanceThumbnail(c, { fetchImpl, apiKey: 'k', verify });
    expect(result.sourceUrl).toContain('maxresdefault.jpg');
    expect(verify).toHaveBeenCalledTimes(1);
  });

  it('rejects a shape-valid thumbnail that verification says has no Taylor in it (the XwCWKSO0F8s case)', async () => {
    const fetchImpl = fakeThumbnailFetch();
    const verify = vi.fn(async () => ({ taylor_present: false, confidence: 0.9, reason: 'animated tree/tire-swing illustration, no person' }));
    await expect(fetchAppearanceThumbnail(c, { fetchImpl, apiKey: 'k', verify })).rejects.toThrow(/verifiably contains Taylor/);
    expect(verify).toHaveBeenCalled();
  });

  it('rejects a low-confidence "yes" rather than shipping an uncertain match', async () => {
    const fetchImpl = fakeThumbnailFetch();
    const verify = vi.fn(async () => ({ taylor_present: true, confidence: 0.3, reason: 'partially obscured, unsure' }));
    await expect(fetchAppearanceThumbnail(c, { fetchImpl, apiKey: 'k', verify })).rejects.toThrow(/low confidence/);
  });

  it('never calls verify for a thumbnail that fails the shape check first', async () => {
    const fetchImpl = fakeThumbnailFetch({ width: 10, height: 10 });
    const verify = vi.fn(async () => ({ taylor_present: true, confidence: 0.95, reason: 'ok' }));
    await expect(fetchAppearanceThumbnail(c, { fetchImpl, apiKey: 'k', verify })).rejects.toThrow(/no Instagram-safe YouTube thumbnail/);
    expect(verify).not.toHaveBeenCalled();
  });
});
