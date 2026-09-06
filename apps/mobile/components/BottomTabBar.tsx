// OS-039 — native bottom tab bar. Retiring SiteShell as the default surface
// means the app needs its own persistent way to switch between the five
// native worlds (era stream, threads, clownbot, community, merch) — the
// web's own equivalent is `apps/web/components/longlive/BottomNav.tsx`.
// This is a deliberately small native port: same five destinations (mood is
// folded into the Clownbot screen already, per ClownChatScreen's own scope
// note), same "current tab highlighted" behavior. No icon-only collapse
// threshold (`bottom-nav-layout.ts`'s measured-width logic) — five plain
// text labels fit comfortably on any phone width this app targets; a visual
// follow-up can port that logic if a 6th tab is ever added here too.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { eraColors } from '../lib/theme';

export type HomeTab = 'era' | 'threads' | 'clownbot' | 'community' | 'merch';

const TABS: readonly { id: HomeTab; label: string }[] = [
  { id: 'era', label: 'Eras' },
  { id: 'threads', label: 'Threads' },
  { id: 'clownbot', label: 'Clownbot' },
  { id: 'community', label: 'Community' },
  { id: 'merch', label: 'Merch' },
];

export function BottomTabBar({
  active,
  onChange,
}: {
  active: HomeTab;
  onChange: (tab: HomeTab) => void;
}) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={styles.tab}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: eraColors.line,
    backgroundColor: eraColors.surface,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: eraColors.inkSoft,
  },
  labelActive: {
    color: eraColors.accent,
  },
});
