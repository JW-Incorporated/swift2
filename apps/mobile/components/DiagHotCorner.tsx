// Invisible 44x44 top-left hot corner that opens the Diagnostics panel with 7
// quick taps while the shared-UI host is mounted (issue #4872). No visual
// change by design: the app must look exactly like the website.
import { useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { createHotCornerPress, HOT_CORNER_SIZE } from '../lib/diag-hot-corner';
import { DiagnosticsPanel } from './DiagnosticsPanel';

export function DiagHotCorner() {
  const [open, setOpen] = useState(false);
  const onPress = useRef(createHotCornerPress(() => setOpen(true))).current;
  return (
    <>
      <Pressable accessible={false} onPress={onPress} style={styles.corner} />
      <DiagnosticsPanel visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  corner: {
    backgroundColor: 'transparent',
    height: HOT_CORNER_SIZE,
    left: 0,
    position: 'absolute',
    top: 0,
    width: HOT_CORNER_SIZE,
  },
});
