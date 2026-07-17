import { describe, expect, it } from 'vitest';
import { extractYouTubeId, youtubeEmbedUrl } from './youtube';

describe('extractYouTubeId', () => {
  it('extracts ID from youtube.com/watch?v=ID', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from youtu.be/ID', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from youtube.com/embed/ID', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from m.youtube.com/watch?v=ID', () => {
    expect(extractYouTubeId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from music.youtube.com/watch?v=ID', () => {
    expect(extractYouTubeId('https://music.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('tolerates extra query params', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s&list=PLxyz')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-YouTube URLs', () => {
    expect(extractYouTubeId('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull();
  });

  it('returns null for malformed input', () => {
    expect(extractYouTubeId('not a url')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractYouTubeId('')).toBeNull();
  });

  it('returns null for invalid video ID (too short)', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=short')).toBeNull();
  });
});

describe('youtubeEmbedUrl', () => {
  it('returns nocookie embed URL', () => {
    expect(youtubeEmbedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });
});
