export function youtubeIdFromUrl(value: unknown): string | null;

export function videoPresentationErrors(input: {
  sources?: Array<{ source_type?: string; url?: unknown }>;
  video?: { youtubeId?: string };
  videoPresentationException?: unknown;
}): string[];
