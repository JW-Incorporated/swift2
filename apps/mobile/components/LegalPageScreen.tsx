// OS-039's last WebView job — a legal page — wrapped in native chrome with a
// Done button, so a user who opens Privacy / Terms / Support from Settings or
// the Clownbot disclosure can always get back. Android hardware back closes
// it too; SiteShell's own back handler re-registers (and so runs first) once
// the WebView has history, so in-page back still walks that history first.
import { useEffect } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SiteShell, type SiteShellProps } from './SiteShell';
import { eraColors } from '../lib/theme';

export function LegalPageScreen({
  onClose,
  ...shellProps
}: SiteShellProps & { onClose: () => void }) {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  return (
    <View style={styles.fill}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close page"
          hitSlop={12}
        >
          <Text style={styles.done}>Done</Text>
        </Pressable>
      </View>
      <SiteShell {...shellProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: '#0b0b0f', flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomColor: eraColors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  done: { color: '#f2c744', fontSize: 15, fontWeight: '700' },
});
