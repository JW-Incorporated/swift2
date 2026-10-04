export interface WebSharePayload {
  title: string;
  text: string;
  url: string;
}

export type WebShareResult = 'native' | 'fallback' | 'unavailable' | 'cancelled';

export interface WebShareEnvironment {
  share?: (data: WebSharePayload) => Promise<void>;
  copyText?: (text: string) => Promise<void>;
}

export type ImageShareResult = 'native' | 'downloaded' | 'cancelled' | 'unavailable';

export interface ImageShareEnvironment {
  /** `navigator.canShare` — absent on browsers with no file sharing at all. */
  canShareFiles?: (data: { files: File[] }) => boolean;
  share?: (data: { files: File[]; title: string; text: string }) => Promise<void>;
  /** Saves the file to the device (an `<a download>` click in the browser). */
  download?: (file: File) => void;
}

/**
 * Share a card PNG as a real file where the platform can (mobile share
 * sheets), otherwise save it. The caption link rides in `text`, never `url`:
 * several targets drop the file when a url is also supplied. Only a dismissed
 * picker (AbortError) is "cancelled"; any other native failure still saves
 * the image so the tap is never a dead end.
 */
export async function triggerImageShare(
  file: File,
  { title, text }: { title: string; text: string },
  { canShareFiles, share, download }: ImageShareEnvironment,
): Promise<ImageShareResult> {
  const data = { files: [file], title, text };
  if (share && canShareFiles?.({ files: data.files })) {
    try {
      await share(data);
      return 'native';
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return 'cancelled';
    }
  }
  if (!download) return 'unavailable';
  try {
    download(file);
    return 'downloaded';
  } catch {
    return 'unavailable';
  }
}

export async function triggerWebShare(
  payload: WebSharePayload,
  { share, copyText }: WebShareEnvironment,
): Promise<WebShareResult> {
  if (share) {
    try {
      await share(payload);
      return 'native';
    } catch {
      return 'cancelled';
    }
  }
  if (!copyText) return 'unavailable';
  try {
    await copyText(payload.url);
    return 'fallback';
  } catch {
    return 'unavailable';
  }
}
