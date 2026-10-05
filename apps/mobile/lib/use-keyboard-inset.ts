import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type KeyboardFrame = { screenX?: number; screenY: number; width: number; height: number };

const EDGE_SLACK = 2;
const MIN_SOFT_KEYBOARD = 100;

/**
 * Docked overlap above the bottom safe inset, in px. Floating/undocked keyboards (iPad) and hardware-keyboard
 * accessory bars cover no bottom inset, so they are 0. The safe inset is removed because the DOM already pads it
 * (`--safe-bottom`). Android: the frame height is the keyboard height regardless of window origin (split-screen).
 * iOS: only a full-screen-width keyboard docked to the screen bottom in a full-height window counts; Slide Over /
 * Stage Manager windows have an unknowable origin, so they get 0.
 */
export function computeKeyboardInset(
  f: KeyboardFrame | null,
  win: { width: number; height: number },
  screen: { width: number; height: number },
  bottomInset: number,
  os: string,
): number {
  if (!f || !(f.height >= MIN_SOFT_KEYBOARD)) return 0;
  if (os === 'android') return Math.max(0, Math.round(f.height - bottomInset));
  const docked =
    (f.screenX ?? 0) <= EDGE_SLACK &&
    f.width >= screen.width - EDGE_SLACK &&
    f.screenY + f.height >= screen.height - EDGE_SLACK;
  if (!docked || win.height < screen.height - EDGE_SLACK) return 0;
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
  return computeKeyboardInset(frame, win, Dimensions.get('screen'), bottomInset, Platform.OS);
}
