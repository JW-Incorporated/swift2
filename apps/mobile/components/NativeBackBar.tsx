// Header with an explicit Back / Close control for the native track-guide and
// song screens (they have no chrome of their own, so iOS users had no way out).
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { eraColors } from '../lib/theme';

export function NativeBackBar({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={label} hitSlop={12}>
        <Text style={styles.action}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: '#0b0b0f',
    borderBottomColor: eraColors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  action: { color: '#f2c744', fontSize: 15, fontWeight: '700' },
});
