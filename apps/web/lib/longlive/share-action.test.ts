import { describe, expect, it, vi } from 'vitest';
import { triggerImageShare, triggerWebShare } from './share-action';

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
  it('falls back to a manual share link when copying is rejected', async () => {
    const copyText = vi.fn().mockRejectedValue(new Error('clipboard permission denied'));

    await expect(triggerWebShare(payload, { copyText })).resolves.toBe('unavailable');
    expect(copyText).toHaveBeenCalledWith(payload.url);
  });
});

describe('triggerImageShare', () => {
  const file = new File([new Uint8Array([137, 80, 78, 71])], 'long-live-story.png', {
    type: 'image/png',
  });
  const caption = { title: payload.title, text: `${payload.text} ${payload.url}` };

  it('shares the PNG as a file when the platform can share files', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const download = vi.fn();
    const canShareFiles = vi.fn().mockReturnValue(true);

    await expect(
      triggerImageShare(file, caption, { canShareFiles, share, download }),
    ).resolves.toBe('native');
    expect(canShareFiles).toHaveBeenCalledWith({ files: [file] });
    expect(share).toHaveBeenCalledWith({ files: [file], ...caption });
    expect(download).not.toHaveBeenCalled();
  });

  it('keeps the link out of the url field so targets never drop the file', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    await triggerImageShare(file, caption, { canShareFiles: () => true, share });
    expect(share.mock.calls[0][0]).not.toHaveProperty('url');
    expect(share.mock.calls[0][0].text).toContain(payload.url);
  });

  it('downloads when the platform cannot share files (desktop)', async () => {
    const share = vi.fn();
    const download = vi.fn();

    await expect(
      triggerImageShare(file, caption, { canShareFiles: () => false, share, download }),
    ).resolves.toBe('downloaded');
    expect(share).not.toHaveBeenCalled();
    expect(download).toHaveBeenCalledWith(file);
  });

  it('downloads when canShare does not exist at all', async () => {
    const download = vi.fn();
    await expect(triggerImageShare(file, caption, { share: vi.fn(), download })).resolves.toBe(
      'downloaded',
    );
  });

  it('treats a dismissed picker as cancelled, without also downloading', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('dismissed', 'AbortError'));
    const download = vi.fn();

    await expect(
      triggerImageShare(file, caption, { canShareFiles: () => true, share, download }),
    ).resolves.toBe('cancelled');
    expect(download).not.toHaveBeenCalled();
  });

  it('still saves the image when the native share fails for another reason', async () => {
    const share = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    const download = vi.fn();

    await expect(
      triggerImageShare(file, caption, { canShareFiles: () => true, share, download }),
    ).resolves.toBe('downloaded');
    expect(download).toHaveBeenCalledWith(file);
  });

  it('reports unavailable when neither sharing nor downloading can happen', async () => {
    await expect(triggerImageShare(file, caption, {})).resolves.toBe('unavailable');
    const download = vi.fn(() => {
      throw new Error('blocked');
    });
    await expect(triggerImageShare(file, caption, { download })).resolves.toBe('unavailable');
  });
});
