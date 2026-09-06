// OS-032 — native era section: masthead + chronological feed for one era.
// Native equivalent of `apps/web/components/longlive/EraSection.tsx`'s hero
// block + `EraFeedList`, minus the pieces out of this card's scope (see
// MomentCard.tsx's header doc for what a video/thread/egg/current entry
// renders here today). Card silhouette (`tiers`) and render order
// (`entries`) come from the exact same `buildEraStreamViewModel` call the
// web now runs (`EraSection.tsx`'s OS-032 refactor) via
// `lib/era-stream-data.ts` — this component never recomputes ordering
// itself, only renders whatever the shared pipeline handed it.
//
// "Era re-skin": each section carries its own `era.theme` colors (bg/ink/
// accent) the same way the web's `eraStyle()` sets CSS custom properties per
// section — native has no CSS variables, so this passes the palette down as
// plain style props instead.
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { Era, EraId } from '@swift2/experience';
import type { PlayableVideoNote } from '@swift2/content-enrichment';
import { loadEraStream } from '../lib/era-stream-data';
import { MomentCard, PlaceholderFeedRow } from './MomentCard';
import { eraColors } from '../lib/theme';

export function EraSection({ era, onOpenItem }: { era: Era; onOpenItem: (id: string) => void }) {
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ready'; viewModel: Awaited<ReturnType<typeof loadEraStream>> }
  >({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    loadEraStream(era.id as EraId)
      .then((viewModel) => {
        if (!cancelled) setState({ status: 'ready', viewModel });
      })
      .catch((e) => {
        if (!cancelled) setState({ status: 'error', message: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [era.id]);

  return (
    <View style={[styles.section, { backgroundColor: era.theme.bg }]}>
      {/* Masthead / era re-skin (parity with EraSection.tsx's hero block: eyebrow chip, name, lyric/intro). */}
      <View style={styles.hero}>
        <Text style={[styles.eyebrow, { color: era.theme.accent }]}>
          {era.isCurrent ? 'Current era' : era.yearLabel}
        </Text>
        <Text style={[styles.eraName, { color: era.theme.ink }]}>{era.name}</Text>
        {era.lyric ? (
          <Text style={[styles.lyric, { color: era.theme.inkSoft }]}>
            {'\u201C'}
            {era.lyric.line}
            {'\u201D'}
          </Text>
        ) : (
          <Text style={[styles.intro, { color: era.theme.inkSoft }]}>{era.intro}</Text>
        )}
      </View>

      {state.status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator color={era.theme.accent} />
        </View>
      )}
      {state.status === 'error' && (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: eraColors.inkSoft }]}>Couldn&apos;t load this era: {state.message}</Text>
        </View>
      )}
      {state.status === 'ready' &&
        state.viewModel.entries.map((entry) => renderEntry(entry, state.viewModel, onOpenItem))}
    </View>
  );
}

function renderEntry(
  entry: import('@swift2/experience').RenderFeedEntry<PlayableVideoNote>,
  viewModel: { tiers: Map<string, import('@swift2/experience').CardTier>; imageHiddenIds: ReadonlySet<string> },
  onOpenItem: (id: string) => void,
) {
  if (entry.kind === 'moment') {
    return (
      <MomentCard
        key={entry.item.id}
        item={entry.item}
        tier={viewModel.tiers.get(entry.item.id) ?? 'text'}
        hideImage={viewModel.imageHiddenIds.has(entry.item.id)}
        onOpen={() => onOpenItem(entry.item.id)}
      />
    );
  }
  if (entry.kind === 'cluster') {
    return (
      <View key={`cluster-${entry.anchor.sortDate}`}>
        {entry.items.map((item) => (
          <MomentCard
            key={item.id}
            item={item}
            tier={viewModel.tiers.get(item.id) ?? 'text'}
            hideImage={viewModel.imageHiddenIds.has(item.id)}
            onOpen={() => onOpenItem(item.id)}
          />
        ))}
      </View>
    );
  }
  const key =
    entry.kind === 'video'
      ? `video-${entry.video.slug}`
      : entry.kind === 'thread'
        ? `thread-${entry.doorway.threadId}`
        : entry.kind === 'egg'
          ? `egg-${entry.doorway.eggId}`
          : `current-${entry.item.id}`;
  return <PlaceholderFeedRow key={key} entry={entry} />;
}

const styles = StyleSheet.create({
  section: {
    paddingBottom: 24,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  eraName: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  lyric: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  intro: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
  centered: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
});
