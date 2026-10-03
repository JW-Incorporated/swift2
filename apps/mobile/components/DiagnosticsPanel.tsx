// One UI WP0.1 — hidden diagnostics panel (unlocked by 7 taps on the Settings
// version label). Shows load-stage timings + device facts, sends a `[diag]`
// report, and holds the C4 "Force shared UI" stub switch (wired in WP0.4).
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { buildDiagPayload, diagCollector, isPointStage } from '../lib/diagnostics';
import { readDiagEnv } from '../lib/diagnostics-env';
import {
  getForceDomFailure,
  getForceSharedUi,
  getUseTestPage,
  setForceDomFailure,
  setForceSharedUi,
  setUseTestPage,
} from '../lib/diagnostics-override';
import { latestProbeJson } from '../dom/spike/probe';
import { readerSpikeLines } from '../lib/dom-probe-store';
import { sendDiagReport } from '../lib/diagnostics-send';
import type { DomFailureMode, WatchdogRecord } from '../lib/watchdog';
import { watchdogLines } from '../lib/watchdog-policy';
import { clearWatchdogRecord, loadWatchdogRecord } from '../lib/watchdog-store';

export function DiagnosticsPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [forceShared, setForceShared] = useState(false);
  const [testPage, setTestPage] = useState(false);
  const [failMode, setFailMode] = useState<DomFailureMode>('off');
  const [wd, setWd] = useState<WatchdogRecord | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    void getForceSharedUi().then(setForceShared);
    void getUseTestPage().then(setTestPage);
    void getForceDomFailure().then(setFailMode);
    void loadWatchdogRecord().then((r) => setWd(r === 'corrupt' ? null : r));
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

  function toggle(on: boolean) {
    setForceShared(on);
    void setForceSharedUi(on);
    if (on) {
      setWd(null);
      void clearWatchdogRecord();
    }
  }

  function pickFailMode(mode: DomFailureMode) {
    setFailMode(mode);
    void setForceDomFailure(mode);
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
          <View style={styles.switchRow}>
            <Text style={styles.fact}>Force shared UI (this device)</Text>
            <Switch value={forceShared} onValueChange={toggle} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.fact}>Use WP0.4 test page, not ReaderSpike (next launch)</Text>
            <Switch
              value={testPage}
              onValueChange={(on) => {
                setTestPage(on);
                void setUseTestPage(on);
              }}
            />
          </View>
          <Text style={styles.fact}>Force DOM failure (applies next launch)</Text>
          <View style={styles.modeRow}>
            {(['off', 'throw', 'hang'] as const).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => pickFailMode(mode)}
                accessibilityRole="button"
                accessibilityState={{ selected: failMode === mode }}
                style={[styles.modeBtn, failMode === mode && styles.modeBtnOn]}
              >
                <Text style={styles.modeText}>{mode}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.section}>Watchdog</Text>
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
