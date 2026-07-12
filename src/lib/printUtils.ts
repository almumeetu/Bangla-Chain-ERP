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
      body{font-family:system-ui,-apple-system,sans-serif;color:#0f172a;background:#fff;padding:32px 40px;font-size:12px;line-height:1.6}
      @media print{body{padding:10mm 12mm}@page{margin:10mm}}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #0f172a}
      .brand h1{font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:.5px}
      .brand p{font-size:10px;color:#64748b;margin-top:2px}
      .doc-meta{text-align:right}
      .doc-meta .doc-type{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
      .doc-meta .doc-id{font-family:monospace;font-size:11px;color:#475569;margin-top:2px}
      .doc-meta .doc-date{font-size:10px;color:#94a3b8;margin-top:2px}
      .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin-bottom:20px}
      .meta-item .label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;display:block;margin-bottom:2px}
      .meta-item .value{font-weight:600;color:#0f172a;font-size:11px}
      table{width:100%;border-collapse:collapse;margin:16px 0;font-size:11px}
      thead tr{background:#0f172a;color:#fff}
      thead th{padding:9px 12px;text-align:left;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.4px}
      tbody tr{border-bottom:1px solid #e2e8f0}
      tbody tr:nth-child(even){background:#f8fafc}
      tbody td{padding:9px 12px;color:#334155}
      .text-right{text-align:right}
      .text-center{text-align:center}
      .summary{display:flex;justify-content:flex-end;margin-top:16px}
      .summary table{width:280px;font-size:11px}
      .summary td{padding:6px 10px;border-bottom:1px solid #e2e8f0}
      .summary .total td{border-top:2px solid #0f172a;border-bottom:2px solid #0f172a;font-weight:700;font-size:13px}
      .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600;border:1px solid}
      .badge-green{background:#dcfce7;color:#166534;border-color:#86efac}
      .badge-amber{background:#fef9c3;color:#854d0e;border-color:#fde047}
      .badge-red{background:#fee2e2;color:#991b1b;border-color:#fca5a5}
      .badge-blue{background:#dbeafe;color:#1e40af;border-color:#93c5fd}
      .signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px;margin-top:60px}
      .sig-line{border-top:1px solid #94a3b8;padding-top:6px;text-align:center;font-size:10px;color:#64748b}
      .footer{margin-top:32px;padding-top:12px;border-top:1px dashed #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
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
  const ch = items[0]; // Header info comes from first item
  const shop = getShopName();

  const totalGrossQty = items.reduce((sum, item) => sum + item.qty, 0);
  const totalBonusQty = items.reduce((sum, item) => sum + (item.bonusQty || 0), 0);
  const totalReturned = items.reduce((sum, item) => sum + (item.returnedQty || 0), 0);
  const totalDamaged = items.reduce((sum, item) => sum + (item.damagedQty || 0), 0);
  const totalNetPayable = items.reduce((sum, item) => sum + item.totalAmount, 0);

  const rows = items.map((item, idx) => {
    const netQty = item.qty - (item.returnedQty || 0) - (item.damagedQty || 0);
    return `
      <tr>
        <td><b>${item.productName}</b><br><span style="font-size:10px;color:#64748b">${item.company || ''}</span></td>
        <td>${item.attribute}</td>
        <td class="text-center">${item.qty}</td>
        <td class="text-center">${item.bonusQty}</td>
        <td class="text-center">${item.returnedQty || 0}</td>
        <td class="text-center">${item.damagedQty || 0}</td>
        <td class="text-center"><b>${netQty}</b></td>
        <td class="text-right">${item.rate.toFixed(0)}</td>
        <td class="text-right"><b>${item.totalAmount.toFixed(0)}</b></td>
      </tr>
    `;
  }).join('');

  printHTML(`Challan ORD-${new Date(ch.createdAt).getTime().toString().slice(-6)}`, `
    <div class="header">
      <div class="brand"><h1>${shop}</h1><p>FMCG Dealer &amp; Distributor</p></div>
      <div class="doc-meta">
        <div class="doc-type">Delivery Challan</div>
        <div class="doc-id">ORD-${new Date(ch.createdAt).getTime().toString().slice(-6)}</div>
        <div class="doc-date">Printed: ${now()}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item"><span class="label">SR Name</span><span class="value">${ch.srName}</span></div>
      <div class="meta-item"><span class="label">Route / Market</span><span class="value">${ch.routeName || '—'}</span></div>
      <div class="meta-item"><span class="label">Delivery Agent</span><span class="value">${ch.deliveryManName}</span></div>
      <div class="meta-item"><span class="label">Challan Date</span><span class="value">${dateOnly(ch.createdAt)}</span></div>
      <div class="meta-item"><span class="label">Status</span><span class="value">
        <span class="badge ${ch.status === 'Delivered' ? 'badge-green' : ch.status === 'Shipped' ? 'badge-blue' : 'badge-amber'}">${ch.status}</span>
      </span></div>
    </div>

    <table>
      <thead><tr>
        <th>Product</th><th>Specification</th>
        <th class="text-center">Gross Qty</th><th class="text-center">Bonus</th>
        <th class="text-center">Returned</th><th class="text-center">Damaged</th>
        <th class="text-center">Net Qty</th>
        <th class="text-right">Rate (৳)</th><th class="text-right">Total (৳)</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="summary"><table>
      <tr><td>Gross Qty:</td><td class="text-right">${totalGrossQty} units</td></tr>
      <tr><td>Bonus Qty:</td><td class="text-right">${totalBonusQty} units</td></tr>
      <tr><td>Returned:</td><td class="text-right">−${totalReturned} units</td></tr>
      <tr><td>Damaged:</td><td class="text-right">−${totalDamaged} units</td></tr>
      <tr class="total"><td><b>NET PAYABLE:</b></td><td class="text-right"><b>৳${totalNetPayable.toLocaleString('en-BD')}</b></td></tr>
    </table></div>

    <div class="signatures">
      <div class="sig-line">Warehouse / Dispatch</div>
      <div class="sig-line">Delivery Agent</div>
      <div class="sig-line">SR / Customer</div>
    </div>
    <div class="footer"><span>System: Bangla-Chain DMS</span><span>Printed: ${now()}</span></div>
  `);
}

// ── 1b. Challan Bulk Sheet (filtered list) ────────────────────────────────────

export function printChallanSheet(challans: ChallanItem[]): void {
  const shop = getShopName();
  const totalAmt = challans.reduce((s, c) => s + c.totalAmount, 0);

  const rows = challans.map((c, i) => {
    const statusClass = c.status === 'Delivered' ? 'badge-green' : c.status === 'Shipped' ? 'badge-blue' : 'badge-amber';
    return `<tr>
      <td class="text-center">${i + 1}</td>
      <td><b>${c.productName}</b><br><span style="font-size:10px;color:#64748b">${c.attribute}</span></td>
      <td class="text-center">${c.qty}</td>
      <td class="text-center">${c.bonusQty}</td>
      <td class="text-center"><b>${c.totalQty}</b></td>
      <td class="text-right">৳${c.rate.toFixed(0)}</td>
      <td class="text-right"><b>৳${c.totalAmount.toFixed(0)}</b></td>
      <td>${c.srName}</td>
      <td>${c.routeName || '—'}</td>
      <td>${c.deliveryManName}</td>
      <td class="text-center"><span class="badge ${statusClass}">${c.status}</span></td>
    </tr>`;
  }).join('');

  printHTML('Challan Sheet', `
    <div class="header">
      <div class="brand"><h1>${shop}</h1><p>FMCG Dealer &amp; Distributor</p></div>
      <div class="doc-meta">
        <div class="doc-type">Challan Sheet</div>
        <div class="doc-id">${challans.length} Record${challans.length !== 1 ? 's' : ''}</div>
        <div class="doc-date">Printed: ${now()}</div>
      </div>
    </div>

    <table>
      <thead><tr>
        <th class="text-center" style="width:30px">#</th>
        <th>Product &amp; Spec</th>
        <th class="text-center">Qty</th>
        <th class="text-center">Bonus</th>
        <th class="text-center">Total Qty</th>
        <th class="text-right">Rate (৳)</th>
        <th class="text-right">Total Amt (৳)</th>
        <th>SR Name</th>
        <th>Route Beat</th>
        <th>Delivery Man</th>
        <th class="text-center">Status</th>
      </tr></thead>
      <tbody>${rows.length ? rows : '<tr><td colspan="11" style="text-align:center;padding:20px;color:#94a3b8">No challans found.</td></tr>'}</tbody>
    </table>

    <div class="summary"><table>
      <tr class="total"><td><b>TOTAL AMOUNT:</b></td><td class="text-right"><b>৳${totalAmt.toLocaleString('en-BD')}</b></td></tr>
    </table></div>
    <div class="footer"><span>System: Bangla-Chain DMS</span><span>Printed: ${now()}</span></div>
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
