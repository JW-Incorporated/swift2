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

  it('routes ?song= to a song dossier, carrying the whole composite key', () => {
    expect(deepLinkTarget('?song=red%3A%3A5%3A%3AAll%20Too%20Well', LENSES)).toEqual({
      kind: 'song',
      key: 'red::5::All Too Well',
    });
  });

  it('routes ?guide= to an album track guide', () => {
    expect(deepLinkTarget('?guide=red', LENSES)).toEqual({ kind: 'guide', eraId: 'red' });
  });

  it('routes ?theories= to an era theories guide', () => {
    expect(deepLinkTarget('?theories=red', LENSES)).toEqual({ kind: 'theories', eraId: 'red' });
  });

  it('prefers item > song > guide > theories > lens > era', () => {
    expect(deepLinkTarget('?era=red&lens=fashion&item=x', LENSES)).toEqual({
      kind: 'item',
      id: 'x',
    });
    // song outranks the bare guide it stacks on top of.
    expect(deepLinkTarget('?guide=red&song=red%3A%3A5%3A%3AATW', LENSES)).toEqual({
      kind: 'song',
      key: 'red::5::ATW',
    });
    expect(deepLinkTarget('?era=red&guide=1989', LENSES)).toEqual({ kind: 'guide', eraId: '1989' });
    expect(deepLinkTarget('?era=red&theories=1989', LENSES)).toEqual({
      kind: 'theories',
      eraId: '1989',
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
