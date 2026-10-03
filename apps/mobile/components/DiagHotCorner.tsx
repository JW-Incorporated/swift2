// Invisible hot corner in the top safe-area inset strip (bottom strip as a
// fallback) that opens the Diagnostics panel with 7 quick taps while the
// shared-UI host is mounted (issue #4872). It lives outside the SafeAreaView so
// it never overlaps DOM content. No visual change by design.
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createHotCornerPress, hotCornerRect } from '../lib/diag-hot-corner';
import { DiagnosticsPanel } from './DiagnosticsPanel';

export function DiagHotCorner() {
  const [open, setOpen] = useState(false);
  const onPress = useRef(createHotCornerPress(() => setOpen(true))).current;
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const rect = hotCornerRect(insets, window);
  if (!rect) return null;
  return (
    <>
      <Pressable
        accessible={false}
        android_ripple={null}
        onPress={onPress}
        style={[styles.corner, rect]}
      />
      <DiagnosticsPanel visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  corner: {
    backgroundColor: 'transparent',
    position: 'absolute',
  },
});
