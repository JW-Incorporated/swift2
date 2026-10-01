import { ERAS, isSubConfirmed, truncate, type Era } from '@swift2/experience';
import { getContentItemByIdOrSlug } from './content';
import {
  MY_ERAS_MAX,
  parseBucketParam,
  parseShareCardSize,
  shareCardPath,
  type ShareCardSize,
} from './share-card-params';

/**
 * Validated, fully-resolved description of one card. Everything the renderer
 * draws comes from here — era palette/copy from the allowlisted catalogue,
 * moment copy from the vault, counts from the bucket set. Nothing from the
 * query string reaches the image as free text, so an arbitrary URL can only
 * ever select one of a bounded set of cards.
 */
export type ShareCardSpec =
  | {
      kind: 'moment';
      /** Canonical id (a slug in the request resolves to this). */
      itemId: string;
      era: Era;
      dateLabel: string;
      title: string;
      summary: string;
      /** Non-null for any sub-confirmed moment; the stamp text. */
      stamp: 'Unconfirmed' | 'Debunked' | null;
    }
  | { kind: 'era'; era: Era }
  | { kind: 'myEras'; eras: Era[]; moments: number; eggs: number; favorites: number }
  | { kind: 'default'; era: Era };

export interface ShareCardRequest {
  spec: ShareCardSpec;
  size: ShareCardSize;
}

const TITLE_MAX = 110;
const SUMMARY_MAX = 200;

const ERA_BY_ID = new Map(ERAS.map((era) => [era.id as string, era]));

/** Strict lookup — unlike `getEra`, an unknown id is `undefined`, never a fallback era. */
function eraForId(id: string | null): Era | undefined {
  return id ? ERA_BY_ID.get(id) : undefined;
}

function defaultSpec(): ShareCardSpec {
  return { kind: 'default', era: ERAS[ERAS.length - 1] };
}

/**
 * Whole sentences up to the budget, so a card never ends mid-clause. A split
 * needs a capital after the full stop, which keeps "album No. 13." in one
 * piece. If even the first sentence is too long, it is word-truncated.
 */
export function leadSentences(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, ' ');
  const sentences = t.split(/(?<=[.!?])\s+(?=[A-Z"“‘'])/);
  let out = '';
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > max) break;
    out = next;
  }
  return out || truncate(t, max);
}

function momentSpec(raw: string): ShareCardSpec | undefined {
  const item = getContentItemByIdOrSlug(raw);
  const era = item ? eraForId(item.eraId) : undefined;
  if (!item || !era) return undefined;
  const unconfirmed = item.confidence !== undefined && isSubConfirmed(item.confidence);
  return {
    kind: 'moment',
    itemId: item.id,
    era,
    dateLabel: item.dateLabel,
    title: truncate(item.title, TITLE_MAX),
    summary: leadSentences(item.summary, SUMMARY_MAX),
    stamp: unconfirmed ? (item.confidence === 'disproven' ? 'Debunked' : 'Unconfirmed') : null,
  };
}

function myErasSpec(raw: string, params: URLSearchParams): ShareCardSpec | undefined {
  const seen = new Set<string>();
  const eras: Era[] = [];
  for (const part of raw.split(',').slice(0, MY_ERAS_MAX * 2)) {
    const era = eraForId(part.trim());
    if (era && !seen.has(era.id)) {
      seen.add(era.id);
      eras.push(era);
    }
    if (eras.length === MY_ERAS_MAX) break;
  }
  if (eras.length === 0) return undefined;
  return {
    kind: 'myEras',
    eras,
    moments: parseBucketParam(params.get('m')),
    eggs: parseBucketParam(params.get('e')),
    favorites: parseBucketParam(params.get('f')),
  };
}

/**
 * Total: any query string yields a renderable request, never a throw. A
 * recognised target that fails validation degrades to the default brand card.
 * Precedence mirrors the form the share UI builds: item, then eras, then era.
 */
export function parseShareCardRequest(url: URL): ShareCardRequest {
  const p = url.searchParams;
  const size = parseShareCardSize(p.get('size'));
  const item = p.get('item');
  const eras = p.get('eras');
  const era = eraForId(p.get('era'));
  let spec: ShareCardSpec | undefined;
  try {
    if (item) spec = momentSpec(item);
    else if (eras) spec = myErasSpec(eras, p);
    else if (era) spec = { kind: 'era', era };
  } catch {
    spec = undefined;
  }
  return { spec: spec ?? defaultSpec(), size };
}

/**
 * The one URL a given card is served from. The route 308s every other query
 * (extra keys, a slug instead of the id, conflicting item+era, invalid ids,
 * unbucketed counts) here, so the CDN only ever renders canonical URLs and an
 * attacker cannot mint cache entries by decorating the query string.
 */
export function canonicalShareCardPath({ spec, size }: ShareCardRequest): string {
  switch (spec.kind) {
    case 'moment':
      return shareCardPath({ item: spec.itemId }, size);
    case 'era':
      return shareCardPath({ era: spec.era.id }, size);
    case 'myEras':
      return shareCardPath(
        {
          eras: spec.eras.map((e) => e.id),
          moments: spec.moments,
          eggs: spec.eggs,
          favorites: spec.favorites,
        },
        size,
      );
    default:
      return shareCardPath({}, size);
  }
}
