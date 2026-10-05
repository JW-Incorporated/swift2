// The route flags the app still reads. The legacy native screens (and their per-screen flags) were
// deleted in One UI PR3; the JSON route keys in config/mobile/app-config.json stay because old OTAs
// still parse them, but nothing here consults them.
export interface RouteFlags {
  /** Mounts the shared-UI DOM host. Defaults ON (founder decision 2026-10-04). */
  sharedUi: boolean;
  /** Same gate for iOS only (iOS reads this, Android reads `sharedUi`). Off until the iOS DOM-ready fix is verified on device; enable with a JSON/OTA one-line change. */
  sharedUiIos: boolean;
}

export const DEFAULT_ROUTE_FLAGS: RouteFlags = { sharedUi: true, sharedUiIos: false };
