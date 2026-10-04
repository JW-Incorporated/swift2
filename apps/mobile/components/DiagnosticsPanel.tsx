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

export function DiagnosticsPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [testPage, setTestPage] = useState(false);
  const [failMode, setFailMode] = useState<DomFailureMode>('off');
  const [speed, setSpeed] = useState<SpeedState | null>(null);
  const [, setTick] = useState(0);
  const [wd, setWd] = useState<WatchdogRecord | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const [writeError, setWriteError] = useState<string | null>(null);

  useEffect(() => {
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

  async function pickFailMode(mode: DomFailureMode) {
    const r = await persistAndReread(() => setForceDomFailure(mode), getForceDomFailure);
    setFailMode(r.value);
    setWriteError(r.error && `Force DOM failure not saved: ${r.error}`);
  }

  async function toggleTestPage(on: boolean) {
    const r = await persistAndReread(() => setUseTestPage(on), getUseTestPage);
    setTestPage(r.value);
    setWriteError(r.error && `Test page not saved: ${r.error}`);
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
          <Text style={styles.title}>Diagnostics</Text>
          <Pressable onPress={onClose} accessibilityLabel="Close diagnostics" hitSlop={12}>
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
          {writeError && <Text style={styles.err}>{writeError}</Text>}
          <View style={styles.switchRow}>
            <Text style={styles.fact}>Use WP0.4 test page, not ReaderSpike (next launch)</Text>
            <Switch
              value={testPage}
              onValueChange={(on) => void toggleTestPage(on)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.fact}>Speed test mode (auto-sends the next 10 launches)</Text>
            <Switch
              value={isActive(speed)}
              onValueChange={(on) => void toggleSpeed(on)}
            />
          </View>
          {panelLines(speed, speedTest.queued()).map((line) => (
            <Text key={line} style={styles.fact}>
              {line}
            </Text>
          ))}
          <Text style={styles.fact}>Force DOM failure (applies next launch)</Text>
          <View style={styles.modeRow}>
            {(['off', 'throw', 'hang'] as const).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => void pickFailMode(mode)}
                accessibilityRole="button"
                accessibilityState={{ selected: failMode === mode }}
                style={[styles.modeBtn, failMode === mode && styles.modeBtnOn]}
              >
                <Text style={styles.modeText}>{mode}</Text>
              </Pressable>
            ))}
          </View>
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
          {status === 'sent' && <Text style={styles.fact}>Report sent.</Text>}
          {status === 'error' && <Text style={styles.err}>{error}</Text>}
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
  close: { color: '#f2c744', fontSize: 15, fontWeight: '700' },
  body: { paddingHorizontal: 16, paddingBottom: 48 },
  section: { color: '#f2c744', fontSize: 12, fontWeight: '800', paddingTop: 16, paddingBottom: 6 },
  fact: { color: '#ddd', fontSize: 13, lineHeight: 20 },
  err: { color: '#ff7b7b', fontSize: 13, paddingTop: 8 },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  modeRow: { flexDirection: 'row', gap: 8, paddingVertical: 8 },
  modeBtn: { borderColor: '#f2c744', borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  modeBtnOn: { backgroundColor: '#3a3320' },
  modeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  button: { backgroundColor: '#f2c744', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 15, fontWeight: '800' },
});
