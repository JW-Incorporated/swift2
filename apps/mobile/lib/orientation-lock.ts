// app.json declares orientation "default" (tablets rotate freely, and the
// native manifest never has to change again); phones are pinned to portrait
// here at runtime so their behavior is unchanged. JS-only, so an OTA can undo it.
import * as Device from 'expo-device';
import * as ScreenOrientation from 'expo-screen-orientation';

export async function lockPhonesToPortrait(): Promise<void> {
  try {
    if ((await Device.getDeviceTypeAsync()) !== Device.DeviceType.PHONE) return;
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  } catch (e) {
    console.warn('lockPhonesToPortrait failed', e instanceof Error ? e.message : e);
  }
}
