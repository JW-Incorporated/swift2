import { afterEach, describe, expect, it, vi } from 'vitest';
import { eraPerfMark, setEraPerfCollector } from './diag-marks';

describe('diag-marks', () => {
  afterEach(() => setEraPerfCollector(null));

  it('is a no-op without a collector', () => {
    expect(() => eraPerfMark('era-scroll')).not.toThrow();
  });

  it('forwards marks to the installed collector and stops after clearing', () => {
    const fn = vi.fn();
    setEraPerfCollector(fn);
    eraPerfMark('era-switch', { eraId: 'tloas' });
    expect(fn).toHaveBeenCalledWith('era-switch', { eraId: 'tloas' });
    setEraPerfCollector(null);
    eraPerfMark('era-scroll');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
