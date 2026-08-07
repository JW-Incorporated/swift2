// Native era timeline scrubber — first pass of the morph-on-grab navigator.
//
// Architecture contract (docs/architecture.md): the gesture + animation run on
// the UI thread via Reanimated worklets + Gesture Handler. There is NO
// React/JS-thread state update per frame — during a drag the only per-frame
// work is a shared-value assignment inside a worklet. JS is involved exactly
// once per gesture (on release) to commit the snapped era, using the SAME
// snap math from @swift2/shared that the web scrubber uses.
//
// v1 scope (per spec): snap to era boundaries only; milestones are passive
// markers. The peek-strip → full-navigator morph is the next milestone.
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { Era, Milestone } from '@swift2/shared';
import { eraIndexAtPosition, eraIndexForDate, positionForEraIndex } from '@swift2/shared';

const THUMB_SIZE = 26;
const TRACK_HEIGHT = 10;
const SPRING = { damping: 18, stiffness: 220, mass: 0.6 };

interface MilestoneMark {
  id: string;
  /** 0..1 across the whole timeline (era slot + fraction within the era window). */
  fraction: number;
  type: Milestone['type'];
}

function milestoneMarks(eras: readonly Era[], milestones: readonly Milestone[]): MilestoneMark[] {
  const count = eras.length;
  if (count === 0) return [];
  return milestones.flatMap((m) => {
    const i = eraIndexForDate(eras, m.date);
    if (i < 0) return [];
    const era = eras[i]!;
    const start = Date.parse(era.startDate);
    const end = Date.parse(era.endDate);
    const t = Date.parse(m.date);
    const within =
      Number.isNaN(t) || Number.isNaN(start) || Number.isNaN(end) || end <= start
        ? 0.5
        : Math.min(1, Math.max(0, (t - start) / (end - start)));
    return [{ id: m.id, fraction: (i + within) / count, type: m.type }];
  });
}

export function EraTimeline({
  eras,
  milestones,
  activeIndex,
  onSelect,
}: {
  eras: readonly Era[];
  milestones: readonly Milestone[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const count = eras.length;
  const [trackWidth, setTrackWidth] = useState(0);
  // The scrub position, 0..1 across all eras. Lives on the UI thread.
  const position = useSharedValue(positionForEraIndex(count, activeIndex));
  const dragStart = useSharedValue(0);

  const marks = useMemo(() => milestoneMarks(eras, milestones), [eras, milestones]);

  // Single JS touchpoint: snap (shared math) + commit the era. Runs once per
  // gesture release / tap — never per frame.
  const select = useCallback(
    (index: number) => {
      position.value = withSpring(positionForEraIndex(count, index), SPRING);
      onSelect(index);
    },
    [count, onSelect, position],
  );
  const commitScrub = useCallback(
    (pos: number) => select(eraIndexAtPosition(count, pos)),
    [count, select],
  );

  const pan = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      dragStart.value = position.value;
    })
    .onUpdate((e) => {
      'worklet';
      if (trackWidth <= 0) return;
      // Per-frame: pure arithmetic on the UI thread, nothing crosses to JS.
      const next = dragStart.value + e.translationX / trackWidth;
      position.value = Math.min(1, Math.max(0, next));
    })
    .onEnd(() => {
      'worklet';
      runOnJS(commitScrub)(position.value);
    });

  const thumbStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: position.value * trackWidth - THUMB_SIZE / 2 }],
    }),
    [trackWidth],
  );

  if (count === 0) return null;
  const activeEra = eras[Math.min(count - 1, Math.max(0, activeIndex))]!;

  return (
    <View style={styles.strip}>
      <GestureDetector gesture={pan}>
        <View style={styles.grabArea}>
          <View style={styles.track} onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
            {eras.map((era, i) => (
              <Pressable
                key={era.slug}
                accessibilityRole="button"
                accessibilityLabel={`Jump to ${era.title}`}
                onPress={() => select(i)}
                style={[
                  styles.segment,
                  { backgroundColor: era.theme.accent, opacity: i === activeIndex ? 1 : 0.45 },
                  i === 0 && styles.segmentFirst,
                  i === count - 1 && styles.segmentLast,
                ]}
              />
            ))}
            {marks.map((m) => (
              <View
                key={m.id}
                pointerEvents="none"
                style={[
                  styles.milestone,
                  m.type === 'tour' && styles.milestoneTour,
                  { left: `${m.fraction * 100}%` },
                ]}
              />
            ))}
            <Animated.View
              pointerEvents="none"
              style={[styles.thumb, { borderColor: activeEra.theme.accent }, thumbStyle]}
            />
          </View>
        </View>
      </GestureDetector>
      <Text style={styles.hint} numberOfLines={1}>
        {activeEra.album} · drag or tap to time-travel
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: '#0b0b0f',
    borderBottomColor: 'rgba(255,255,255,0.12)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
    paddingTop: 10,
  },
  grabArea: {
    justifyContent: 'center',
    minHeight: 44, // comfortable grab target
    paddingHorizontal: THUMB_SIZE / 2 + 4,
  },
  track: {
    borderRadius: TRACK_HEIGHT / 2,
    flexDirection: 'row',
    height: TRACK_HEIGHT,
  },
  segment: { flex: 1, marginHorizontal: 1 },
  segmentFirst: {
    borderBottomLeftRadius: TRACK_HEIGHT / 2,
    borderTopLeftRadius: TRACK_HEIGHT / 2,
    marginLeft: 0,
  },
  segmentLast: {
    borderBottomRightRadius: TRACK_HEIGHT / 2,
    borderTopRightRadius: TRACK_HEIGHT / 2,
    marginRight: 0,
  },
  milestone: {
    backgroundColor: '#fff',
    borderRadius: 2,
    height: 4,
    marginLeft: -2,
    opacity: 0.9,
    position: 'absolute',
    top: -7,
    width: 4,
  },
  milestoneTour: { borderRadius: 1, transform: [{ rotate: '45deg' }] },
  thumb: {
    backgroundColor: '#fff',
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    elevation: 4,
    height: THUMB_SIZE,
    left: 0,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    top: (TRACK_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
  },
  hint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    letterSpacing: 0.4,
    paddingHorizontal: 16,
    paddingTop: 2,
    textAlign: 'center',
  },
});
