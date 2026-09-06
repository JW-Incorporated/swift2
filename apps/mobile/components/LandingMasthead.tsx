// OS-032 — native landing masthead. Native equivalent of
// `apps/web/components/longlive/LandingMasthead.tsx`'s eyebrow/wordmark/
// tagline block (gloss rotation + live-activity summary are Stage 5/R1
// wiring the web version has via `dailyGloss`/`summarizeCurrentActivity`
// (`@swift2/experience`) — reused here unchanged since both are already
// framework-free and take no DOM/window dependency).
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { dailyGloss, GLOSS_SECTIONS } from '@swift2/experience';
import { eraColors } from '../lib/theme';

function todayKey(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function LandingMasthead() {
  const [dayKey, setDayKey] = useState<string | null>(null);
  useEffect(() => setDayKey(todayKey()), []);
  const gloss = (dayKey ? dailyGloss(dayKey) : GLOSS_SECTIONS[0]) ?? GLOSS_SECTIONS[0];

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>The Taylor Swift time machine</Text>
      <Text style={styles.wordmark}>Long Live</Text>
      <Text style={styles.tagline}>
        Real-time updates on her whole life — every moment sourced and dated, back through all twelve eras.
      </Text>
      <View style={styles.glossPill}>
        <Text style={styles.glossLabel}>{gloss.label}</Text>
        <Text style={styles.glossText}> — {gloss.gloss}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    gap: 8,
  },
  eyebrow: {
    color: eraColors.accent2,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  wordmark: {
    color: eraColors.ink,
    fontSize: 40,
    fontWeight: '700',
  },
  tagline: {
    color: eraColors.inkSoft,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  glossPill: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: eraColors.line,
  },
  glossLabel: {
    color: eraColors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  glossText: {
    color: eraColors.inkSoft,
    fontSize: 13,
  },
});
