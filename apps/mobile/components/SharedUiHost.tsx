// One UI WP0.4: native host for the 'use dom' test page. Records the watchdog
// signals (launch attempted / ready / DOM-side errors / webview process death)
// through `onSignal`; WP0.4b persistence + timeouts consume these via `watch`.
// Supplying onContentProcessDidTerminate / onRenderProcessGone REPLACES the
// expo wrapper's auto-reload, so this host reloads itself — at most
// MAX_CRASH_RELOADS times, then it shows a static message instead of looping.
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import SharedUiTest from '../dom/SharedUiTest';
import { createDomHostHandlers, type DomSignal } from '../lib/dom-host-handlers';
import type { DomFailureMode } from '../lib/watchdog';
import type { DomWatch } from '../lib/watchdog-gate';

interface DomRef {
  reload?: () => void;
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
  const ref = useRef<DomRef>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onSignal('dom-launch-attempted');
  }, []);

  const handlers = useMemo(
    () =>
      createDomHostHandlers({
        onSignal,
        watch,
        reload: () => ref.current?.reload?.(),
        onGiveUp: () => setFailed(true),
        isAppActive: () => AppState.currentState === 'active',
        onceFocused: (fn) => {
          const sub = AppState.addEventListener('focus', () => {
            fn();
            sub.remove();
          });
        },
      }),
    [],
  );

  if (failed) {
    return (
      <View style={styles.fill}>
        <Text style={styles.msg}>Shared UI failed — turn off in Settings &gt; Diagnostics</Text>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <SharedUiTest
        ref={ref}
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
  msg: { color: '#fff', textAlign: 'center' },
});
