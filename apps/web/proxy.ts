import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';
import { API_VERSION } from '@swift2/shared';

import { campaignVisitScope, recordCampaignVisit } from './lib/campaign-visit';
import { contentSecurityPolicy, FRAME_DENY_HEADER, isEmbedPath } from './lib/security-headers.mjs';

export function proxy(request: NextRequest, event?: NextFetchEvent) {
  const embed = isEmbedPath(request.nextUrl.pathname);
  const nonce = btoa(crypto.randomUUID());
  const policy = contentSecurityPolicy({
    nonce,
    dev: process.env.NODE_ENV !== 'production',
    embed,
  }).join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', policy);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', policy);
  if (!embed) response.headers.set(FRAME_DENY_HEADER.key, FRAME_DENY_HEADER.value);
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('x-api-version', String(API_VERSION));
  }
  const visitScope = campaignVisitScope(request.method, request.nextUrl, request.headers);
  if (visitScope) {
    const counted = recordCampaignVisit(visitScope);
    if (event) event.waitUntil(counted);
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
    },
  ],
};