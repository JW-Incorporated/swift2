// The enable button paints `bg-accent` + `text-[var(--era-accent-fg)]` (disabled: `bg-surface` + `text-ink-soft`).
// The web /settings/notifications page renders outside the era shell, on the :root defaults, which once had no
// --era-accent-fg at all (text fell back to --era-ink: #ededed on #e8e8e8, 1.04:1).
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ERAS, ERA_TOKENS } from '@swift2/experience';
import { accentFgFor } from '../../lib/theme';
import { SubscribePrompt } from './SubscribePrompt';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

describe('SubscribePrompt enable button contrast (WCAG 1.4.3, >= 4.5:1)', () => {
  it('the button reads its text colour from --era-accent-fg', () => {
    const html = renderToStaticMarkup(<SubscribePrompt kind="not_subscribed" optOutPending={false} onSubscribe={() => {}} />);
    expect(html).toContain('bg-accent');
    expect(html).toContain('text-[color:var(--era-accent-fg)]');
  });

  it('outside the era shell: the generated :root defaults define --era-accent-fg and it clears 4.5:1 on the default accent', () => {
    const css = readFileSync(new URL('../../../../../../apps/web/app/tokens.generated.css', import.meta.url), 'utf8');
    expect(css).toContain(`--era-accent-fg: ${ERA_TOKENS.accentFg};`);
    expect(contrast(ERA_TOKENS.accentFg, ERA_TOKENS.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(ERA_TOKENS.inkSoft, ERA_TOKENS.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(ERAS.map((e) => ({ id: e.id, theme: e.theme })))('$id: enabled and disabled states clear 4.5:1', ({ theme }) => {
    expect(contrast(accentFgFor(theme), theme.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.inkSoft, theme.surface)).toBeGreaterThanOrEqual(4.5);
  });
});
