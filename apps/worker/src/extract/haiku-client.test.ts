import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractWithLLM, sanitizeResult } from './haiku-client';
import { ExtractUsageStore, type UsageDb } from './usage-store';

function unlimitedUsageDb(): UsageDb {
  return {
    async todaysCallCount() {
      return 0;
    },
    async incrementToday() {},
  };
}

const ORIGINAL_ENV = process.env.ANTHROPIC_API_KEY;
const baseInput = { items: [{ title: 't', snippet: 's' }], symbolLexiconKeys: [], eraId: 'tloas', today: '2026-08-23' };

function toolUseResponse(input: unknown) {
  return {
    ok: true,
    json: async () => ({ content: [{ type: 'tool_use', name: 'record_knowledge', input }] }),
  };
}

describe('extractWithLLM', () => {
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = ORIGINAL_ENV;
    vi.unstubAllGlobals();
  });

  it('returns null with no ANTHROPIC_API_KEY — the expected state, not an error', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractWithLLM(usage, baseInput);
    expect(result).toBeNull();
  });

  it('returns null when the cap is already reserved out, without calling fetch', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const usage = await ExtractUsageStore.create(unlimitedUsageDb(), 0, 600); // perRunCap=0
    const result = await extractWithLLM(usage, baseInput);
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('parses a skip tool call', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(toolUseResponse({ kind: 'skip', skip_reason: 'not_taylor', redline_flags: [] })),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractWithLLM(usage, baseInput);
    expect(result).toEqual({ kind: 'skip', skipReason: 'not_taylor', redlineFlags: [] });
  });

  it('parses a current_item tool call and clamps an out-of-range category', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        toolUseResponse({
          kind: 'current_item',
          redline_flags: [],
          current_item: {
            observed_on: '2026-08-23',
            category: 'not-a-real-category',
            headline: 'H',
            summary: 'S',
            detail: 'D',
            status_hint: 'reported',
            tags: ['taylor'],
            symbols: ['13'],
            entities: [],
          },
        }),
      ),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractWithLLM(usage, baseInput);
    expect(result?.kind).toBe('current_item');
    expect(result?.currentItem?.category).toBe('sighting'); // fallback default
    expect(result?.currentItem?.headline).toBe('H');
  });

  it('degrades an empty current_item body to skip rather than write a half-empty row', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(toolUseResponse({ kind: 'current_item', redline_flags: [] })));
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractWithLLM(usage, baseInput);
    expect(result?.kind).toBe('skip');
    expect(result?.skipReason).toBe('no_truth_value');
  });

  it('throws on a non-OK response — a real failure, defers the cluster, never silently drops it', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'server error' }),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await expect(extractWithLLM(usage, baseInput)).rejects.toThrow('Anthropic extract failed (500)');
  });

  it('caches the system prompt via cache_control on the system block', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const fetchSpy = vi.fn().mockResolvedValue(toolUseResponse({ kind: 'skip', redline_flags: [] }));
    vi.stubGlobal('fetch', fetchSpy);
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await extractWithLLM(usage, baseInput);
    const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body);
    expect(body.system[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(body.tool_choice).toEqual({ type: 'tool', name: 'record_knowledge' });
  });

  it('sends real-shaped Reddit comment bodies as explicitly untrusted, aggregate-only context', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const fetchSpy = vi.fn().mockResolvedValue(toolUseResponse({ kind: 'skip', redline_flags: [] }));
    vi.stubGlobal('fetch', fetchSpy);
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await extractWithLLM(usage, {
      ...baseInput,
      commentThreads: [
        {
          postTitle: 'Taylor Swift Performance - The Icon Sessions at the Grammy Museum.',
          comments: [
            'WAKE THE FCK UP ITS SURPRISE SONG OCLOCK',
            'i miss The Eras Tour piano so much! the idea of mashing up I Knew It, I Knew You x august x All Too Well is genius.',
          ],
        },
      ],
    });

    const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body);
    const userMessage = body.messages[0].content as string;
    expect(userMessage).toContain('REDDIT COMMENT THREAD CONTEXT');
    expect(userMessage).toContain('SURPRISE SONG OCLOCK');
    expect(userMessage).toContain('mashing up I Knew It, I Knew You x august x All Too Well');
    expect(userMessage).not.toContain('/u/');
    expect(body.system[0].text).toContain('untrusted source material');
    expect(body.system[0].text).toContain('Never name, quote, closely paraphrase');
    expect(body.system[0].text).toContain('Easter-egg interpretation, theories, and new-song discussion');
  });

  it('includes fetched article text in the prompt, labelled untrusted, bounded in total length', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const fetchSpy = vi.fn().mockResolvedValue(toolUseResponse({ kind: 'skip', redline_flags: [] }));
    vi.stubGlobal('fetch', fetchSpy);
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    await extractWithLLM(usage, {
      ...baseInput,
      articleTexts: [
        {
          url: 'https://variety.com/article',
          outletName: 'Variety',
          text: 'Taylor announced the new single during a livestream, citing the Eras Tour anniversary as the inspiration.',
        },
      ],
    });

    const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body);
    const userMessage = body.messages[0].content as string;
    expect(userMessage).toContain('FULL ARTICLE TEXT');
    expect(userMessage).toContain('untrusted source material');
    expect(userMessage).toContain('Variety');
    expect(userMessage).toContain('Eras Tour anniversary as the inspiration');
  });

  it('caps the total article-text block even when several long articles are supplied', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const fetchSpy = vi.fn().mockResolvedValue(toolUseResponse({ kind: 'skip', redline_flags: [] }));
    vi.stubGlobal('fetch', fetchSpy);
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const longText = 'word '.repeat(2000);
    await extractWithLLM(usage, {
      ...baseInput,
      articleTexts: [
        { url: 'https://a.example/1', text: longText },
        { url: 'https://b.example/2', text: longText },
        { url: 'https://c.example/3', text: longText },
      ],
    });

    const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body);
    const userMessage = body.messages[0].content as string;
    const articleBlockStart = userMessage.indexOf('FULL ARTICLE TEXT');
    expect(articleBlockStart).toBeGreaterThan(-1);
    // The block itself (not the whole message) must stay within the module's
    // total-article-text bound — well under the sum of three ~10k fixtures.
    expect(userMessage.length - articleBlockStart).toBeLessThan(10_000);
  });
});

