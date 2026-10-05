import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SharedUiHost dom props', () => {
  const src = readFileSync(join(__dirname, 'SharedUiHost.tsx'), 'utf8');
  const dom = src.slice(src.indexOf('const dom = useMemo('), src.indexOf('return (', src.indexOf('const dom = useMemo(')));

  it('sets inline media playback and user-action requirement explicitly', () => {
    expect(dom).toContain('allowsInlineMediaPlayback: true');
    expect(dom).toContain('mediaPlaybackRequiresUserAction: true');
  });
});
