// RN Modal that presents native routes over the still-mounted DOM host (One UI D-7).
// The Modal is a separate native window, so it carries its own diag hot-corner strips
// (G8): the app-wide shared 7-tap counter keeps working while an overlay is up.
import { Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { diagCollector } from '../lib/diagnostics';
import type { NativeRouteState } from '../lib/dom-host-handlers';
import type { NativeOverlayPresenter } from '../lib/use-native-overlay';
import { DiagHotCorner } from './DiagHotCorner';
import { NotificationInboxScreen } from './NotificationInboxScreen';
import { NotificationSettingsScreen } from './NotificationSettingsScreen';

const FILL = { flex: 1, backgroundColor: '#0b0b0f' } as const;

export function NativeOverlayHost({
  state,
  presenter,
  navigate,
}: {
  state: NativeRouteState;
  presenter: NativeOverlayPresenter;
  navigate: (url: string | null | undefined) => void;
}) {
  return (
    <Modal
      visible={state.phase === 'opening' || state.phase === 'open'}
      animationType="slide"
      statusBarTranslucent
      onShow={() => {
        if (presenter.opened(state.seq) === 'stale') diagCollector.mark('native-overlay-stale', 'opened');
      }}
      // iOS only: Android has no onDismiss, so its closing phase resolves via the deadline tick.
      onDismiss={() => {
        if (presenter.closed(state.seq) === 'stale') diagCollector.mark('native-overlay-stale', 'closed');
      }}
      onRequestClose={() => {
        presenter.handleBack();
      }}
    >
      <GestureHandlerRootView style={FILL}>
        <SafeAreaView style={FILL}>
          {state.route === '/inbox' ? (
            <NotificationInboxScreen
              onClose={() => presenter.dismiss()}
              onOpenItem={(event) => {
                presenter.dismiss();
                navigate(event.deepLink);
              }}
            />
          ) : state.route === '/settings/notifications' ? (
            <NotificationSettingsScreen
              onClose={() => presenter.dismiss()}
              onOpenInbox={() => presenter.presentNativeRoute('/inbox')}
            />
          ) : null}
        </SafeAreaView>
        <DiagHotCorner />
      </GestureHandlerRootView>
    </Modal>
  );
}
