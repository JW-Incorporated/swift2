// OS-037 — native doorway cards: thread/egg entries in the era feed.
// Native equivalent of the web's `DoorwayCard.tsx` (`ThreadDoorwayCard`/
// `EggDoorwayCard`) — same data (`ThreadDoorway`/`EggDoorway` from
// `@swift2/experience`), same "same card shape as a moment, so it reads as
// part of the story" intent, minus the two-column grid span (native is
// single-column, same simplification `EraSection.tsx`/`MomentCard.tsx`
// already apply to every other card kind).
//
// This replaces the plain `PlaceholderFeedRow` (MomentCard.tsx) ONLY for
// `thread`/`egg` entries — `video`/`current` entries are still out of scope
// (OS-033/OS-036/OS-038's native homes) and keep rendering the placeholder.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EggDoorway, ThreadDoorway } from '@swift2/experience';
import { eraColors } from '../lib/theme';

export function ThreadDoorwayRow({ doorway, onOpen }: { doorway: ThreadDoorway; onOpen?: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onOpen} disabled={!onOpen}>
      <Text style={styles.kicker}>{doorway.kicker}</Text>
      <Text style={styles.title}>{doorway.title}</Text>
      <Text style={styles.example} numberOfLines={2}>
        &ldquo;{doorway.example}&rdquo;
      </Text>
      <Text style={styles.cta}>Follow this thread →</Text>
    </Pressable>
  );
}

export function EggDoorwayRow({ doorway, onOpen }: { doorway: EggDoorway; onOpen?: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onOpen} disabled={!onOpen}>
      <Text style={styles.kicker}>{doorway.kicker}</Text>
      <Text style={styles.title}>{doorway.title}</Text>
      <Text style={styles.cta}>See this in Theories &amp; eggs →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: eraColors.surface,
    borderColor: eraColors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 6,
  },
  kicker: {
    color: eraColors.accent,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: { color: eraColors.ink, fontSize: 18, fontWeight: '700' },
  example: { color: eraColors.inkSoft, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  cta: { color: eraColors.accent, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
});
