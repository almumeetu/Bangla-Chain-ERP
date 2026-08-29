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
    challanId, companyName, srName, deliveryManName, routeName,
    customerName, deliveryDate, orderDate, status,
    shopName, shopSubBrand, totalAmount, grossAmount, commissionAmount,
    extraProfitAmount, items,
    // Fallback single-item fields
    productName, qty, bonusQty, rate, selectedUnitName, returnedQty, damagedQty,
  } = body;

  // Normalize items array
  type EmailItem = {
    productName: string;
    company: string;
    attribute: string;
    qty: number;
    bonusQty: number;
    totalQty: number;
    rate: number;
    totalAmount: number;
    returnedQty: number;
    damagedQty: number;
    selectedUnitName: string;
  };

  const productItems: EmailItem[] = (items && items.length > 0)
    ? items.map(it => ({
        productName: it.productName,
        company: it.company || companyName || '',
        attribute: it.attribute || '',
        qty: it.qty,
        bonusQty: it.bonusQty || 0,
        totalQty: it.totalQty || (it.qty + (it.bonusQty || 0)),
        rate: it.rate,
        totalAmount: it.totalAmount,
        returnedQty: it.returnedQty || 0,
        damagedQty: it.damagedQty || 0,
        selectedUnitName: it.selectedUnitName || 'Pcs',
      }))
    : [{
        productName: productName || 'Product Item',
        company: companyName || '',
        attribute: '',
        qty: qty ?? 1,
        bonusQty: bonusQty || 0,
        totalQty: (qty ?? 1) + (bonusQty || 0),
        rate: rate ?? 0,
        totalAmount: totalAmount || ((qty ?? 1) * (rate ?? 0)),
        returnedQty: returnedQty || 0,
        damagedQty: damagedQty || 0,
        selectedUnitName: selectedUnitName || 'Pcs',
      }];

  // Determine effective company name
  const effectiveCompany = companyName || productItems[0]?.company || 'General Brand';

  // Format Date & Time nicely
  const rawDate = deliveryDate || orderDate || new Date().toISOString();
  const dateObj = new Date(rawDate);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const formattedTime = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const fullDateTimeFormatted = `${formattedDate} • ${formattedTime}`;

  // Totals calculations
  const computedGross = grossAmount ?? productItems.reduce((s, it) => s + (it.qty * it.rate), 0);
  const totalSentUnits = productItems.reduce((s, it) => s + it.qty, 0);
  const totalReturnedUnits = productItems.reduce((s, it) => s + it.returnedQty, 0);
  const totalDamagedUnits = productItems.reduce((s, it) => s + it.damagedQty, 0);
  const totalDamagedValue = productItems.reduce((s, it) => s + (it.damagedQty * it.rate), 0);
  const totalBonusUnits = productItems.reduce((s, it) => s + it.bonusQty, 0);
  const totalItemsCount = productItems.length;

  const statusColor = status === 'Delivered' ? '#10b981' : (status === 'Shipped' ? '#3b82f6' : '#f59e0b');
  const statusBg = status === 'Delivered' ? '#ecfdf5' : (status === 'Shipped' ? '#eff6ff' : '#fffbeb');
  const statusBorder = status === 'Delivered' ? '#a7f3d0' : (status === 'Shipped' ? '#bfdbfe' : '#fde68a');

  const htmlContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Delivery Challan & Invoice #${challanId}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td, th { padding: 0; }
    img { border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 640px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .mobile-stack { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .mobile-hide { display: none !important; }
      .table-scroll { display: block; overflow-x: auto; width: 100%; }
    }
  </style>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: #f1f5f9;">
  <center>
    <!-- Main Excel Sheet Container -->
    <table role="presentation" class="email-container" width="660" border="0" cellpadding="0" cellspacing="0" style="max-width: 660px; width: 100%; background-color: #ffffff; border: 2px solid #334155; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);">
      
      <!-- Top Accent Line -->
      <tr>
        <td height="4" style="background: #1e3a8a;"></td>
      </tr>

      <!-- Sheet Header: Company & Voucher Meta -->
      <tr>
        <td style="background-color: #ffffff; padding: 20px 24px 16px 24px; border-bottom: 2px solid #0f172a;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <!-- Shop Title & Brand -->
              <td valign="top" align="left" style="width: 55%;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.3px;">
                  ${shopName || 'Bangla-Chain ERP'}
                </h1>
                <div style="margin-top: 2px; font-size: 11px; color: #64748b; font-weight: 500;">
                  ${shopSubBrand || 'FMCG Dealer & Distribution Hub'}
                </div>
                <div style="margin-top: 6px;">
                  <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; color: #1e40af;">
                    🏢 Brand: ${effectiveCompany}
                  </span>
                </div>
              </td>
              <!-- Invoice Title & Status -->
              <td valign="top" align="right" style="width: 45%;">
                <div style="font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                  DELIVERY CHALLAN & INVOICE
                </div>
                <div style="font-size: 12px; font-family: monospace; font-weight: 800; color: #475569; margin-top: 3px;">
                  VOUCHER NO: #${challanId}
                </div>
                <div style="margin-top: 6px;">
                  <span style="display: inline-block; background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; font-size: 10px; font-weight: 800; padding: 2px 10px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                    ● ${status || 'DELIVERED'}
                  </span>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Excel Metadata Grid (Customer, Date, SR, Route) -->
      <tr>
        <td style="padding: 16px 24px 12px 24px;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #cbd5e1; background-color: #f8fafc; font-size: 11px;">
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px; width: 22%; background-color: #f1f5f9; font-weight: 700; color: #475569; text-transform: uppercase;">
                Customer / Shop
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px; width: 33%; font-weight: 800; color: #0f172a;">
                ${customerName || 'Walk-In Customer'}
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px; width: 20%; background-color: #f1f5f9; font-weight: 700; color: #475569; text-transform: uppercase;">
                Issue Date
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px; width: 25%; font-weight: 700; color: #0f172a;">
                ${formattedDate}
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; font-weight: 700; color: #475569; text-transform: uppercase;">
                Market / Beat
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: 700; color: #0f172a;">
                ${routeName || 'General Route'}
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; font-weight: 700; color: #475569; text-transform: uppercase;">
                Issue Time
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: 700; color: #0f172a;">
                ${formattedTime}
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; font-weight: 700; color: #475569; text-transform: uppercase;">
                Sales Officer (SR)
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: 700; color: #0f172a;">
                ${srName || 'N/A'}
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; font-weight: 700; color: #475569; text-transform: uppercase;">
                Delivery Agent
              </td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: 700; color: #0f172a;">
                ${deliveryManName || 'N/A'}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Excel Product Items Grid -->
      <tr>
        <td style="padding: 6px 24px 16px 24px;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #334155; width: 100%;">
            
            <!-- Table Header Row -->
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th align="center" style="border: 1px solid #334155; padding: 9px 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; width: 6%;">SL</th>
              <th align="left" style="border: 1px solid #334155; padding: 9px 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; width: 38%;">Product & Specification</th>
              <th align="center" style="border: 1px solid #334155; padding: 9px 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; width: 8%;">Unit</th>
              <th align="center" style="border: 1px solid #334155; padding: 9px 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; width: 9%;">Qty</th>
              <th align="center" style="border: 1px solid #334155; padding: 9px 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; width: 8%;">Bonus</th>
              <th align="center" style="border: 1px solid #334155; padding: 9px 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; width: 9%;">Total Qty</th>
              <th align="right" style="border: 1px solid #334155; padding: 9px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; width: 11%;">Rate (৳)</th>
              <th align="right" style="border: 1px solid #334155; padding: 9px 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; width: 13%;">Amount (৳)</th>
            </tr>

            <!-- Line Item Rows -->
            ${productItems.map((item, idx) => {
              const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
              const isZeroQtyDamage = item.qty === 0 && item.damagedQty > 0;
              return `
              <tr style="background-color: ${rowBg};">
                <td align="center" style="border: 1px solid #cbd5e1; padding: 8px 4px; font-size: 11px; font-family: monospace; font-weight: 700; color: #64748b;">
                  ${idx + 1}
                </td>
                <td align="left" style="border: 1px solid #cbd5e1; padding: 8px 8px;">
                  <div style="font-size: 12px; font-weight: 800; color: #0f172a;">
                    ${item.productName}
                  </div>
                  <div style="font-size: 10px; color: #64748b; margin-top: 1px;">
                    ${item.company ? `<span style="font-weight: 600; color: #2563eb;">${item.company}</span>` : ''}
                    ${item.attribute && item.attribute !== 'None' && item.attribute !== 'Default' ? ` • ${item.attribute}` : ''}
                  </div>
                  ${isZeroQtyDamage ? `
                    <div style="font-size: 10px; color: #dc2626; font-weight: 700; margin-top: 2px;">
                      ⚠️ Damage Record: ${item.damagedQty} pcs (Claim: ৳${(item.damagedQty * item.rate).toFixed(2)})
                    </div>` : ''}
                </td>
                <td align="center" style="border: 1px solid #cbd5e1; padding: 8px 4px; font-size: 11px; font-weight: 600; color: #475569;">
                  ${item.selectedUnitName || 'Pcs'}
                </td>
                <td align="center" style="border: 1px solid #cbd5e1; padding: 8px 4px; font-size: 11px; font-family: monospace; font-weight: 800; color: #0f172a;">
                  ${item.qty}
                  ${(!isZeroQtyDamage && item.returnedQty > 0) ? `<div style="font-size: 9px; color: #d97706; font-weight: 700;">-${item.returnedQty} ret</div>` : ''}
                  ${(!isZeroQtyDamage && item.damagedQty > 0) ? `<div style="font-size: 9px; color: #dc2626; font-weight: 700;">-${item.damagedQty} dmg</div>` : ''}
                </td>
                <td align="center" style="border: 1px solid #cbd5e1; padding: 8px 4px; font-size: 11px; font-family: monospace; font-weight: 700; color: ${item.bonusQty > 0 ? '#059669' : '#94a3b8'};">
                  ${item.bonusQty > 0 ? `+${item.bonusQty}` : '0'}
                </td>
                <td align="center" style="border: 1px solid #cbd5e1; padding: 8px 4px; font-size: 11px; font-family: monospace; font-weight: 800; color: #0f172a;">
                  ${item.totalQty || (item.qty + (item.bonusQty || 0))}
                </td>
                <td align="right" style="border: 1px solid #cbd5e1; padding: 8px 6px; font-size: 11px; font-family: monospace; font-weight: 600; color: #334155;">
                  ${Number(item.rate).toFixed(2)}
                </td>
                <td align="right" style="border: 1px solid #cbd5e1; padding: 8px 8px; font-size: 11px; font-family: monospace; font-weight: 800; color: ${item.totalAmount < 0 ? '#dc2626' : '#0f172a'};">
                  ${item.totalAmount < 0 ? `-৳${Math.abs(Number(item.totalAmount)).toFixed(2)}` : `৳${Number(item.totalAmount).toFixed(2)}`}
                </td>
              </tr>
            `;}).join('')}

            <!-- Summary Row 1: Quantity & Subtotal -->
            <tr style="background-color: #f1f5f9; font-weight: 800;">
              <td colspan="3" align="right" style="border: 1px solid #cbd5e1; padding: 8px 8px; font-size: 11px; text-transform: uppercase; color: #334155;">
                Total / সর্বমোট সংখ্যা:
              </td>
              <td align="center" style="border: 1px solid #cbd5e1; padding: 8px 4px; font-size: 11px; font-family: monospace; color: #0f172a;">
                ${totalSentUnits}
              </td>
              <td align="center" style="border: 1px solid #cbd5e1; padding: 8px 4px; font-size: 11px; font-family: monospace; color: #059669;">
                +${totalBonusUnits}
              </td>
              <td align="center" style="border: 1px solid #cbd5e1; padding: 8px 4px; font-size: 11px; font-family: monospace; color: #0f172a;">
                ${totalSentUnits + totalBonusUnits}
              </td>
              <td align="right" style="border: 1px solid #cbd5e1; padding: 8px 6px; font-size: 10px; text-transform: uppercase; color: #475569;">
                Gross Total:
              </td>
              <td align="right" style="border: 1px solid #cbd5e1; padding: 8px 8px; font-size: 11px; font-family: monospace; font-weight: 800; color: #0f172a;">
                ৳${Number(computedGross).toFixed(2)}
              </td>
            </tr>

            <!-- Summary Row 2: Commission (if any) -->
            ${(commissionAmount && commissionAmount > 0) ? `
            <tr style="background-color: #ffffff;">
              <td colspan="7" align="right" style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; font-weight: 600; color: #4338ca;">
                Special Trade Discount / Commission (কমিশন / ছাড়):
              </td>
              <td align="right" style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; font-family: monospace; font-weight: 800; color: #4338ca;">
                - ৳${Number(commissionAmount).toFixed(2)}
              </td>
            </tr>` : ''}

            <!-- Summary Row 3: Returns & Damages (if any) -->
            ${(totalDamagedValue > 0 || totalReturnedUnits > 0) ? `
            <tr style="background-color: #ffffff;">
              <td colspan="7" align="right" style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; font-weight: 600; color: #dc2626;">
                Market Damage & Return Adjustment (ড্যামেজ ও ফেরত সমন্বয়: ${totalReturnedUnits} ret, ${totalDamagedUnits} dmg):
              </td>
              <td align="right" style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; font-family: monospace; font-weight: 800; color: #dc2626;">
                - ৳${Number(totalDamagedValue).toFixed(2)}
              </td>
            </tr>` : ''}

            <!-- Summary Row 4: Extra Profit (if any) -->
            ${(extraProfitAmount && extraProfitAmount > 0) ? `
            <tr style="background-color: #ffffff;">
              <td colspan="7" align="right" style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; font-weight: 600; color: #047857;">
                Additional Value Add (অতিরিক্ত লাভ):
              </td>
              <td align="right" style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; font-family: monospace; font-weight: 800; color: #047857;">
                + ৳${Number(extraProfitAmount).toFixed(2)}
              </td>
            </tr>` : ''}

            <!-- Summary Final Row: Net Total Payable -->
            <tr style="background-color: #0f172a; color: #ffffff;">
              <td colspan="6" align="right" style="border: 1px solid #0f172a; padding: 10px 12px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #e2e8f0;">
                NET TOTAL PAYABLE / সর্বমোট প্রদেয় বিল:
              </td>
              <td colspan="2" align="right" style="border: 1px solid #0f172a; padding: 10px 12px; font-size: 14px; font-weight: 900; font-family: monospace; color: #34d399;">
                ৳${Number(totalAmount).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style="font-size: 10px; color: #93c5fd;">BDT</span>
              </td>
            </tr>

          </table>
        </td>
      </tr>

      <!-- Authorization / Signatures Grid -->
      <tr>
        <td style="padding: 24px 24px 16px 24px;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="width: 30%; font-size: 10px; color: #64748b; border-top: 1px dashed #94a3b8; padding-top: 6px;">
                Prepared By (SR)
              </td>
              <td style="width: 5%;">&nbsp;</td>
              <td align="center" style="width: 30%; font-size: 10px; color: #64748b; border-top: 1px dashed #94a3b8; padding-top: 6px;">
                Delivered By (DSR)
              </td>
              <td style="width: 5%;">&nbsp;</td>
              <td align="center" style="width: 30%; font-size: 10px; color: #64748b; border-top: 1px dashed #94a3b8; padding-top: 6px;">
                Received By (Customer)
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Excel Sheet Footer -->
      <tr>
        <td style="background-color: #f8fafc; border-top: 1px solid #cbd5e1; padding: 10px 24px; text-align: center;">
          <span style="font-size: 10px; color: #94a3b8; font-family: monospace;">
            Bangla-Chain ERP Distribution Voucher • Ref: #${challanId} • Auto-generated on ${fullDateTimeFormatted}
          </span>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`;

  // ── 7. Send via Resend ────────────────────────────────────────────────────
  try {
    const emailSubject = `Delivery Challan #${challanId} [${effectiveCompany}] - ${customerName || 'Customer Invoice'}`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `Bangla Chain ERP <${senderEmail}>`,
        to: [recipientEmail],
        subject: emailSubject,
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
