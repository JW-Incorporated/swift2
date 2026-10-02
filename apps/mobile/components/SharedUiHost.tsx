// One UI WP0.4: native host for the 'use dom' test page. Records the watchdog
// signals (launch attempted / ready / DOM-side errors / webview process death)
// through `onSignal`; WP0.4b adds persistence and timeouts on top of these.
// Supplying onContentProcessDidTerminate / onRenderProcessGone REPLACES the
// expo wrapper's auto-reload, so this host calls reload() itself.
import { useCallback, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import SharedUiTest from '../dom/SharedUiTest';

export type DomSignal = (stage: string, detail?: string) => void;

interface DomRef {
  reload?: () => void;
}

export function SharedUiHost({ onSignal }: { onSignal: DomSignal }) {
  const ref = useRef<DomRef>(null);
  useState(() => {
    onSignal('dom-launch-attempted');
    return null;
  });

  const reload = useCallback(() => ref.current?.reload?.(), []);

  const onReady = useCallback(async () => {
    onSignal('dom-ready');
  }, [onSignal]);

  const reportError = useCallback(
    async (message: string) => {
      onSignal('dom-error', message.slice(0, 200));
    },
    [onSignal],
  );

  const dom = {
    onContentProcessDidTerminate: () => {
      onSignal('dom-process-terminated');
      reload();
    },
    onRenderProcessGone: () => {
      onSignal('dom-render-process-gone');
      if (AppState.currentState === 'active') {
        reload();
        return;
      }
      const sub = AppState.addEventListener('focus', () => {
        reload();
        sub.remove();
      });
    },
  };

  return (
    <View style={styles.fill}>
      <SharedUiTest ref={ref} dom={dom} onReady={onReady} reportError={reportError} />
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: '#0b0b0f' } });
