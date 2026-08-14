import { NextResponse } from 'next/server';

/**
 * Next.js Route Handler for sending invoice emails via Resend REST API
 * 
 * Required Environment Variables in .env.local:
 * - RESEND_API_KEY: The API token obtained from https://resend.com
 * - SENDER_EMAIL: Optional, defaults to "onboarding@resend.dev"
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      challanId,
      customerName,
      customerEmail,
      productName,
      qty,
      bonusQty,
      totalQty,
      rate,
      totalAmount,
      deliveryDate,
      shopName,
      shopSubBrand,
      selectedUnitName,
      returnedQty = 0,
      damagedQty = 0,
    } = body;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[Email] RESEND_API_KEY environment variable is not defined.');
      return NextResponse.json(
        { error: 'Mail server credentials are not configured.' },
        { status: 500 }
      );
    }

    const recipientEmail = process.env.RESEND_TO_EMAIL || customerEmail;
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email address is required.' },
        { status: 400 }
      );
    }

    const senderEmail = process.env.RESEND_FROM_EMAIL || process.env.SENDER_EMAIL || 'onboarding@resend.dev';

    // Format quantities
    const formattedQty = `${qty} ${selectedUnitName || 'Pcs'}`;
    const formattedBonus = bonusQty > 0 ? `${bonusQty} Pcs` : 'None';

    const deliveryFormatted = deliveryDate 
      ? new Date(deliveryDate).toLocaleDateString('en-US', { dateStyle: 'medium' }) 
      : new Date().toLocaleDateString('en-US', { dateStyle: 'medium' });

    // Premium bilingual HTML Template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${shopName || 'Samir Enterprise'}</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #fafbfc; margin: 0; padding: 20px; color: #2d3748; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
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
    .table-container { margin-bottom: 28px; }
    .invoice-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .invoice-table th { background: #f1f5f9; color: #475569; font-weight: 700; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; }
    .invoice-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
    .invoice-table tr:last-child td { border-bottom: none; }
    .invoice-table .num-cell { text-align: right; }
    .invoice-table th.num-cell { text-align: right; }
    .total-section { border-top: 2px solid #0f172a; padding-top: 16px; display: table; width: 100%; font-size: 14px; }
    .total-row { display: table-row; }
    .total-cell { display: table-cell; padding: 4px 0; }
    .total-label { font-weight: 800; color: #0f172a; }
    .total-value { font-size: 16px; font-weight: 900; color: #0f172a; text-align: right; }
    .returns-banner { background-color: #fffbeb; border: 1px solid #fef3c7; color: #b45309; padding: 12px 16px; font-size: 12px; font-weight: 600; margin-bottom: 28px; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-text { font-size: 11px; color: #94a3b8; margin: 0 0 8px 0; line-height: 1.5; font-weight: 500; }
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

      <div class="table-container">
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
            ${bonusQty > 0 ? `
            <tr>
              <td style="color: #64748b; font-style: italic;">└ Free Bonus Items</td>
              <td class="num-cell" style="color: #64748b;">${formattedBonus}</td>
              <td class="num-cell" style="color: #64748b;">৳0</td>
              <td class="num-cell" style="color: #64748b;">৳0.00</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
      </div>

      ${(returnedQty > 0 || damagedQty > 0) ? `
      <div class="returns-banner">
        ⚠️ Returns/Damages processed: 
        ${returnedQty > 0 ? `${returnedQty} Returned ` : ''} 
        ${damagedQty > 0 ? `${damagedQty} Damaged ` : ''} 
      </div>
      ` : ''}

      <div class="total-section">
        <div class="total-row">
          <div class="total-cell total-label">Grand Total / সর্বমোট মূল্য</div>
          <div class="total-cell total-value">৳${Number(totalAmount).toFixed(2)} BDT</div>
        </div>
      </div>
    </div>
    <div class="footer">
      <p class="footer-text">
        This is an automated delivery receipt issued by Bangla Chain ERP on behalf of ${shopName || 'Samir Enterprise'}. Please do not reply directly to this mail.
      </p>
      <p class="footer-thankyou">Thank you for your business! / ধন্যবাদ!</p>
    </div>
  </div>
</body>
</html>
    `;

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
        { error: data.message || 'Resend API failed to process mail request.' },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error('[Email API] Unhandled error sending invoice email:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error processing invoice email.' },
      { status: 500 }
    );
  }
}
