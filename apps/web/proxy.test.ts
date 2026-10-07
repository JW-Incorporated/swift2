import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { API_VERSION } from '@swift2/shared';
import { proxy } from './proxy';

describe('proxy x-api-version header', () => {
  it('is set on /api/* responses', () => {
    const res = proxy(new NextRequest('http://localhost/api/mood'));
    expect(res.headers.get('x-api-version')).toBe(String(API_VERSION));
  });

  it('is not set on page responses', () => {
    const res = proxy(new NextRequest('http://localhost/'));
    expect(res.headers.get('x-api-version')).toBeNull();
  });

  it('still sets the CSP header', () => {
    const res = proxy(new NextRequest('http://localhost/api/mood'));
    expect(res.headers.get('Content-Security-Policy')).toBeTruthy();
  });
});
