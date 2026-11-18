// One UI WP0.1 — hidden diagnostics panel (unlocked by 7 taps on the Settings
// version label). Shows load-stage timings + device facts, sends a `[diag]`
// report, and holds the watchdog drill switches.
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { buildDiagPayload, diagCollector, getMountInfo, isPointStage } from '../lib/diagnostics';
import { readDiagEnv } from '../lib/diagnostics-env';
import {
  getForceDomFailure,
  getUseTestPage,
  persistAndReread,
  setForceDomFailure,
  setUseTestPage,
} from '../lib/diagnostics-override';
import { latestProbeJson } from '../dom/reader/probe';
import { readerSpikeLines } from '../lib/dom-probe-store';
import { sendDiagReport } from '../lib/diagnostics-send';
import { isActive, panelLines, type SpeedState } from '../lib/speed-test';
import { speedTest } from '../lib/speed-test-runtime';
import type { DomFailureMode, WatchdogRecord } from '../lib/watchdog';
import { mountLine, watchdogLines } from '../lib/watchdog-policy';
import { clearWatchdogRecord, loadWatchdogRecord } from '../lib/watchdog-store';

type PendingDrill = { kind: 'fail'; mode: 'throw' | 'hang' } | { kind: 'test' };

const TEST_PAGE_LABEL = 'TEST ONLY: show the WP0.4 test page instead of the reader (next launch only)';
const FAIL_LABEL = 'TEST ONLY: Force DOM failure (breaks the next launch only, then clears itself)';

