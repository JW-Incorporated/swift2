import { describe, expect, it } from 'vitest';
import { deepLinkTarget } from './deepLink';

const LENSES = ['love-story', 'fashion', 'easter-eggs'];

describe('deepLinkTarget', () => {
  it('returns null for a plain visit — the landing page is the front door', () => {
    expect(deepLinkTarget('', LENSES)).toBeNull();
    expect(deepLinkTarget('?utm_source=share', LENSES)).toBeNull();
  });

  it('routes ?item= to the moment overlay', () => {
    expect(deepLinkTarget('?item=vmas-2009', LENSES)).toEqual({ kind: 'item', id: 'vmas-2009' });
  });

  it('routes ?lens= to a known thread', () => {
    expect(deepLinkTarget('?lens=love-story', LENSES)).toEqual({
      kind: 'lens',
      id: 'love-story',
    });
  });

  it('routes ?era= to an era', () => {
    expect(deepLinkTarget('?era=red', LENSES)).toEqual({ kind: 'era', id: 'red' });
  });

  it('prefers item over lens over era when several are present', () => {
    expect(deepLinkTarget('?era=red&lens=fashion&item=x', LENSES)).toEqual({
      kind: 'item',
      id: 'x',
    });
    expect(deepLinkTarget('?era=red&lens=fashion', LENSES)).toEqual({
      kind: 'lens',
      id: 'fashion',
    });
  });

  it('ignores an unknown lens and falls through to era', () => {
    expect(deepLinkTarget('?lens=not-a-thread&era=red', LENSES)).toEqual({
      kind: 'era',
      id: 'red',
    });
    expect(deepLinkTarget('?lens=not-a-thread', LENSES)).toBeNull();
  });
});
