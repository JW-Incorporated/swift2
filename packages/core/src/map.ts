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

function asSources(value: unknown): MomentSource[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === 'object')
    .map((s) => ({ outlet: String(s['outlet'] ?? ''), url: String(s['url'] ?? '') }))
    .filter((s) => s.url !== '');
}

function asPhotos(value: unknown): MomentPhoto[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === 'object')
    .map((p) => ({
      url: String(p['url'] ?? ''),
      credit: p['credit'] == null ? null : String(p['credit']),
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
