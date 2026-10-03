// One UI WP1.1c: parity-harness web entry. Resolved only by `expo export
// --platform web` (native keeps index.ts); mounts the WP0.4 DOM test page in a
// plain browser so Playwright can screenshot it. Never part of a native bundle.
//   ?inset=t,r,b,l   -> --safe-top/right/bottom/left (px) on <html>
//   ?mutate=shift    -> nudge one small element 4px (negative-spec hook)
//   ?mutate=colour   -> change one colour (negative-spec hook)
//   ?mutate=blur     -> sub-pixel blur (must stay within tolerance)
import { registerRootComponent } from 'expo';
import { useEffect } from 'react';

import SharedUiTest from './dom/SharedUiTest';

const params = new URLSearchParams(window.location.search);
const inset = (params.get('inset') ?? '0,0,0,0').split(',').map((n) => Number(n) || 0);
const root = document.documentElement.style;
['top', 'right', 'bottom', 'left'].forEach((side, i) => {
  root.setProperty(`--safe-${side}`, `${inset[i] ?? 0}px`);
});

const mutate = params.get('mutate');

function Parity() {
  useEffect(() => {
    if (!mutate) return;
    const button = document.querySelector('button');
    const row = document.querySelector('li');
    if (mutate === 'shift' && button instanceof HTMLElement) {
      button.style.position = 'relative';
      button.style.left = '4px';
    }
    if (mutate === 'colour' && button instanceof HTMLElement) {
      button.style.background = '#2f6f4f';
    }
    if (mutate === 'blur' && row instanceof HTMLElement) {
      row.style.filter = 'blur(0.3px)';
    }
  }, []);
  return (
    <SharedUiTest
      onReady={async () => {
        (window as unknown as { __ready: boolean }).__ready = true;
      }}
      reportError={async (message) => {
        console.error(message);
      }}
    />
  );
}

registerRootComponent(Parity);
