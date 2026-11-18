import { describe, expect, it } from 'vitest';
import { CURRENT_ERA_ID } from '@swift2/experience';
import { ERA_JUMP_GATE_ATTR } from '@swift2/ui/reader/lib/era-jump-landing';
import { ERA_JUMP_GATE_MAX_MS, eraJumpGateScript, eraJumpGateTarget } from './era-jump-gate';

describe('eraJumpGateTarget (#6807)', () => {
  it('gates a lone valid, non-current era', () => {
    expect(eraJumpGateTarget({ era: 'debut' })).toBe('debut');
    expect(eraJumpGateTarget({ era: 'folklore', utm_source: 'x' })).toBe('folklore');
  });

  it('does not gate the current era, an unknown era, or no era', () => {
    expect(eraJumpGateTarget({ era: CURRENT_ERA_ID })).toBeNull();
    expect(eraJumpGateTarget({ era: 'nope' })).toBeNull();
    expect(eraJumpGateTarget({ era: ['debut', 'red'] })).toBeNull();
    expect(eraJumpGateTarget({})).toBeNull();
  });

  it.each(['item', 'song', 'guide', 'theories', 'lens', 'mode'])(
    'does not gate when ?%s= is present (it outranks era in deepLinkTarget)',
    (key) => {
      expect(eraJumpGateTarget({ era: 'debut', [key]: 'x' })).toBeNull();
    },
  );
});

describe('eraJumpGateScript', () => {
  it('sets the gate attribute and schedules the fallback reveal', () => {
    const script = eraJumpGateScript();
    expect(script).toContain(`setAttribute('${ERA_JUMP_GATE_ATTR}','')`);
    expect(script).toContain(`removeAttribute('${ERA_JUMP_GATE_ATTR}')},${ERA_JUMP_GATE_MAX_MS})`);
  });

  it('runs: flags <html>, then clears it after the fallback delay', () => {
    const attrs = new Set<string>();
    let timer: (() => void) | undefined;
    const doc = {
      documentElement: {
        setAttribute: (name: string) => attrs.add(name),
        removeAttribute: (name: string) => attrs.delete(name),
      },
    };
    new Function('document', 'setTimeout', eraJumpGateScript())(doc, (fn: () => void) => {
      timer = fn;
    });
    expect(attrs.has(ERA_JUMP_GATE_ATTR)).toBe(true);
    timer?.();
    expect(attrs.has(ERA_JUMP_GATE_ATTR)).toBe(false);
  });
});
