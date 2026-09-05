// Maps the OS-013 content bundle's file shapes (`@swift2/content`'s zod
// schemas) onto the `VaultSkeleton` shape (`@swift2/shared/vault-types`) that
// `VaultNavigator` already renders (OS-015, `docs/specs/2026-09-05-one-
// source-three-surfaces.md` §6). Pure, no I/O — the loader (OS-013) fetches
// and validates the bundle; this file only reshapes already-validated data,
// so it is unit-testable without a network or a fixture server.
//
// The content bundle's per-domain shapes (`Era`, `Milestone`, `ContentItem`
// from `packages/content/src/schema.ts`) predate `VaultSkeleton` and don't
// match it field-for-field (different key names, no `MonthItem.year/month`
// split, no `EraTheme.heroGradient`/`eyebrow`) — this mapper is the
// single place that reconciles the two, mirroring `packages/core/src/map.ts`'s
// row-to-domain mapping role but for bundle files instead of Supabase rows.
import type {
  BundleFiles,
  Era as ContentEra,
  Milestone as ContentMilestone,
  ContentBundleFile,
  ContentItem,
  ContentTag,
  EraTheme as ContentEraTheme,
  Manifest,
  TrackNote as ContentTrackNote,
} from '@swift2/content';
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
import { isVaultCategory } from '@swift2/shared';
// `VaultSkeleton` is `@swift2/core`'s Tier 0 contract (see that package's
// `vault.ts`), not `@swift2/shared`'s — kept there since OS-015 deprecates
// `core`'s Supabase reads but not its now-mapper-target shape.
import type { VaultSkeleton } from '@swift2/core';

/** `ContentTag` -> the nearest `VaultCategory` (used only when an item carries no `milestone.kind`). */
const TAG_TO_CATEGORY: Record<ContentTag, VaultCategory> = {
  Music: 'music',
  Fashion: 'fashion',
  Tour: 'tour',
  Relationship: 'relationship',
  Lore: 'sighting',
};

