/**
 * Supabase browser client — lazy singleton.
 *
 * createBrowserClient() requires URL + anon key at call time.
 * We defer creation to first use so build-time SSR prerendering
 * (which has no env vars) never triggers the constructor.
 */

import { createBrowserClient } from '@supabase/ssr';

let _client: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseClient() {
  if (_client) return _client;

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!url || !anon) {
    // During static build or when env vars are missing, return a stub.
    // The real app always has env vars set via .env.local / Vercel dashboard.
    if (typeof window !== 'undefined') {
      console.error(
        '[DillerPro] Missing Supabase environment variables.\n' +
        'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local\n' +
        'See SUPABASE_SETUP.md for instructions.'
      );
    }
    // Return a no-op proxy so the app renders without crashing during build
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ error: { message: 'Not configured' } }),
        signUp: async () => ({ error: { message: 'Not configured' } }),
        signOut: async () => ({}),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        resetPasswordForEmail: async () => ({}),
        getUser: async () => ({ data: { user: null } }),
      },
      from: () => ({
        select: () => ({ maybeSingle: async () => ({ data: null, error: null }), order: () => ({ data: [], error: null }) }),
        upsert: () => Promise.resolve({ error: null }),
        insert: () => Promise.resolve({ error: null }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }),
    } as unknown as ReturnType<typeof createBrowserClient>;
  }

  _client = createBrowserClient(url, anon);
  return _client;
}

/**
 * Browser / Client-Component Supabase proxy.
 * Each property access goes through the lazy getter.
 */
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') return value.bind(client);
    return value;
  },
});
