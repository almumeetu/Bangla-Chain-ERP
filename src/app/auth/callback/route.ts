import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Supabase Auth callback handler.
 * Handles the OAuth / magic-link code exchange after Supabase redirects back.
 * Required for Vercel deployment so sessions work correctly on any device.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/admin/dashboard';

  if (code) {
    const cookieStore = request.cookies;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // Cookies are set via response headers below
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the app dashboard after successful auth
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // On error, redirect to home (LoginPage will show)
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
