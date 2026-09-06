// OS-037 — native community directory screen. Native equivalent of the
// web's `CommunitySection.tsx` (grouped-by-platform fan community
// directory): same data (`COMMUNITIES`/`communitiesByPlatform`, now homed
// in `@swift2/experience` — see that package's `communities.ts` header for
// why this moved out of `apps/web`), same platform grouping and
// hypeScore-descending sort within each group, same "first (highest-hype)
// entry per group is featured" rule the web's `CommunitySection.tsx` uses.
//
// Scope for this card: the directory list itself, reachable via
// `?mode=community` (routes.ts's `community` flag, off by default per D3's
// progressive rollout — see routes.ts). Submitting a new community link
// (`SubmitLinkForm.tsx`, web-only) is out of scope; native readers who want
// to suggest one still fall back to the web page for that action, same as
// any other not-yet-ported affordance.
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { COMMUNITIES, communitiesByPlatform, type Community } from '@swift2/experience';
import { eraColors } from '../lib/theme';

interface Row {
  key: string;
  kind: 'header' | 'community';
  platform?: string;
  count?: number;
  community?: Community;
  featured?: boolean;
}

function buildRows(): Row[] {
  const groups = Array.from(communitiesByPlatform());
  const rows: Row[] = [];
  for (const [platform, communities] of groups) {
    rows.push({ key: `header-${platform}`, kind: 'header', platform, count: communities.length });
    communities.forEach((community, index) => {
      rows.push({
        key: `${platform}-${community.name}`,
        kind: 'community',
        community,
        featured: index === 0,
      });
    });
  }
  return rows;
}

function CommunityRow({ community, featured }: { community: Community; featured: boolean }) {
  const hasCount = community.memberCount != null;
  return (
    <View style={[styles.card, featured && styles.cardFeatured]}>
      <View style={styles.cardHead}>
        <Text style={styles.cardName} numberOfLines={1}>
          {community.name}
        </Text>
        <Text style={styles.cardCount}>{hasCount ? community.memberCount!.toLocaleString() : '—'}</Text>
      </View>
      <Text style={styles.cardDescription} numberOfLines={3}>
        {community.description}
      </Text>
      {community.flags.length > 0 && (
        <Text style={styles.cardFlag} numberOfLines={2}>
          {community.flags[0]}
        </Text>
      )}
    </View>
  );
}

export function CommunityScreen() {
  const rows = buildRows();

  return (
    <View style={styles.fill}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Fan communities</Text>
        <Text style={styles.topBarSubtitle}>
          {COMMUNITIES.length} communities, grouped by platform
        </Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={styles.content}
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <Text style={styles.sectionHeader}>
              {item.platform} · {item.count}
            </Text>
          ) : (
            <CommunityRow community={item.community!} featured={item.featured ?? false} />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: eraColors.bg },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: eraColors.line,
  },
  topBarTitle: { color: eraColors.ink, fontSize: 22, fontWeight: '700' },
  topBarSubtitle: { color: eraColors.inkSoft, fontSize: 13, marginTop: 4 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionHeader: {
    color: eraColors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: eraColors.surface,
    borderColor: eraColors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardFeatured: {
    borderColor: eraColors.accent,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: { color: eraColors.ink, fontSize: 15, fontWeight: '600', flexShrink: 1 },
  cardCount: { color: eraColors.inkSoft, fontSize: 13, fontVariant: ['tabular-nums'] },
  cardDescription: { color: eraColors.inkSoft, fontSize: 13, marginTop: 6, lineHeight: 18 },
  cardFlag: { color: eraColors.accent2, fontSize: 12, marginTop: 6 },
});
