import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// A11Y-10: form fields need a >=3:1 border (WCAG 1.4.11) and a visible 2px
// accent focus ring. The class strings are the contract; axe does not check
// non-text contrast, so pin them here.
function fieldLine(file: string, marker: string): string {
  const src = readFileSync(new URL(file, import.meta.url), 'utf8');
  const line = src.split('\n').find((l) => l.includes(marker));
  expect(line, `${file} contains ${marker}`).toBeDefined();
  return line!;
}

describe('form field borders and focus ring', () => {
  it('FeedbackButton textarea', () => {
    const l = fieldLine('./legal/FeedbackButton.tsx', 'resize-y rounded-lg');
    expect(l).toContain('border-ink-soft/75');
    expect(l).not.toContain('border-line');
    expect(l).toContain('focus-visible:ring-2');
    expect(l).toContain('focus-visible:ring-accent');
  });

  it('SubmitLinkForm input', () => {
    const l = fieldLine('./merch/SubmitLinkForm.tsx', 'min-h-[44px] flex-1 rounded-lg');
    expect(l).toContain('border-[color:var(--era-ink-soft)]/75');
    expect(l).not.toContain('--era-line');
    expect(l).toContain('focus-visible:ring-2');
    expect(l).toContain('focus-visible:ring-[color:var(--era-accent)]');
  });

  it('ClownChatComposer wrapper', () => {
    const l = fieldLine('./clown/ClownChatComposer.tsx', 'focus-within:border');
    expect(l).toContain('border-[color:var(--clown-ink-soft)]/70');
    expect(l).not.toContain('--clown-line');
    expect(l).toContain('focus-within:ring-2');
    expect(l).toContain('focus-within:ring-[color:var(--era-accent)]');
  });

  it('MoodChat composer wrapper', () => {
    const l = fieldLine('./clown/MoodChat.tsx', 'focus-within:border');
    expect(l).toContain('border-[color:var(--era-ink-soft)]/75');
    expect(l).not.toContain('--era-line');
    expect(l).toContain('focus-within:ring-2');
    expect(l).toContain('focus-within:ring-[color:var(--era-accent)]');
  });
});
