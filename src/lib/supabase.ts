/**
 * Supabase browser client — lazy singleton.
 *
 * createBrowserClient() requires a URL + anon key at call time.
 * Deferring creation to first use prevents build-time SSR prerendering
 * (which has no env vars) from triggering the constructor.
 */

import { createBrowserClient } from '@supabase/ssr';

// ── Types ─────────────────────────────────────────────────────────────────────

type SupabaseClient = ReturnType<typeof createBrowserClient>;

// ── Stub (returned during SSR / missing env vars) ─────────────────────────────

const NO_OP_STUB: SupabaseClient = {
  auth: {
    getSession:              async () => ({ data: { session: null }, error: null }),
    signInWithPassword:      async () => ({ error: { message: 'Not configured' } }),
    signUp:                  async () => ({ error: { message: 'Not configured' } }),
    signOut:                 async () => ({}),
    onAuthStateChange:       ()       => ({ data: { subscription: { unsubscribe: () => {} } } }),
    resetPasswordForEmail:   async () => ({}),
    getUser:                 async () => ({ data: { user: null } }),
  },
  from: () => ({
    select:  () => ({
      maybeSingle: async () => ({ data: null, error: null }),
      order:       ()       => ({ data: [], error: null }),
    }),
    upsert:  () => Promise.resolve({ error: null }),
    insert:  () => Promise.resolve({ error: null }),
    delete:  () => ({ eq: () => Promise.resolve({ error: null }) }),
  }),
} as unknown as SupabaseClient;

// ── Singleton factory ─────────────────────────────────────────────────────────

let _client: SupabaseClient | null = null;

function resolveClient(): SupabaseClient {
  const isBrowser = typeof window !== 'undefined';
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL        ?? '';
  const anon       = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY   ?? '';
  const isMissing  = !url || !anon;

  if (isMissing) {
    if (isBrowser) {
      console.error(
        '[DillerPro] Missing Supabase environment variables.\n' +
        'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local\n' +
        'See SUPABASE_SETUP.md for instructions.',
      );
    }
    return NO_OP_STUB;
  }

  if (!_client) {
    _client = createBrowserClient(url, anon);
  }

  return _client;
}

// ── Exported proxy ────────────────────────────────────────────────────────────

/**
 * Browser / Client-Component Supabase proxy.
 * All property accesses are forwarded through the lazy `resolveClient()` getter,
 * so the real client is never instantiated during SSR prerendering.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    const client = resolveClient();
    const value  = (client as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
