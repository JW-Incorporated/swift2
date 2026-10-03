// Flat-order audit (WP2.2 Fable carry): the snapshot regroups content by era, so
// anything that depended on the web's flat `CONTENT` order must give the same
// answer over the era-grouped order. Real baked inputs, every thread.
import { describe, expect, it } from 'vitest';
import type { ReaderCorpus } from '../corpus';
import { ERAS } from '../eras';
import { THREADS } from '../lenses';
import { contentForThreadIn } from '../threads';
import type { ContentItem } from '../types';

const web = '../../../../apps/web/lib/longlive/';

const corpusOf = (content: readonly ContentItem[]): ReaderCorpus => ({
  content: () => content,
  getContentItem: () => undefined,
  tracks: () => ({}),
  theories: () => ({}),
  eraSecrets: () => ({}),
  songTarget: () => null,
});

describe('flat CONTENT order vs era-grouped order', () => {
  it('contentForThreadIn is id-for-id identical for every thread', async () => {
    const { CONTENT } = (await import(/* @vite-ignore */ `${web}content`)) as { CONTENT: ContentItem[] };
    const grouped = ERAS.flatMap((e) => CONTENT.filter((c) => c.eraId === e.id));
    expect(grouped).toHaveLength(CONTENT.length);
    const flat = corpusOf(CONTENT);
    const byEra = corpusOf(grouped);
    const offending: string[] = [];
    for (const t of THREADS) {
      const a = contentForThreadIn(flat, t.id).map((i) => i.id);
      const b = contentForThreadIn(byEra, t.id).map((i) => i.id);
      if (JSON.stringify(a) !== JSON.stringify(b)) offending.push(t.id);
    }
    expect(offending, `threads whose order differs: ${offending.join(', ')}`).toEqual([]);
  });

  it('ids and slugs are unique across content (getContentItemByIdOrSlug)', async () => {
    const { CONTENT } = (await import(/* @vite-ignore */ `${web}content`)) as { CONTENT: ContentItem[] };
    const dupes = (values: string[]) => values.filter((v, i) => values.indexOf(v) !== i);
    expect(dupes(CONTENT.map((c) => c.id))).toEqual([]);
    expect(dupes(CONTENT.flatMap((c) => (c.slug ? [c.slug] : [])))).toEqual([]);
  });
});
