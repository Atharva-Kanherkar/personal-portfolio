import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  // Clone the request to avoid modifying the original
  const response = NextResponse.next();
  
  // Track the request asynchronously (don't block the response)
  response.headers.set('x-request-start', startTime.toString());
  
  // Add monitoring headers
  response.headers.set('x-monitored', 'true');
  response.headers.set('x-request-id', crypto.randomUUID());
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/monitoring (avoid infinite loops)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/monitoring|_next/static|_next/image|favicon.ico).*)',
  ],
};
