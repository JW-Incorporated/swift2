// Invisible hot corner in the top and bottom inset strips that opens the
// Diagnostics panel with 7 quick taps (shared across both strips) while the
// shared-UI host is mounted (issue #4872). It lives outside the SafeAreaView so
// it never overlaps DOM content, and it is rendered AFTER (above) the DOM host
// with zIndex/elevation so the strips take touches over the full-bleed webview on
// iOS and Android. The bottom strip sits on the home indicator; it renders only when
// insets.bottom >= MIN_STRIP_HEIGHT (20pt), so a device without a home indicator
// relies on the top strip. No visual change by design.
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createHotCornerPress, hotCornerRects, sharedHotCornerUnlock } from '../lib/diag-hot-corner';
import { DiagnosticsPanel } from './DiagnosticsPanel';

export function DiagHotCorner() {
  const [open, setOpen] = useState(false);
  const onPress = useRef(createHotCornerPress(() => setOpen(true), sharedHotCornerUnlock)).current;
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const rects = hotCornerRects(insets, window);
  if (rects.length === 0) return null;
  return (
    <>
      {rects.map((rect) => (
        <Pressable
          key={rect.top === 0 ? 'top' : 'bottom'}
          accessible={false}
          android_ripple={null}
          onPress={onPress}
          style={[styles.corner, rect]}
        />
      ))}
      <DiagnosticsPanel visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  corner: {
    backgroundColor: 'transparent',
    position: 'absolute',
    zIndex: 1000,
    elevation: 1000,
  },
});
