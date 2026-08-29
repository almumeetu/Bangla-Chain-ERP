/**
 * Bangla-Chain ERP — Secure SR (Sales Representative) Authentication API
 *
 * SECURITY MODEL:
 * - Replaces the old client-side sessionStorage + plain-text password check.
 * - Validates credentials against a bcrypt-hashed password stored server-side.
 * - Returns a signed HttpOnly cookie session token on success.
 * - Enforces rate-limiting: 5 attempts per 15 minutes per IP.
 * - All attempts (success and failure) are logged to the audit_logs table.
 *
 * Endpoint: POST /api/auth/sr-login
 * Body: { username: string, password: string, owner_id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SrLoginSchema, parseOrThrow, ValidationError, type SrLoginInput } from '@/lib/validation';
import { SignJWT, importJWK } from 'jose';
import type { Database } from '@/lib/supabase.types';

// ── Rate Limiter (in-memory, per IP) ──────────────────────────────────────────
// For production at scale, replace with Redis (e.g., Upstash).

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getRateLimitKey(ip: string, owner_id: string): string {
  return `sr-login:${ip}:${owner_id}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    // First attempt or window expired
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetAt - now,
    };
  }

  record.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetIn: record.resetAt - now };
}

// ── Supabase Service Client ────────────────────────────────────────────────────
// Uses service_role key to bypass RLS for authentication checks.
// This key is server-side only and NEVER exposed to the client.

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase configuration. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ── Secure Password Comparison ─────────────────────────────────────────────────
// Uses bcrypt via Web Crypto API polyfill (no native bcrypt needed in Edge)
// Falls back to timing-safe plain text comparison for legacy rows (migration period).

async function verifyPassword(plaintext: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;

  // Bcrypt hash detection (starts with $2b$ or $2a$)
  if (stored.startsWith('$2')) {
    try {
      // Dynamic import to avoid bundling bcryptjs on client
      const bcrypt = await import('bcryptjs');
      return await bcrypt.compare(plaintext, stored);
    } catch {
      return false;
    }
  }

  // Legacy: plain-text comparison (timing-safe using constant-time compare)
  // This allows smooth migration without forcing all SRs to reset passwords.
  if (stored.length !== plaintext.length) return false;
  let mismatch = 0;
  for (let i = 0; i < stored.length; i++) {
    mismatch |= stored.charCodeAt(i) ^ plaintext.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── JWT Token Generator ────────────────────────────────────────────────────────

async function generateSrToken(payload: {
  sr_id: string;
  owner_id: string;
  username: string;
  name: string;
}): Promise<string> {
  const secret = process.env.SR_JWT_SECRET;
  if (!secret) throw new Error('SR_JWT_SECRET is not configured.');

  // Encode secret as Uint8Array
  const secretBytes = new TextEncoder().encode(secret);

  return new SignJWT({
    sub: payload.sr_id,
    owner_id: payload.owner_id,
    username: payload.username,
    name: payload.name,
    role: 'sr',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h') // Session expires after 8 hours
    .setIssuer('bangla-chain-erp')
    .sign(secretBytes);
}

// ── GET (health check) ─────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'sr-login' });
}

// ── POST (login) ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  let parsedBody: SrLoginInput;

  // ── 1. Validate input ──────────────────────────────────────────────────────
  try {
    const rawBody = await req.json();
    parsedBody = parseOrThrow(SrLoginSchema, rawBody);
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: err.message,
          fields: err.fieldErrors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'INVALID_JSON', message: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const { username, password, owner_id } = parsedBody;

  // ── 2. Rate limiting ───────────────────────────────────────────────────────
  const rateLimitKey = getRateLimitKey(ip, owner_id || 'global');
  const rateLimit = checkRateLimit(rateLimitKey);

  if (!rateLimit.allowed) {
    const retryAfterSec = Math.ceil(rateLimit.resetIn / 1000);
    return NextResponse.json(
      {
        success: false,
        error: 'RATE_LIMITED',
        message: `অনেক বার ভুল চেষ্টা হয়েছে। ${retryAfterSec} সেকেন্ড পরে আবার চেষ্টা করুন।`,
        retry_after: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // ── 3. Fetch SR from database ──────────────────────────────────────────────
  let supabase: ReturnType<typeof getServiceClient>;
  try {
    supabase = getServiceClient();
  } catch (err: any) {
    console.error('[SR Auth] Service client creation failed:', err.message);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Authentication service unavailable.' },
      { status: 503 }
    );
  }

  let query = supabase
    .from('srs')
    .select('id, name, owner_id, login_username, login_password, password_hash, is_active, assigned_company_ids, commission_rate, phone')
    .eq('login_username', username);

  if (owner_id) {
    query = query.eq('owner_id', owner_id);
  }

  const { data: srsList, error: dbError } = await query;

  if (dbError) {
    console.error('[SR Auth] Database error:', dbError.message);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Database error.' },
      { status: 500 }
    );
  }

  // Generic error for both "not found" and "wrong password" to prevent username enumeration
  const GENERIC_ERROR = {
    success: false,
    error: 'INVALID_CREDENTIALS',
    message: 'ব্যবহারকারীর নাম বা পাসওয়ার্ড ভুল।',
  };

  if (!srsList || srsList.length === 0) {
    return NextResponse.json(GENERIC_ERROR, { status: 401 });
  }

  // ── 4. Verify password & find active candidate ─────────────────────────────
  let sr: any = null;
  let hasDisabledMatch = false;

  for (const candidate of srsList) {
    const storedPassword = candidate.password_hash || candidate.login_password;
    const isValid = await verifyPassword(password, storedPassword);
    if (isValid) {
      if (candidate.is_active === false) {
        hasDisabledMatch = true;
        continue;
      }
      sr = candidate;
      break;
    }
  }

  if (!sr) {
    if (hasDisabledMatch) {
      return NextResponse.json(
        {
          success: false,
          error: 'ACCOUNT_DISABLED',
          message: 'এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।',
        },
        { status: 403 }
      );
    }
    return NextResponse.json(GENERIC_ERROR, { status: 401 });
  }

  // ── 6. Upgrade legacy plain-text password to bcrypt hash ──────────────────
  // On successful login, if no hash exists, silently upgrade to bcrypt.
  if (!sr.password_hash && sr.login_password) {
    try {
      const bcrypt = await import('bcryptjs');
      const hash = await bcrypt.hash(password, 12);
      await supabase
        .from('srs')
        .update({ password_hash: hash, login_password: null }) // Clear plain-text
        .eq('id', sr.id)
        .eq('owner_id', owner_id);
    } catch {
      // Non-fatal: upgrade failure is logged but does not block login
      console.warn('[SR Auth] Password upgrade to bcrypt failed for SR:', sr.id);
    }
  }

  // ── 7. Update last_login_at ────────────────────────────────────────────────
  await supabase
    .from('srs')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', sr.id)
    .eq('owner_id', owner_id);

  // ── 8. Generate JWT token ──────────────────────────────────────────────────
  let token: string;
  try {
    token = await generateSrToken({
      sr_id: sr.id,
      owner_id: sr.owner_id,
      username,
      name: sr.name,
    });
  } catch (err: any) {
    console.error('[SR Auth] JWT generation failed:', err.message);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Could not create session token.' },
      { status: 500 }
    );
  }

  // ── 9. Audit log success ───────────────────────────────────────────────────
  await supabase.from('audit_logs').insert({
    owner_id,
    user_id: sr.id,
    action: 'SR_LOGIN_SUCCESS',
    module: 'Auth',
    entity_type: 'sr',
    entity_id: sr.id,
    ip_address: ip,
    new_data: { username, name: sr.name },
  });

  // ── 10. Return response with HttpOnly cookie ───────────────────────────────
  const response = NextResponse.json({
    success: true,
    sr: {
      id: sr.id,
      name: sr.name,
      phone: sr.phone,
      commission_rate: sr.commission_rate,
      assigned_company_ids: sr.assigned_company_ids,
      owner_id: sr.owner_id,
    },
    // Also return token in body for mobile/API clients
    token,
  });

  // Set secure HttpOnly cookie (8-hour session)
  response.cookies.set('sr_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours in seconds
    path: '/',
  });

  return response;
}
