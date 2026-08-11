/**
 * Bangla-Chain ERP — Next.js Middleware
 *
 * This app manages auth INSIDE /admin/dashboard/page.tsx (LoginPage is
 * rendered conditionally when unauthenticated). So the middleware must NOT
 * block /admin/dashboard.
 *
 * What middleware does here:
 *  - Passes /auth/callback through for OAuth handling
 *  - Lets everything else through (auth is handled client-side in the app)
 */

import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow all requests to pass through.
  // Auth is handled client-side inside /admin/dashboard/page.tsx via
  // supabase.auth.getSession() — no server-side blocking needed.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Only run on auth/callback to handle OAuth code exchange.
     * Everything else passes through freely.
     */
    '/auth/callback',
  ],
};