export function DiagnosticsPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [testPage, setTestPage] = useState(false);
  const [failMode, setFailMode] = useState<DomFailureMode>('off');
  const [speed, setSpeed] = useState<SpeedState | null>(null);
  const [, setTick] = useState(0);
  const [wd, setWd] = useState<WatchdogRecord | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const [writeError, setWriteError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingDrill | null>(null);

  useEffect(() => {
    setPending(null);
    if (!visible) return;
    void getUseTestPage().then(setTestPage);
    void getForceDomFailure().then(setFailMode);
    void speedTest.state().then(setSpeed);
    void loadWatchdogRecord().then((r) => setWd(r === 'corrupt' ? null : r));
    return speedTest.onChange(() => {
      setTick((n) => n + 1);
      void speedTest.state().then(setSpeed);
    });
  }, [visible]);

  if (!visible) return null;
  const env = readDiagEnv();
  const summary = diagCollector.summary();

  async function send() {
    if (status === 'sending') return;
    setStatus('sending');
    const result = await sendDiagReport(buildDiagPayload(env, diagCollector.summary()));
    setStatus(result.ok ? 'sent' : 'error');
    setError(result.error ?? '');
  }

  async function applyFailMode(mode: DomFailureMode) {
    const r = await persistAndReread(() => setForceDomFailure(mode), getForceDomFailure);
    setFailMode(r.value);
    setWriteError(r.error && `Force DOM failure not saved: ${r.error}`);
  }

  async function applyTestPage(on: boolean) {
    const r = await persistAndReread(() => setUseTestPage(on), getUseTestPage);
    setTestPage(r.value);
    setWriteError(r.error && `Test page not saved: ${r.error}`);
  }

  // Arming a drill breaks the next launch on purpose, so it always takes a second, explicit tap here.
  function pickFailMode(mode: DomFailureMode) {
    setPending(null);
    if (mode === 'off') void applyFailMode('off');
    else setPending({ kind: 'fail', mode });
  }

  function toggleTestPage(on: boolean) {
    setPending(null);
    if (on) setPending({ kind: 'test' });
    else void applyTestPage(false);
  }

  function confirmPending() {
    if (!pending) return;
    setPending(null);
    if (pending.kind === 'fail') void applyFailMode(pending.mode);
    else void applyTestPage(true);
  }

  async function toggleSpeed(on: boolean) {
    const r = await persistAndReread(
      () => (on ? speedTest.enable() : speedTest.disable()),
      () => speedTest.state(),
    );
    setSpeed(r.value);
    setWriteError(r.error && `Speed test not saved: ${r.error}`);
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.fill}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">Diagnostics</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Done" hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.close}>Done</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.fact}>Model: {env.model}</Text>
          <Text style={styles.fact}>OS: {env.os}</Text>
          <Text style={styles.fact}>Build: {env.build}</Text>
          <Text style={styles.fact}>Update id: {env.updateId}</Text>
          <Text style={styles.fact}>Launch: {summary.launch}</Text>
          <Text style={styles.section}>Stages (span: total ms; mark: at ms from launch)</Text>
          {summary.stages.length === 0 && <Text style={styles.fact}>No timings recorded yet.</Text>}
          {summary.stages.map((s) => (
            <Text key={s.stage} style={styles.fact}>
              {isPointStage(s)
                ? `${s.stage}: at ${Math.round(s.firstStartMs)} ms / ${s.count}`
                : `${s.stage}: ${Math.round(s.totalMs)} ms / ${s.count} (at ${Math.round(s.firstStartMs)})`}
            </Text>
          ))}
          {writeError && <Text style={styles.err} accessibilityLiveRegion="polite">{writeError}</Text>}
          <View style={styles.switchRow}>
            <Text style={[styles.fact, styles.drill]}>{TEST_PAGE_LABEL}</Text>
            <Switch
              accessibilityLabel={TEST_PAGE_LABEL}
              value={testPage}
              onValueChange={toggleTestPage}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.fact}>Speed test mode (auto-sends the next 10 launches)</Text>
            <Switch
              accessibilityLabel="Speed test mode (auto-sends the next 10 launches)"
              value={isActive(speed)}
              onValueChange={(on) => void toggleSpeed(on)}
            />
          </View>
          {panelLines(speed, speedTest.queued()).map((line) => (
            <Text key={line} style={styles.fact}>
              {line}
            </Text>
          ))}
          <Text style={[styles.fact, styles.drill]}>{FAIL_LABEL}</Text>
          <View style={styles.modeRow}>
            {(['off', 'throw', 'hang'] as const).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => pickFailMode(mode)}
                accessibilityRole="button"
                accessibilityLabel={`Force DOM failure ${mode}`}
                accessibilityState={{ selected: failMode === mode }}
                style={[styles.modeBtn, failMode === mode && styles.modeBtnOn]}
              >
                <Text style={styles.modeText}>{mode}</Text>
              </Pressable>
            ))}
          </View>
          {pending && (
            <View style={styles.confirm} accessibilityLiveRegion="polite">
              <Text style={styles.drill}>
                {pending.kind === 'fail'
                  ? `Arm "${pending.mode}"? The next launch will fail on purpose and show the Recovery screen.`
                  : 'Arm the test page? The next launch will show the test page instead of Long Live.'}{' '}
                It applies to one launch only.
              </Text>
              <View style={styles.modeRow}>
                <Pressable onPress={confirmPending} accessibilityRole="button" style={styles.modeBtn} testID="diag-confirm-arm">
                  <Text style={styles.modeText}>Arm for next launch</Text>
                </Pressable>
                <Pressable onPress={() => setPending(null)} accessibilityRole="button" style={styles.modeBtn} testID="diag-confirm-cancel">
                  <Text style={styles.modeText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}
          <Text style={styles.section}>Watchdog</Text>
          <Text style={styles.fact}>
            {mountLine(getMountInfo().mount, getMountInfo().reason, getMountInfo().source)}
          </Text>
          {watchdogLines(wd).map((line) => (
            <Text key={line} style={styles.fact}>
              {line}
            </Text>
          ))}
          <Pressable
            onPress={() => {
              setWd(null);
              void clearWatchdogRecord();
            }}
            style={styles.button}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Reset watchdog (applies next launch)</Text>
          </Pressable>
          <Text style={styles.section}>Reader spike</Text>
          {readerSpikeLines().map((line) => (
            <Text key={line} style={styles.fact}>
              {line}
            </Text>
          ))}
          <Pressable
            onPress={() => void Share.share({ message: latestProbeJson() ?? '{}' })}
            style={styles.button}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Share probe JSON</Text>
          </Pressable>
          <Pressable onPress={send} style={styles.button} accessibilityRole="button">
            <Text style={styles.buttonText}>
              {status === 'sending' ? 'Sending…' : 'Send report'}
            </Text>
          </Pressable>
          <Text style={status === 'error' ? styles.err : styles.fact} accessibilityLiveRegion="polite" testID="diag-status">
            {status === 'sent' ? 'Report sent.' : status === 'error' ? error : ''}
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: '#0b0b0f', flex: 1, paddingTop: 48 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  closeBtn: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  close: { color: '#f2c744', fontSize: 15, fontWeight: '700' },
  body: { paddingHorizontal: 16, paddingBottom: 48 },
  section: { color: '#f2c744', fontSize: 12, fontWeight: '800', paddingTop: 16, paddingBottom: 6 },
  fact: { color: '#ddd', fontSize: 13, lineHeight: 20 },
  err: { color: '#ff7b7b', fontSize: 13, paddingTop: 8 },
  drill: { color: '#ff9f6b', fontSize: 13, fontWeight: '700', lineHeight: 20, flexShrink: 1 },
  confirm: { borderColor: '#ff9f6b', borderWidth: 1, borderRadius: 8, padding: 12, marginVertical: 8 },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  modeRow: { flexDirection: 'row', gap: 8, paddingVertical: 8 },
  modeBtn: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44, borderColor: '#f2c744', borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  modeBtnOn: { backgroundColor: '#3a3320' },
  modeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  button: { backgroundColor: '#f2c744', borderRadius: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  buttonText: { color: '#000', fontSize: 15, fontWeight: '800' },
});
