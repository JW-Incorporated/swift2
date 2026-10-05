import { useEffect, useState } from 'react';
import { Keyboard, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type KeyboardFrame = { screenX?: number; screenY: number; width: number; height: number };

const EDGE_SLACK = 2;
const MIN_SOFT_KEYBOARD = 100;

/**
 * Docked overlap above the bottom safe inset, in px. Floating/undocked keyboards (iPad) and hardware-keyboard
 * accessory bars cover no bottom inset, so they are 0. The safe inset is removed because the DOM already pads it
 * (`--safe-bottom`); Android reports the frame above the nav bar, iOS reports it including the home indicator.
 */
export function computeKeyboardInset(
  f: KeyboardFrame | null,
  win: { width: number; height: number },
  bottomInset: number,
): number {
  if (!f || !(f.height >= MIN_SOFT_KEYBOARD)) return 0;
  const docked =
    f.screenY + f.height >= win.height - bottomInset - EDGE_SLACK &&
    f.width >= win.width - EDGE_SLACK;
  if (!docked) return 0;
  return Math.max(0, Math.round(win.height - f.screenY - bottomInset));
}

/** Soft-keyboard height in px (0 when hidden). Edge-to-edge Android ignores `resize`, so the DOM gets this over the bridge. */
export function useKeyboardInset(): number {
  const [frame, setFrame] = useState<KeyboardFrame | null>(null);
  const win = useWindowDimensions();
  const bottomInset = useSafeAreaInsets().bottom;
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const onFrame = (e?: { endCoordinates?: KeyboardFrame }) => setFrame(e?.endCoordinates ?? null);
    const subs = [
      Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', onFrame),
      Keyboard.addListener(ios ? 'keyboardWillChangeFrame' : 'keyboardDidChangeFrame', onFrame),
      Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setFrame(null)),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);
  return computeKeyboardInset(frame, win, bottomInset);
}
