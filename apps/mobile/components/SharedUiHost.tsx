// One UI WP0.4/0.5b: native host for the 'use dom' pages. Under the C4 override
// it mounts ReaderSpike (the real era stream, WP0.5b); the WP0.4 test page stays
// reachable through the Diagnostics "test page" toggle. Records the watchdog
// signals (launch attempted / ready / DOM-side errors / webview process death)
// through `onSignal` and forwards them to the WP0.4b watchdog via `watch`.
// Supplying onContentProcessDidTerminate / onRenderProcessGone REPLACES the
// expo wrapper's auto-reload; this host never reloads or shows its own error
// screen. A crash is a watchdog strike, and the strike unmounts this host in
// favour of the native screens (lib/watchdog-gate.ts).
// The webview reads the native disk cache itself: only a cache URI and a
// version token cross the bridge (C6), never content.
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReaderSpike from '../dom/ReaderSpike';
import SharedUiTest from '../dom/SharedUiTest';
import { hardwareBackHandled } from '../dom/spike/back';
import { setLatestProbeJson, withNativeTiming } from '../dom/spike/probe';
import { loadContentBundle } from '../lib/content-bundle';
import { createDomHostHandlers, type DomSignal } from '../lib/dom-host-handlers';
import { setProbeJson } from '../lib/dom-probe-store';
import { noteImageLoaded } from '../lib/image-marks';
import { speedTest } from '../lib/speed-test-runtime';
import { lastGoodCacheUri } from '../lib/dom-reader-config';
import { getUseTestPage } from '../lib/diagnostics-override';
import type { DomFailureMode } from '../lib/watchdog';
import type { DomWatch } from '../lib/watchdog-gate';

interface ReaderSource {
  cacheUri: string | null;
  versionToken: string;
}

export function SharedUiHost({
  onSignal,
  watch,
  forceFailure,
}: {
  onSignal: DomSignal;
  watch: DomWatch;
  forceFailure: DomFailureMode;
}) {
  const [testPage, setTestPage] = useState<boolean | null>(null);
  const [source, setSource] = useState<ReaderSource | null>(null);
  const [backTick, setBackTick] = useState(0);
  const readerReady = useRef(false);
  const launchedAt = useRef(0);
  const nativeMs = useRef<number | null>(null);
  const rawProbe = useRef<string | null>(null);
  const insets = useSafeAreaInsets();
  const [speedOn, setSpeedOn] = useState(speedTest.isOn());
  useEffect(() => {
    const sync = () => setSpeedOn(speedTest.isOn());
    sync();
    return speedTest.onChange(sync);
  }, []);

  useEffect(() => {
    launchedAt.current = Date.now();
    onSignal('dom-launch-attempted');
    void getUseTestPage().then(setTestPage);
  }, []);

  useEffect(() => {
    if (testPage !== false) return;
    // Cache-first: render from what is on disk now (offline relaunch), refresh in the background.
    const cached = lastGoodCacheUri();
    if (cached) setSource({ cacheUri: cached, versionToken: '' });
    void loadContentBundle()
      .then((bundle) => {
        if (!cached) setSource({ cacheUri: lastGoodCacheUri(), versionToken: bundle.manifest.bundleVersion });
      })
      .catch(() => {
        if (!cached) setSource({ cacheUri: null, versionToken: '' });
      });
  }, [testPage]);

  const handlers = useMemo(() => createDomHostHandlers({ onSignal, watch }), []);

  useEffect(() => {
    if (testPage !== false) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () =>
      hardwareBackHandled(readerReady.current, () => setBackTick((n) => n + 1)),
    );
    return () => sub.remove();
  }, [testPage]);

  useEffect(() => {
    if (forceFailure === 'throw' && source) void handlers.reportError('forced DOM failure');
  }, [forceFailure, source]);

  const publishProbe = (json: string) => {
    const merged = withNativeTiming(json, nativeMs.current);
    rawProbe.current = json;
    setProbeJson(merged);
    setLatestProbeJson(merged);
  };

  const dom = {
    onContentProcessDidTerminate: handlers.onContentProcessDidTerminate,
    onRenderProcessGone: handlers.onRenderProcessGone,
  };

  return (
    <View style={testPage ? styles.test : styles.fill}>
      {testPage === true ? (
        <SharedUiTest
          dom={dom}
          onReady={handlers.onReady}
          reportError={handlers.reportError}
          forceFailure={forceFailure}
        />
      ) : testPage === false && source ? (
        <ReaderSpike
          dom={dom}
          cacheUri={source.cacheUri ?? undefined}
          versionToken={source.versionToken}
          backTick={backTick}
          insets={insets}
          onReady={
            forceFailure === 'off'
              ? async () => {
                  readerReady.current = true;
                  nativeMs.current = Date.now() - launchedAt.current;
                  if (rawProbe.current) publishProbe(rawProbe.current);
                  await handlers.onReady();
                }
              : async () => {}
          }
          reportError={handlers.reportError}
          reportProbe={async (json) => publishProbe(json)}
          speedTestOn={speedOn}
          reportImageLoad={async (visible) => noteImageLoaded(visible)}
          reportBack={async (result) => {
            if (result === 'exit') BackHandler.exitApp();
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#0b0b0f' },
  test: { flex: 1, backgroundColor: '#0b0b0f', justifyContent: 'center', padding: 24 },
});
