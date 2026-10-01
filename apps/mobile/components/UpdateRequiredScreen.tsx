// Full-screen blocker shown only when the dormant forced-update gate trips
// (lib/update-required.ts, docs/mobile-release.md "Forcing an update").
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { storeUrlFor } from '../lib/update-required';

export function UpdateRequiredScreen() {
  return (
    <View style={styles.fill}>
      <Text style={styles.message}>
        A new version of Long Live is available — please update to keep going.
      </Text>
      <Pressable
        onPress={() => {
          Linking.openURL(storeUrlFor(Platform.OS)).catch(() => {});
        }}
        accessibilityRole="button"
        accessibilityLabel="Update Long Live"
        style={styles.button}
      >
        <Text style={styles.buttonText}>Update</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    alignItems: 'center',
    backgroundColor: '#0b0b0f',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  message: { color: '#ffffff', fontSize: 18, marginBottom: 24, textAlign: 'center' },
  button: {
    backgroundColor: '#f2c744',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: { color: '#0b0b0f', fontSize: 15, fontWeight: '700' },
});
