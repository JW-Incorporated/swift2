// Native screens NativeOverlayHost renders over the DOM host (D2): /inbox and /settings/about (refs #4992).
// (/settings/notifications moved to the DOM settings overlay, 2.12-D.) The D-7 presenter
// (`presentNativeRoute`) rejects every other path, so registering more would make the adapter route to a screen
// that does not exist. Native-safe (no slot components).
import { registerRoutes } from './routes-instance';

registerRoutes({
  slice: 'host',
  nativeRoutes: [
    { id: 'host:inbox', match: '/inbox' },
    { id: 'host:about', match: '/settings/about' },
  ],
});
