import { afterEach, describe, expect, it, vi } from 'vitest';
import { postToX, postToInstagram, mimeTypeFor, MAX_X_IMAGES } from './platforms.mjs';

const creds = {
  apiKey: 'ck',
  apiKeySecret: 'cs',
  accessToken: 'tok',
  accessTokenSecret: 'toksec',
};
const MEDIA_BASE_URL = 'https://www.longlivets.com';

// Responses are parsed via res.text() (then best-effort JSON.parse'd) now,
// not res.json() — so every fake response needs a .text(), not a .json().
function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) };
}

function rawResponse(status: number, text: string) {
  return { ok: status >= 200 && status < 300, status, text: async () => text };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mimeTypeFor', () => {
  it('maps common image extensions', () => {
    expect(mimeTypeFor('/eras/red.png')).toBe('image/png');
    expect(mimeTypeFor('/social/thing.jpg')).toBe('image/jpeg');
    expect(mimeTypeFor('/social/thing.JPEG')).toBe('image/jpeg');
    expect(mimeTypeFor('/social/thing.gif')).toBe('image/gif');
  });

  it('falls back to octet-stream for an unknown extension', () => {
    expect(mimeTypeFor('/social/thing.bmp')).toBe('application/octet-stream');
  });
});

describe('postToX', () => {
  it('posts text-only (no media) with no upload calls', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === 'https://api.twitter.com/2/tweets') return jsonResponse(200, { data: { id: '999' } });
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await postToX({ body: 'hello world' }, creds, MEDIA_BASE_URL);

    expect(result).toEqual({ id: '999', url: 'https://x.com/longlivetscom/status/999' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.twitter.com/2/tweets');
    expect(JSON.parse(opts.body)).toEqual({ text: 'hello world' });
    expect(opts.headers.Authorization).toMatch(/^OAuth /);
  });

  it('uploads a single image, then attaches its media_id to the tweet', async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn(async (url: string, opts?: { body: unknown; headers: Record<string, string> }) => {
      calls.push(url);
      if (url === `${MEDIA_BASE_URL}/social/photo.png`) {
        return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
      }
      if (url === 'https://upload.twitter.com/1.1/media/upload.json') {
        expect(opts!.body).toBeInstanceOf(FormData);
        expect(opts!.headers['Content-Type']).toBeUndefined(); // fetch sets multipart boundary itself
        return jsonResponse(200, { media_id_string: 'media-1' });
      }
      if (url === 'https://api.twitter.com/2/tweets') {
        return jsonResponse(200, { data: { id: '42' } });
      }
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await postToX({ body: 'caption', media: ['/social/photo.png'] }, creds, MEDIA_BASE_URL);

    expect(result.id).toBe('42');
    expect(calls).toEqual([
      `${MEDIA_BASE_URL}/social/photo.png`,
      'https://upload.twitter.com/1.1/media/upload.json',
      'https://api.twitter.com/2/tweets',
    ]);
    const tweetCall = fetchMock.mock.calls.find(([u]) => u === 'https://api.twitter.com/2/tweets');
    expect(JSON.parse(tweetCall![1].body)).toEqual({ text: 'caption', media: { media_ids: ['media-1'] } });
  });

  it('uploads multiple images in order and attaches all media_ids', async () => {
    let uploadCount = 0;
    const fetchMock = vi.fn(async (url: string) => {
      if (url.startsWith(MEDIA_BASE_URL)) return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array([9]).buffer };
      if (url === 'https://upload.twitter.com/1.1/media/upload.json') {
        uploadCount++;
        return jsonResponse(200, { media_id_string: `media-${uploadCount}` });
      }
      if (url === 'https://api.twitter.com/2/tweets') return jsonResponse(200, { data: { id: '1' } });
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await postToX({ body: 'x', media: ['/a.png', '/b.png', '/c.png'] }, creds, MEDIA_BASE_URL);

    const tweetCall = fetchMock.mock.calls.find(([u]) => u === 'https://api.twitter.com/2/tweets');
    expect(JSON.parse(tweetCall![1].body).media.media_ids).toEqual(['media-1', 'media-2', 'media-3']);
  });

  it('rejects more than MAX_X_IMAGES without making any network call', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const media = Array.from({ length: MAX_X_IMAGES + 1 }, (_, i) => `/img-${i}.png`);

    await expect(postToX({ body: 'x', media }, creds, MEDIA_BASE_URL)).rejects.toThrow(/at most/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws a readable error when the source image fetch fails, and never reaches the tweet endpoint', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === `${MEDIA_BASE_URL}/missing.png`) return { ok: false, status: 404 };
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(postToX({ body: 'x', media: ['/missing.png'] }, creds, MEDIA_BASE_URL)).rejects.toThrow(/404/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws a readable error when the X upload endpoint rejects the media', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === `${MEDIA_BASE_URL}/bad.png`) return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array([1]).buffer };
      if (url === 'https://upload.twitter.com/1.1/media/upload.json') return jsonResponse(400, { errors: [{ message: 'bad media' }] });
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(postToX({ body: 'x', media: ['/bad.png'] }, creds, MEDIA_BASE_URL)).rejects.toThrow(/bad media/);
  });

  it('throws a readable error when the tweet itself is rejected', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === 'https://api.twitter.com/2/tweets') return jsonResponse(403, { detail: 'duplicate content' });
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(postToX({ body: 'x' }, creds, MEDIA_BASE_URL)).rejects.toThrow(/duplicate content/);
  });

  it('preserves the raw response text when the platform returns non-JSON (e.g. an HTML error page)', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === 'https://api.twitter.com/2/tweets') return rawResponse(503, '<html>Service Unavailable</html>');
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(postToX({ body: 'x' }, creds, MEDIA_BASE_URL)).rejects.toThrow(/Service Unavailable/);
  });

  it('rejects when the upload response is 2xx but has no media_id_string', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === `${MEDIA_BASE_URL}/photo.png`) return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array([1]).buffer };
      if (url === 'https://upload.twitter.com/1.1/media/upload.json') return jsonResponse(200, { processing_info: {} });
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(postToX({ body: 'x', media: ['/photo.png'] }, creds, MEDIA_BASE_URL)).rejects.toThrow(/no media_id_string/);
  });

  it('rejects when the tweet-create response is 2xx but has no data.id', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === 'https://api.twitter.com/2/tweets') return jsonResponse(200, {});
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(postToX({ body: 'x' }, creds, MEDIA_BASE_URL)).rejects.toThrow(/no data\.id/);
  });

  it('marks a transport-level failure at the tweet-create call as ambiguous (do not blindly retry)', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === 'https://api.twitter.com/2/tweets') throw new Error('ECONNRESET');
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    let caught: (Error & { ambiguous?: boolean }) | undefined;
    try {
      await postToX({ body: 'x' }, creds, MEDIA_BASE_URL);
    } catch (err) {
      caught = err as Error & { ambiguous?: boolean };
    }
    expect(caught).toBeDefined();
    expect(caught!.ambiguous).toBe(true);
    expect(caught!.message).toMatch(/ECONNRESET/);
  });

  it('does NOT mark an ordinary (non-2xx response received) failure as ambiguous', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === 'https://api.twitter.com/2/tweets') return jsonResponse(403, { detail: 'duplicate content' });
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    let caught: (Error & { ambiguous?: boolean }) | undefined;
    try {
      await postToX({ body: 'x' }, creds, MEDIA_BASE_URL);
    } catch (err) {
      caught = err as Error & { ambiguous?: boolean };
    }
    expect(caught).toBeDefined();
    expect(caught!.ambiguous).toBeFalsy();
  });

  it('does NOT mark an upload-step (pre-publish) transport failure as ambiguous', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === `${MEDIA_BASE_URL}/photo.png`) return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array([1]).buffer };
      if (url === 'https://upload.twitter.com/1.1/media/upload.json') throw new Error('ECONNRESET');
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    let caught: (Error & { ambiguous?: boolean }) | undefined;
    try {
      await postToX({ body: 'x', media: ['/photo.png'] }, creds, MEDIA_BASE_URL);
    } catch (err) {
      caught = err as Error & { ambiguous?: boolean };
    }
    expect(caught).toBeDefined();
    expect(caught!.ambiguous).toBeFalsy();
  });
});

