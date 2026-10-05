import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { newBridgeToken } from '../lib/bridge-token';

const host = readFileSync(new URL('./SharedUiHost.tsx', import.meta.url), 'utf8');

describe('bridge token', () => {
  it('is 32 hex chars and fresh each time', () => {
    const a = newBridgeToken();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(newBridgeToken()).not.toBe(a);
  });

  it('never rides a DOM prop: not in the dom props object, not passed to AppReader/SharedUiTest as a prop', () => {
    const domProps = host.slice(host.indexOf('const dom = {'), host.indexOf('};', host.indexOf('const dom = {')));
    expect(domProps).not.toMatch(/token/i);
    const jsx = host.slice(host.indexOf('<SharedUiTest'));
    expect(jsx).not.toMatch(/\btoken=/);
    expect(jsx).not.toContain('injectedJavaScriptObject');
    expect(host).not.toContain('injectedJavaScriptObject');
  });
});
