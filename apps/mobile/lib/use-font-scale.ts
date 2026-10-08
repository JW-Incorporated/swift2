import { useEffect, useState } from 'react';
import { AppState, Dimensions, PixelRatio } from 'react-native';

/** The OS text-size setting (Android font scale / iOS Dynamic Type), re-read on foreground and on Dimensions changes so a change made while the app is open applies. */
export function useFontScale(): number {
  const [scale, setScale] = useState(() => PixelRatio.getFontScale());
  useEffect(() => {
    const read = () => setScale(PixelRatio.getFontScale());
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') read();
    });
    const dims = Dimensions.addEventListener('change', read);
    return () => {
      app.remove();
      dims.remove();
    };
  }, []);
  return scale;
}
