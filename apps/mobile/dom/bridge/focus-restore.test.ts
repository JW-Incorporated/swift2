// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { withFocusRestore } from './focus-restore';

describe('withFocusRestore', () => {
  it('returns focus to the triggering element after the call resolves', async () => {
    document.body.innerHTML = '<button id="share">Share</button><button id="other">Other</button>';
    const share = document.getElementById('share')!;
    share.focus();
    const result = await withFocusRestore(async () => {
      document.getElementById('other')!.focus();
      return 'done';
    });
    expect(result).toBe('done');
    expect(document.activeElement).toBe(share);
  });

  it('restores focus even when the call rejects, and rethrows', async () => {
    document.body.innerHTML = '<button id="share">Share</button><button id="other">Other</button>';
    const share = document.getElementById('share')!;
    share.focus();
    await expect(
      withFocusRestore(async () => {
        document.getElementById('other')!.focus();
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(document.activeElement).toBe(share);
  });

  it('does not touch focus when the trigger left the document', async () => {
    document.body.innerHTML = '<button id="share">Share</button><button id="other">Other</button>';
    document.getElementById('share')!.focus();
    await withFocusRestore(async () => {
      document.getElementById('share')!.remove();
      document.getElementById('other')!.focus();
    });
    expect(document.activeElement).toBe(document.getElementById('other'));
  });
});
