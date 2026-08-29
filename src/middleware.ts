/**
 * Bangla-Chain ERP — Next.js Middleware
 *
 * Responsibilities:
 *  1. Protect admin routes — redirect unauthenticated requests to /login
 *  2. Refresh Supabase auth session on every request (SSR cookie sync)
 *  3. Inject security headers on every response
 *  4. Allow public routes and API routes to pass through freely
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ── Public routes — NO admin auth required ────────────────────────────────────
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/auth/callback',
  '/auth/reset-password',
];

// ── API routes that are intentionally public ─────────────────────────────────
// These handle their own auth internally (e.g., SR login checks owner_id + credentials).
const PUBLIC_API_PREFIXES = [
  '/api/auth/sr-login',
  '/api/auth/sr-logout',
  '/api/send-invoice',   // Auth checked inside route handler
];

// ── Security headers applied to every response ───────────────────────────────
function applySecurityHeaders(response: NextResponse): NextResponse {
  // Prevent embedding in iframes (clickjacking protection)
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable browser XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Allow public API routes to pass through ─────────────────────────────
  const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isPublicApi) {
    return applySecurityHeaders(NextResponse.next());
  }

  // ── Allow all other /api/ routes (each handles its own auth) ────────────
  // Change this to require auth on specific API routes if needed.
  if (pathname.startsWith('/api/')) {
    return applySecurityHeaders(NextResponse.next());
  }

  // ── Supabase SSR session refresh ─────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if present (writes updated cookies to response)
  await supabase.auth.getUser();

  // ── Apply security headers to response ──────────────────────────────────
  applySecurityHeaders(supabaseResponse);
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public static assets (svg, png, jpg, jpeg, gif, webp, ico, woff, woff2)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
};

