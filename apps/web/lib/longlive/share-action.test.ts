import { describe, expect, it, vi } from 'vitest';
import { triggerWebShare } from './share-action';

const payload = {
  title: 'The interrupted speech — Fearless · Long Live',
  text: 'The interrupted speech (Fearless, September 2009) — A defining public turning point.',
  url: 'https://www.longlivets.com?item=interrupted-speech',
};

describe('triggerWebShare', () => {
  it('opens the native destination picker on the first share tap', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const copyText = vi.fn();

    await expect(triggerWebShare(payload, { share, copyText })).resolves.toBe('native');
    expect(share).toHaveBeenCalledOnce();
    expect(share).toHaveBeenCalledWith(payload);
    expect(copyText).not.toHaveBeenCalled();
  });

  it('immediately copies the canonical link only when native sharing is unavailable', async () => {
    const copyText = vi.fn().mockResolvedValue(undefined);

    await expect(triggerWebShare(payload, { copyText })).resolves.toBe('fallback');
    expect(copyText).toHaveBeenCalledOnce();
    expect(copyText).toHaveBeenCalledWith(payload.url);
  });

  it('does not replace a dismissed native picker with an unexpected copy action', async () => {
    const share = vi.fn().mockRejectedValue(new Error('cancelled'));
    const copyText = vi.fn();

    await expect(triggerWebShare(payload, { share, copyText })).resolves.toBe('cancelled');
    expect(copyText).not.toHaveBeenCalled();
  });

  it('never claims a link was copied when clipboard access is unavailable', async () => {
    await expect(triggerWebShare(payload, {})).resolves.toBe('unavailable');
  });
});
