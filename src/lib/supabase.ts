/**
 * Bangla-Chain ERP — Supabase Client
 *
 * Provides three clients:
 *  1. createBrowserClient  → for Client Components (browser)
 *  2. createServerClient   → for Server Components / Route Handlers / Middleware
 *  3. supabase             → singleton for Client Components (convenience export)
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './supabase.types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '❌ Missing Supabase environment variables.\n' +
    'Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
  );
}

/**
 * Client-side Supabase client (singleton).
 * Use this inside Client Components ('use client').
 */
export const supabase = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Factory function — creates a fresh browser client.
 * Useful when you need isolated clients (e.g., tests).
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
