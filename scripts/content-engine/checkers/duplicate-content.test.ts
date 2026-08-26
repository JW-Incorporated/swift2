import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check, titleSimilarity } from './duplicate-content.mjs';
// @ts-expect-error — plain .mjs corpus loader, no types
import { loadCorpus } from '../lib/corpus.mjs';

const moment = (over: Record<string, unknown> = {}) => ({
  type: 'moment',
  file: 'supabase/seed/content/the-life-of-a-showgirl.mjs',
  era: 'the-life-of-a-showgirl',
  key: 'k',
  title: 'A moment',
  category: 'fashion',
  texts: { context: '' },
  sources: [],
  images: [],
  raw: { year: 2025, month: 8, day: 26 },
  ...over,
});

describe('duplicate-content check', () => {
  it('ignores non-moment items and lone moments', async () => {
    expect(await check([{ type: 'track' }, { type: 'theory' }])).toEqual([]);
    expect(await check([moment()])).toEqual([]);
  });

  it('flags near-identical titles, and marks a cross-era pair P2 (a misfile)', async () => {
    const a = moment({ era: 'the-life-of-a-showgirl', key: 'a', title: 'The engagement, announced on Instagram', category: 'relationship' });
    const b = moment({ era: 'tortured-poets', file: 'supabase/seed/content/tortured-poets.mjs', key: 'b', title: 'The engagement announced on Instagram', category: 'relationship' });
    const f = await check([a, b]);
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.duplicate-content');
    expect(f[0].severity).toBe('P2'); // different eras
  });

  it('flags a same-shoot pair: shared image + same category within a week', async () => {
    const a = moment({ key: 'a', title: 'A black Versace gown at the VMAs', images: [{ url: 'shoot.jpg' }] });
    const b = moment({ key: 'b', title: 'A black-and-gold gown for a record VMA night', day: 28, images: [{ url: 'shoot.jpg' }] });
    const f = await check([a, b]);
    expect(f).toHaveLength(1);
    expect(f[0].severity).toBe('P3'); // same era
  });

  it('does NOT flag distinct moments that merely reuse a hero image', async () => {
    // Same photo can legitimately headline two unrelated stories; without title
    // overlap and same category+week, that is not a duplicate.
    const a = moment({ key: 'a', title: 'The engagement ring, an old mine diamond', category: 'fashion', images: [{ url: 'hero.jpg' }] });
    const b = moment({ key: 'b', title: 'A wedding at Madison Square Garden', category: 'relationship', day: 3, month: 7, images: [{ url: 'hero.jpg' }] });
    expect(await check([a, b])).toEqual([]);
  });

  it('does NOT flag two genuinely different fashion moments in the same era/week', async () => {
    const a = moment({ key: 'a', title: 'A Schiaparelli gown at the Grammys' });
    const b = moment({ key: 'b', title: 'A Polo Ralph Lauren dress in the garden' });
    expect(await check([a, b])).toEqual([]);
  });

  it('flags a thin migrated stub beside a same-day rich retelling despite dissimilar titles', async () => {
    const a = moment({
      key: 'stub',
      title: 'The schedule changes overnight',
      category: 'music',
      texts: {
        context:
          'An online leak forced the label to rush Mine to country radio and iTunes on August 4.',
      },
    });
    const b = moment({
      key: 'rich',
      title: 'Mine reaches listeners twelve days early',
      category: 'music',
      texts: {
        context: [
          'Mine had been scheduled for August 16, but an online leak changed the label plan.',
          'Big Machine rushed the single to country radio and iTunes on August 4, twelve days before the announced date.',
          'The accelerated rollout turned an unauthorized upload into the public start of the Speak Now campaign.',
          'Contemporary coverage traced the decision, the radio delivery, and the digital-store launch in detail.',
        ].join(' '),
      },
      sources: [{ url: 'https://example.com/one' }, { url: 'https://example.com/two' }],
    });
    expect(titleSimilarity(a.title, b.title)).toBe(0);
    const f = await check([a, b]);
    expect(f).toHaveLength(1);
    expect(f[0].severity).toBe('P3');
    expect(f[0].title).toMatch(/likely migrated stub/);
    expect(f[0].evidence).toMatch(/body characters/);
  });

  it('does NOT flag distinct same-day angles solely because one is thinner', async () => {
    const writingStory = moment({
      key: 'writing',
      title: 'How the bridge found its final melody',
      category: 'music',
      texts: {
        context:
          'A Nashville notebook and a late piano exercise shaped the bridge before the final studio session.',
      },
    });
    const releaseEvent = moment({
      key: 'release',
      title: 'A midnight release party fills the record store',
      category: 'music',
      texts: {
        context: [
          'Hundreds gathered beneath the Manhattan marquee for a midnight listening party.',
          'Staff handed out numbered wristbands, opened the doors at eleven, and kept the celebration moving across two floors.',
          'The event included a photo booth, handwritten signs, themed drinks, and a countdown led by the local radio host.',
          'Reporters documented the queue outside, the in-store decorations, and the crowd reaction when the clock struck twelve.',
        ].join(' '),
      },
      sources: [{ url: 'https://example.com/three' }, { url: 'https://example.com/four' }],
    });
    expect(await check([writingStory, releaseEvent])).toEqual([]);
  });

  it('does NOT apply the stub rule across eras or beyond two days', async () => {
    const stub = moment({
      key: 'stub',
      title: 'A short schedule note',
      texts: { context: 'A surprise leak forced the label to change the planned radio launch.' },
    });
    const rich = moment({
      key: 'rich',
      title: 'The full account of an unexpected rollout',
      texts: {
        context: 'A surprise leak forced the label to change the planned radio launch. '.repeat(8),
      },
      sources: [{ url: 'https://example.com/one' }, { url: 'https://example.com/two' }],
    });
    expect(await check([stub, moment({ ...rich, era: 'midnights' })])).toEqual([]);
    expect(
      await check([stub, moment({ ...rich, raw: { year: 2025, month: 8, day: 29 } })]),
    ).toEqual([]);
    expect(
      await check([
        moment({ ...stub, raw: { year: 2025, month: 8 } }),
        moment({ ...rich, raw: { year: 2025, month: 8 } }),
      ]),
    ).toEqual([]);
  });
});

describe('real corpus duplicate regression', () => {
  it('has no same-era, same-day moments with title Jaccard similarity above 0.5', async () => {
    const moments = (await loadCorpus()).filter((item: { type: string }) => item.type === 'moment');
    const offenders = [];
    for (let i = 0; i < moments.length; i++) {
      for (let j = i + 1; j < moments.length; j++) {
        const A = moments[i],
          B = moments[j];
        const sameDate =
          A.raw?.year != null &&
          A.raw?.month != null &&
          A.raw?.day != null &&
          A.raw.year === B.raw?.year &&
          A.raw?.month === B.raw?.month &&
          A.raw?.day === B.raw?.day;
        if (A.era !== B.era || !sameDate || titleSimilarity(A.title, B.title) <= 0.5) continue;
        offenders.push(
          `${A.era} ${A.raw.year}-${A.raw.month}-${A.raw.day}: "${A.title}" vs "${B.title}"`,
        );
      }
    }
    expect(offenders).toEqual([]);
  });
});
