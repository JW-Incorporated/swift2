import { describe, expect, it } from 'vitest';
import { CURRENT_ERA_ID } from '@swift2/experience';
import { ERA_JUMP_GATE_ATTR, ERA_JUMP_GATE_TIMER } from '@swift2/ui/reader/lib/era-jump-landing';
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
    expect(script).toContain(`},${ERA_JUMP_GATE_MAX_MS});`);
  });

  it('keeps the fallback near EraStream’s own 8 s jump deadline', () => {
    expect(ERA_JUMP_GATE_MAX_MS).toBeLessThanOrEqual(12000);
  });

  function run(stillGatedAtDcl = true) {
    const attrs = new Set<string>();
    const mainAttrs = new Map<string, string>();
    let timer: (() => void) | undefined;
    let dcl: (() => void) | undefined;
    const win: Record<string, unknown> = {};
    const doc = {
      documentElement: {
        setAttribute: (name: string) => attrs.add(name),
        removeAttribute: (name: string) => attrs.delete(name),
        hasAttribute: (name: string) => attrs.has(name),
      },
      getElementById: (id: string) =>
        id === 'main-content'
          ? {
              setAttribute: (n: string, v: string) => mainAttrs.set(n, v),
              removeAttribute: (n: string) => mainAttrs.delete(n),
            }
          : null,
      addEventListener: (type: string, fn: () => void) => {
        if (type === 'DOMContentLoaded') dcl = fn;
      },
    };
    new Function('document', 'window', 'setTimeout', eraJumpGateScript())(doc, win, (fn: () => void) => {
      timer = fn;
      return 42;
    });
    if (!stillGatedAtDcl) attrs.delete(ERA_JUMP_GATE_ATTR);
    dcl?.();
    return { attrs, mainAttrs, win, fireTimer: () => timer?.() };
  }

  it('runs: flags <html>, parks the timer on window, marks <main> busy, clears both at the fallback', () => {
    const r = run();
    expect(r.attrs.has(ERA_JUMP_GATE_ATTR)).toBe(true);
    expect(r.win[ERA_JUMP_GATE_TIMER]).toBe(42);
    expect(r.mainAttrs.get('aria-busy')).toBe('true');
    r.fireTimer();
    expect(r.attrs.has(ERA_JUMP_GATE_ATTR)).toBe(false);
    expect(r.mainAttrs.has('aria-busy')).toBe(false);
  });

  it('does not mark <main> busy if the gate already lifted before DOMContentLoaded', () => {
    expect(run(false).mainAttrs.has('aria-busy')).toBe(false);
  });
});
