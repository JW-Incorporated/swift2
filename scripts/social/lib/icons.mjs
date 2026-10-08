// Path data lifted from lucide-react (ISC-licensed, already a dependency of
// apps/web — see components/longlive/TopBar.tsx, which uses these exact
// three icons for the Eras/Threads/Mood nav tabs). Reusing them as oversized
// low-opacity watermarks on cards ties the social library back to the app's
// own icon vocabulary instead of introducing new decorative art, and fills
// the negative space a bottom-anchored text card otherwise leaves empty.
// 24x24 viewBox, as lucide ships them.
export const ICONS = {
  sparkles: [
    {
      type: 'path',
      d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
    },
    { type: 'path', d: 'M20 2v4' },
    { type: 'path', d: 'M22 4h-4' },
    { type: 'circle', cx: '4', cy: '20', r: '2' },
  ],
  layers: [
    {
      type: 'path',
      d: 'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z',
    },
    {
      type: 'path',
      d: 'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12',
    },
    {
      type: 'path',
      d: 'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17',
    },
  ],
  compass: [
    { type: 'circle', cx: '12', cy: '12', r: '10' },
    {
      type: 'path',
      d: 'm16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z',
    },
  ],
};
