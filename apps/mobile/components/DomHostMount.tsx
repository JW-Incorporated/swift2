// The DOM surface as App.tsx mounts it (W2-I): the shared-UI host plus the native-route overlay it presents
// into. Extracted so App.tsx only passes props; all DOM-host composition lives here and in SharedUiHost.
import type { ComponentProps } from 'react';
import { diagCollector, diagMarkOnce } from '../lib/diagnostics';
import type { RouteFlags } from '../lib/routes';
import type { DomFailureMode } from '../lib/watchdog';
import type { DomWatch } from '../lib/watchdog-gate';
import { NativeOverlayHost } from './NativeOverlayHost';
import { SharedUiHost } from './SharedUiHost';

type OverlayProps = ComponentProps<typeof NativeOverlayHost>;

export function DomHostMount({
  watch,
  forceFailure,
  siteUrl,
  getRouteFlags,
  state,
  presenter,
  navigate,
}: {
  watch: DomWatch;
  forceFailure: DomFailureMode;
  siteUrl: string;
  getRouteFlags: () => RouteFlags;
  state: OverlayProps['state'];
  presenter: OverlayProps['presenter'];
  navigate: OverlayProps['navigate'];
}) {
  return (
    <>
      <SharedUiHost
        onSignal={(stage, detail) => {
          diagCollector.mark(stage, detail);
          if (stage === 'dom-ready') diagMarkOnce('first-era-paint', 'shared');
        }}
        watch={watch}
        forceFailure={forceFailure}
        siteUrl={siteUrl}
        getRouteFlags={getRouteFlags}
        presentNativeRoute={presenter.presentNativeRoute}
      />
      <NativeOverlayHost state={state} presenter={presenter} navigate={navigate} />
    </>
  );
}
