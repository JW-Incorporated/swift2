import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/** Soft-keyboard height in px (0 when hidden). Edge-to-edge Android ignores `resize`, so the DOM gets this over the bridge. */
export function useKeyboardInset(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) =>
      setHeight(Math.max(0, Math.round(e.endCoordinates?.height ?? 0))),
    );
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}
