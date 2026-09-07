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
