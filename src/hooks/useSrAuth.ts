'use client';

/**
 * Bangla-Chain ERP — useSrAuth Hook
 *
 * Secure SR (Sales Representative) authentication hook.
 *
 * REPLACES the old pattern:
 *   sessionStorage.setItem('srUser', JSON.stringify(sr))  ← INSECURE
 *
 * NEW PATTERN:
 *   - Calls POST /api/auth/sr-login (server-side validation)
 *   - Server returns HttpOnly cookie (sr_session) — invisible to JS
 *   - SR profile (non-sensitive) stored in React state + sessionStorage
 *   - On logout: calls POST /api/auth/sr-logout (clears the cookie)
 *
 * Usage:
 *   const { srUser, isLoading, error, login, logout } = useSrAuth();
 */

import { useState, useEffect, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SrProfile {
  id: string;
  name: string;
  phone: string;
  commission_rate: number;
  assigned_company_ids: string[];
  owner_id: string;
}

interface SrAuthState {
  srUser: SrProfile | null;
  isLoading: boolean;
  isLoggingIn: boolean;
  error: string | null;
}

interface LoginParams {
  username: string;
  password: string;
  owner_id: string;
}

const SESSION_STORAGE_KEY = 'sr_profile';

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useSrAuth() {
  const [state, setState] = useState<SrAuthState>({
    srUser: null,
    isLoading: true,
    isLoggingIn: false,
    error: null,
  });

  // ── Load SR profile from sessionStorage on mount ──────────────────────────
  // This is safe: sessionStorage only contains the non-sensitive profile (name, etc.)
  // The actual session token is stored in a server-set HttpOnly cookie.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const profile = JSON.parse(stored) as SrProfile;
        // Validate required fields exist before trusting stored data
        if (profile?.id && profile?.name && profile?.owner_id) {
          setState((prev) => ({ ...prev, srUser: profile, isLoading: false }));
          return;
        }
      }
    } catch {
      // Malformed data — clear it
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
    setState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(async (params: LoginParams): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoggingIn: true, error: null }));

    try {
      const res = await fetch('/api/auth/sr-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // credentials: 'same-origin' ensures cookies are included/set
        credentials: 'same-origin',
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMessage = data.message || 'লগইন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।';
        setState((prev) => ({
          ...prev,
          isLoggingIn: false,
          error: errorMessage,
          srUser: null,
        }));
        return false;
      }

      // Store non-sensitive profile in sessionStorage for UI access
      // The actual auth token is in the HttpOnly cookie set by the server
      const profile: SrProfile = data.sr;
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(profile));
      } catch {
        // sessionStorage not available (e.g., private browsing) — continue without it
      }

      setState({
        srUser: profile,
        isLoading: false,
        isLoggingIn: false,
        error: null,
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'নেটওয়ার্ক ত্রুটি। ইন্টারনেট সংযোগ পরীক্ষা করুন।';
      setState((prev) => ({
        ...prev,
        isLoggingIn: false,
        error: message,
      }));
      return false;
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(async (): Promise<void> => {
    try {
      // Tell the server to clear the HttpOnly cookie
      await fetch('/api/auth/sr-logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      // Non-fatal: clear local state even if the API call fails
    }

    // Clear local profile storage
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }

    setState({
      srUser: null,
      isLoading: false,
      isLoggingIn: false,
      error: null,
    });
  }, []);

  // ── Clear error ────────────────────────────────────────────────────────────

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    srUser: state.srUser,
    isLoading: state.isLoading,
    isLoggingIn: state.isLoggingIn,
    isAuthenticated: state.srUser !== null,
    error: state.error,
    login,
    logout,
    clearError,
  };
}
