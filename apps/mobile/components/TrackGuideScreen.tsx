// OS-035 — native track guide screen: an album's song list. Native
// equivalent of `apps/web/components/longlive/TrackGuide.tsx` (era-art
// header, `{n} songs, each with a sourced note` byline, one row per sourced
// track) — reads the exact same headless data via `tracksForEra`
// (`@swift2/experience`), wired to the published bundle by
// `track-guide-data.ts`.
//
// Scope cuts vs. the web (documented, same precedent as OS-032's header
// doc):
//   - No paired inline video per row (web's `MomentVideo`/`trackVideoFor`
//     matching against the era's video feed) — this card's "done when" is
//     section/row order + content parity for the note/sources/title, not
//     video playback, which native has no player wired for yet outside
//     what OS-032 already scoped out for moments.
//   - No focus trap / scroll lock / Escape-to-close / back-gesture dismiss
//     (`useFocusTrap`/`useScrollLock`/`useBackDismiss`) — those are DOM-only
//     web overlay concerns; this screen is a normal full-bleed native
//     screen (same pattern as EraStreamScreen), so RN's own back button/
//     gesture navigation (owned by App.tsx's screen-state, not this
//     component) is the native equivalent.
//   - The "Track 5" pill (`TrackFivePill`) is rendered as a plain inline
//     text badge rather than the web's icon-bearing pill component — no
//     lucide-react equivalent is wired into the native icon set yet.
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getEra, type EraId, type EggSource, type TrackNote } from '@swift2/experience';
import { eraColors } from '../lib/theme';

/** A song "has a deep dive" (opens the dossier) exactly when the web's TrackGuide.tsx does: real discussion paragraphs, or any dossier at all. */
function hasDeepDive(track: TrackNote): boolean {
  return Boolean((track.discussion && track.discussion.length > 0) || track.dossier);
}

function SourceLinks({ sources }: { sources: EggSource[] }) {
  return (
    <Text style={styles.sources}>
      {sources.length > 1 ? 'Sources: ' : 'Source: '}
      {sources.map((s, i) => (
        <Text key={`${s.url}-${i}`}>
          {i > 0 ? ', ' : ''}
          <Text style={styles.sourceLink} onPress={() => Linking.openURL(s.url)}>
            {s.name}
          </Text>
        </Text>
      ))}
    </Text>
  );
}

function TrackRow({
  track,
  onOpenSong,
}: {
  track: TrackNote;
  onOpenSong: (track: TrackNote) => void;
}) {
  const openable = hasDeepDive(track);
  const isTrackFive = track.trackNumber === 5;

  return (
    <Pressable
      onPress={openable ? () => onOpenSong(track) : undefined}
      disabled={!openable}
      style={({ pressed }) => [styles.row, openable && pressed && styles.rowPressed]}
      accessibilityRole={openable ? 'button' : undefined}
      accessibilityLabel={openable ? `${track.title} — open song dossier` : undefined}
    >
      <Text style={styles.trackNumber}>{track.trackNumber ?? '·'}</Text>
      <View style={styles.rowBody}>
        <View style={styles.titleLine}>
          <Text style={styles.title}>{track.title}</Text>
          {isTrackFive && (
            <View style={styles.trackFivePill}>
              <Text style={styles.trackFivePillText}>Track 5</Text>
            </View>
          )}
          {openable && <Text style={styles.openArrow}>↗</Text>}
        </View>
        <Text style={styles.note}>{track.note}</Text>
        {track.sources && track.sources.length > 0 && <SourceLinks sources={track.sources} />}
      </View>
    </Pressable>
  );
}

export function TrackGuideScreen({
  eraId,
  tracks,
  onOpenSong,
}: {
  eraId: EraId;
  /** Pre-loaded (see `track-guide-data.ts`'s `loadTrackGuide`) rather than fetched inside this component — mirrors `EraStreamScreen`'s pattern of the App-level container owning the async load and this component staying a pure render of already-resolved data. */
  tracks: TrackNote[];
  onOpenSong: (track: TrackNote) => void;
}) {
  const era = getEra(eraId);

  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Track guide · {era.yearLabel}</Text>
      <Text style={styles.album}>{era.album}</Text>
      <Text style={styles.byline}>
        {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}, each with a sourced note — the
        meaning, the background, or the Easter egg.
      </Text>
      {tracks.map((t) => (
        <TrackRow key={`${t.trackNumber ?? 'x'}-${t.title}`} track={t} onOpenSong={onOpenSong} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: eraColors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  eyebrow: {
    color: eraColors.inkSoft,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  album: {
    color: eraColors.ink,
    fontSize: 30,
    fontWeight: '700',
    marginTop: 6,
  },
  byline: {
    color: eraColors.inkSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: eraColors.line,
    backgroundColor: eraColors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  rowPressed: {
    opacity: 0.85,
  },
  trackNumber: {
    width: 24,
    textAlign: 'right',
    color: eraColors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    color: eraColors.ink,
    fontSize: 17,
    fontWeight: '600',
    flexShrink: 1,
  },
  trackFivePill: {
    backgroundColor: eraColors.accent,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  trackFivePillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  openArrow: {
    color: eraColors.inkSoft,
    fontSize: 14,
    marginLeft: 'auto',
  },
  note: {
    color: eraColors.inkSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  sources: {
    color: eraColors.inkSoft,
    fontSize: 10,
    lineHeight: 15,
    opacity: 0.8,
    marginTop: 2,
  },
  sourceLink: {
    textDecorationLine: 'underline',
  },
});
