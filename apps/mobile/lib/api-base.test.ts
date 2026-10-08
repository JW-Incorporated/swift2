import { afterEach, describe, expect, it } from 'vitest';
import { apiBaseUrl, DEFAULT_API_BASE_URL } from './api-base';

describe('apiBaseUrl', () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  });

  it('defaults to the canonical production host when unset', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    expect(DEFAULT_API_BASE_URL).toBe('https://www.longlivets.com');
    expect(apiBaseUrl()).toBe('https://www.longlivets.com');
  });

  it('honours the env override', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:3000';
    expect(apiBaseUrl()).toBe('http://localhost:3000');
  });

  it('falls back to the default when the env var is an empty string', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = '';
    expect(apiBaseUrl()).toBe('https://www.longlivets.com');
  });

  it('strips trailing slashes', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://preview.example.test//';
    expect(apiBaseUrl()).toBe('https://preview.example.test');
  });
});
