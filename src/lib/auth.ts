'use client';

/**
 * Bangla-Chain ERP — Supabase Auth Helpers
 *
 * All auth operations for the ERP system.
 * Uses Supabase Auth (email/password for admin).
 *
 * OAuth Endpoints (for third-party integrations):
 *  Authorization: https://rcxkszqimhxzcbiehbvx.supabase.co/auth/v1/authorize
 *  Token:         https://rcxkszqimhxzcbiehbvx.supabase.co/auth/v1/token
 *  JWKS:          https://rcxkszqimhxzcbiehbvx.supabase.co/auth/v1/.well-known/jwks.json
 *  OIDC:          https://rcxkszqimhxzcbiehbvx.supabase.co/auth/v1/.well-known/openid-configuration
 */

import { supabase } from './supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

// ── Sign Up (Admin Registration) ──────────────────────────────────────────────

/**
 * Register a new admin user with email + password.
 * After signup, Supabase sends a confirmation email.
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

// ── Sign In ────────────────────────────────────────────────────────────────────

/**
 * Sign in an existing admin with email + password.
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

// ── Sign In with Google (OAuth) ────────────────────────────────────────────────

/**
 * Sign in with Google OAuth.
 * Redirect happens automatically.
 */
export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { error };
}

// ── Sign Out ───────────────────────────────────────────────────────────────────

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// ── Get Current User ───────────────────────────────────────────────────────────

/**
 * Get the currently logged-in user.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Get the current session.
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ── Reset Password ─────────────────────────────────────────────────────────────

/**
 * Send a password reset email.
 */
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  return { error };
}

// ── Update Password ────────────────────────────────────────────────────────────

/**
 * Update the user's password (after reset flow).
 */
export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error };
}

// ── Auth State Change Listener ─────────────────────────────────────────────────

/**
 * Subscribe to auth state changes.
 * Call the returned unsubscribe() function to cleanup.
 *
 * @example
 * const unsubscribe = onAuthStateChange((user) => {
 *   if (user) console.log('Logged in:', user.email);
 *   else console.log('Logged out');
 * });
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}
