// Speed test mode (#4896): the DOM-side hook the next/image stub calls on each
// loaded <img>. ReaderSpike registers the listener that reports it to the host.
type Listener = (visible: boolean) => void;

let listener: Listener | null = null;

export function setImageLoadListener(fn: Listener | null): void {
  listener = fn;
}

/** Visible = has a box that intersects the viewport right now. */
export function imageLoaded(el: HTMLImageElement): void {
  if (!listener) return;
  const r = el.getBoundingClientRect();
  listener(r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight);
}
