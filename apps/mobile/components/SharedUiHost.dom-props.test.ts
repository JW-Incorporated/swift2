import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SharedUiHost dom props', () => {
  const dom = readFileSync(join(__dirname, '..', 'lib', 'shared-ui-dom-props.ts'), 'utf8');

  it('sets inline media playback and user-action requirement explicitly', () => {
    expect(dom).toContain('allowsInlineMediaPlayback: true');
    expect(dom).toContain('mediaPlaybackRequiresUserAction: true');
  });
});