function parseYearMonth(iso: string): { year: number; month: number } {
  const d = new Date(iso);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/** `EraTheme` (content schema) -> `EraTheme` (shared/vault-types). `heroGradient` and `eyebrow` have no direct
 * source field in the content bundle, so they're derived: a two-stop gradient off the era's own accent colors,
 * and the era's tagline as the small uppercase hero label. */
export function mapEraTheme(theme: ContentEraTheme, era: ContentEra): EraTheme {
  return {
    bg: theme.bg,
    surface: theme.surface,
    ink: theme.ink,
    inkSoft: theme.inkSoft,
    line: theme.line,
    accent: theme.accent,
    heroGradient: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
    eyebrow: era.tagline,
  };
}

/** `Era` (content schema) -> `Era` (shared/vault-types). `order` isn't a content-bundle field (Phase 1's `eras.json`
 * carries no explicit sort index) — the caller assigns it from each era's position once every era is sorted by
 * `start` (see `mapErasToVaultEras`), matching how `orderedEras()` already treats `order` as the timeline index. */
export function mapEra(era: ContentEra, order: number): Era {
  return {
    slug: era.id,
    title: era.name,
    album: era.album,
    startDate: era.start,
    endDate: era.end,
    order,
    theme: mapEraTheme(era.theme, era),
    coverImageUrl: era.image ?? null,
  };
}

export function mapErasToVaultEras(eras: readonly ContentEra[]): Era[] {
  const byStart = [...eras].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  return byStart.map((era, index) => mapEra(era, index));
}

/** `Milestone` (content schema, `kind` in `MILESTONE_KINDS`) -> `Milestone` (shared/vault-types, `type` in
 * `MILESTONE_TYPES`). The content schema's kind taxonomy (`album|tour|life|business|award|fandom`) is wider than
 * the Vault's two-value `MilestoneType`; only `tour` maps to `'tour'`, everything else collapses to
 * `'album_release'` (the Vault timeline marker only ever distinguished those two visually). */
export function mapMilestone(milestone: ContentMilestone): Milestone {
  const type: MilestoneType = milestone.kind === 'tour' ? 'tour' : 'album_release';
  return {
    id: milestone.id,
    eraSlug: milestone.eraId,
    type,
    title: milestone.label,
    date: milestone.date,
  };
}

/** One `ContentItem` -> one Tier 0 `MonthItem` row. Category preference, most specific first: an item flagged as
 * its era's own album milestone (`item.milestone.kind === 'album'`) is a `release`; a business milestone
 * (`item.milestone.kind === 'business'`) is `business`; an item carrying a `video` (music video / lyric video
 * etc.) is `video`; otherwise the item's first `ContentTag` maps via `TAG_TO_CATEGORY`; an item matching none of
 * these falls back to `'sighting'` (the Vault's catch-all, same default the web reader's own content model uses
 * for untagged items). This ordering is why `business` and `video` — reachable via `milestone.kind`/`video`, not
 * any `ContentTag` — still show up as categories despite `TAG_TO_CATEGORY` never producing them itself. */
export function mapContentItemToMonthItem(item: ContentItem): MonthItem {
  const { year, month } = parseYearMonth(item.date);
  const primaryImage = item.images.find((img) => img.kind === 'primary') ?? item.images[0];
  const category: VaultCategory =
    item.milestone?.kind === 'album'
      ? 'release'
      : item.milestone?.kind === 'business'
        ? 'business'
        : item.video
          ? 'video'
          : (item.tags.map((tag) => TAG_TO_CATEGORY[tag]).find(isVaultCategory) ?? 'sighting');

  return {
    id: item.id,
    eraSlug: item.eraId,
    year,
    month,
    category,
    title: item.title,
    snippet: item.summary,
    sourceUrl: item.sources?.[0]?.url ?? null,
    thumbnailUrl: primaryImage?.url ?? null,
  };
}

/** One `ContentItem` -> its Tier 1 `Moment` detail. Unlike the Supabase-backed `createVaultClient` (which fetched
 * Tier 1 on demand per `getMoment(monthItemId)` call), the content bundle downloads every item's full body up
 * front (OS-013's `loadBundle` has no partial-fetch mode) — so "on demand" here means "look up what's already in
 * memory", not a network round trip. `body` (an array of paragraphs in the content schema) joins into one string
 * to match `Moment.context`'s shape. */
export function mapContentItemToMoment(item: ContentItem): Moment {
  const sources: MomentSource[] = (item.sources ?? []).map((s) => ({ outlet: s.name, url: s.url }));
  const photos: MomentPhoto[] = item.images.map((img) => ({ url: img.url, credit: img.credit ?? null }));
  return {
    monthItemId: item.id,
    context: item.body.join('\n\n'),
    sources,
    photos,
  };
}

/** `TrackNote` (content schema) -> `TrackNote` (shared/vault-types). Field names already mostly agree; the content
 * schema's `title`/`sources` differ from the Vault's `trackTitle`/`sourceUrl` naming, and everything else
 * (writers, producers, dossier, etc.) is additive-optional on both sides so it passes through unchanged. */
export function mapContentTrackNote(eraSlug: string, note: ContentTrackNote): TrackNote {
  return {
    id: note.slug ?? `${eraSlug}-${note.trackNumber ?? note.title}`,
    eraSlug,
    trackTitle: note.title,
    trackNumber: note.trackNumber,
    note: note.note,
    sourceUrl: note.sources?.[0]?.url ?? null,
    sources: (note.sources ?? []).map((s) => ({ outlet: s.name, url: s.url })),
    slug: note.slug,
    writers: note.facts?.writers,
    singleReleaseDate: note.facts?.singleReleaseDate ?? null,
    producers: note.facts?.producers,
    release: note.facts?.release,
    releaseDate: note.facts?.releaseDate,
    isSingle: note.facts?.isSingle,
    themes: note.facts?.themes,
  };
}

/** Every manifest entry whose validated content is a per-era content file — i.e. every `content:<eraId>` key
 * (the ONLY per-era-fanned-out domain per OS-011's "split per era for the vault" step; see module doc). */
function eraContentFiles(files: BundleFiles): ContentBundleFile[] {
  return Object.entries(files)
    .filter(([name]) => name.startsWith('content:'))
    .map(([, value]) => value as ContentBundleFile);
}

/**
 * The full `loadBundle().files` map -> `VaultSkeleton`. Reads the `eras`, `milestones`, and every `content:<eraId>`
 * manifest entry (see `eraContentFiles`); throws if `eras` or `milestones` is missing from the bundle so a
 * misconfigured `build-content-bundle.mjs` output fails loudly here rather than rendering a silently-empty Vault.
 */
export function mapBundleToSkeleton(files: BundleFiles): VaultSkeleton {
  const eras = files.eras as ContentEra[] | undefined;
  const milestones = files.milestones as ContentMilestone[] | undefined;
  if (!eras) throw new Error('mapBundleToSkeleton: bundle is missing its "eras" file');
  if (!milestones) throw new Error('mapBundleToSkeleton: bundle is missing its "milestones" file');

  const monthItems = eraContentFiles(files).flatMap((file) => file.items.map(mapContentItemToMonthItem));

  return {
    eras: mapErasToVaultEras(eras),
    milestones: milestones.map(mapMilestone),
    monthItems,
  };
}

/** Look up one Tier 1 moment by its `MonthItem.id` across every `content:<eraId>` file already in memory. Returns
 * `null` when no item with that id was found (mirrors `createVaultClient().getMoment`'s "no moment authored" contract). */
export function findMoment(files: BundleFiles, monthItemId: string): Moment | null {
  for (const file of eraContentFiles(files)) {
    const item = file.items.find((it) => it.id === monthItemId);
    if (item) return mapContentItemToMoment(item);
  }
  return null;
}

/** Every track note for one era, across a `tracks:<eraSlug>` manifest entry if present, else the single flat
 * `tracks` entry (both shapes `tracksBundleFileSchema` allows) filtered to `eraSlug`. */
export function findTrackGuide(files: BundleFiles, eraSlug: string): TrackNote[] {
  const perEraKey = `tracks:${eraSlug}`;
  const perEraFile = files[perEraKey] as { eraId: string; tracks: ContentTrackNote[] } | undefined;
  if (perEraFile) return perEraFile.tracks.map((note) => mapContentTrackNote(eraSlug, note));

  const flatFile = files.tracks as { eraId: string; tracks: ContentTrackNote[] } | undefined;
  if (flatFile && flatFile.eraId === eraSlug) {
    return flatFile.tracks.map((note) => mapContentTrackNote(eraSlug, note));
  }
  return [];
}

/** Re-exported so callers/tests importing from this module don't also need `@swift2/content` just for the
 * manifest type used by `getManifestBundleVersion` in `vault.ts`. */
export type { Manifest };
