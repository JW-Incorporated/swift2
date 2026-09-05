// Notifications Phase 1 (NOTIFICATIONS_SPEC.md §5) — the segmented cadence
// pill row. One component, two value sets: steady categories get
// Instant · Daily · Weekly · Off; fun categories swap Instant for Monthly
// (Daily · Weekly · Monthly · Off). Fun categories don't send anything
// until Phase 4's cron ships, but the control itself is full Phase 1 scope
// per NOTIFICATIONS_PROMPTS.md ("just make the pill component support both
// variants now").
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  EVENT_CADENCES,
  FUN_CADENCES,
  STEADY_CADENCES,
  type EventCadence,
  type FunCadence,
  type NotificationCadence,
  type SteadyCadence,
} from '@swift2/shared';

const LABELS: Record<NotificationCadence, string> = {
  instant: 'Instant',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  on: 'On',
  off: 'Off',
};

interface CadencePillsProps {
  variant: 'steady' | 'fun' | 'event';
  value: NotificationCadence;
  onChange: (value: NotificationCadence) => void;
  /** Disables all pills while a write is in flight — the row still shows
   * the optimistic value, just not interactive mid-request. */
  disabled?: boolean;
}

export function CadencePills({ variant, value, onChange, disabled }: CadencePillsProps) {
  const options: readonly NotificationCadence[] =
    variant === 'steady' ? STEADY_CADENCES : variant === 'fun' ? FUN_CADENCES : EVENT_CADENCES;

  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, disabled: !!disabled }}
            accessibilityLabel={LABELS[option]}
            disabled={disabled}
            onPress={() => {
              if (!active) onChange(option);
            }}
            style={[styles.pill, active && styles.pillActive, disabled && styles.pillDisabled]}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{LABELS[option]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export type { EventCadence, FunCadence, SteadyCadence };

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2a2a33',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillActive: {
    backgroundColor: '#f2c744',
    borderColor: '#f2c744',
  },
  pillDisabled: {
    opacity: 0.5,
  },
  pillText: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#0b0b0f',
  },
});
