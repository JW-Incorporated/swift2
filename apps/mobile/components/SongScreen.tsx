// OS-035 — native song page (dossier). Native equivalent of
// `apps/web/components/longlive/TrackDetail.tsx`: hero, Previous/Next album
// navigation, facts card, "Why this song matters", "The story" + quoted
// lines, tiered "What it means" (confirmed/supported/fan theory), "On
// stage", "In their words", "Keep exploring" connections, and a sources
// list at the foot — same section order, same headless data functions
// (`releasedFactValue`, `adjacentTrackOnAlbum`, `keepExploring`,
// `trackKey`), read straight from `@swift2/experience`.
//
// Scope cuts vs. the web (documented, same precedent as OS-032's header
// doc):
//   - No swipe-left/right song navigation, no one-time swipe hint, no
//     desktop gutter arrows, no Escape/keyboard shortcuts — those are
//     DOM/gesture-library concerns the web owns (`useSwipeNav`,
//     `useBackDismiss`); Previous/Next ship here as a plain button row,
//     the accessible baseline both platforms already treat as the
//     "always available" path.
//   - No paired video (`resolvedTrackVideo`/`MomentVideo`) — same reasoning
//     as TrackGuideScreen's scope note: no native video player wired for
//     this card.
//   - "Keep exploring" song targets navigate to that song's own dossier
//     (via `onOpenSong`, wired the same way `onOpenSong` in TrackGuideScreen
//     is); moment targets are a documented no-op (`onOpenMoment` is
//     optional and simply not called if omitted) — native moment detail is
//     OS-033/OS-037, not this card, matching `EraStreamScreen`'s
//     `handleOpenItem` no-op precedent exactly.
import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  adjacentTrackOnAlbum,
  formatFullDate,
  getEra,
  keepExploring,
  releasedFactValue,
  trackKey,
  type EggSource,
  type EraId,
  type TrackFacts,
  type TrackMeaning,
  type TrackNote,
} from '@swift2/experience';
import { eraColors } from '../lib/theme';

/** De-duped (by url) merge of the dossier and discussion/note citations — same contract as the web's `mergeSources`. */
function mergeSources(...lists: (EggSource[] | undefined)[]): EggSource[] {
  const out: EggSource[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const s of list ?? []) {
      if (seen.has(s.url)) continue;
      seen.add(s.url);
      out.push(s);
    }
  }
  return out;
}

