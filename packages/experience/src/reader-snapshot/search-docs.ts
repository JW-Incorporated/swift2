import { EGG_NODES, THREADS, motifOf } from '../lenses';
import { makeSearchDoc, type SearchDoc, type SearchTarget } from '../search-index';
import { trackKey } from '../track-guide';
import type { ReaderSnapshotInputs } from './types';

/**
 * The one search-index builder, from the inputs alone, for both the baked and
 * the bundle path (it replaced the web's own `buildSearchIndex()`, which it
 * matched doc for doc).
 */
export function buildSearchDocs(inputs: ReaderSnapshotInputs): SearchDoc[] {
  const { eras, content, tracks, theories, videos } = inputs;
  const docs: SearchDoc[] = [];

  for (const era of eras) {
    docs.push(
      makeSearchDoc('era', era.id, era.name, era.tagline, era.id, { kind: 'era', eraId: era.id }, [
        era.album,
        era.shortName,
        era.yearLabel,
        era.tagline,
        era.intro,
      ]),
    );
  }

  for (const item of content) {
    docs.push(
      makeSearchDoc(
        'moment',
        item.id,
        item.title,
        item.summary,
        item.eraId,
        { kind: 'moment', itemId: item.id },
        [item.summary, ...item.body, item.tags.join(' '), item.dateLabel],
        item.significance === 'defining' ? 45 : item.significance === 'notable' ? 18 : 0,
      ),
    );
  }

  for (const node of EGG_NODES) {
    const motifId = motifOf(node.id);
    const target: SearchTarget = motifId
      ? { kind: 'trail', motifId }
      : { kind: 'era', eraId: node.eraId };
    docs.push(
      makeSearchDoc('egg', node.id, node.label, node.detail, node.eraId, target, [node.detail, String(node.year)]),
    );
  }

  for (const thread of THREADS) {
    docs.push(
      makeSearchDoc('thread', thread.id, thread.title, thread.kicker, null, { kind: 'thread', lensId: thread.id }, [
        thread.kicker,
        thread.what,
      ]),
    );
  }

  for (const era of eras) {
    for (const track of tracks[era.id] ?? []) {
      docs.push(
        makeSearchDoc(
          'track',
          `${era.id}:${track.trackNumber ?? 'x'}:${track.title}`,
          track.title,
          `${era.album} · ${track.note}`,
          era.id,
          { kind: 'track', eraId: era.id, trackKey: trackKey(era.id, track) },
          [track.note, era.album],
        ),
      );
    }
    for (const theory of theories[era.id] ?? []) {
      docs.push(
        makeSearchDoc(
          'theory',
          `${era.id}:${theory.slug}`,
          theory.title,
          theory.claim,
          era.id,
          { kind: 'theory-guide', eraId: era.id },
          [theory.claim, theory.evidence ?? ''],
        ),
      );
    }
    for (const video of videos[era.id] ?? []) {
      docs.push(
        makeSearchDoc(
          'video',
          `${era.id}:${video.slug}`,
          video.title,
          video.summary ?? `${era.album} era video`,
          era.id,
          { kind: 'video', eraId: era.id, videoId: video.slug },
          [video.summary ?? '', video.relatedSongs.join(' '), video.easterEggs.join(' ')],
        ),
      );
    }
  }

  return docs;
}