describe('postToInstagram', () => {
  const igCreds = { igUserId: '123', accessToken: 'igtok' };
  const base = 'https://graph.facebook.com/v25.0/123';

  it('creates a container then publishes it for a single image', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === `${base}/media`) return jsonResponse(200, { id: 'container-1' });
      if (url === `${base}/media_publish`) return jsonResponse(200, { id: 'post-1' });
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await postToInstagram({ body: 'caption', media: ['/eras/red.png'] }, igCreds, MEDIA_BASE_URL);
    expect(result).toEqual({ id: 'post-1', url: 'https://www.instagram.com/longlivetscom/' });
  });

  it('rejects when the container response is 2xx but has no id', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === `${base}/media`) return jsonResponse(200, {});
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(postToInstagram({ body: 'x', media: ['/eras/red.png'] }, igCreds, MEDIA_BASE_URL)).rejects.toThrow(/no id/);
  });

  it('rejects when media_publish is 2xx but has no id', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === `${base}/media`) return jsonResponse(200, { id: 'container-1' });
      if (url === `${base}/media_publish`) return jsonResponse(200, {});
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(postToInstagram({ body: 'x', media: ['/eras/red.png'] }, igCreds, MEDIA_BASE_URL)).rejects.toThrow(/no id/);
  });

  it('marks a transport-level failure at media_publish as ambiguous', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === `${base}/media`) return jsonResponse(200, { id: 'container-1' });
      if (url === `${base}/media_publish`) throw new Error('ETIMEDOUT');
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    let caught: (Error & { ambiguous?: boolean }) | undefined;
    try {
      await postToInstagram({ body: 'x', media: ['/eras/red.png'] }, igCreds, MEDIA_BASE_URL);
    } catch (err) {
      caught = err as Error & { ambiguous?: boolean };
    }
    expect(caught).toBeDefined();
    expect(caught!.ambiguous).toBe(true);
  });

  it('does NOT mark a container-creation (pre-publish) transport failure as ambiguous', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === `${base}/media`) throw new Error('ETIMEDOUT');
      throw new Error(`unexpected fetch to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    let caught: (Error & { ambiguous?: boolean }) | undefined;
    try {
      await postToInstagram({ body: 'x', media: ['/eras/red.png'] }, igCreds, MEDIA_BASE_URL);
    } catch (err) {
      caught = err as Error & { ambiguous?: boolean };
    }
    expect(caught).toBeDefined();
    expect(caught!.ambiguous).toBeFalsy();
  });
});
