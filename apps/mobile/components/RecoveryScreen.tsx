// Minimal recovery surface shown when the shared-UI (DOM) host has failed the watchdog.
// Replaces the legacy native screens: the only actions are Retry (one reload per human tap)
// and Send report (the existing /api/feedback diagnostics sender).
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { buildDiagPayload, diagCollector } from '../lib/diagnostics';
import { readDiagEnv } from '../lib/diagnostics-env';
import { sendDiagReport } from '../lib/diagnostics-send';
import { LEGAL_PAGES, legalPageUrl } from '../lib/legal-links';
import { retryDomAttempt } from '../lib/recovery-retry';

/** If reloadAsync resolved but the app is still here after this long, Retry is offered again. */
export const RELOAD_GRACE_MS = 3000;

// Fixed production origin: these links must work with no DOM host and no env.
const LEGAL_ORIGIN = 'https://www.longlivets.com';

const ERROR_RETRY = "Couldn't restart. Please try again.";
const ERROR_REOPEN = 'Close and reopen Long Live.';
const ERROR_NO_RELOAD = "The app didn't restart. Please try again.";

export function RecoveryScreen({ slow = false }: { slow?: boolean }) {
  const [retrying, setRetrying] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const retryLock = useRef(false);
  const sendLock = useRef(false);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function say(message: string) {
    setStatus(message);
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
  }

  function reopenRetry(message: string) {
    if (!mounted.current) return;
    retryLock.current = false;
    setRetrying(false);
    say(message);
  }

  async function retry() {
    if (retryLock.current) return;
    retryLock.current = true;
    setRetrying(true);
    say('Retrying');
    const outcome = await retryDomAttempt(Date.now, (phase) => {
      if (mounted.current) say(phase === 'checking' ? 'Checking for an update…' : 'Downloading update…');
    });
    if (outcome === 'reload-failed') return reopenRetry(ERROR_REOPEN);
    if (outcome !== 'reload-requested') return reopenRetry(ERROR_RETRY);
    timer.current = setTimeout(() => reopenRetry(ERROR_NO_RELOAD), RELOAD_GRACE_MS);
  }

  async function send() {
    if (sendLock.current) return;
    sendLock.current = true;
    setSending(true);
    say('Sending report');
    const result = await sendDiagReport(buildDiagPayload(readDiagEnv(), diagCollector.summary()));
    sendLock.current = false;
    if (!mounted.current) return;
    setSending(false);
    say(result.ok ? 'Report sent' : 'Send failed. Tap Send report to try again.');
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.fill} testID="recovery-screen">
      <Text style={styles.title} accessibilityRole="header">
        {slow ? "Taking longer than expected" : "Something went wrong"}
      </Text>
      <Text style={styles.body}>
        {slow ? "Tap Retry to load Long Live." : "Long Live hit a snag loading. Try again, and if it keeps happening, send us a report."}
      </Text>
      <Pressable
        onPress={retry}
        disabled={retrying}
        accessibilityRole="button"
        accessibilityLabel="Retry"
        accessibilityState={{ disabled: retrying, busy: retrying }}
        style={[styles.primary, retrying && styles.dim]}
      >
        <Text style={styles.primaryText}>{retrying ? 'Retrying…' : 'Retry'}</Text>
      </Pressable>
      <Pressable
        onPress={send}
        disabled={sending}
        accessibilityRole="button"
        accessibilityLabel="Send report"
        accessibilityState={{ disabled: sending, busy: sending }}
        style={[styles.secondary, sending && styles.dim]}
      >
        <Text style={styles.secondaryText}>{sending ? 'Sending…' : 'Send report'}</Text>
      </Pressable>
      <View style={styles.links}>
        {LEGAL_PAGES.map((page) => (
          <Pressable
            key={page.id}
            onPress={() => {
              Linking.openURL(legalPageUrl(page.id, LEGAL_ORIGIN)).catch(() => {});
            }}
            accessibilityRole="link"
            accessibilityLabel={page.label}
            style={styles.link}
          >
            <Text style={styles.linkText}>{page.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.status} accessibilityLiveRegion="polite" accessibilityRole="alert">
        {status}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#0c0c0c', flex: 1 },
  fill: { alignItems: 'center', backgroundColor: '#0c0c0c', flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  body: { color: '#a0a0a8', fontSize: 15, lineHeight: 22, marginBottom: 28, maxWidth: 320, textAlign: 'center' },
  primary: { alignItems: 'center', backgroundColor: '#f2c744', borderRadius: 8, minHeight: 44, justifyContent: 'center', minWidth: 160, paddingHorizontal: 24 },
  primaryText: { color: '#0c0c0c', fontSize: 15, fontWeight: '700' },
  secondary: { alignItems: 'center', justifyContent: 'center', marginTop: 12, minHeight: 44, paddingHorizontal: 24 },
  secondaryText: { color: '#d8d8de', fontSize: 14, textDecorationLine: 'underline' },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 },
  link: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 12 },
  linkText: { color: '#a0a0a8', fontSize: 13, textDecorationLine: 'underline' },
  dim: { opacity: 0.6 },
  status: { color: '#d8d8de', fontSize: 14, marginTop: 16, minHeight: 20, textAlign: 'center' },
});
