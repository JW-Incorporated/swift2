// Native /settings/about screen presented by NativeOverlayHost (refs #4992): the existing About section
// (legal links, unofficial disclaimer, version label whose 7 taps open Diagnostics) under a close bar.
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { diagCollector } from '../lib/diagnostics';
import { LEGAL_PAGES, type LegalPageId } from '../lib/legal-links';
import { SettingsAboutSection } from './SettingsAboutSection';

export function NativeAboutScreen({
  onClose,
  navigateDom,
}: {
  onClose: () => void;
  /** Hands a path to the DOM host (bridge navigate, resolves on the DOM ack); the overlay is dismissed first. */
  navigateDom: (path: string) => Promise<boolean>;
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
            if (!page) return;
            onClose();
            void navigateDom(page.path).then((ok) => ok || diagCollector.mark('about-legal-failed', page.path), () => diagCollector.mark('about-legal-failed', page.path));
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
