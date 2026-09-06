// OS-032 — native moment card. Single-column equivalent of the web's
// `MomentCard`/`MomentCardButton`/`card-chrome.ts` tier system
// (apps/web/components/longlive/MomentCard.tsx) — this screen renders one
// column (no `md:col-span-2` grid, per RN's simpler layout needs), so the
// only tier signal that survives is height/density, exactly as the web's
// own comment notes happens below its `md` breakpoint ("every card is full
// width and the tiers separate on height and internal density instead").
//
// Video playback (VideoPoster/MomentVideo, YouTube inline embed) and doorway
// cards (thread/egg) are out of scope for this card (OS-032 is moments +
// masthead + era chrome; OS-033/OS-037 are the detail sheet and doorways'
// native homes) — a `video`/`thread`/`egg`/`current` entry renders a
// simpler placeholder row here so the full feed order is still visible on
// device, without claiming a play/detail affordance this card doesn't ship.
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { CardTier, ContentItem, RenderFeedEntry } from '@swift2/experience';
import type { PlayableVideoNote } from '@swift2/content-enrichment';
import { eraColors } from '../lib/theme';

const TIER_IMAGE_HEIGHT: Record<CardTier, number> = {
  hero: 220,
  media: 160,
  chip: 88,
  text: 0,
};

function primaryImageUrl(item: ContentItem): string | null {
  const primary = item.images.find((img) => img.kind === 'primary') ?? item.images[0];
  return primary?.url ?? null;
}

export function MomentCard({
  item,
  tier,
  hideImage,
  onOpen,
}: {
  item: ContentItem;
  tier: CardTier;
  /** Video-affordance suppression (OS-032 doesn't wire this from live data yet — see era-stream-data.ts's header doc — but the prop exists so a future wiring is a one-line change here.) */
  hideImage?: boolean;
  onOpen: () => void;
}) {
  const imageUrl = hideImage ? null : primaryImageUrl(item);
  const imageHeight = TIER_IMAGE_HEIGHT[tier];

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {imageUrl && imageHeight > 0 ? (
        <Image source={{ uri: imageUrl }} style={[styles.image, { height: imageHeight }]} resizeMode="cover" />
      ) : null}
      <View style={styles.body}>
        <Text style={styles.dateLabel}>{item.dateLabel}</Text>
        <Text style={[styles.title, tier === 'hero' && styles.titleHero]} numberOfLines={tier === 'chip' ? 1 : 3}>
          {item.title}
        </Text>
        {tier !== 'chip' && (
          <Text style={styles.summary} numberOfLines={tier === 'hero' ? 4 : 2}>
            {item.summary}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/** A placeholder row for the feed kinds this card doesn't render yet (video/thread/egg/current) — see this file's header doc. Keeps `EraFeedList`'s full section order visible on device without a play/detail affordance those kinds don't have here. */
export function PlaceholderFeedRow({ entry }: { entry: Exclude<RenderFeedEntry<PlayableVideoNote>, { kind: 'moment' }> }) {
  const label =
    entry.kind === 'video'
      ? entry.video.title
      : entry.kind === 'thread'
        ? entry.doorway.title
        : entry.kind === 'egg'
          ? entry.doorway.title
          : entry.kind === 'current'
            ? entry.item.headline
            : `${entry.items.length} moments`;
  return (
    <View style={styles.placeholderRow}>
      <Text style={styles.placeholderKind}>{entry.kind.toUpperCase()}</Text>
      <Text style={styles.placeholderLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: eraColors.surface,
    borderColor: eraColors.line,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardPressed: {
    opacity: 0.85,
  },
  image: {
    width: '100%',
  },
  body: {
    padding: 14,
    gap: 6,
  },
  dateLabel: {
    color: eraColors.accent2,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: eraColors.ink,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  titleHero: {
    fontSize: 22,
    lineHeight: 28,
  },
  summary: {
    color: eraColors.inkSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  placeholderRow: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: eraColors.line,
    backgroundColor: eraColors.surface2,
    gap: 4,
  },
  placeholderKind: {
    color: eraColors.accent2,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  placeholderLabel: {
    color: eraColors.inkSoft,
    fontSize: 13,
  },
});
