// Native screens NativeOverlayHost renders over the DOM host (D2). None remain: the inbox moved to the DOM
// (inbox.ts, W6-inbox-dom) and the native About screen was retired (Diagnostics stays behind the hidden hot corner),
// so every user-facing surface is the shared DOM UI. The D-7 presenter (`presentNativeRoute`) rejects every path;
// register an entry here only for a route NativeOverlayHost actually renders. Native-safe (no slot components).
import { registerRoutes } from './routes-instance';

registerRoutes({
  slice: 'host',
  nativeRoutes: [],
});
