// Native screen shown while the very first launch downloads the content bundle (no last-good cache on disk yet).
// Lives in the native layer on purpose: the watchdog gate holds the DOM host back until the cache exists.
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export function FirstLaunchScreen({ failed, onRetry }: { failed: boolean; onRetry: () => void }) {
  return (
    <View style={styles.fill} testID="first-launch-screen">
      {failed ? (
        <>
          <Text style={styles.message} accessibilityRole="alert">You're offline — connect to load Long Live</Text>
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry"
            style={styles.button}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator color="#f2c744" size="large" />
          <Text style={[styles.message, styles.loading]} accessibilityLiveRegion="polite">Downloading Long Live…</Text>
        </>
      )}
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
  loading: { marginBottom: 0, marginTop: 16 },
  button: {
    backgroundColor: '#f2c744',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: { color: '#0b0b0f', fontSize: 15, fontWeight: '700' },
});
