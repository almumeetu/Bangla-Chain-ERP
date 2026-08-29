/**
 * Bangla-Chain ERP — SR Logout API
 *
 * Endpoint: POST /api/auth/sr-logout
 * Clears the sr_session HttpOnly cookie and logs the event.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';
import type { Database } from '@/lib/supabase.types';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });

  // Clear the session cookie
  response.cookies.set('sr_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  // Optionally audit the logout
  try {
    const token = req.cookies.get('sr_session')?.value;
    if (token && process.env.SR_JWT_SECRET) {
      const secret = new TextEncoder().encode(process.env.SR_JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (url && key && payload.sub && payload.owner_id) {
        const supabase = createClient(url, key, {
          auth: { persistSession: false },
        });

        await supabase.from('audit_logs').insert({
          owner_id: payload.owner_id as string,
          user_id: payload.sub,
          action: 'SR_LOGOUT',
          module: 'Auth',
          entity_type: 'sr',
          entity_id: payload.sub,
          new_data: { name: payload.name },
        });
      }
    }
  } catch {
    // Non-fatal: logout proceeds even if audit fails
  }

  return response;
}
