// WP0.5b: Android hardware back. Only a reader that has reported ready can
// consume the press; while it is loading or failed the press must fall through
// (return false) so the user can leave the app.
export function hardwareBackHandled(readerReady: boolean, ping: () => void): boolean {
  if (!readerReady) return false;
  ping();
  return true;
}
