# 2.12-D settings prefs: app-side webPush shim design (research only; origin/main 781cf22d)

## 1. Current interface and page usage
- packages/ui/src/host/types.ts:101 HostWebPush (optional webPush? on HostAdapter, :161):
  isSupported():boolean; getDeviceId():string (SYNC); subscribe(vapid|null) -> {status: subscribed | permission_denied (both carry deviceId) | unsupported | vapid_not_configured | error+error};
  unsubscribe() -> {ok:true}|{ok:false,error}; loadPrefs(deviceId) -> DevicePrefsResponse; savePrefs(deviceId,{settings?,prefs?}) -> DevicePrefsResponse (reject on HTTP error).
- Page: packages/ui/src/reader/settings/WebNotificationSettings.tsx (NotificationSettingsPage.tsx only wraps it; prop vapidPublicKey).
  - :74 isSupported() gate -> "unsupported" copy.
  - :78-84 initial state reads the GLOBAL Notification.permission (not the host): granted -> subscribed (calls getDeviceId()), denied -> denied, else not_subscribed. Webviews often lack Notification, so the page would always show "Enable notifications".
  - loadPrefs/savePrefs(deviceId, ...) once subscribed; subscribe/unsubscribe on buttons; denied copy says "blocked for this site in your browser settings ... reload this page".
- Shapes: DevicePrefsResponse {settings, prefs[]} (packages/shared/src/notifications-types.ts:357); PUT body DevicePrefsUpdateInput (:365).

## 2. Existing bridge notifications.* (packages/ui/src/bridge/messages.ts:27-30; apps/mobile/lib/bridge-handlers-notifications.ts)
- status{} -> granted|denied|undetermined|unsupported; request{} -> same (shows OS prompt); register{} -> null; updatePrefs{prefs: Record<string,boolean>} -> null (validKnownPrefs, serialized latest-wins, 15s timeout, fixed error text "notification operation failed"; ids/tokens never returned).
- CAN: permission state, OS prompt, register device. CANNOT: read prefs; write DevicePrefsResponse-shaped data. updatePrefs is a flat boolean map, NOT {settings, prefs[{category,cadence}]}; do not overload it.
- Native building blocks exist: apps/mobile/lib/prefs-client.ts fetchDevicePrefs()/saveDevicePrefs({settings,prefs}) (resolve id natively via getOrCreateDeviceId + apiBaseUrl); apps/mobile/lib/push-registration.ts requestPushRegistration()/registerDevice().
- Trap: grep found NO production wiring of NotificationHandlerDeps (only tests; app-handlers.ts:12 takes deps.notifications). Verify the D1/H3 host really supplies status/request/register/updatePrefs before building on it.
- Bridge "api" command could reach /api/devices/ID/prefs only if the DOM knew the id: violates the rule, do not use.

## 3. Design: webPush shim in apps/mobile/dom/bridge/app-adapter; deviceId is an opaque constant
DOM-side constant APP_DEVICE = "native" is the only "id" the page sees; native ignores the arg and uses its real id.
- isSupported() -> true (native "unsupported" surfaces via subscribe).
- getDeviceId() -> APP_DEVICE (sync, satisfies the type).
- subscribe(_vapid) (VAPID unused; Expo push): s = await cmd(notifications.request) (OS prompt if undetermined, no-op if granted).
  denied -> {status: permission_denied, deviceId: APP_DEVICE}; unsupported -> {status: unsupported}; granted -> cmd(notifications.register) then {status: subscribed, deviceId: APP_DEVICE}; bridge error -> {status: error, error: "Could not enable notifications. Try again."} (fixed text; never forward native strings).
- unsubscribe(): OS permission cannot be revoked in-app. ADD-ONLY cmd notifications.unregister (native: registerWithBackend pushToken:null, mirrors apps/web/lib/web-push-client.ts:147) -> {ok:true}; error -> {ok:false,error:"Could not turn off notifications."}.
- loadPrefs(_id): ADD-ONLY cmd notifications.getPrefs {} -> DevicePrefsResponse (native fetchDevicePrefs). On error shim throws Error("Could not load your settings.") (page shows prefsError).
- savePrefs(_id, body): ADD-ONLY cmd notifications.savePrefs {settings?,prefs?} -> DevicePrefsResponse (native saveDevicePrefs). Needs a bounded validator in bridge-host-validate.ts (known keys, cadence enum, numeric ranges; reuse packages/core notification-prefs validation). Use a plain FIFO queue: latest-wins (as updatePrefs) is WRONG here since per-key writes are independent.
- Add-only plumbing: DomCommandSpec + handler map + validate switch (bridge-host-validate.ts:63 pattern) + contract.test. Check version.ts range semantics before assuming no protocol bump.
- Initial-state problem (page reads global Notification.permission): zero-ui-change option = adapter bootstrap awaits cmd(notifications.status) BEFORE first render of the route and sets globalThis.Notification ??= {permission: granted|denied|default} (undetermined/unsupported -> default). Hacky global; scope it and ensure nothing else feature-detects Notification.
- Denied hint: web copy ("blocked for this site in your browser settings ... reload this page") is false in-app. Options: (a) accept, zero ui change; (b) ADD optional deniedHint?: string to HostWebPush, page renders it when present (additive, web pixel-identical). Recommend (b): "Notifications are turned off for Long Live. Open your phone Settings, then Notifications, to allow them." (no deep-link: an app-settings URL is not https, openExternal rejects it). PM call vs "identical to web".
- Failure modes: bridge timeout/cancel (route change mid-op) -> shim error, no partial state; offline PUT -> reject, page shows red prefsError, keeps prior state; 15s native timeout; permission flipped in OS Settings while backgrounded -> stale until next subscribe/status (no AppState hook; accepted or add refresh); register fails after grant -> report error, retry via button; simulator: requestPushRegistration returns unsupported (Device.isDevice false) -> unsupported copy, so S5 must use real devices.

## 4. packages/ui changes
- Required: none (polyfill route + accept web denied copy).
- Recommended, additive/optional, web unchanged: HostWebPush.deniedHint?; optionally HostWebPush.getPermission?() returning granted|denied|default, replacing the global read (cleaner than the polyfill). Needs ui tests.

## 5. Tests
- Unit apps/mobile/dom/bridge/app-adapter.test: every shim method with a fake cmd: granted/denied/unsupported/undetermined then granted, bridge errors -> fixed strings, no native text leaks; assert no real id in any payload/result (deviceId always native).
- Handler tests (bridge-handlers-notifications.test.ts): getPrefs/savePrefs/unregister: invalid body rejected, FIFO order, timeout, abort, response never contains id (prefs-client mocked; URL built natively only).
- contract.test.ts / bridge.test.ts: new commands in spec + validator parity. Render test: NotificationSettingsPage under app host with fake bridge walks not_subscribed, subscribed, save, unsubscribe.
- Parity: snapshot the page HTML under web adapter vs shim adapter in the same state (identical except hint text if option b).

## S5 device checks (real iOS + Android)
Fresh install: Enable, OS prompt, Allow, prefs load; Deny shows hint; flip in OS Settings then re-enter route; toggle master/quiet hours/daily cap/category cadence, persists after app kill; confirm server row via native prefs GET; airplane-mode save error; Disable sets backend pushToken null; webview inspector: no id in bridge messages or DOM storage; visual diff vs longlivets.com/settings/notifications at 390px and tablet, light/dark.

## Open questions
Is NotificationHandlerDeps wired in production (not found)? Version-range semantics for add-only commands? Is unsubscribe expected in-app? Denied-hint (a) vs (b)?
