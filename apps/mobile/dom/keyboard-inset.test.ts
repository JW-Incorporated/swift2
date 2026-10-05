// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyKeyboardInset } from './keyboard-inset';

afterEach(() => {
  document.documentElement.removeAttribute('style');
  document.body.removeAttribute('style');
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('applyKeyboardInset', () => {
  it('sets --keyboard-inset and body padding, clears on 0', () => {
    applyKeyboardInset(300);
    expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe('300px');
    expect(document.body.style.paddingBottom).toBe('300px');
    applyKeyboardInset(0);
    expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe('0px');
    expect(document.body.style.paddingBottom).toBe('');
  });
  it('scrolls the focused field into view once the keyboard is up', () => {
    vi.useFakeTimers();
    const ta = document.createElement('textarea');
    ta.scrollIntoView = vi.fn();
    document.body.appendChild(ta);
    ta.focus();
    applyKeyboardInset(300);
    vi.advanceTimersByTime(100);
    expect(ta.scrollIntoView).toHaveBeenCalled();
  });
  it('ClownChat panels and composer read the var', () => {
    const src = readFileSync(resolve(process.cwd(), 'packages/ui/src/reader/clown/ClownChat.tsx'), 'utf8');
    expect(src).toContain('bottom-[var(--keyboard-inset,0px)]');
    expect(src).toContain('var(--keyboard-inset, 0px)');
  });
});