describe('sanitizeResult', () => {
  it('defaults to skip for a completely unrecognized kind', () => {
    expect(sanitizeResult({ kind: 'nonsense' })).toEqual({ kind: 'skip', redlineFlags: [] });
  });
});

// Card 2: fixture tests against a realistic clustered story + fetched
// article text, asserting the end-to-end output (model response ->
// sanitizeResult) meets the new copy-standard length floors, and that the
// sanitizer never fabricates content the model didn't actually return — the
// closest thing to "no invented facts" this pure-unit layer can assert
// (the prompt itself carries the no-invention instruction; prompt.test.ts
// pins that down. What's checked here is that nothing in the write path
// silently pads/invents past what's given).
describe('Card 2 fixture: length floors on a grounded extraction', () => {
  const FIXTURE_ARTICLE_TEXT =
    'Taylor announced during a livestream on Tuesday that her new single, "Evermore Skies," will release ' +
    'on November 14, tying the date to the fifth anniversary of the Evermore era. She said the song was ' +
    'written in the same creative stretch as that album but was left off the original tracklist. The ' +
    'announcement followed weeks of cryptic countdown posts on her official Instagram that fans had been ' +
    'decoding since early October.';

  // A realistic shape for what the model would return given the fixture
  // above — meets both new floors (summary 2-3 sentences / ~160+ chars,
  // detail 60-150 words) and only restates facts present in the fixture.
  const GROUNDED_SUMMARY =
    'Taylor announced a new single, "Evermore Skies," releasing November 14 — the fifth anniversary of the ' +
    'Evermore era. Fans have been decoding cryptic countdown posts on her Instagram since early October.';
  const GROUNDED_DETAIL =
    'During a livestream on Tuesday, Taylor revealed that "Evermore Skies" will arrive November 14, deliberately ' +
    'timed to the fifth anniversary of the Evermore era. She explained the song came from the same writing stretch ' +
    'as that album but did not make the original tracklist, giving longtime fans a new piece of an era they already ' +
    'know well. The reveal capped weeks of cryptic countdown posts on her official Instagram, which fans had been ' +
    'picking apart since early October trying to guess what was coming.';

  it('summary meets the 2-3 sentence / ~160+ character floor', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        toolUseResponse({
          kind: 'current_item',
          redline_flags: [],
          current_item: {
            observed_on: '2026-10-12',
            category: 'release',
            headline: 'Taylor announces "Evermore Skies," out November 14',
            summary: GROUNDED_SUMMARY,
            detail: GROUNDED_DETAIL,
            status_hint: 'confirmed',
            tags: ['evermore'],
            symbols: [],
            entities: [],
          },
        }),
      ),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractWithLLM(usage, {
      ...baseInput,
      articleTexts: [{ url: 'https://variety.com/evermore-skies', text: FIXTURE_ARTICLE_TEXT }],
    });

    const summary = result?.currentItem?.summary ?? '';
    const sentenceCount = (summary.match(/[.!?](\s|$)/g) ?? []).length;
    expect(summary.length).toBeGreaterThanOrEqual(160);
    expect(sentenceCount).toBeGreaterThanOrEqual(2);
    vi.unstubAllGlobals();
  });

  it('detail meets the 60-150 word paragraph floor and ceiling', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        toolUseResponse({
          kind: 'current_item',
          redline_flags: [],
          current_item: {
            observed_on: '2026-10-12',
            category: 'release',
            headline: 'Taylor announces "Evermore Skies," out November 14',
            summary: GROUNDED_SUMMARY,
            detail: GROUNDED_DETAIL,
            status_hint: 'confirmed',
            tags: ['evermore'],
            symbols: [],
            entities: [],
          },
        }),
      ),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractWithLLM(usage, {
      ...baseInput,
      articleTexts: [{ url: 'https://variety.com/evermore-skies', text: FIXTURE_ARTICLE_TEXT }],
    });

    const detail = result?.currentItem?.detail ?? '';
    const wordCount = detail.split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBeGreaterThanOrEqual(60);
    expect(wordCount).toBeLessThanOrEqual(150);
    vi.unstubAllGlobals();
  });

  it('every concrete fact in the sanitized output traces back to the fixture article text', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        toolUseResponse({
          kind: 'current_item',
          redline_flags: [],
          current_item: {
            observed_on: '2026-10-12',
            category: 'release',
            headline: 'Taylor announces "Evermore Skies," out November 14',
            summary: GROUNDED_SUMMARY,
            detail: GROUNDED_DETAIL,
            status_hint: 'confirmed',
            tags: ['evermore'],
            symbols: [],
            entities: [],
          },
        }),
      ),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const result = await extractWithLLM(usage, {
      ...baseInput,
      articleTexts: [{ url: 'https://variety.com/evermore-skies', text: FIXTURE_ARTICLE_TEXT }],
    });

    const combined = `${result?.currentItem?.summary ?? ''} ${result?.currentItem?.detail ?? ''}`;
    // Every specific fact the fixture article actually states is allowed to
    // appear in the output...
    expect(combined).toContain('Evermore Skies');
    expect(combined).toContain('November 14');
    expect(combined).toContain('fifth anniversary');
    // ...but a date, number, or claim the fixture never mentions must never
    // appear — the sanitizer passes model output through verbatim (clamped
    // for length, never augmented), so this is really asserting there is no
    // write-path step that could inject unsourced specifics.
    expect(combined).not.toMatch(/November 1[0-3]\b/); // no invented nearby date
    expect(combined).not.toContain('platinum'); // no invented chart/sales claim
    expect(combined).not.toContain('world tour'); // no invented tour claim
    vi.unstubAllGlobals();
  });
});