function SourceLinks({ sources }: { sources: EggSource[] }) {
  if (sources.length === 0) return null;
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function FactsCard({ facts }: { facts: TrackFacts }) {
  const rows: Array<[string, string]> = [];
  const released = releasedFactValue(facts);
  if (released) rows.push(['Released', released]);
  if (facts.writers?.length) rows.push(['Written by', facts.writers.join(', ')]);
  if (facts.producers?.length) rows.push(['Produced by', facts.producers.join(', ')]);
  if (facts.isSingle) {
    rows.push([
      'Single',
      facts.singleReleaseDate ? `Released ${formatFullDate(facts.singleReleaseDate)}` : 'Yes',
    ]);
  }
  if (facts.themes?.length) rows.push(['Themes', facts.themes.join(', ')]);
  if (rows.length === 0) return null;

  return (
    <View style={styles.factsCard}>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.factRow}>
          <Text style={styles.factLabel}>{label}</Text>
          <Text style={styles.factValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function MeaningTier({ pill, paras }: { pill: string; paras: string[] }) {
  return (
    <View style={styles.meaningTier}>
      <View style={styles.meaningPill}>
        <Text style={styles.meaningPillText}>{pill}</Text>
      </View>
      {paras.map((para, i) => (
        <Text key={i} style={styles.paragraph}>
          {para}
        </Text>
      ))}
    </View>
  );
}

function MeaningSection({ meaning }: { meaning: TrackMeaning }) {
  return (
    <Section title="What it means">
      {meaning.confirmed && <MeaningTier pill="Confirmed" paras={meaning.confirmed} />}
      {meaning.supported && <MeaningTier pill="Supported reading" paras={meaning.supported} />}
      {meaning.fanTheories && <MeaningTier pill="Fan theory" paras={meaning.fanTheories} />}
    </Section>
  );
}

function ConnectionsSection({
  eraId,
  track,
  onOpenSong,
  onOpenMoment,
}: {
  eraId: EraId;
  track: TrackNote;
  onOpenSong: (eraId: EraId, track: TrackNote) => void;
  onOpenMoment?: (id: string) => void;
}) {
  const resolved = keepExploring(eraId, track);
  if (resolved.length === 0) return null;

  return (
    <Section title="Keep exploring">
      {resolved.map((r) => {
        const hint = r.kind === 'song' ? getEra(r.eraId).shortName : getEra(r.item.eraId).shortName;
        const onPress =
          r.kind === 'song' ? () => onOpenSong(r.eraId, r.track) : () => onOpenMoment?.(r.item.id);
        return (
          <Pressable
            key={r.connection.relatedId}
            onPress={onPress}
            style={({ pressed }) => [styles.connectionCard, pressed && styles.cardPressed]}
          >
            <Text style={styles.connectionLabel}>
              {r.connection.label}{' '}
              <Text style={styles.connectionKind}>
                {r.kind === 'song' ? `Song · ${hint}` : `Moment · ${hint}`}
              </Text>
            </Text>
            <Text style={styles.paragraph}>{r.connection.why}</Text>
          </Pressable>
        );
      })}
    </Section>
  );
}

export function SongScreen({
  eraId,
  track,
  onOpenSong,
  onOpenMoment,
}: {
  eraId: EraId;
  track: TrackNote;
  /** Navigate to a different song's dossier — used by Previous/Next and by "Keep exploring" song connections. Caller (App.tsx) re-renders this screen with the new track. */
  onOpenSong: (eraId: EraId, track: TrackNote) => void;
  /** Native moment detail (OS-033/OS-037) isn't built yet — documented no-op if omitted, see this file's header doc. */
  onOpenMoment?: (id: string) => void;
}) {
  const era = getEra(eraId);
  const dossier = track.dossier;
  const sources = mergeSources(dossier?.sources, track.discussionSources ?? track.sources);
  const prevTrack = adjacentTrackOnAlbum(eraId, track, 'previous');
  const nextTrack = adjacentTrackOnAlbum(eraId, track, 'next');

  return (
    <ScrollView key={trackKey(eraId, track)} style={styles.fill} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>
        {era.album}
        {track.trackNumber ? ` · Track ${track.trackNumber}` : ''}
      </Text>
      <Text style={styles.title}>{track.title}</Text>
      <Text style={styles.note}>{track.note}</Text>

      {(prevTrack || nextTrack) && (
        <View style={styles.navRow}>
          {prevTrack ? (
            <Pressable
              onPress={() => onOpenSong(eraId, prevTrack)}
              style={styles.navButton}
              accessibilityLabel={`Previous track: ${prevTrack.title}`}
            >
              <Text style={styles.navButtonText} numberOfLines={1}>
                ← {prevTrack.title}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.navSpacer} />
          )}
          {nextTrack ? (
            <Pressable
              onPress={() => onOpenSong(eraId, nextTrack)}
              style={styles.navButton}
              accessibilityLabel={`Next track: ${nextTrack.title}`}
            >
              <Text style={styles.navButtonText} numberOfLines={1}>
                {nextTrack.title} →
              </Text>
            </Pressable>
          ) : (
            <View style={styles.navSpacer} />
          )}
        </View>
      )}

      {track.facts && <FactsCard facts={track.facts} />}

      {dossier?.whyItMatters && (
        <Section title="Why this song matters">
          {dossier.whyItMatters.map((para, i) => (
            <Text key={i} style={styles.paragraph}>
              {para}
            </Text>
          ))}
        </Section>
      )}

      {track.discussion && track.discussion.length > 0 ? (
        <Section title="The story">
          {track.discussion.map((para, i) => (
            <Text key={i} style={styles.paragraph}>
              {para}
            </Text>
          ))}
          {track.quotedLines && track.quotedLines.length > 0 && (
            <View style={styles.quoteCard}>
              {track.quotedLines.map((line, i) => (
                <Text key={i} style={styles.quoteLine}>
                  “{line}”
                </Text>
              ))}
            </View>
          )}
        </Section>
      ) : (
        !dossier && (
          <Text style={styles.emptyStory}>
            The full story behind this song hasn&apos;t been written yet — check back soon.
          </Text>
        )
      )}

      {dossier?.meaning && <MeaningSection meaning={dossier.meaning} />}

      {dossier?.live && (
        <Section title="On stage">
          {dossier.live.map((m, i) => (
            <View key={i} style={styles.listCard}>
              <View style={styles.listCardHeader}>
                <Text style={styles.listCardTitle}>{m.event}</Text>
                {m.date && <Text style={styles.listCardDate}>{formatFullDate(m.date)}</Text>}
              </View>
              <Text style={styles.paragraph}>{m.note}</Text>
            </View>
          ))}
        </Section>
      )}

      {dossier?.voices && (
        <Section title="In their words">
          {dossier.voices.map((v, i) => (
            <View key={i} style={styles.listCard}>
              <View style={styles.listCardHeader}>
                <Text style={styles.listCardTitle}>{v.who}</Text>
                {v.context && <Text style={styles.listCardDate}>{v.context}</Text>}
              </View>
              <Text style={styles.paragraph}>{v.note}</Text>
            </View>
          ))}
        </Section>
      )}

      <ConnectionsSection
        eraId={eraId}
        track={track}
        onOpenSong={onOpenSong}
        onOpenMoment={onOpenMoment}
      />

      <SourceLinks sources={sources} />
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
    paddingBottom: 48,
  },
  eyebrow: {
    color: eraColors.inkSoft,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  title: {
    color: eraColors.ink,
    fontSize: 30,
    fontWeight: '700',
    marginTop: 6,
  },
  note: {
    color: eraColors.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 16,
  },
  navButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: eraColors.line,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navSpacer: {
    flex: 1,
  },
  navButtonText: {
    color: eraColors.ink,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  factsCard: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: eraColors.line,
    backgroundColor: eraColors.surface,
    padding: 16,
    gap: 8,
  },
  factRow: {
    flexDirection: 'row',
    gap: 10,
  },
  factLabel: {
    width: 96,
    color: eraColors.inkSoft,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  factValue: {
    flex: 1,
    color: eraColors.ink,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: eraColors.inkSoft,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionBody: {
    marginTop: 10,
    gap: 12,
  },
  paragraph: {
    color: eraColors.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyStory: {
    color: eraColors.inkSoft,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
    marginTop: 20,
  },
  quoteCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: eraColors.line,
    backgroundColor: eraColors.surface,
    padding: 16,
    gap: 8,
  },
  quoteLine: {
    color: eraColors.ink,
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  meaningTier: {
    gap: 6,
  },
  meaningPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: eraColors.line,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  meaningPillText: {
    color: eraColors.inkSoft,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: eraColors.line,
    backgroundColor: eraColors.surface,
    padding: 14,
    gap: 4,
  },
  listCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  listCardTitle: {
    color: eraColors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  listCardDate: {
    color: eraColors.inkSoft,
    fontSize: 11,
  },
  connectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: eraColors.line,
    backgroundColor: eraColors.surface,
    padding: 14,
    gap: 4,
  },
  cardPressed: {
    opacity: 0.85,
  },
  connectionLabel: {
    color: eraColors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  connectionKind: {
    color: eraColors.inkSoft,
    fontSize: 10,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sources: {
    color: eraColors.inkSoft,
    fontSize: 10,
    lineHeight: 15,
    opacity: 0.8,
    marginTop: 32,
  },
  sourceLink: {
    textDecorationLine: 'underline',
  },
});
