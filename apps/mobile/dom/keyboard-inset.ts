/** Publishes the native keyboard height as `--keyboard-inset` (absent on the website, so it reads 0) and keeps the focused field visible. */
export function applyKeyboardInset(px: number): void {
  const root = document.documentElement;
  root.style.setProperty('--keyboard-inset', `${px}px`);
  document.body.style.paddingBottom = px > 0 ? `${px}px` : '';
  if (px <= 0) return;
  setTimeout(() => {
    const el = document.activeElement;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 60);
}
