// Persistent top bar above the five BottomTabBar worlds. Since OS-039 retired
// the WebView home (and with it the site's in-page bell), this is the app's
// one always-visible way into Settings: notification preferences, the inbox,
// push-permission onboarding, and the Privacy / Terms / Support links App
// Review needs to find (guideline 5.1.1(i)).
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { eraColors } from '../lib/theme';

export function HomeTopBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <View style={styles.bar}>
      <Text style={styles.wordmark} accessibilityRole="header">
        Long Live
      </Text>
      <Pressable
        onPress={onOpenSettings}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        accessibilityHint="Notifications, inbox, privacy policy, terms and support"
        hitSlop={12}
        style={styles.settingsBtn}
      >
        <Text style={styles.settingsText}>{'⚙︎'} Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: eraColors.surface,
    borderBottomColor: eraColors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  wordmark: { color: eraColors.ink, fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },
  settingsBtn: {
    borderColor: eraColors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  settingsText: { color: eraColors.accent, fontSize: 13, fontWeight: '700' },
});
