/**
 * printUtils.ts — shared browser print helpers for Bangla-Chain ERP.
 *
 * All helpers open a new window, write styled HTML, and call window.print().
 * shopName is always read from localStorage so it reflects the live branding.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function getShopName(): string {
  try { return localStorage.getItem('erp_settings')
    ? (JSON.parse(localStorage.getItem('erp_settings')!) as { shopName?: string }).shopName || 'Bangla-Chain ERP'
    : 'Bangla-Chain ERP';
  } catch { return 'Bangla-Chain ERP'; }
}

function getShopSubBrand(): string {
  try {
    return localStorage.getItem('erp_settings')
      ? (JSON.parse(localStorage.getItem('erp_settings')!) as { shopSubBrand?: string }).shopSubBrand || 'FMCG Dealer & Distribution Hub'
      : 'FMCG Dealer & Distribution Hub';
  } catch {
    return 'FMCG Dealer & Distribution Hub';
  }
}

function getOwnerName(): string {
  try {
    return localStorage.getItem('erp_settings')
      ? (JSON.parse(localStorage.getItem('erp_settings')!) as { ownerName?: string }).ownerName || 'Sohanur Rahman Sohan'
      : 'Sohanur Rahman Sohan';
  } catch {
    return 'Sohanur Rahman Sohan';
  }
}

function now(): string {
  return new Date().toLocaleString('en-BD', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function dateOnly(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

/** Write HTML to a popup window and trigger print */
function printHTML(title: string, body: string): void {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { alert('Pop-up blocked — please allow pop-ups for this site.'); return; }
  w.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:system-ui,-apple-system,sans-serif;color:#0f172a;background:#fff;padding:28px 36px;font-size:11.5px;line-height:1.5}
      @media print{body{padding:8mm 10mm}@page{margin:8mm}}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #0f172a}
      .brand h1{font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#0f172a}
      .brand p{font-size:10px;color:#64748b;margin-top:2px}
      .doc-meta{text-align:right}
      .doc-meta .doc-type{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#0f172a}
      .doc-meta .doc-id{font-family:monospace;font-size:11px;color:#475569;margin-top:2px}
      .doc-meta .doc-date{font-size:10px;color:#94a3b8;margin-top:2px}
      .meta-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:8px 16px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:12px 14px;margin-bottom:16px}
      .meta-item .label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#64748b;display:block;margin-bottom:2px}
      .meta-item .value{font-weight:700;color:#0f172a;font-size:11.5px}
      table{width:100%;border-collapse:collapse;margin:14px 0;font-size:10.5px}
      thead tr{background:#0f172a;color:#fff}
      thead th{padding:8px 8px;text-align:left;font-weight:700;font-size:9.5px;text-transform:uppercase;letter-spacing:.4px}
      tbody tr{border-bottom:1px solid #e2e8f0}
      tbody tr:nth-child(even){background:#f8fafc}
      tbody td{padding:7px 8px;color:#334155}
      .text-right{text-align:right}
      .text-center{text-align:center}
      .summary{display:flex;justify-content:flex-end;margin-top:16px}
      .summary table{width:320px;font-size:11px}
      .summary td{padding:5px 8px;border-bottom:1px solid #e2e8f0}
      .summary .total td{border-top:2px solid #0f172a;border-bottom:2px solid #0f172a;font-weight:800;font-size:13px}
      .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:9.5px;font-weight:700;border:1px solid}
      .badge-green{background:#dcfce7;color:#166534;border-color:#86efac}
      .badge-amber{background:#fef9c3;color:#854d0e;border-color:#fde047}
      .badge-red{background:#fee2e2;color:#991b1b;border-color:#fca5a5}
      .badge-blue{background:#dbeafe;color:#1e40af;border-color:#93c5fd}
      .signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:36px;margin-top:48px;page-break-inside:avoid}
      .sig-line{border-top:1px solid #94a3b8;padding-top:6px;text-align:center;font-size:9.5px;color:#64748b}
      .footer{margin-top:24px;padding-top:10px;border-top:1px dashed #cbd5e1;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
      .tag-increase{color:#166534;font-weight:700} .tag-decrease{color:#991b1b;font-weight:700}
    </style>
  </head><body>${body}<script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
}

// ── Types ─────────────────────────────────────────────────────────────────────

import type { ChallanItem, Procurement, ExpenseRecord, StockAdjustment } from '../types';

// ── 1. Challan / Delivery Invoice ─────────────────────────────────────────────

export function printChallanInvoice(items: ChallanItem[]): void {
  if (items.length === 0) return;
  const ch = items[0];
  const shop = getShopName();
  const subBrand = getShopSubBrand();

  const totalGrossQty = items.reduce((sum, item) => sum + (item.qty || 0), 0);
  const totalBonusQty = items.reduce((sum, item) => sum + (item.bonusQty || 0), 0);
  const totalReturned = items.reduce((sum, item) => sum + (item.returnedQty || 0), 0);
  const totalDamaged = items.reduce((sum, item) => sum + (item.damagedQty || 0), 0);
  const totalNetDelivered = items.reduce((sum, item) => sum + Math.max(0, item.qty - (item.returnedQty || 0) - (item.damagedQty || 0)), 0);
  
  const totalGrossAmount = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const totalCommission = items.reduce((sum, item) => sum + (item.commissionAmount || 0), 0);
  const totalExtraProfit = items.reduce((sum, item) => sum + (item.extraProfitAmount || 0), 0);
  const totalNetPayable = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

  const uniqueCompanies = Array.from(new Set(items.map(i => i.company).filter(Boolean)));
  const companyTitle = uniqueCompanies.length > 0 ? uniqueCompanies.join(', ') : 'General Brand';

  // Group items by company
  const companyGroups = new Map<string, ChallanItem[]>();
  items.forEach(item => {
    const co = item.company || 'General Brand';
    if (!companyGroups.has(co)) companyGroups.set(co, []);
    companyGroups.get(co)!.push(item);
  });

  let slNo = 1;
  const tableContent = Array.from(companyGroups.entries()).map(([coName, coItems]) => {
    const showHeader = companyGroups.size > 1;
    const coGrossQty = coItems.reduce((s, it) => s + (it.qty || 0), 0);
    const coBonusQty = coItems.reduce((s, it) => s + (it.bonusQty || 0), 0);
    const coReturned = coItems.reduce((s, it) => s + (it.returnedQty || 0), 0);
    const coDamaged = coItems.reduce((s, it) => s + (it.damagedQty || 0), 0);
    const coNetQty = coItems.reduce((s, it) => s + Math.max(0, it.qty - (it.returnedQty || 0) - (it.damagedQty || 0)), 0);
    const coGrossAmt = coItems.reduce((s, it) => s + (it.qty * it.rate), 0);
    const coNetAmt = coItems.reduce((s, it) => s + (it.totalAmount || 0), 0);

    const rows = coItems.map((item) => {
      const netQty = Math.max(0, item.qty - (item.returnedQty || 0) - (item.damagedQty || 0));
      const itemGross = item.qty * item.rate;
      const hasRet = (item.returnedQty || 0) > 0;
      const hasDmg = (item.damagedQty || 0) > 0;
      return `
        <tr>
          <td class="text-center" style="color:#64748b;font-weight:600">${slNo++}</td>
          <td>
            <b>${item.productName}</b>
            ${item.attribute && item.attribute !== 'None' && item.attribute !== 'Default' ? `<br><span style="font-size:10px;color:#64748b">${item.attribute}</span>` : ''}
            ${hasRet ? `<br><span style="font-size:9.5px;color:#dc2626;font-weight:700">🔄 Returned: ${item.returnedQty} ${item.selectedUnitName || 'Pcs'} (−৳${((item.returnedQty || 0) * item.rate).toFixed(2)})</span>` : ''}
            ${hasDmg ? `<br><span style="font-size:9.5px;color:#d97706;font-weight:700">⚠️ Damaged: ${item.damagedQty} ${item.selectedUnitName || 'Pcs'} (−৳${((item.damagedQty || 0) * item.rate).toFixed(2)})</span>` : ''}
          </td>
          <td class="text-center" style="font-size:10px;color:#475569">${item.selectedUnitName || 'Pcs'}</td>
          <td class="text-center"><b>${item.qty}</b></td>
          <td class="text-center" style="color:#2563eb">${item.bonusQty || 0}</td>
          <td class="text-center" style="color:${hasRet ? '#dc2626' : '#94a3b8'};${hasRet ? 'background:#fef2f2;font-weight:700' : ''}">${hasRet ? `−${item.returnedQty}` : '0'}</td>
          <td class="text-center" style="color:${hasDmg ? '#d97706' : '#94a3b8'};${hasDmg ? 'background:#fffbeb;font-weight:700' : ''}">${hasDmg ? `−${item.damagedQty}` : '0'}</td>
          <td class="text-center" style="background:#f0fdf4;font-weight:800;color:#166534">${netQty}</td>
          <td class="text-right">৳${item.rate.toFixed(0)}</td>
          <td class="text-right" style="color:#64748b">৳${itemGross.toLocaleString('en-BD')}</td>
          <td class="text-right" style="font-weight:800;color:#0f172a">৳${item.totalAmount.toLocaleString('en-BD')}</td>
        </tr>
      `;
    }).join('');

    return `
      ${showHeader ? `
        <tr style="background:#f1f5f9;">
          <td colspan="11" style="padding:6px 10px;font-weight:800;color:#1e40af;font-size:11px;border-top:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;">
            🏢 Company: ${coName} (${coItems.length} Products)
          </td>
        </tr>
      ` : ''}
      ${rows}
      ${showHeader ? `
        <tr style="background:#f8fafc;font-weight:700;border-top:1px solid #cbd5e1;font-size:10.5px;">
          <td colspan="3" style="text-align:right;color:#475569;">Subtotal (${coName}):</td>
          <td class="text-center">${coGrossQty}</td>
          <td class="text-center" style="color:#2563eb">${coBonusQty}</td>
          <td class="text-center" style="color:${coReturned ? '#dc2626' : '#94a3b8'}">${coReturned}</td>
          <td class="text-center" style="color:${coDamaged ? '#dc2626' : '#94a3b8'}">${coDamaged}</td>
          <td class="text-center" style="color:#166534;font-weight:800">${coNetQty}</td>
          <td></td>
          <td class="text-right" style="color:#64748b">৳${coGrossAmt.toLocaleString('en-BD')}</td>
          <td class="text-right" style="color:#1e40af;font-weight:800">৳${coNetAmt.toLocaleString('en-BD')}</td>
        </tr>
      ` : ''}
    `;
  }).join('');

  let voucherNo = ch.id || '';
  if (!voucherNo || voucherNo.includes('_') || voucherNo.includes('T')) {
    const ts = new Date(ch.createdAt).getTime();
    voucherNo = !isNaN(ts) ? `CH-${ts.toString().slice(-6)}` : `CH-${Date.now().toString().slice(-6)}`;
  }

  printHTML(`Delivery Challan & Invoice #${voucherNo}`, `
    <div class="header">
      <div class="brand">
        <h1>${shop}</h1>
        <p>${subBrand}</p>
        <div style="margin-top:6px;">
          <span style="display:inline-block;background:#f1f5f9;border:1px solid #cbd5e1;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;color:#1e40af">
            🏢 Brand: ${companyTitle}
          </span>
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-type">Delivery Challan &amp; Invoice</div>
        <div class="doc-id">Voucher No: <b>#${voucherNo}</b></div>
        <div class="doc-date">Printed: ${now()}</div>
        <div style="margin-top:4px;">
          <span class="badge ${ch.status === 'Delivered' ? 'badge-green' : ch.status === 'Shipped' ? 'badge-blue' : 'badge-amber'}">
            ● ${ch.status || 'Delivered'}
          </span>
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item"><span class="label">Customer / Shop</span><span class="value">${ch.customerName || 'Walk-In Customer'}</span></div>
      <div class="meta-item"><span class="label">Challan Date</span><span class="value">${dateOnly(ch.createdAt)}</span></div>
      <div class="meta-item"><span class="label">Market / Route Beat</span><span class="value">${ch.routeName || 'General Route'}</span></div>
      <div class="meta-item"><span class="label">Delivery Agent</span><span class="value">${ch.deliveryManName || 'N/A'}</span></div>
      <div class="meta-item"><span class="label">Sales Officer (SR)</span><span class="value">${ch.srName || 'N/A'}</span></div>
      <div class="meta-item"><span class="label">Total Item Lines</span><span class="value">${items.length} Product${items.length !== 1 ? 's' : ''}</span></div>
    </div>

    <table>
      <thead><tr>
        <th class="text-center" style="width:25px">#</th>
        <th>Product &amp; Specification</th>
        <th class="text-center">Unit</th>
        <th class="text-center">Order Qty</th>
        <th class="text-center">Bonus</th>
        <th class="text-center">Returned</th>
        <th class="text-center">Damaged</th>
        <th class="text-center">Delivered Qty</th>
        <th class="text-right">Rate (৳)</th>
        <th class="text-right">Gross (৳)</th>
        <th class="text-right">Net Total (৳)</th>
      </tr></thead>
      <tbody>${tableContent}</tbody>
    </table>

    <div class="summary">
      <table style="width:380px;">
        <tr>
          <td>Total Ordered (মোট অর্ডার):</td>
          <td class="text-right"><b>${totalGrossQty} units</b> <span style="color:#64748b;font-size:10px;">(৳${totalGrossAmount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span></td>
        </tr>
        ${totalBonusQty > 0 ? `
        <tr>
          <td>Total Bonus (মোট বোনাস):</td>
          <td class="text-right" style="color:#2563eb">+${totalBonusQty} units <span style="font-size:10px;">(Free)</span></td>
        </tr>` : ''}
        ${totalReturned > 0 ? `
        <tr>
          <td>Total Returned (মোট ফেরত):</td>
          <td class="text-right" style="color:#dc2626">−${totalReturned} units <span style="font-size:10px;">(−৳${(items.reduce((s, it) => s + ((it.returnedQty || 0) * it.rate), 0)).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span></td>
        </tr>` : ''}
        ${totalDamaged > 0 ? `
        <tr>
          <td>Total Damaged (মোট ড্যামেজ):</td>
          <td class="text-right" style="color:#dc2626">−${totalDamaged} units <span style="font-size:10px;">(−৳${(items.reduce((s, it) => s + ((it.damagedQty || 0) * it.rate), 0)).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span></td>
        </tr>` : ''}
        <tr style="background:#f0fdf4;border-top:1px solid #86efac;border-bottom:1px solid #86efac;">
          <td style="color:#166534;font-weight:700;">Net Delivered (প্রকৃত ডেলিভারি):</td>
          <td class="text-right" style="color:#166534;font-weight:800;">
            ${totalNetDelivered} units <span style="font-size:10.5px;">(৳${(items.reduce((s, it) => s + (Math.max(0, it.qty - (it.returnedQty || 0) - (it.damagedQty || 0)) * it.rate), 0)).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
          </td>
        </tr>
        ${totalCommission > 0 ? `
        <tr>
          <td>SR Commission / Discount (কমিশন / ছাড়):</td>
          <td class="text-right" style="color:#dc2626">−৳${totalCommission.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>` : ''}
        ${totalExtraProfit > 0 ? `
        <tr>
          <td>Adjustment / Extra (সমন্বয় / অতিরিক্ত):</td>
          <td class="text-right" style="color:#166534">+৳${totalExtraProfit.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>` : ''}
        <tr class="total">
          <td><b>NET PAYABLE (সর্বমোট প্রদেয় বিল):</b></td>
          <td class="text-right" style="color:#1e3a8a;font-size:14px"><b>৳${totalNetPayable.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></td>
        </tr>
      </table>
    </div>

    <div class="signatures">
      <div class="sig-line">Warehouse / Dispatch In-charge</div>
      <div class="sig-line">Delivery Agent / Carrier</div>
      <div class="sig-line">SR / Customer Acknowledgment</div>
    </div>
    <div class="footer"><span>System: Bangla-Chain ERP (B2B Distribution Management)</span><span>Generated: ${now()}</span></div>
  `);
}

// ── 1b. Challan Bulk Sheet (Company-wise Consolidated) ─────────────────────────

export function printChallanSheet(challans: ChallanItem[]): void {
  const shop = getShopName();
  const subBrand = getShopSubBrand();

  if (challans.length === 0) {
    printHTML('Challan Sheet', `<p style="padding:40px;text-align:center;color:#64748b">No challan records found.</p>`);
    return;
  }

  // 1. Group ALL challans by Company
  const companyGroups = new Map<string, ChallanItem[]>();
  challans.forEach(c => {
    const co = c.company || 'General Brand';
    if (!companyGroups.has(co)) companyGroups.set(co, []);
    companyGroups.get(co)!.push(c);
  });

  const totalCompanies = companyGroups.size;
  const totalItemsCount = challans.length;
  const totalGrossQty = challans.reduce((s, c) => s + (c.qty || 0), 0);
  const totalBonusQty = challans.reduce((s, c) => s + (c.bonusQty || 0), 0);
  const totalReturned = challans.reduce((s, c) => s + (c.returnedQty || 0), 0);
  const totalDamaged = challans.reduce((s, c) => s + (c.damagedQty || 0), 0);
  const totalNetDelivered = challans.reduce((s, c) => s + Math.max(0, c.qty - (c.returnedQty || 0) - (c.damagedQty || 0)), 0);
  const totalGrossAmt = challans.reduce((s, c) => s + (c.qty * c.rate), 0);
  const totalReturnedValue = challans.reduce((s, c) => s + ((c.returnedQty || 0) * c.rate), 0);
  const totalDamagedValue = challans.reduce((s, c) => s + ((c.damagedQty || 0) * c.rate), 0);
  const totalNetDeliveredGross = challans.reduce((s, c) => s + (Math.max(0, c.qty - (c.returnedQty || 0) - (c.damagedQty || 0)) * c.rate), 0);
  const totalNetAmt = challans.reduce((s, c) => s + (c.totalAmount || 0), 0);

  let globalIndex = 1;

  const companySectionsHtml = Array.from(companyGroups.entries()).map(([coName, coItems]) => {
    const coGrossQty = coItems.reduce((s, it) => s + (it.qty || 0), 0);
    const coBonusQty = coItems.reduce((s, it) => s + (it.bonusQty || 0), 0);
    const coReturned = coItems.reduce((s, it) => s + (it.returnedQty || 0), 0);
    const coDamaged = coItems.reduce((s, it) => s + (it.damagedQty || 0), 0);
    const coNetQty = coItems.reduce((s, it) => s + Math.max(0, it.qty - (it.returnedQty || 0) - (it.damagedQty || 0)), 0);
    const coGrossAmt = coItems.reduce((s, it) => s + (it.qty * it.rate), 0);
    const coReturnedVal = coItems.reduce((s, it) => s + ((it.returnedQty || 0) * it.rate), 0);
    const coDamagedVal = coItems.reduce((s, it) => s + ((it.damagedQty || 0) * it.rate), 0);
    const coNetDelivGross = coItems.reduce((s, it) => s + (Math.max(0, it.qty - (it.returnedQty || 0) - (it.damagedQty || 0)) * it.rate), 0);
    const coNetAmt = coItems.reduce((s, it) => s + (it.totalAmount || 0), 0);

    const rows = coItems.map((c) => {
      const netQty = Math.max(0, c.qty - (c.returnedQty || 0) - (c.damagedQty || 0));
      const statusClass = c.status === 'Delivered' ? 'badge-green' : c.status === 'Shipped' ? 'badge-blue' : 'badge-amber';
      return `
        <tr>
          <td class="text-center" style="color:#64748b;font-weight:600">${globalIndex++}</td>
          <td>
            <b>${c.productName}</b>
            ${c.attribute && c.attribute !== 'None' && c.attribute !== 'Default' ? `<br><span style="font-size:10px;color:#64748b">${c.attribute}</span>` : ''}
          </td>
          <td class="text-center">${c.qty}</td>
          <td class="text-center" style="color:#2563eb">${c.bonusQty || 0}</td>
          <td class="text-center" style="color:${c.returnedQty ? '#dc2626' : '#94a3b8'}">${c.returnedQty || 0}</td>
          <td class="text-center" style="color:${c.damagedQty ? '#dc2626' : '#94a3b8'}">${c.damagedQty || 0}</td>
          <td class="text-center" style="background:#f0fdf4;font-weight:800;color:#166534">${netQty}</td>
          <td class="text-right">৳${c.rate.toFixed(0)}</td>
          <td class="text-right" style="color:#64748b">৳${(c.qty * c.rate).toLocaleString('en-BD')}</td>
          <td class="text-right" style="font-weight:800;color:#0f172a">৳${c.totalAmount.toLocaleString('en-BD')}</td>
          <td>${c.srName || '—'}</td>
          <td>${c.routeName || '—'}</td>
          <td class="text-center"><span class="badge ${statusClass}">${c.status}</span></td>
        </tr>
      `;
    }).join('');

    return `
      <div style="margin-top:20px;page-break-inside:avoid;">
        <div style="background:#1e293b;color:#fff;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;border-radius:4px 4px 0 0;">
          <div style="font-size:12px;font-weight:800;letter-spacing:.3px;">
            🏢 Company: <span style="color:#93c5fd">${coName}</span> (${coItems.length} Products)
          </div>
          <div style="font-size:11px;font-weight:700;color:#cbd5e1;">
            Company Total: ৳${coNetAmt.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <table style="margin-top:0;margin-bottom:0;border:1px solid #cbd5e1;border-top:none;">
          <thead>
            <tr style="background:#0f172a;color:#fff;">
              <th class="text-center" style="width:25px">#</th>
              <th>Product &amp; Spec</th>
              <th class="text-center">Qty</th>
              <th class="text-center">Bonus</th>
              <th class="text-center">Returned</th>
              <th class="text-center">Damaged</th>
              <th class="text-center">Delivered</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Gross</th>
              <th class="text-right">Net Total</th>
              <th>SR Name</th>
              <th>Route</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr style="background:#f8fafc;font-weight:700;border-top:2px solid #94a3b8;font-size:10.5px;">
              <td colspan="2" style="text-align:right;color:#334155;">Subtotal (${coName}):</td>
              <td class="text-center">${coGrossQty}</td>
              <td class="text-center" style="color:#2563eb">${coBonusQty}</td>
              <td class="text-center" style="color:${coReturned ? '#dc2626' : '#94a3b8'}">${coReturned}</td>
              <td class="text-center" style="color:${coDamaged ? '#dc2626' : '#94a3b8'}">${coDamaged}</td>
              <td class="text-center" style="color:#166534;font-weight:800">${coNetQty}</td>
              <td></td>
              <td class="text-right" style="color:#64748b">৳${coGrossAmt.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td class="text-right" style="color:#1e40af;font-weight:800">৳${coNetAmt.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td colspan="3"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  printHTML('Company-wise Delivery Challan Sheet', `
    <div class="header">
      <div class="brand">
        <h1>${shop}</h1>
        <p>${subBrand}</p>
      </div>
      <div class="doc-meta">
        <div class="doc-type">Company-wise Delivery Challan Sheet</div>
        <div class="doc-id">${totalCompanies} Companies • ${totalItemsCount} Products</div>
        <div class="doc-date">Printed: ${now()}</div>
      </div>
    </div>

    ${companySectionsHtml}

    <div class="summary" style="margin-top:24px;page-break-inside:avoid;">
      <table style="width:380px;">
        <tr><td>Total Companies:</td><td class="text-right"><b>${totalCompanies}</b></td></tr>
        <tr><td>Total Product Rows:</td><td class="text-right"><b>${totalItemsCount} items</b></td></tr>
        <tr><td>Total Ordered Qty:</td><td class="text-right"><b>${totalGrossQty} units</b> <span style="color:#64748b;font-size:10px;">(৳${totalGrossAmt.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span></td></tr>
        ${totalBonusQty > 0 ? `<tr><td>Total Bonus Qty:</td><td class="text-right" style="color:#2563eb">+${totalBonusQty} units <span style="font-size:10px;">(Free)</span></td></tr>` : ''}
        ${totalReturned > 0 ? `<tr><td>Total Returned:</td><td class="text-right" style="color:#dc2626">−${totalReturned} units <span style="font-size:10px;">(−৳${totalReturnedValue.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span></td></tr>` : ''}
        ${totalDamaged > 0 ? `<tr><td>Total Damaged:</td><td class="text-right" style="color:#dc2626">−${totalDamaged} units <span style="font-size:10px;">(−৳${totalDamagedValue.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span></td></tr>` : ''}
        <tr style="background:#f0fdf4;border-top:1px solid #86efac;border-bottom:1px solid #86efac;">
          <td style="color:#166534;font-weight:700;">Total Net Delivered Qty:</td>
          <td class="text-right" style="color:#166534;font-weight:800;">
            ${totalNetDelivered} units <span style="font-size:10.5px;">(৳${totalNetDeliveredGross.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
          </td>
        </tr>
        <tr class="total"><td><b>GRAND TOTAL AMOUNT:</b></td><td class="text-right" style="color:#1e3a8a;font-size:14px"><b>৳${totalNetAmt.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></td></tr>
      </table>
    </div>

    <div class="signatures">
      <div class="sig-line">Warehouse / Store Manager</div>
      <div class="sig-line">Delivery Supervisor</div>
      <div class="sig-line">Accounts / Audit Verification</div>
    </div>
    <div class="footer"><span>System: Bangla-Chain ERP (Company Consolidated Challan Engine)</span><span>Printed: ${now()}</span></div>
  `);
}

// ── 2. Procurement / Purchase Voucher ─────────────────────────────────────────

export function printProcurementVoucher(proc: Procurement, productNameMap: Record<string, string>): void {
  const shop = getShopName();

  const rows = proc.items.map((item, i) => `
    <tr>
      <td class="text-center">${i + 1}</td>
      <td><b>${productNameMap[item.productId] || item.productName}</b></td>
      <td class="text-center">${item.qty}</td>
      <td class="text-center">${item.bonusQty || 0}</td>
      <td class="text-right">৳${item.purchasePrice.toFixed(2)}</td>
      <td class="text-right">৳${item.mrp.toFixed(2)}</td>
      <td class="text-right"><b>৳${item.totalPrice.toFixed(2)}</b></td>
    </tr>`).join('');

  printHTML(`Procurement ${proc.invoiceRef}`, `
    <div class="header">
      <div class="brand"><h1>${shop}</h1><p>FMCG Dealer &amp; Distributor</p></div>
      <div class="doc-meta">
        <div class="doc-type">Purchase Voucher</div>
        <div class="doc-id">REF: ${proc.invoiceRef}</div>
        <div class="doc-date">Printed: ${now()}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item"><span class="label">Supplier</span><span class="value">${proc.supplierName}</span></div>
      <div class="meta-item"><span class="label">Procurement Title</span><span class="value">${proc.procurementName}</span></div>
      <div class="meta-item"><span class="label">Invoice Date</span><span class="value">${proc.invoiceDate}</span></div>
      <div class="meta-item"><span class="label">Delivery Date</span><span class="value">${proc.deliveryDate}</span></div>
      <div class="meta-item"><span class="label">Payment Status</span><span class="value">
        <span class="badge ${proc.paymentStatus === 'Paid' ? 'badge-green' : proc.paymentStatus === 'Pending' ? 'badge-red' : 'badge-amber'}">${proc.paymentStatus}</span>
      </span></div>
      <div class="meta-item"><span class="label">Additional Cost</span><span class="value">৳${proc.additionalCost.toFixed(2)}</span></div>
    </div>

    <table>
      <thead><tr>
        <th class="text-center" style="width:36px">#</th>
        <th>Product</th>
        <th class="text-center">Qty</th><th class="text-center">Bonus</th>
        <th class="text-right">Purchase Price</th>
        <th class="text-right">MRP</th>
        <th class="text-right">Net Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="summary"><table>
      <tr><td>Items Subtotal:</td><td class="text-right">৳${(proc.globalTotal - proc.additionalCost).toFixed(2)}</td></tr>
      <tr><td>Carriage / Extra Cost:</td><td class="text-right">+৳${proc.additionalCost.toFixed(2)}</td></tr>
      <tr class="total"><td><b>GRAND TOTAL:</b></td><td class="text-right"><b>৳${proc.globalTotal.toFixed(2)}</b></td></tr>
    </table></div>

    <div class="signatures">
      <div class="sig-line">Warehouse Staff</div>
      <div class="sig-line">Supplier Rep</div>
      <div class="sig-line">Authorized (Admin)</div>
    </div>
    <div class="footer"><span>System: Bangla-Chain DMS</span><span>Printed: ${now()}</span></div>
  `);
}

// ── 3. Expense Receipt ────────────────────────────────────────────────────────

export function printExpenseReceipt(exp: ExpenseRecord): void {
  const shop = getShopName();

  printHTML(`Expense ${exp.id}`, `
    <div class="header">
      <div class="brand"><h1>${shop}</h1><p>FMCG Dealer &amp; Distributor</p></div>
      <div class="doc-meta">
        <div class="doc-type">Expense Receipt</div>
        <div class="doc-id">${exp.id.toUpperCase()}</div>
        <div class="doc-date">Printed: ${now()}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item"><span class="label">Category</span><span class="value">${exp.categoryName}</span></div>
      <div class="meta-item"><span class="label">Expense Date</span><span class="value">${exp.expenseDate}</span></div>
      <div class="meta-item"><span class="label">Paid To</span><span class="value">${exp.paidTo || '—'}</span></div>
      <div class="meta-item"><span class="label">Notes</span><span class="value">${exp.notes || '—'}</span></div>
    </div>

    <div class="summary" style="margin-top:24px"><table>
      <tr class="total"><td><b>AMOUNT PAID:</b></td><td class="text-right"><b>৳${exp.amount.toLocaleString('en-BD')}</b></td></tr>
    </table></div>

    <div class="signatures" style="grid-template-columns:1fr 1fr;gap:60px;margin-top:48px">
      <div class="sig-line">Paid By (Admin)</div>
      <div class="sig-line">Received By</div>
    </div>
    <div class="footer"><span>System: Bangla-Chain DMS</span><span>Printed: ${now()}</span></div>
  `);
}

// ── 4. Stock Adjustment Log ───────────────────────────────────────────────────

export function printStockAdjustmentLog(adjustments: StockAdjustment[]): void {
  const shop = getShopName();

  const rows = adjustments.map((adj, i) => {
    const isInc = adj.qtyChanged > 0;
    return `<tr>
      <td class="text-center">${i + 1}</td>
      <td><b>${adj.productName}</b></td>
      <td class="text-center">${adj.oldQty.toLocaleString()}</td>
      <td class="text-center"><b>${adj.newQty.toLocaleString()}</b></td>
      <td class="text-center">
        <span class="${isInc ? 'tag-increase' : 'tag-decrease'}">${isInc ? '+' : ''}${adj.qtyChanged}</span>
      </td>
      <td>${adj.reason}</td>
      <td>${adj.adjustedBy}</td>
      <td class="text-right">${dateOnly(adj.date)}<br><span style="font-size:9px;color:#94a3b8">${new Date(adj.date).toLocaleTimeString('en-BD',{hour:'2-digit',minute:'2-digit'})}</span></td>
    </tr>`;
  }).join('');

  printHTML('Stock Adjustment Log', `
    <div class="header">
      <div class="brand"><h1>${shop}</h1><p>FMCG Dealer &amp; Distributor</p></div>
      <div class="doc-meta">
        <div class="doc-type">Stock Adjustment Log</div>
        <div class="doc-id">${adjustments.length} Record${adjustments.length !== 1 ? 's' : ''}</div>
        <div class="doc-date">Printed: ${now()}</div>
      </div>
    </div>

    <table>
      <thead><tr>
        <th class="text-center">#</th>
        <th>Product</th>
        <th class="text-center">Before</th>
        <th class="text-center">After</th>
        <th class="text-center">Change</th>
        <th>Reason</th>
        <th>Adjusted By</th>
        <th class="text-right">Date</th>
      </tr></thead>
      <tbody>${rows.length ? rows : '<tr><td colspan="8" style="text-align:center;padding:20px;color:#94a3b8">No adjustments recorded.</td></tr>'}</tbody>
    </table>
    <div class="footer"><span>System: Bangla-Chain DMS</span><span>Printed: ${now()}</span></div>
  `);
}

// ── 5. Sales Order Invoice (SellModule checkout) ──────────────────────────────

interface SalesOrderItem {
  productName: string;
  company:     string;
  spec:        string;
  qty:         number;
  bonusQty:    number;
  rate:        number;
  total:       number;
}

export interface SalesOrderData {
  items:          SalesOrderItem[];
  srName:         string;
  routeName:      string;
  deliveryMan:    string;
  commissionPct:  number;
  subtotal:       number;
  commissionAmt:  number;
  extraProfitAmt?: number;
  extraCommissionAmt?: number; // for backward compatibility
  netTotal:       number;
  orderIds:       string[];
}

export function printSalesOrder(order: SalesOrderData): void {
  const shop = getShopName();
  const orderId = `SO-${Date.now()}`;

  const rows = order.items.map((item, i) => `<tr>
    <td class="text-center">${i + 1}</td>
    <td><b>${item.productName}</b><br><span style="font-size:10px;color:#64748b">${item.company}</span></td>
    <td>${item.spec}</td>
    <td class="text-center">${item.qty}</td>
    <td class="text-center">${item.bonusQty}</td>
    <td class="text-right">৳${item.rate.toFixed(0)}</td>
    <td class="text-right"><b>৳${item.total.toFixed(0)}</b></td>
  </tr>`).join('');

  printHTML(`Sales Order ${orderId}`, `
    <div class="header">
      <div class="brand"><h1>${shop}</h1><p>FMCG Dealer &amp; Distributor</p></div>
      <div class="doc-meta">
        <div class="doc-type">Sales Order / Dispatch</div>
        <div class="doc-id">${orderId}</div>
        <div class="doc-date">Printed: ${now()}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item"><span class="label">SR Officer</span><span class="value">${order.srName}</span></div>
      <div class="meta-item"><span class="label">Market / Route</span><span class="value">${order.routeName}</span></div>
      <div class="meta-item"><span class="label">Delivery Agent</span><span class="value">${order.deliveryMan}</span></div>
      <div class="meta-item"><span class="label">Dispatch Date</span><span class="value">${now()}</span></div>
    </div>

    <table>
      <thead><tr>
        <th class="text-center">#</th>
        <th>Product</th><th>Specification</th>
        <th class="text-center">Qty</th><th class="text-center">Bonus</th>
        <th class="text-right">Rate (৳)</th><th class="text-right">Total (৳)</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="summary"><table>
      <tr><td>Subtotal:</td><td class="text-right">৳${order.subtotal.toFixed(0)}</td></tr>
      ${order.commissionPct > 0 ? `<tr><td>Commission:</td><td class="text-right" style="color:#2563eb">−৳${(order.commissionAmt || 0).toFixed(0)}</td></tr>` : ''}
      ${order.extraProfitAmt && order.extraProfitAmt > 0 ? `<tr><td>Extra Profit:</td><td class="text-right" style="color:#10b981">+৳${order.extraProfitAmt.toFixed(0)}</td></tr>` : ''}
      ${!order.extraProfitAmt && order.extraCommissionAmt && order.extraCommissionAmt > 0 ? `<tr><td>Extra Comm.:</td><td class="text-right" style="color:#2563eb">−৳${order.extraCommissionAmt.toFixed(0)}</td></tr>` : ''}
      <tr class="total"><td><b>NET TOTAL:</b></td><td class="text-right"><b>৳${order.netTotal.toFixed(0)}</b></td></tr>
    </table></div>

    <div class="signatures">
      <div class="sig-line">Prepared By</div>
      <div class="sig-line">SR Signature</div>
      <div class="sig-line">Authorized (Admin)</div>
    </div>
    <div class="footer"><span>System: Bangla-Chain DMS</span><span>Printed: ${now()}</span></div>
  `);
}

export function printInventoryValuation(
  targetDate: string,
  products: {
    name: string;
    sku: string;
    company: string;
    historicStock: number;
    defaultPP: number;
    valuationDP: number;
    valuationTP: number;
    pricePerPiece: number;
    pricePerCarton: number;
    primaryUnit?: string;
    cartonSize: number;
  }[],
  totalValuationDP: number,
  totalValuationTP: number
): void {
  const shop = getShopName();

  const rows = products.map((p, i) => {
    const tpPrice = p.primaryUnit === 'Carton'
      ? (p.pricePerCarton || p.defaultPP)
      : (p.pricePerPiece || p.defaultPP);
    
    const formatStockInline = (stock: number, size: number, primaryUnit?: string) => {
      const s = size || 24;
      let cartons = 0;
      let pieces = 0;
      if (primaryUnit === 'Carton') {
        cartons = Math.floor(stock);
        pieces = Math.round((stock - cartons) * s);
      } else {
        cartons = Math.floor(stock / s);
        pieces = Math.round(stock % s);
      }
      const parts = [];
      if (cartons > 0) parts.push(`${cartons} Ctn`);
      if (pieces > 0) parts.push(`${pieces} Pcs`);
      return parts.join(', ') || '0 Pcs';
    };

    return `<tr>
      <td class="text-center">${i + 1}</td>
      <td><b>${p.name}</b><br><span style="font-size:9px;color:#64748b">${p.sku}</span></td>
      <td>${p.company}</td>
      <td>${formatStockInline(p.historicStock, p.cartonSize, p.primaryUnit)}</td>
      <td class="text-right">৳${p.defaultPP.toLocaleString('en-BD')}/${p.primaryUnit === 'Carton' ? 'Ctn' : 'pc'}</td>
      <td class="text-right">৳${tpPrice.toLocaleString('en-BD')}/${p.primaryUnit === 'Carton' ? 'Ctn' : 'pc'}</td>
      <td class="text-right">৳${p.valuationDP.toLocaleString('en-BD')}</td>
      <td class="text-right">৳${p.valuationTP.toLocaleString('en-BD')}</td>
    </tr>`;
  }).join('');

  printHTML(`Valuation-${targetDate}`, `
    <div class="header">
      <div class="brand"><h1>${shop}</h1><p>FMCG Dealer &amp; Distributor</p></div>
      <div class="doc-meta">
        <div class="doc-type">Inventory Valuation</div>
        <div class="doc-id">Snapshot Date: ${targetDate}</div>
        <div class="doc-date">Generated: ${now()}</div>
      </div>
    </div>

    <table style="margin-top:20px">
      <thead>
        <tr>
          <th style="width:40px" class="text-center">#</th>
          <th>Product Name</th>
          <th>Company</th>
          <th>Stock Quantity</th>
          <th class="text-right">DP Price</th>
          <th class="text-right">TP Price</th>
          <th class="text-right">Valuation (DP)</th>
          <th class="text-right">Valuation (TP)</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="summary">
      <table style="width:320px">
        <tr class="total">
          <td>Total Value (DP Cost)</td>
          <td class="text-right">৳${totalValuationDP.toLocaleString('en-BD')}</td>
        </tr>
        <tr class="total" style="background:#f8fafc">
          <td>Total Value (TP Wholesale)</td>
          <td class="text-right">৳${totalValuationTP.toLocaleString('en-BD')}</td>
        </tr>
      </table>
    </div>

    <div class="signatures">
      <div class="sig-line">Prepared By</div>
      <div class="sig-line">Verified By</div>
      <div class="sig-line">Authorized Signature</div>
    </div>

    <div class="footer">
      <span>Bangla-Chain ERP Valuation Sheet</span>
      <span>Printed: ${now()}</span>
    </div>
  `);
}
