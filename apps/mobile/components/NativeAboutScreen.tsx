// Native /settings/about screen presented by NativeOverlayHost (refs #4992): the existing About section
// (legal links, unofficial disclaimer, version label whose 7 taps open Diagnostics) under a close bar.
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LEGAL_PAGES, type LegalPageId } from '../lib/legal-links';
import { SettingsAboutSection } from './SettingsAboutSection';

export function NativeAboutScreen({
  onClose,
  onOpenLegalPage,
}: {
  onClose: () => void;
  onOpenLegalPage: (path: string) => void;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close About" hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>
      <ScrollView>
        <SettingsAboutSection
          onOpenLegalPage={(id: LegalPageId) => {
            const page = LEGAL_PAGES.find((p) => p.id === id);
            if (page) onOpenLegalPage(page.path);
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: { alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 12 },
  close: { color: '#f2c744', fontSize: 15, fontWeight: '700' },
});
