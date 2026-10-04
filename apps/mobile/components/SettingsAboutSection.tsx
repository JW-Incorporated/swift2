// Settings → About: the in-app Privacy Policy / Terms of Use / Support links
// App Store guideline 5.1.1(i) requires, plus the UNOFFICIAL disclaimer the
// store listing carries (apps/mobile/docs/store-listing.md). Each row opens
// the page through App.tsx's legal WebView route (`openWebUrl`).
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createTapUnlock } from '../lib/diagnostics';
import { versionLabel } from '../lib/diagnostics-env';
import { LEGAL_PAGES, type LegalPageId } from '../lib/legal-links';
import { DiagnosticsPanel } from './DiagnosticsPanel';

export function SettingsAboutSection({
  onOpenLegalPage,
}: {
  onOpenLegalPage: (page: LegalPageId) => void;
}) {
  // 7 quick taps on the version label open the hidden diagnostics panel (One UI WP0.1).
  const unlock = useRef(createTapUnlock()).current;
  const [diagOpen, setDiagOpen] = useState(false);
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle} accessibilityRole="header">
        About
      </Text>
      {LEGAL_PAGES.map((page) => (
        <Pressable
          key={page.id}
          onPress={() => onOpenLegalPage(page.id)}
          accessibilityRole="link"
          accessibilityLabel={`Open ${page.label}`}
          hitSlop={4}
          style={styles.row}
        >
          <Text style={styles.rowLabel}>{page.label}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
      <Text style={styles.disclaimer}>
        Unofficial: Long Live is an independent fan project, not affiliated with, endorsed by, or
        sponsored by Taylor Swift, her management, or her record labels.
      </Text>
      <Pressable onPress={() => unlock.tap() && setDiagOpen(true)} accessibilityRole="text">
        <Text style={styles.version}>{versionLabel()}</Text>
      </Pressable>
      <DiagnosticsPanel visible={diagOpen} onClose={() => setDiagOpen(false)} />
    </View>
  );
}

// Palette/metrics for the About rows and group titles.
const styles = StyleSheet.create({
  group: { paddingTop: 20 },
  groupTitle: {
    color: '#f2c744',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    alignItems: 'center',
    borderBottomColor: '#1c1c22',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  chevron: { color: '#999', fontSize: 20 },
  version: { color: '#666', fontSize: 11, paddingHorizontal: 16, paddingTop: 12 },
  disclaimer: {
    color: '#666',
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
