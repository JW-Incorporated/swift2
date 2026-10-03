// WP0.5b DEV/WEB ONLY entry (Metro picks `index.web.ts` for platform web; the
// native entries never see it). Renders ReaderSpike in a plain browser against
// a served content bundle: ?content=<base url of /content> (default same origin).
import 'expo';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import ReaderSpike from './dom/ReaderSpike';
import { loadDevEnvelope } from './dom/spike/dev-loader';

const base = new URLSearchParams(window.location.search).get('content') ?? '/content';
const noop = async () => {};

createRoot(document.getElementById('root') as HTMLElement).render(
  createElement(ReaderSpike, {
    devLoader: () => loadDevEnvelope(base),
    onReady: noop,
    reportError: async (m: string) => console.error('[spike]', m),
    reportProbe: async (j: string) => {
      (window as unknown as { __probe: unknown }).__probe = JSON.parse(j);
    },
  }),
);
