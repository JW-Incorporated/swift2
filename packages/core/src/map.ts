// Pure row -> domain mappers (snake_case DB rows -> camelCase @swift2/shared
// types). Kept separate from I/O so they can be unit-tested without a network.
import type {
  Era,
  EraTheme,
  Milestone,
  MilestoneType,
  Moment,
  MomentPhoto,
  MomentSource,
  MonthItem,
  TrackNote,
  VaultCategory,
} from '@swift2/shared';

export interface EraRow {
  slug: string;
  title: string;
  album: string;
  start_date: string;
  end_date: string;
  sort_order: number;
  theme: unknown;
  cover_image_url: string | null;
}

export interface MilestoneRow {
  id: string;
  era_slug: string;
  type: string;
  title: string;
  date: string;
}

export interface MonthItemRow {
  id: string;
  era_slug: string;
  year: number;
  month: number;
  category: string;
  title: string;
  snippet: string;
  source_url: string | null;
  thumbnail_url: string | null;
}

export interface MomentRow {
  month_item_id: string;
  context: string;
  sources: unknown;
  photos: unknown;
}

export function mapEra(row: EraRow): Era {
  return {
    slug: row.slug,
    title: row.title,
    album: row.album,
    startDate: row.start_date,
    endDate: row.end_date,
    order: row.sort_order,
    theme: row.theme as EraTheme,
    coverImageUrl: row.cover_image_url,
  };
}

export function mapMilestone(row: MilestoneRow): Milestone {
  return {
    id: row.id,
    eraSlug: row.era_slug,
    type: row.type as MilestoneType,
    title: row.title,
    date: row.date,
  };
}

export function mapMonthItem(row: MonthItemRow): MonthItem {
  return {
    id: row.id,
    eraSlug: row.era_slug,
    year: row.year,
    month: row.month,
    category: row.category as VaultCategory,
    title: row.title,
    snippet: row.snippet,
    sourceUrl: row.source_url,
    thumbnailUrl: row.thumbnail_url,
  };
}

// url must be a real string — never coerce (a non-string like {} would become
// "[object Object]" and pass as a valid link). Drop malformed entries instead.
const asUrl = (value: unknown): string => (typeof value === 'string' ? value : '');

function asSources(value: unknown): MomentSource[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === 'object')
    .map((s) => ({
      // Accept both the legacy {outlet,url} shape and the rich §5 provenance
      // shape ({source_title,publisher,source_url,…}) the seed runners store.
      outlet: String(s['outlet'] ?? s['source_title'] ?? s['publisher'] ?? ''),
      url: asUrl(s['url'] ?? s['source_url']),
    }))
    .filter((s) => s.url !== '');
}

/** Trimmed non-empty strings from a jsonb array, or undefined when none. */
function asStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value.filter((s): s is string => typeof s === 'string' && s.trim() !== '');
  return out.length ? out : undefined;
}

function asPhotos(value: unknown): MomentPhoto[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === 'object')
    .map((p) => ({
      url: asUrl(p['url']),
      credit: typeof p['credit'] === 'string' ? p['credit'] : null,
    }))
    .filter((p) => p.url !== '');
}

export function mapMoment(row: MomentRow): Moment {
  return {
    monthItemId: row.month_item_id,
    context: row.context,
    sources: asSources(row.sources),
    photos: asPhotos(row.photos),
  };
}

export interface TrackNoteRow {
  id: string;
  era_slug: string;
  track_title: string;
  track_number: number | null;
  note: string;
  source_url: string | null;
  sources: unknown;
  // Additive columns (issue #440 Phase 0 migration) — optional so the mapper
  // stays compatible with a DB that hasn't run the migration yet.
  slug?: string | null;
  release?: string | null;
  release_date?: string | null;
  writers?: unknown;
  producers?: unknown;
  is_single?: boolean | null;
  single_release_date?: string | null;
  themes?: unknown;
  dossier?: unknown;
}

export function mapTrackNote(row: TrackNoteRow): TrackNote {
  const dossier =
    row.dossier && typeof row.dossier === 'object' && !Array.isArray(row.dossier) && Object.keys(row.dossier).length
      ? (row.dossier as Record<string, unknown>)
      : undefined;
  return {
    id: row.id,
    eraSlug: row.era_slug,
    trackTitle: row.track_title,
    trackNumber: row.track_number,
    note: row.note,
    sourceUrl: row.source_url,
    sources: asSources(row.sources),
    ...(row.slug ? { slug: row.slug } : {}),
    ...(row.release ? { release: row.release } : {}),
    ...(row.release_date ? { releaseDate: row.release_date } : {}),
    ...(asStringList(row.writers) ? { writers: asStringList(row.writers) } : {}),
    ...(asStringList(row.producers) ? { producers: asStringList(row.producers) } : {}),
    ...(row.is_single ? { isSingle: true } : {}),
    ...(row.single_release_date ? { singleReleaseDate: row.single_release_date } : {}),
    ...(asStringList(row.themes) ? { themes: asStringList(row.themes) } : {}),
    ...(dossier ? { dossier } : {}),
  };
}
