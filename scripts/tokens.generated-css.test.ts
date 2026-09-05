// OS-031 "Done when": proves the web's --era-*/--clown-* CSS variables
// equal the shared token values in packages/experience/src/tokens.ts, and
// that the committed apps/web/app/tokens.generated.css matches what the
// generator produces from that same source right now (so a token edit
// without regenerating is a red test, not silent drift).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CLOWN_CSS_VAR_NAMES,
  CLOWN_TOKENS,
  ERA_CSS_VAR_NAMES,
  ERA_TOKENS,
} from '../packages/experience/src/tokens';
import { renderCss } from './generate-design-tokens.mjs';
import { ROOT } from './lib/generated-content.mjs';

const GENERATED_CSS_PATH = join(ROOT, 'apps/web/app/tokens.generated.css');

/** Parse `--name: value;` declarations out of a `:root { ... }` CSS block. */
function parseCssVars(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of css.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    out[match[1]] = match[2].trim();
  }
  return out;
}

describe('design tokens shared between web CSS and native (OS-031)', () => {
  const committedCss = readFileSync(GENERATED_CSS_PATH, 'utf8');
  const cssVars = parseCssVars(committedCss);

  it('every --era-* CSS variable equals its token value', () => {
    for (const [key, varName] of Object.entries(ERA_CSS_VAR_NAMES)) {
      expect(cssVars[varName]).toBe(ERA_TOKENS[key as keyof typeof ERA_TOKENS]);
    }
  });

  it('every --clown-* CSS variable equals its token value', () => {
    for (const [key, varName] of Object.entries(CLOWN_CSS_VAR_NAMES)) {
      expect(cssVars[varName]).toBe(CLOWN_TOKENS[key as keyof typeof CLOWN_TOKENS]);
    }
  });

  it('the committed generated CSS is byte-identical to a fresh regeneration', async () => {
    const mod = await import('../packages/experience/src/tokens');
    expect(committedCss).toBe(renderCss(mod));
  });
});
