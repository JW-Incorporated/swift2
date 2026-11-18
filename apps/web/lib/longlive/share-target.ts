import { THREADS, getEra, getThread, resolveTrackKey } from '@swift2/experience';
import type { OgCardCopy } from '@/lib/longlive/og-card';
import { getContentItemByIdOrSlug } from '@/lib/longlive/content';
import '@/lib/longlive/vault-wiring';

export interface ShareTarget {
  /** The single canonical `key=value` pair the og image route is asked to render. */
  param: string;
  /** Card copy rendered into the og image. */
  card: OgCardCopy;
  title: string;
  description: string;
  /** Site-relative URL of the shared target (`/?<param>`), used as og:url. */
  path: string;
  /** Alt text for the og image, read from the same card copy it renders. */
  imageAlt: string;
}

export type ShareParams = Partial<Record<'item' | 'song' | 'guide' | 'theories' | 'lens' | 'mode' | 'era', string>>;

const MODE_COPY = new Map<string, OgCardCopy>([
  [
    'mood',
    {
      kicker: 'Long Live',
      title: 'Mood',
      subtitle: "Tell it how you're feeling, get back the songs that fit.",
    },
  ],
  [
    'clownbot',
    {
      kicker: 'Long Live',
      title: 'Clownbot',
      subtitle: 'An unhinged, permanently-online superfan you can chat with.',
    },
  ],
]);

const MAX_DESCRIPTION = 160;
const MAX_ERA_DESCRIPTION = 155;
const MAX_TITLE = 100;

function eraForId(id: string | undefined) {
  if (!id) return undefined;
  const era = getEra(id);
  return era.id === id ? era : undefined;
}

export function clampOnWord(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max + 1);
  const space = cut.lastIndexOf(' ');
  const head = (space > 0 ? cut.slice(0, space) : flat.slice(0, max)).replace(/[\s,;:.\-–—]+$/, '');
  return `${head}…`;
}

function target(param: string, card: OgCardCopy, description = card.subtitle, title = card.title): ShareTarget {
  return {
    param,
    card,
    title: clampOnWord(title, MAX_TITLE),
    description: clampOnWord(description, MAX_DESCRIPTION),
    path: `/?${param}`,
    imageAlt: card.kicker === 'Long Live' ? `Long Live card: ${card.title}` : `Long Live card: ${card.title} (${card.kicker})`,
  };
}

const enc = encodeURIComponent;

/**
 * One resolver for both the page's text metadata and the og image route, so the
 * words and the picture cannot disagree. Precedence mirrors the reader's
 * `deepLinkTarget` (item > song > guide > theories > lens > mode > era). A param
 * that does not resolve is skipped; null means "keep the generic metadata".
 */
export function resolveShareTarget(params: ShareParams): ShareTarget | null {
  const { item: itemId, song, guide, theories, lens, mode, era: eraParam } = params;

  const item = itemId ? getContentItemByIdOrSlug(itemId) : undefined;
  if (item) {
    const era = getEra(item.eraId);
    return target(`item=${enc(item.id)}`, { kicker: `${era.name} · ${item.dateLabel}`, title: item.title, subtitle: item.summary });
  }

  const track = song ? resolveTrackKey(song) : null;
  if (song && track) {
    const era = getEra(track.eraId);
    return target(`song=${enc(song)}`, { kicker: era.album, title: track.track.title, subtitle: track.track.note }, era.album);
  }

  const guideEra = eraForId(guide);
  if (guide && guideEra) {
    return target(`guide=${enc(guide)}`, {
      kicker: `Track guide · ${guideEra.yearLabel}`,
      title: guideEra.album,
      subtitle: 'Every song, each with a sourced note.',
    });
  }

  const theoriesEra = eraForId(theories);
  if (theories && theoriesEra) {
    return target(`theories=${enc(theories)}`, {
      kicker: `Theories & eggs · ${theoriesEra.yearLabel}`,
      title: `${theoriesEra.shortName} decoded`,
      subtitle: 'Every egg and theory, sourced and graded.',
    });
  }

  if (lens && THREADS.some((t) => t.id === lens)) {
    const thread = getThread(lens as (typeof THREADS)[number]['id']);
    return target(`lens=${enc(lens)}`, { kicker: 'Long Live', title: thread.title, subtitle: thread.what });
  }

  const modeCopy = mode ? MODE_COPY.get(mode) : undefined;
  if (mode && modeCopy) return target(`mode=${enc(mode)}`, modeCopy);

  const era = eraForId(eraParam);
  if (eraParam && era) {
    const description = clampOnWord(`${era.yearLabel}: ${era.tagline} ${era.intro}`, MAX_ERA_DESCRIPTION);
    return target(`era=${enc(eraParam)}`, { kicker: era.yearLabel, title: era.name, subtitle: era.tagline }, description);
  }

  return null;
}
