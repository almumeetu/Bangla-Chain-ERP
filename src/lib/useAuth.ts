'use client';

/**
 * Bangla-Chain ERP — useAuth Hook
 *
 * React hook for accessing auth state throughout the app.
 * Provides: user, session, loading state, and auth methods.
 *
 * Usage:
 *   const { user, loading, signIn, signOut } = useAuth();
 */

import { useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { signIn as authSignIn, signOut as authSignOut, signUp as authSignUp } from './auth';

interface UseAuthReturn {
  /** Current logged-in user (null if not authenticated) */
  user: User | null;
  /** Current session */
  session: Session | null;
  /** True while checking auth state */
  loading: boolean;
  /** Sign in with email + password */
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Sign up with email + password */
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Sign out */
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await authSignIn(email, password);
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await authSignUp(email, password);
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
  }, []);

  return { user, session, loading, signIn, signUp, signOut };
}
