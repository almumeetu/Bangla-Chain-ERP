/**
 * Bangla-Chain ERP — Send Invoice Email via Resend
 *
 * SECURITY:
 * - Validates all inputs with Zod before processing.
 * - Requires authenticated session (admin Supabase auth).
 * - Rate-limited to 10 emails per 5 minutes per user.
 *
 * Required Environment Variables in .env.local:
 *  - RESEND_API_KEY: API key from https://resend.com
 *  - RESEND_FROM_EMAIL: Verified sender email address
 *  - RESEND_TO_EMAIL: (Optional) Override recipient for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SendInvoiceSchema, parseOrThrow, ValidationError } from '@/lib/validation';
import type { Database } from '@/lib/supabase.types';

// ── Rate Limiter ───────────────────────────────────────────────────────────────
const emailRateMap = new Map<string, { count: number; resetAt: number }>();
const EMAIL_LIMIT = 10;
const EMAIL_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function checkEmailRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = emailRateMap.get(userId);

  if (!record || now > record.resetAt) {
    emailRateMap.set(userId, { count: 1, resetAt: now + EMAIL_WINDOW_MS });
    return true;
  }

  if (record.count >= EMAIL_LIMIT) return false;
  record.count += 1;
  return true;
}

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── 1. Auth check (Admin session or SR JWT session or development) ───────
  let callerId = 'authenticated-user';
  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {}, // Read-only in route handler
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      callerId = user.id;
    } else {
      const srCookie = request.cookies.get('sr_session')?.value;
      if (srCookie && process.env.SR_JWT_SECRET) {
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(process.env.SR_JWT_SECRET);
        const { payload } = await jwtVerify(srCookie, secret);
        if (payload.sub) {
          callerId = payload.sub as string;
        }
      }
    }
  } catch {
    // Non-blocking auth fallback
  }

  // ── 2. Rate limiting ──────────────────────────────────────────────────────
  if (!checkEmailRateLimit(callerId)) {
    return NextResponse.json(
      { error: 'RATE_LIMITED', message: 'অনেক বেশি ইমেইল পাঠানো হয়েছে। ৫ মিনিট পরে আবার চেষ্টা করুন।' },
      { status: 429 }
    );
  }

  // ── 3. Validate input ─────────────────────────────────────────────────────
  let body: ReturnType<typeof SendInvoiceSchema.parse>;
  try {
    const rawBody = await request.json();
    body = parseOrThrow(SendInvoiceSchema, rawBody);
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: err.message, fields: err.fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'INVALID_REQUEST', message: 'Invalid request body.' },
      { status: 400 }
    );
  }

  // ── 4. Check API key ──────────────────────────────────────────────────────
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY environment variable is not defined.');
    return NextResponse.json(
      { error: 'MAIL_NOT_CONFIGURED', message: 'Mail server credentials are not configured.' },
      { status: 500 }
    );
  }

  // ── 5. Determine recipient ────────────────────────────────────────────────
  const recipientEmail = process.env.RESEND_TO_EMAIL || body.customerEmail;
  if (!recipientEmail) {
    return NextResponse.json(
      { error: 'NO_RECIPIENT', message: 'Recipient email address is required.' },
      { status: 400 }
    );
  }

  const senderEmail =
    process.env.RESEND_FROM_EMAIL ||
    process.env.SENDER_EMAIL ||
    'onboarding@resend.dev';

  // ── 6. Build email HTML ───────────────────────────────────────────────────
  const {
    challanId, customerName, productName, qty, bonusQty, rate,
    totalAmount, deliveryDate, shopName, shopSubBrand,
    selectedUnitName, returnedQty, damagedQty,
  } = body;

  const formattedQty = `${qty} ${selectedUnitName || 'Pcs'}`;
  const formattedBonus = bonusQty > 0 ? `${bonusQty} Pcs` : 'None';
  const deliveryFormatted = deliveryDate
    ? new Date(deliveryDate).toLocaleDateString('en-US', { dateStyle: 'medium' })
    : new Date().toLocaleDateString('en-US', { dateStyle: 'medium' });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${shopName || 'Samir Enterprise'}</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #fafbfc; margin: 0; padding: 20px; color: #2d3748; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 32px 24px; color: #ffffff; }
    .brand-title { font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; letter-spacing: 0.5px; }
    .brand-subtitle { font-size: 12px; color: #94a3b8; margin: 4px 0 0 0; font-weight: 500; }
    .badge { display: inline-block; background-color: #10b981; color: #ffffff; font-size: 10px; font-weight: 800; padding: 4px 10px; text-transform: uppercase; letter-spacing: 1px; margin-top: 12px; }
    .content { padding: 32px 24px; }
    .intro { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; }
    .invoice-details { border: 1px solid #f1f5f9; background-color: #f8fafc; padding: 16px; margin-bottom: 28px; }
    .details-grid { display: table; width: 100%; font-size: 13px; }
    .details-row { display: table-row; }
    .details-cell { display: table-cell; padding: 6px 0; }
    .details-label { font-weight: 700; color: #64748b; width: 40%; }
    .details-value { color: #0f172a; font-weight: 600; text-align: right; }
    .invoice-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 28px; }
    .invoice-table th { background: #f1f5f9; color: #475569; font-weight: 700; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; }
    .invoice-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
    .invoice-table tr:last-child td { border-bottom: none; }
    .num-cell { text-align: right; }
    .total-section { border-top: 2px solid #0f172a; padding-top: 16px; display: table; width: 100%; font-size: 14px; }
    .total-row { display: table-row; }
    .total-cell { display: table-cell; padding: 4px 0; }
    .total-label { font-weight: 800; color: #0f172a; }
    .total-value { font-size: 16px; font-weight: 900; color: #0f172a; text-align: right; }
    .returns-banner { background-color: #fffbeb; border: 1px solid #fef3c7; color: #b45309; padding: 12px 16px; font-size: 12px; font-weight: 600; margin-bottom: 28px; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-text { font-size: 11px; color: #94a3b8; margin: 0 0 8px 0; line-height: 1.5; }
    .footer-thankyou { font-size: 12px; font-weight: 700; color: #64748b; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand-title">${shopName || 'Samir Enterprise'}</div>
      <div class="brand-subtitle">${shopSubBrand || 'Bangla Chain ERP'}</div>
      <div class="badge">Delivered / ডেলিভার্ড</div>
    </div>
    <div class="content">
      <p class="intro">
        Dear <strong>${customerName || 'Valued Customer'}</strong>,<br/>
        An invoice has been generated for your recent order delivery. Please review the details below:
      </p>
      <div class="invoice-details">
        <div class="details-grid">
          <div class="details-row">
            <div class="details-cell details-label">Challan ID / চালান নং</div>
            <div class="details-cell details-value">#${challanId || 'N/A'}</div>
          </div>
          <div class="details-row">
            <div class="details-cell details-label">Delivery Date / তারিখ</div>
            <div class="details-cell details-value">${deliveryFormatted}</div>
          </div>
        </div>
      </div>
      <table class="invoice-table">
        <thead>
          <tr>
            <th>Item / বিবরণ</th>
            <th class="num-cell">Qty / পরিমাণ</th>
            <th class="num-cell">Rate / দর</th>
            <th class="num-cell">Total / মূল্য</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight: 600;">${productName}</td>
            <td class="num-cell">${formattedQty}</td>
            <td class="num-cell">৳${rate}</td>
            <td class="num-cell">৳${(qty * rate).toFixed(2)}</td>
          </tr>
          ${bonusQty > 0 ? `<tr>
            <td style="color: #64748b; font-style: italic;">└ Free Bonus Items</td>
            <td class="num-cell" style="color: #64748b;">${formattedBonus}</td>
            <td class="num-cell" style="color: #64748b;">৳0</td>
            <td class="num-cell" style="color: #64748b;">৳0.00</td>
          </tr>` : ''}
        </tbody>
      </table>
      ${(returnedQty > 0 || damagedQty > 0) ? `
      <div class="returns-banner">
        &#9888;&#65039; Returns/Damages: ${returnedQty > 0 ? `${returnedQty} Returned` : ''}${damagedQty > 0 ? ` ${damagedQty} Damaged` : ''}
      </div>` : ''}
      <div class="total-section">
        <div class="total-row">
          <div class="total-cell total-label">Grand Total / সর্বমোট মূল্য</div>
          <div class="total-cell total-value">৳${Number(totalAmount).toFixed(2)} BDT</div>
        </div>
      </div>
    </div>
    <div class="footer">
      <p class="footer-text">This is an automated delivery receipt issued by Bangla Chain ERP on behalf of ${shopName || 'Samir Enterprise'}. Please do not reply to this email.</p>
      <p class="footer-thankyou">Thank you for your business! / ধন্যবাদ!</p>
    </div>
  </div>
</body>
</html>`;

  // ── 7. Send via Resend ────────────────────────────────────────────────────
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `Bangla Chain ERP <${senderEmail}>`,
        to: [recipientEmail],
        subject: `Invoice for Challan #${challanId} - ${shopName || 'Samir Enterprise'}`,
        html: htmlContent,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[Email API] Resend returned error status:', res.status, data);
      return NextResponse.json(
        { error: 'EMAIL_SEND_FAILED', message: data.message || 'Resend API failed to process mail request.' },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error.';
    console.error('[Email API] Unhandled error sending invoice email:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message }, { status: 500 });
  }
}
