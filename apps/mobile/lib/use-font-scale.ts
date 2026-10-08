import { useEffect, useState } from 'react';
import { AppState, PixelRatio } from 'react-native';

/** The OS text-size setting (Android font scale / iOS Dynamic Type), re-read when the app returns to the foreground: users change it while we are backgrounded. */
export function useFontScale(): number {
  const [scale, setScale] = useState(() => PixelRatio.getFontScale());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setScale(PixelRatio.getFontScale());
    });
    return () => sub.remove();
  }, []);
  return scale;
}
