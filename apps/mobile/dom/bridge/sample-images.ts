import { countPlaceholders, type createProbe } from '../reader/probe';

/** Sample once the first screen has settled, then again later: lazy images that had not finished are reported as pending, not dropped. */
export function sampleImages(probe: ReturnType<typeof createProbe>, errored: WeakSet<EventTarget>, report: (json: string) => unknown) {
  for (const ms of [4000, 12000]) {
    setTimeout(() => {
      const imgs = Array.from(document.images).map((i) => ({
        src: i.currentSrc || i.src,
        complete: i.complete,
        naturalWidth: i.naturalWidth,
        errored: errored.has(i),
      }));
      probe.report.placeholders = countPlaceholders(imgs);
      void report(probe.json());
    }, ms);
  }
}
