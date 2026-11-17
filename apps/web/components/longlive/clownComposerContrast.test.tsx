// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClownChatComposer } from '@swift2/ui/reader/clown/ClownChatComposer';

const tokens = readFileSync(join(process.cwd(), 'apps/web/app/tokens.generated.css'), 'utf8');

function token(name: string): number[] {
  const hex = new RegExp(`--${name}:\\s*#([0-9a-fA-F]{6})`).exec(tokens)![1];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function luminance(rgb: number[]): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: number[], b: number[]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function renderComposer() {
  return render(
    <ClownChatComposer
      className=""
      text=""
      setText={() => {}}
      submit={() => {}}
      busy={false}
      textareaRef={createRef<HTMLTextAreaElement>()}
    />,
  );
}

describe('Clownbot composer footnote contrast (WCAG 1.4.3)', () => {
  it('draws the disclaimer and the report link in the soft ink with no opacity fade', () => {
    renderComposer();
    for (const el of [
      screen.getByText(/theorises from the vault/),
      screen.getByRole('button', { name: 'Report a problem' }),
    ]) {
      let node: HTMLElement | null = el;
      while (node && node.parentElement) {
        expect(node.className, node.tagName).not.toMatch(/(^|\s)opacity-/);
        node = node.parentElement;
      }
      expect(el.className).toContain('--clown-ink-soft');
    }
  });

  it('the soft ink on the composer background is at least 4.5:1', () => {
    expect(ratio(token('clown-ink-soft'), token('clown-bg'))).toBeGreaterThanOrEqual(4.5);
  });
});
