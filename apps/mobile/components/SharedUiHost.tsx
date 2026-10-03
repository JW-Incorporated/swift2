// One UI WP0.4: native host for the 'use dom' test page. Records the watchdog
// signals (launch attempted / ready / DOM-side errors / webview process death)
// through `onSignal` and forwards them to the WP0.4b watchdog via `watch`.
// Supplying onContentProcessDidTerminate / onRenderProcessGone REPLACES the
// expo wrapper's auto-reload; this host never reloads or shows its own error
// screen. A crash is a watchdog strike, and the strike unmounts this host in
// favour of the native screens (lib/watchdog-gate.ts).
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import SharedUiTest from '../dom/SharedUiTest';
import { createDomHostHandlers, type DomSignal } from '../lib/dom-host-handlers';
import type { DomFailureMode } from '../lib/watchdog';
import type { DomWatch } from '../lib/watchdog-gate';

export function SharedUiHost({
  onSignal,
  watch,
  forceFailure,
}: {
  onSignal: DomSignal;
  watch: DomWatch;
  forceFailure: DomFailureMode;
}) {
  useEffect(() => {
    onSignal('dom-launch-attempted');
  }, []);

  const handlers = useMemo(() => createDomHostHandlers({ onSignal, watch }), []);

  return (
    <View style={styles.fill}>
      <SharedUiTest
        dom={{
          onContentProcessDidTerminate: handlers.onContentProcessDidTerminate,
          onRenderProcessGone: handlers.onRenderProcessGone,
        }}
        onReady={handlers.onReady}
        reportError={handlers.reportError}
        forceFailure={forceFailure}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#0b0b0f', justifyContent: 'center', padding: 24 },
});
