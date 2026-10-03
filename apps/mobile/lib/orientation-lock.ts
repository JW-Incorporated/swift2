// app.json declares orientation "default" (tablets rotate freely, and the
// native manifest never has to change again); phones are pinned to portrait
// here at runtime so their behavior is unchanged. JS-only, so an OTA can undo it.
import * as Device from 'expo-device';
import * as ScreenOrientation from 'expo-screen-orientation';

/** Only a confirmed phone locks; tablets and unknown device types stay free. */
export function shouldLockPortrait(deviceType: number, phoneType: number): boolean {
  return deviceType === phoneType;
}

export async function lockPhonesToPortrait(): Promise<void> {
  try {
    const type = await Device.getDeviceTypeAsync();
    if (!shouldLockPortrait(type, Device.DeviceType.PHONE)) return;
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  } catch (e) {
    console.warn('lockPhonesToPortrait failed', e instanceof Error ? e.message : e);
  }
}
