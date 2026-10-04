// Minimal recovery surface shown when the shared-UI (DOM) host has failed the watchdog.
// Replaces the legacy native screens: the only actions are Retry (one reload per human tap)
// and Send report (the existing /api/feedback diagnostics sender).
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { buildDiagPayload, diagCollector } from '../lib/diagnostics';
import { readDiagEnv } from '../lib/diagnostics-env';
import { sendDiagReport } from '../lib/diagnostics-send';
import { retryDomAttempt } from '../lib/recovery-retry';

type SendStatus = 'idle' | 'sending' | 'sent' | 'error';

export function RecoveryScreen() {
  const retrying = useRef(false);
  const sending = useRef(false);
  const [status, setStatus] = useState<SendStatus>('idle');

  function retry() {
    if (retrying.current) return;
    retrying.current = true;
    retryDomAttempt().catch(() => {
      retrying.current = false;
    });
  }

  async function send() {
    if (sending.current) return;
    sending.current = true;
    setStatus('sending');
    const result = await sendDiagReport(buildDiagPayload(readDiagEnv(), diagCollector.summary()));
    sending.current = false;
    setStatus(result.ok ? 'sent' : 'error');
  }

  const sendLabel =
    status === 'sending' ? 'Sending…' : status === 'sent' ? 'Report sent' : status === 'error' ? 'Send failed — tap to retry' : 'Send report';

  return (
    <View style={styles.fill} testID="recovery-screen">
      <Text style={styles.title} accessibilityRole="header">
        Something went wrong
      </Text>
      <Text style={styles.body}>Long Live hit a snag loading. Try again, and if it keeps happening, send us a report.</Text>
      <Pressable onPress={retry} accessibilityRole="button" accessibilityLabel="Retry" style={styles.primary}>
        <Text style={styles.primaryText}>Retry</Text>
      </Pressable>
      <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="Send report" style={styles.secondary}>
        <Text style={styles.secondaryText}>{sendLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { alignItems: 'center', backgroundColor: '#0c0c0c', flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  body: { color: '#a0a0a8', fontSize: 15, lineHeight: 22, marginBottom: 28, maxWidth: 320, textAlign: 'center' },
  primary: { alignItems: 'center', backgroundColor: '#f2c744', borderRadius: 8, minHeight: 44, justifyContent: 'center', minWidth: 160, paddingHorizontal: 24 },
  primaryText: { color: '#0c0c0c', fontSize: 15, fontWeight: '700' },
  secondary: { alignItems: 'center', justifyContent: 'center', marginTop: 12, minHeight: 44, paddingHorizontal: 24 },
  secondaryText: { color: '#d8d8de', fontSize: 14, textDecorationLine: 'underline' },
});
