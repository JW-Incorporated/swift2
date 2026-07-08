// Native Vault reader — the mobile counterpart of apps/web VaultReader.tsx.
// One era-skinned surface at a time: hero header, gesture timeline (the
// EraTimeline scrubber), and the era's month-by-month rows. All domain logic —
// era ordering, month enumeration, snap math — comes from @swift2/shared;
// this file is view-only (architecture.md hard boundary).
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Era, Milestone, MonthItem } from '@swift2/shared';
import { monthsInEra, orderedEras } from '@swift2/shared';
import type { VaultSkeleton } from '@swift2/core';
import { EraTimeline } from './EraTimeline';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1] ?? '?'} ${year}`;
}

function ymKey(year: number, month: number): string {
  return `${year}-${month}`;
}

function keyFromISO(iso: string): string {
  const d = new Date(iso);
  return ymKey(d.getUTCFullYear(), d.getUTCMonth() + 1);
}

function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

function rangeLabel(startDate: string, endDate: string): string {
  const s = new Date(startDate);
  const e = new Date(endDate);
  return `${monthLabel(s.getUTCFullYear(), s.getUTCMonth() + 1)} – ${monthLabel(
    e.getUTCFullYear(),
    e.getUTCMonth() + 1,
  )}`;
}

export function VaultNavigator({ skeleton }: { skeleton: VaultSkeleton }) {
  const eras = useMemo(() => orderedEras(skeleton.eras), [skeleton.eras]);
  // Land on the newest era, like the web reader.
  const [index, setIndex] = useState(() => Math.max(0, eras.length - 1));
  const era = eras[Math.min(index, Math.max(0, eras.length - 1))];

  if (!era) {
    return (
      <View style={[styles.fill, styles.center]}>
        <Text style={styles.emptyText}>No eras yet.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: era.theme.bg }]}>
      <EraTimeline
        eras={eras}
        milestones={skeleton.milestones}
        activeIndex={index}
        onSelect={setIndex}
      />
      {/* key resets scroll to the era top when time-traveling */}
      <ScrollView key={era.slug} contentContainerStyle={styles.scroll}>
        <EraHero era={era} />
        <EraMonths era={era} skeleton={skeleton} />
      </ScrollView>
    </View>
  );
}

function EraHero({ era }: { era: Era }) {
  const t = era.theme;
  return (
    // theme.heroGradient is a CSS gradient string (web-only); the native hero
    // uses the era accent until expo-linear-gradient earns its place.
    <View style={[styles.hero, { backgroundColor: t.accent }]}>
      <Text style={styles.heroEyebrow}>{t.eyebrow}</Text>
      <Text style={styles.heroTitle}>{era.title}</Text>
      <Text style={styles.heroMeta}>
        {era.album} · {rangeLabel(era.startDate, era.endDate)}
      </Text>
    </View>
  );
}

function EraMonths({ era, skeleton }: { era: Era; skeleton: VaultSkeleton }) {
  const months = monthsInEra(era);
  const milestonesByMonth = groupBy(
    skeleton.milestones.filter((m) => m.eraSlug === era.slug),
    (m) => keyFromISO(m.date),
  );
  const itemsByMonth = groupBy(
    skeleton.monthItems.filter((i) => i.eraSlug === era.slug),
    (i) => ymKey(i.year, i.month),
  );

  return (
    <View style={styles.months}>
      {months.map(({ year, month }) => {
        const key = ymKey(year, month);
        return (
          <MonthRow
            key={key}
            theme={era.theme}
            label={monthLabel(year, month)}
            milestones={milestonesByMonth.get(key) ?? []}
            items={itemsByMonth.get(key) ?? []}
          />
        );
      })}
    </View>
  );
}

function MonthRow({
  theme,
  label,
  milestones,
  items,
}: {
  theme: Era['theme'];
  label: string;
  milestones: Milestone[];
  items: MonthItem[];
}) {
  const empty = milestones.length === 0 && items.length === 0;
  return (
    <View style={[styles.monthRow, { borderBottomColor: theme.line }]}>
      <Text style={[styles.monthLabel, { color: theme.inkSoft }]}>{label}</Text>
      <View style={styles.monthBody}>
        {empty ? (
          <Text style={[styles.emptyDot, { color: theme.inkSoft }]}>·</Text>
        ) : (
          <>
            {milestones.map((m) => (
              <View key={m.id} style={styles.entry}>
                <View style={styles.entryHead}>
                  <View style={[styles.milestoneDot, { backgroundColor: theme.accent }]} />
                  <Text style={[styles.entryTitle, { color: theme.ink }]}>{m.title}</Text>
                  <Text style={[styles.entryTag, { color: theme.inkSoft }]}>
                    {m.type === 'tour' ? 'tour' : 'release'}
                  </Text>
                </View>
              </View>
            ))}
            {items.map((it) => (
              <View key={it.id} style={styles.entry}>
                <View style={styles.entryHead}>
                  <Text style={[styles.entryTitle, { color: theme.ink }]}>{it.title}</Text>
                  <Text style={[styles.entryTag, { color: theme.inkSoft }]}>{it.category}</Text>
                </View>
                {it.snippet ? (
                  <Text style={[styles.entrySnippet, { color: theme.inkSoft }]}>{it.snippet}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', backgroundColor: '#0b0b0f', justifyContent: 'center' },
  emptyText: { color: '#aaa' },
  scroll: { paddingBottom: 56 },
  hero: { paddingBottom: 28, paddingHorizontal: 20, paddingTop: 32 },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  heroTitle: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 5 },
  heroMeta: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  months: { paddingHorizontal: 16, paddingTop: 8 },
  monthRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 9,
  },
  monthLabel: { fontSize: 12, paddingTop: 3, width: 72 },
  monthBody: { flex: 1, gap: 8 },
  emptyDot: { opacity: 0.4 },
  entry: { gap: 2 },
  entryHead: {
    alignItems: 'baseline',
    columnGap: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  milestoneDot: { alignSelf: 'center', borderRadius: 4, height: 8, width: 8 },
  entryTitle: { fontSize: 15, fontWeight: '600' },
  entryTag: { fontSize: 11, textTransform: 'uppercase' },
  entrySnippet: { fontSize: 13, lineHeight: 18 },
});
