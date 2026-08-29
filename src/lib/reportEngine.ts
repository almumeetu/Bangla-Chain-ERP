/**
 * reportEngine.ts — Reusable PDF Export, Excel/CSV Export & Browser Print Engine for Bangla-Chain ERP
 *
 * FEATURES & CAPABILITIES:
 *  1. Complete Filter Awareness: Respects Company, SR, Delivery Man, Date Range, and Sub-Tab selections.
 *  2. Dynamic Report Titles: Customizes document header to reflect exact active subtab & filter (e.g. "SR-WISE SALES REPORT", "COMPANY-WISE SALES REPORT", "PRAN DAIRY — STOCK REPORT").
 *  3. Full Report Coverage: Stock, Sales, Damage, Profit & Loss, Margin, Price List, Day-End, and Claims.
 *  4. Accurate KPIs: Computes metrics strictly based on the applied filters.
 *  5. HTML Print Window (`printReport`): Renders rich, high-contrast, filter-badged printable pages.
 *  6. jsPDF Engine (`exportReportPDF`): Crisp vector PDF with auto page-breaks and dynamic headers.
 *  7. CSV Export (`exportReportExcel`): Filter-compliant data exports.
 */

import { jsPDF } from 'jspdf';
import type {
  Product, ChallanItem, SR, DeliveryMan, ExpenseRecord, CompanyBrand, Claim, ClaimSettlement
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type ReportType =
  | 'stock'
  | 'sales'
  | 'damage'
  | 'profit'
  | 'margin'
  | 'pricelist'
  | 'dayend'
  | 'claims';

export interface ReportOptions {
  type:           ReportType;
  subTab?:        string;
  shopName:       string;
  shopSubBrand:   string;
  shopLogo?:      string;   // base64 data-URL (optional)
  generatedBy?:   string;
  startDate:      string;
  endDate:        string;
  language:       'en' | 'bn';
  // filters applied
  filterCompany?: string;
  filterSR?:      string;
  filterDM?:      string;
  // data
  products:       Product[];
  challans:       ChallanItem[];
  srs:            SR[];
  deliveryMen:    DeliveryMan[];
  expenses:       ExpenseRecord[];
  companies:      CompanyBrand[];
  claims?:        Claim[];
  claimSettlements?: ClaimSettlement[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Report Title Resolver
// ─────────────────────────────────────────────────────────────────────────────

export interface DynamicReportInfo {
  title: string;
  subtitle: string;
  fileTag: string;
}

export function getDynamicReportTitle(opts: ReportOptions): DynamicReportInfo {
  const isFilteredCo = opts.filterCompany && opts.filterCompany !== 'All';
  const isFilteredSR = opts.filterSR && opts.filterSR !== 'All';
  const isFilteredDM = opts.filterDM && opts.filterDM !== 'All';
  const coName = isFilteredCo ? opts.filterCompany! : '';
  const srName = isFilteredSR ? opts.filterSR! : '';
  const dmName = isFilteredDM ? opts.filterDM! : '';

  if (opts.type === 'sales') {
    if (opts.subTab === 'sr' || isFilteredSR) {
      return {
        title: srName ? `${srName.toUpperCase()} — SR SALES REPORT` : 'SR-WISE SALES REPORT',
        subtitle: srName ? `Sales Officer Performance & Dispatch Summary: ${srName}` : 'Field Sales Officer (SR) Performance & Delivery Summary',
        fileTag: srName ? `SR_Sales_${srName.replace(/\s+/g, '_')}` : 'SR_Wise_Sales_Report'
      };
    }
    if (opts.subTab === 'dm' || isFilteredDM) {
      return {
        title: dmName ? `${dmName.toUpperCase()} — DELIVERY MAN REPORT` : 'DELIVERY MAN-WISE SALES REPORT',
        subtitle: dmName ? `Delivery Staff Logistics & Fulfillment: ${dmName}` : 'Delivery Staff Order Fulfillment & Logistics Summary',
        fileTag: dmName ? `DM_Sales_${dmName.replace(/\s+/g, '_')}` : 'DeliveryMan_Sales_Report'
      };
    }
    if (opts.subTab === 'product') {
      return {
        title: coName ? `${coName.toUpperCase()} — PRODUCT SALES REPORT` : 'PRODUCT-WISE SALES REPORT',
        subtitle: 'Product-wise Itemized Sales Breakdown with Cartons & Pieces',
        fileTag: coName ? `Product_Sales_${coName.replace(/\s+/g, '_')}` : 'Product_Sales_Report'
      };
    }
    if (opts.subTab === 'unit') {
      return {
        title: coName ? `${coName.toUpperCase()} — UNIT-WISE SALES REPORT` : 'UNIT-WISE SALES REPORT',
        subtitle: 'Packaging Unit & Multiplier Breakdown',
        fileTag: 'Unit_Sales_Report'
      };
    }
    // Company subtab or default
    return {
      title: coName ? `${coName.toUpperCase()} — COMPANY SALES REPORT` : 'COMPANY-WISE SALES REPORT',
      subtitle: 'Company-wise B2B Distribution Sales & Challan Summary',
      fileTag: coName ? `Company_Sales_${coName.replace(/\s+/g, '_')}` : 'Company_Sales_Report'
    };
  }

  if (opts.type === 'stock') {
    if (opts.subTab === 'product') {
      return {
        title: coName ? `${coName.toUpperCase()} — PRODUCT STOCK REPORT` : 'PRODUCT-WISE STOCK & VALUATION REPORT',
        subtitle: 'Detailed Product Inventory with Carton Sizes & DP Valuation',
        fileTag: coName ? `Product_Stock_${coName.replace(/\s+/g, '_')}` : 'Product_Stock_Report'
      };
    }
    return {
      title: coName ? `${coName.toUpperCase()} — STOCK REPORT` : 'COMPANY-WISE STOCK REPORT',
      subtitle: 'Company-wise Inventory Holdings, Cartons, Pieces & DP Valuation',
      fileTag: coName ? `Company_Stock_${coName.replace(/\s+/g, '_')}` : 'Company_Stock_Report'
    };
  }

  if (opts.type === 'damage') {
    return {
      title: coName ? `${coName.toUpperCase()} — DAMAGE REPORT` : 'COMPANY-WISE DAMAGE REPORT',
      subtitle: 'Damage Reconciliation, Losses & Market Replacements',
      fileTag: coName ? `Damage_${coName.replace(/\s+/g, '_')}` : 'Damage_Report'
    };
  }

  if (opts.type === 'profit') {
    return {
      title: coName ? `${coName.toUpperCase()} — PROFIT & LOSS REPORT` : 'COMPANY-WISE PROFIT & LOSS REPORT',
      subtitle: 'Gross Revenue, COGS (DP), Expenses & Net Profit Analysis',
      fileTag: coName ? `Profit_${coName.replace(/\s+/g, '_')}` : 'Profit_Loss_Report'
    };
  }

  if (opts.type === 'margin') {
    return {
      title: coName ? `${coName.toUpperCase()} — PROFIT MARGIN REPORT` : 'PROFIT MARGIN (DP / TP / MRP) REPORT',
      subtitle: 'Trade Price & Dealer Price Variance Analysis',
      fileTag: coName ? `Margin_${coName.replace(/\s+/g, '_')}` : 'Margin_Analysis'
    };
  }

  if (opts.type === 'pricelist') {
    return {
      title: coName ? `${coName.toUpperCase()} — PRICE LIST (DP / TP / MRP)` : 'PRICE LIST (DP / TP / MRP) REPORT',
      subtitle: 'Official Dealer Price (DP), Wholesale TP & Retail MRP Schedule',
      fileTag: coName ? `PriceList_${coName.replace(/\s+/g, '_')}` : 'Price_List'
    };
  }

  if (opts.type === 'dayend') {
    const srPart = srName ? ` [SR: ${srName}]` : '';
    return {
      title: coName ? `${coName.toUpperCase()} — DAY-END SETTLEMENT${srPart}` : `DAILY DAY-END SETTLEMENT REPORT${srPart}`,
      subtitle: 'Daily Opening Stock, Sold Units, Returns & Closing Stock',
      fileTag: 'DayEnd_Settlement'
    };
  }

  if (opts.type === 'claims') {
    return {
      title: coName ? `${coName.toUpperCase()} — CLAIMS & DAMAGE LOG` : 'COMPANY CLAIMS & DAMAGE LOG',
      subtitle: 'Company Replacement Claims & Settlement Status',
      fileTag: 'Claims_Report'
    };
  }

  return {
    title: 'DISTRIBUTION REPORT',
    subtitle: 'Bangla-Chain Distribution Report',
    fileTag: 'Distribution_Report'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** ASCII-safe currency formatter for jsPDF helvetica */
function fmtTK(n: number): string {
  return `TK ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Rich BDT currency formatter for HTML Print */
function fmtBDT(n: number): string {
  return `৳${n.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtNum(n: number): string {
  return (n || 0).toLocaleString('en-US');
}

/** Formats stock into Cartons + Pieces representation */
function formatCtnPcs(qty: number, cartonSize = 24, primaryUnit = 'Piece'): string {
  const cs = (cartonSize && cartonSize > 1) ? cartonSize : 24;
  if (primaryUnit === 'Carton') {
    const totalPcs = Math.round(qty * cs);
    return `${qty.toLocaleString()} Ctn + 0 Pcs (${totalPcs.toLocaleString()} pcs)`;
  }
  const ctn = Math.floor(qty / cs);
  const pcs = qty % cs;
  return `${ctn} Ctn + ${pcs} Pcs (${qty.toLocaleString()} pcs)`;
}

/** Safely clamp a string for jsPDF text rendering */
function clamp(s: string | null | undefined, max: number): string {
  if (!s) return '';
  const asciiText = s.replace(/[^\x00-\x7F]/g, '?');
  return asciiText.length > max ? asciiText.substring(0, max - 2) + '..' : asciiText;
}

/** Make product / company names ASCII safe for jsPDF */
function ascii(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/[^\x00-\x7F]/g, '?');
}

interface DocContext {
  doc:        jsPDF;
  shopName:   string;
  shopSub:    string;
  shopLogo?:  string;
  dateStr:    string;
  timeStr:    string;
  generatedBy:string;
  startDate:  string;
  endDate:    string;
  filters:    string[];
  y:          number;
  W:          number;
  L:          number;
  R:          number;
  BOTTOM:     number;
  currentPage:number;
  totalPages: number;
}

function buildCtx(opts: ReportOptions, totalPages = 1): DocContext {
  const now = new Date();
  const filters: string[] = [];
  if (opts.filterCompany && opts.filterCompany !== 'All') filters.push(`Company: ${opts.filterCompany}`);
  if (opts.filterSR      && opts.filterSR      !== 'All') filters.push(`SR: ${opts.filterSR}`);
  if (opts.filterDM      && opts.filterDM      !== 'All') filters.push(`DM: ${opts.filterDM}`);
  if (opts.subTab) {
    const subName = opts.subTab === 'sr' ? 'SR Performance' : (opts.subTab === 'dm' ? 'Delivery Logistics' : (opts.subTab === 'product' ? 'Product Breakdown' : (opts.subTab === 'unit' ? 'Unit Breakdown' : 'Company Summary')));
    filters.push(`View: ${subName}`);
  }

  return {
    doc:         new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' }),
    shopName:    ascii(opts.shopName)    || 'Bangla-Chain ERP',
    shopSub:     ascii(opts.shopSubBrand) || 'Distribution Management System',
    shopLogo:    opts.shopLogo,
    dateStr:     now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    timeStr:     now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    generatedBy: opts.generatedBy || 'Admin',
    startDate:   opts.startDate,
    endDate:     opts.endDate,
    filters,
    y:           0,
    W:           182,
    L:           14,
    R:           196,
    BOTTOM:      268,
    currentPage: 1,
    totalPages,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page structure for jsPDF
// ─────────────────────────────────────────────────────────────────────────────

const HEADER_H = 42;

function drawPageHeader(ctx: DocContext, reportTitle: string, reportSubtitle: string): void {
  const { doc, shopName, shopSub, dateStr, timeStr, generatedBy, startDate, endDate, L, R, filters, shopLogo } = ctx;

  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, HEADER_H, 'F');

  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, HEADER_H - 2, 210, 2, 'F');

  if (shopLogo) {
    try {
      doc.addImage(shopLogo, 'PNG', L, 6, 26, 26);
    } catch {
      // ignore logo errors
    }
  }

  const textLeft = shopLogo ? L + 30 : L;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(shopName, textLeft, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(shopSub, textLeft, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(248, 250, 252);
  doc.text(ascii(reportTitle).toUpperCase(), textLeft, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Period: ${startDate} to ${endDate}`, textLeft, 34);

  const rightX = R;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${dateStr} ${timeStr}`, rightX, 14, { align: 'right' });
  doc.text(`By: ${generatedBy}`, rightX, 20, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(ascii(reportSubtitle), L, HEADER_H + 8);

  let fy = HEADER_H + 8;
  if (filters.length > 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(99, 102, 241);
    doc.text('Active Filters: ' + filters.join('  |  '), L, HEADER_H + 14);
    fy = HEADER_H + 14;
  }

  ctx.y = fy + 8;
}

function drawPageFooter(ctx: DocContext): void {
  const { doc, shopName, dateStr, timeStr, L, R } = ctx;
  const y = 283;
  doc.setDrawColor(226, 232, 240);
  doc.line(L, y - 2, R, y - 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`${shopName} | Generated: ${dateStr} ${timeStr}`, L, y + 2);

  const pageLabel = `Page ${ctx.currentPage} of ${ctx.totalPages}`;
  doc.text(pageLabel, R - doc.getTextWidth(pageLabel), y + 2);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.text('Powered by Bangla-Chain ERP', L, y + 6);
}

function addPage(ctx: DocContext, title: string, subtitle: string): void {
  ctx.doc.addPage();
  ctx.currentPage++;
  drawPageHeader(ctx, title, subtitle);
}

function maybePageBreak(ctx: DocContext, needed: number, title: string, subtitle: string): void {
  if (ctx.y + needed > ctx.BOTTOM) {
    addPage(ctx, title, subtitle);
  }
}

interface ColDef {
  label:    string;
  x:        number;
  align?:   'left' | 'right' | 'center';
  bold?:    boolean;
  color?:   [number, number, number];
  width?:   number;
}

function drawSectionHeading(ctx: DocContext, text: string): void {
  const { doc, L, W } = ctx;
  doc.setFillColor(241, 245, 249);
  doc.rect(L, ctx.y - 1, W, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(L, ctx.y + 7, ctx.R, ctx.y + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(text.toUpperCase(), L + 3, ctx.y + 5);
  ctx.y += 12;
}

function drawTableHeader(ctx: DocContext, cols: ColDef[], rowH = 8): void {
  const { doc, L, W } = ctx;
  doc.setFillColor(15, 23, 42);
  doc.rect(L, ctx.y - 1, W, rowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  cols.forEach(col => {
    const align = col.align || 'left';
    doc.text(col.label, col.x, ctx.y + 4.5, { align });
  });

  ctx.y += rowH;
}

function drawTableRow(
  ctx: DocContext,
  cols: ColDef[],
  values: string[],
  isEven = false,
  isHighlight = false,
  rowH = 7
): void {
  const { doc, L, W } = ctx;

  if (isHighlight) {
    doc.setFillColor(254, 242, 242); // red-50
    doc.rect(L, ctx.y - 1, W, rowH, 'F');
  } else if (isEven) {
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(L, ctx.y - 1, W, rowH, 'F');
  }

  doc.setDrawColor(241, 245, 249);
  doc.line(L, ctx.y + rowH - 1, ctx.R, ctx.y + rowH - 1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);

  values.forEach((val, i) => {
    if (i >= cols.length) return;
    const col = cols[i];
    if (col.bold) doc.setFont('helvetica', 'bold');
    if (col.color) doc.setTextColor(...col.color);
    doc.text(val, col.x, ctx.y + 3.8, { align: col.align || 'left' });
    if (col.bold) doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
  });

  ctx.y += rowH;
}

function drawTotalRow(ctx: DocContext, cols: ColDef[], values: string[], rowH = 8): void {
  const { doc, L, W } = ctx;
  doc.setFillColor(226, 232, 240); // slate-200
  doc.rect(L, ctx.y - 1, W, rowH, 'F');
  doc.setDrawColor(148, 163, 184);
  doc.line(L, ctx.y - 1, ctx.R, ctx.y - 1);
  doc.line(L, ctx.y + rowH - 1, ctx.R, ctx.y + rowH - 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  values.forEach((val, i) => {
    if (i >= cols.length) return;
    const col = cols[i];
    doc.text(val, col.x, ctx.y + 4.5, { align: col.align || 'left' });
  });

  ctx.y += rowH + 4;
}

function drawKpiRow(
  ctx: DocContext,
  cards: { label: string; value: string; r?: number; g?: number; b?: number }[]
): void {
  const { doc, L, W } = ctx;
  const count = cards.length;
  const gap = 3;
  const cardW = (W - gap * (count - 1)) / count;
  const cardH = 15;

  cards.forEach((card, i) => {
    const x = L + i * (cardW + gap);
    doc.setFillColor(248, 250, 252);
    doc.rect(x, ctx.y, cardW, cardH, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(x, ctx.y, cardW, cardH, 'S');

    doc.setFillColor(card.r ?? 99, card.g ?? 102, card.b ?? 241);
    doc.rect(x, ctx.y, 2, cardH, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(card.label.toUpperCase(), x + 5, ctx.y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(card.r ?? 15, card.g ?? 23, card.b ?? 42);
    doc.text(card.value, x + 5, ctx.y + 11.5);
  });

  ctx.y += cardH + 7;
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter helpers
// ─────────────────────────────────────────────────────────────────────────────

function getFilteredProducts(opts: ReportOptions): Product[] {
  return opts.products.filter(p => 
    !opts.filterCompany || opts.filterCompany === 'All' || p.company === opts.filterCompany
  );
}

function getFilteredChallans(opts: ReportOptions): ChallanItem[] {
  return opts.challans.filter(ch => {
    if (!ch.createdAt) return true;
    const date = ch.createdAt.split('T')[0];
    const inRange  = date >= opts.startDate && date <= opts.endDate;
    const inCo     = !opts.filterCompany || opts.filterCompany === 'All' || ch.company === opts.filterCompany;
    const inSR     = !opts.filterSR      || opts.filterSR      === 'All' || (ch.srName || '').toLowerCase() === opts.filterSR.toLowerCase();
    const inDM     = !opts.filterDM      || opts.filterDM      === 'All' || (ch.deliveryManName || '').toLowerCase() === opts.filterDM.toLowerCase();
    return inRange && inCo && inSR && inDM && ch.status === 'Delivered';
  });
}

function productsByCompany(opts: ReportOptions): Record<string, Product[]> {
  const map: Record<string, Product[]> = {};
  const fProds = getFilteredProducts(opts);
  fProds.forEach(p => {
    const co = p.company || 'Unknown';
    if (!map[co]) map[co] = [];
    map[co].push(p);
  });
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generators for jsPDF
// ─────────────────────────────────────────────────────────────────────────────

function genStock(ctx: DocContext, opts: ReportOptions, dynamicInfo: DynamicReportInfo): void {
  drawPageHeader(ctx, dynamicInfo.title, dynamicInfo.subtitle);

  const byCompany = productsByCompany(opts);
  const companies = Object.keys(byCompany).sort();
  const fProds = getFilteredProducts(opts);

  const totalUnits   = fProds.reduce((s, p) => s + p.currentStock, 0);
  const totalDP      = fProds.reduce((s, p) => s + p.currentStock * (p.defaultPP || 0), 0);
  const totalDamaged = fProds.reduce((s, p) => s + (p.damagedStock || 0), 0);

  drawKpiRow(ctx, [
    { label: 'Products Filtered', value: fmtNum(fProds.length), r: 99,  g: 102, b: 241 },
    { label: 'Total Stock Units', value: fmtNum(totalUnits),    r: 16,  g: 185, b: 129 },
    { label: 'Stock Value (DP)',  value: fmtTK(totalDP),        r: 245, g: 158, b: 11  },
    { label: 'Damaged Stock',     value: fmtNum(totalDamaged),  r: 239, g: 68,  b: 68  },
  ]);

  if (!opts.filterCompany || opts.filterCompany === 'All') {
    drawSectionHeading(ctx, 'Company Summary');
    const sumCols: ColDef[] = [
      { label: '#',              x: 15 },
      { label: 'Company / Brand',x: 22 },
      { label: 'Products',       x: 110 },
      { label: 'Stock Units',    x: 140 },
      { label: 'Value (DP)',     x: 170 },
    ];
    drawTableHeader(ctx, sumCols);

    let gQty = 0, gDP = 0;
    companies.forEach((co, i) => {
      maybePageBreak(ctx, 8, dynamicInfo.title, dynamicInfo.subtitle);
      const prods   = byCompany[co];
      const qty     = prods.reduce((s, p) => s + p.currentStock, 0);
      const dp      = prods.reduce((s, p) => s + p.currentStock * (p.defaultPP || 0), 0);
      gQty += qty; gDP += dp;
      drawTableRow(ctx, sumCols,
        [`${i + 1}`, clamp(co, 36), `${prods.length}`, fmtNum(qty), fmtTK(dp)],
        i % 2 === 0,
      );
    });
    drawTotalRow(ctx, sumCols, ['', 'GRAND TOTAL', `${fProds.length}`, fmtNum(gQty), fmtTK(gDP)]);
    ctx.y += 4;
  }

  maybePageBreak(ctx, 18, dynamicInfo.title, dynamicInfo.subtitle);
  drawSectionHeading(ctx, 'Product-wise Stock Breakdown');

  const detCols: ColDef[] = [
    { label: '#',          x: 15 },
    { label: 'Product',    x: 22 },
    { label: 'Company',    x: 88 },
    { label: 'SKU',        x: 128 },
    { label: 'Stock',      x: 151 },
    { label: 'Damaged',    x: 166 },
    { label: 'DP Value',   x: 181 },
  ];
  drawTableHeader(ctx, detCols);

  const sortedProds = [...fProds].sort((a, b) => a.company.localeCompare(b.company) || a.name.localeCompare(b.name));
  sortedProds.forEach((p, i) => {
    maybePageBreak(ctx, 8, dynamicInfo.title, dynamicInfo.subtitle);
    const dpVal = p.currentStock * (p.defaultPP || 0);
    drawTableRow(ctx, detCols,
      [
        `${i + 1}`,
        clamp(p.name, 28),
        clamp(p.company, 16),
        clamp(p.sku, 10),
        fmtNum(p.currentStock),
        fmtNum(p.damagedStock || 0),
        fmtTK(dpVal),
      ],
      i % 2 === 0,
    );
  });
}

function genSales(ctx: DocContext, opts: ReportOptions, dynamicInfo: DynamicReportInfo): void {
  drawPageHeader(ctx, dynamicInfo.title, dynamicInfo.subtitle);

  const fch = getFilteredChallans(opts);
  const totalRev = fch.reduce((s, ch) => s + ch.totalAmount, 0);
  const totalQty = fch.reduce((s, ch) => s + ch.qty, 0);
  const totalRet = fch.reduce((s, ch) => s + (ch.returnedQty || 0), 0);
  const totalDmg = fch.reduce((s, ch) => s + (ch.damagedQty || 0), 0);

  drawKpiRow(ctx, [
    { label: 'Delivered Orders', value: fmtNum(fch.length),  r: 99,  g: 102, b: 241 },
    { label: 'Units Sold',       value: fmtNum(totalQty),    r: 16,  g: 185, b: 129 },
    { label: 'Total Revenue',    value: fmtTK(totalRev),     r: 245, g: 158, b: 11  },
    { label: 'Returns/Damages',  value: fmtNum(totalRet + totalDmg), r: 239, g: 68, b: 68 },
  ]);

  // Company summary
  drawSectionHeading(ctx, 'Company-wise Sales');
  const coCols: ColDef[] = [
    { label: '#',           x: 15 },
    { label: 'Company',     x: 22 },
    { label: 'Units Sold',  x: 98 },
    { label: 'Returns',     x: 122 },
    { label: 'Damages',     x: 144 },
    { label: 'Revenue',     x: 164 },
  ];
  drawTableHeader(ctx, coCols);

  const companies = Array.from(new Set(opts.products.map(p => p.company).filter(Boolean))).sort();
  companies.forEach((co, i) => {
    if (opts.filterCompany && opts.filterCompany !== 'All' && co !== opts.filterCompany) return;
    maybePageBreak(ctx, 8, dynamicInfo.title, dynamicInfo.subtitle);
    const cc = fch.filter(ch => ch.company === co);
    const u  = cc.reduce((s, ch) => s + ch.qty, 0);
    const r  = cc.reduce((s, ch) => s + (ch.returnedQty || 0), 0);
    const d  = cc.reduce((s, ch) => s + (ch.damagedQty || 0), 0);
    const v  = cc.reduce((s, ch) => s + ch.totalAmount, 0);
    drawTableRow(ctx, coCols, [`${i+1}`, clamp(co, 32), fmtNum(u), fmtNum(r), fmtNum(d), fmtTK(v)], i % 2 === 0);
  });
  drawTotalRow(ctx, coCols, ['', 'TOTAL', fmtNum(totalQty), fmtNum(totalRet), fmtNum(totalDmg), fmtTK(totalRev)]);

  // SR summary
  ctx.y += 6;
  maybePageBreak(ctx, 18, dynamicInfo.title, dynamicInfo.subtitle);
  drawSectionHeading(ctx, 'Sales Officer (SR) Performance');
  const srCols: ColDef[] = [
    { label: '#',           x: 15 },
    { label: 'SR Name',     x: 22 },
    { label: 'Phone',       x: 80 },
    { label: 'Units',       x: 118 },
    { label: 'Returns',     x: 140 },
    { label: 'Damages',     x: 158 },
    { label: 'Revenue',     x: 174 },
  ];
  drawTableHeader(ctx, srCols);
  const activeSRs = opts.filterSR && opts.filterSR !== 'All'
    ? opts.srs.filter(s => s.name.toLowerCase() === opts.filterSR!.toLowerCase())
    : opts.srs;
  activeSRs.forEach((sr, i) => {
    maybePageBreak(ctx, 8, dynamicInfo.title, dynamicInfo.subtitle);
    const sc = fch.filter(ch => ch.srName?.toLowerCase() === sr.name.toLowerCase());
    const u  = sc.reduce((s, ch) => s + ch.qty, 0);
    const r  = sc.reduce((s, ch) => s + (ch.returnedQty || 0), 0);
    const d  = sc.reduce((s, ch) => s + (ch.damagedQty || 0), 0);
    const v  = sc.reduce((s, ch) => s + ch.totalAmount, 0);
    if (u === 0 && v === 0) return;
    drawTableRow(ctx, srCols,
      [`${i+1}`, clamp(sr.name, 24), clamp(sr.phone, 14), fmtNum(u), fmtNum(r), fmtNum(d), fmtTK(v)],
      i % 2 === 0,
    );
  });
}

function genDamage(ctx: DocContext, opts: ReportOptions, dynamicInfo: DynamicReportInfo): void {
  drawPageHeader(ctx, dynamicInfo.title, dynamicInfo.subtitle);

  const fch = getFilteredChallans(opts);
  const fProds = getFilteredProducts(opts);

  const rows = fProds
    .map(p => {
      const hist   = p.damageHistory || [];
      const signed = hist.reduce((s, e) => s + (e.type === 'new' ? (e.deltaQty ?? e.qty) : 0), 0);
      const posD   = hist.reduce((s, e) => s + (e.type === 'new' && (e.deltaQty ?? e.qty) > 0 ? (e.deltaQty ?? e.qty) : 0), 0);
      const oldQty = Math.max(0, (p.damagedStock || 0) - signed);
      const newQty = Math.max(0, posD);
      const totQty = oldQty + newQty;
      const up     = p.defaultPP || 0;
      const salesV = fch.filter(ch => ch.productName?.toLowerCase() === p.name.toLowerCase())
                       .reduce((s, ch) => s + ch.totalAmount, 0);
      return { name: p.name, sku: p.sku, co: p.company, oldQty, newQty, totQty, oldV: oldQty * up, newV: newQty * up, totV: totQty * up, salesV };
    })
    .filter(r => r.totQty > 0 || r.salesV > 0)
    .sort((a, b) => b.totV - a.totV);

  const tDmgUnits = rows.reduce((s, r) => s + r.totQty, 0);
  const tDmgVal   = rows.reduce((s, r) => s + r.totV, 0);
  const tSalesVal = rows.reduce((s, r) => s + r.salesV, 0);

  drawKpiRow(ctx, [
    { label: 'Damaged Products', value: fmtNum(rows.length),  r: 239, g: 68,  b: 68  },
    { label: 'Total Damage Qty', value: fmtNum(tDmgUnits),    r: 245, g: 158, b: 11  },
    { label: 'Damage Value',     value: fmtTK(tDmgVal),       r: 99,  g: 102, b: 241 },
    { label: 'Recorded Sales',   value: fmtTK(tSalesVal),     r: 16,  g: 185, b: 129 },
  ]);

  drawSectionHeading(ctx, 'Damage Reconciliation Details');
  const cols: ColDef[] = [
    { label: '#',          x: 15 },
    { label: 'Product',    x: 22 },
    { label: 'Company',    x: 82 },
    { label: 'Old Qty',    x: 118 },
    { label: 'New Qty',    x: 133 },
    { label: 'Total Qty',  x: 148 },
    { label: 'Dmg Value',  x: 163 },
    { label: 'Sales Val',  x: 182 },
  ];
  drawTableHeader(ctx, cols);

  rows.forEach((row, i) => {
    maybePageBreak(ctx, 8, dynamicInfo.title, dynamicInfo.subtitle);
    drawTableRow(ctx, cols,
      [
        `${i+1}`,
        clamp(row.name, 24),
        clamp(row.co, 16),
        fmtNum(row.oldQty),
        fmtNum(row.newQty),
        fmtNum(row.totQty),
        fmtTK(row.totV),
        fmtTK(row.salesV),
      ],
      i % 2 === 0,
    );
  });
}

function genProfit(ctx: DocContext, opts: ReportOptions, dynamicInfo: DynamicReportInfo): void {
  drawPageHeader(ctx, dynamicInfo.title, dynamicInfo.subtitle);

  const fch = getFilteredChallans(opts);
  const companies = Array.from(new Set(opts.products.map(p => p.company).filter(Boolean))).sort()
    .filter(co => !opts.filterCompany || opts.filterCompany === 'All' || co === opts.filterCompany);

  const totalExpenses = opts.expenses
    .filter(e => e.expenseDate >= opts.startDate && e.expenseDate <= opts.endDate)
    .reduce((s, e) => s + (e.amount ?? 0), 0);

  let grandRev = 0, grandCost = 0, grandGrossProfit = 0;

  const rows = companies.map(co => {
    const cc   = fch.filter(ch => ch.company === co);
    const rev  = cc.reduce((s, ch) => s + (ch.totalAmount ?? 0), 0);
    const cost = cc.reduce((s, ch) => {
      const prod = opts.products.find(p => (p.name || '').trim().toLowerCase() === (ch.productName || '').trim().toLowerCase());
      const netQty = Math.max(0, (ch.qty ?? 0) - (ch.returnedQty || 0) - (ch.damagedQty || 0));
      return s + (netQty * (prod?.defaultPP ?? ch.rate * 0.80));
    }, 0);
    const grossProfit = rev - cost;
    const margin = rev > 0 ? (grossProfit / rev) * 100 : 0;
    grandRev += rev; grandCost += cost; grandGrossProfit += grossProfit;
    return { co, rev, cost, grossProfit, margin };
  });

  const grandNetProfit = grandGrossProfit - totalExpenses;

  drawKpiRow(ctx, [
    { label: 'Total Revenue',    value: fmtTK(grandRev),        r: 99,  g: 102, b: 241 },
    { label: 'Total COGS',       value: fmtTK(grandCost),       r: 245, g: 158, b: 11  },
    { label: 'Gross Profit',     value: fmtTK(grandGrossProfit),r: 16,  g: 185, b: 129 },
    { label: 'Expenses',         value: fmtTK(totalExpenses),   r: 239, g: 68,  b: 68  },
    { label: 'Net Profit',       value: fmtTK(grandNetProfit),  r: 168, g: 85,  b: 247 },
  ]);

  drawSectionHeading(ctx, 'Company Profit Summary');
  const sumCols: ColDef[] = [
    { label: '#',              x: 15 },
    { label: 'Company',        x: 22 },
    { label: 'Revenue',        x: 98 },
    { label: 'Cost (COGS)',    x: 128 },
    { label: 'Gross Profit',   x: 155 },
    { label: 'Margin %',       x: 185 },
  ];
  drawTableHeader(ctx, sumCols);

  rows.forEach((row, i) => {
    maybePageBreak(ctx, 8, dynamicInfo.title, dynamicInfo.subtitle);
    drawTableRow(ctx, sumCols, [
      `${i+1}`,
      clamp(row.co, 32),
      fmtTK(row.rev),
      fmtTK(row.cost),
      fmtTK(row.grossProfit),
      `${row.margin.toFixed(2)}%`,
    ], i % 2 === 0);
  });
}

function genPriceList(ctx: DocContext, opts: ReportOptions, dynamicInfo: DynamicReportInfo): void {
  drawPageHeader(ctx, dynamicInfo.title, dynamicInfo.subtitle);

  const byCompany = productsByCompany(opts);
  const companies = Object.keys(byCompany).sort();
  const fProds = getFilteredProducts(opts);

  drawKpiRow(ctx, [
    { label: 'Total Companies', value: fmtNum(companies.length), r: 99,  g: 102, b: 241 },
    { label: 'Total Products',  value: fmtNum(fProds.length),     r: 16,  g: 185, b: 129 },
    { label: 'Report Date',     value: ctx.dateStr,              r: 245, g: 158, b: 11  },
    { label: 'Generated By',    value: ctx.generatedBy,          r: 168, g: 85,  b: 247 },
  ]);

  const cols: ColDef[] = [
    { label: '#',               x: 15 },
    { label: 'Product Name',    x: 22 },
    { label: 'SKU',             x: 100 },
    { label: 'DP (TK)',         x: 130 },
    { label: 'TP (TK)',         x: 153 },
    { label: 'MRP (TK)',        x: 172 },
    { label: 'Margin %',        x: 186 },
  ];

  companies.forEach(co => {
    maybePageBreak(ctx, 18, dynamicInfo.title, dynamicInfo.subtitle);
    drawSectionHeading(ctx, `Company: ${ascii(co)}`);
    drawTableHeader(ctx, cols);

    const prods = byCompany[co].sort((a, b) => a.name.localeCompare(b.name));
    prods.forEach((p, i) => {
      maybePageBreak(ctx, 8, dynamicInfo.title, dynamicInfo.subtitle);
      const dp  = p.defaultPP   || 0;
      const tp  = p.defaultWSP  || 0;
      const mrp = p.defaultMRP  || 0;
      const mgn = dp > 0 ? ((tp - dp) / dp) * 100 : 0;
      drawTableRow(ctx, cols,
        [
          `${i+1}`,
          clamp(p.name, 34),
          clamp(p.sku, 12),
          fmtTK(dp),
          fmtTK(tp),
          fmtTK(mrp),
          `${mgn.toFixed(1)}%`,
        ],
        i % 2 === 0,
      );
    });
    ctx.y += 4;
  });
}

function genMargin(ctx: DocContext, opts: ReportOptions, dynamicInfo: DynamicReportInfo): void {
  drawPageHeader(ctx, dynamicInfo.title, dynamicInfo.subtitle);

  const filtered = getFilteredProducts(opts)
    .sort((a, b) => a.company.localeCompare(b.company) || a.name.localeCompare(b.name));

  const avgMgn = filtered.length > 0
    ? filtered.reduce((s, p) => {
        const dp = p.defaultPP || 0;
        const tp = p.defaultWSP || 0;
        return s + (dp > 0 ? ((tp - dp) / dp) * 100 : 0);
      }, 0) / filtered.length
    : 0;

  drawKpiRow(ctx, [
    { label: 'Products Analyzed', value: fmtNum(filtered.length), r: 99,  g: 102, b: 241 },
    { label: 'Avg DP/TP Margin',  value: `${avgMgn.toFixed(1)}%`, r: 16,  g: 185, b: 129 },
    { label: 'Formula',           value: '(TP - DP) / DP * 100', r: 245, g: 158, b: 11  },
    { label: 'Date',              value: ctx.dateStr,              r: 168, g: 85,  b: 247 },
  ]);

  drawSectionHeading(ctx, 'Product-wise Margin Analysis');
  const cols: ColDef[] = [
    { label: '#',            x: 15 },
    { label: 'Product',      x: 22 },
    { label: 'Company',      x: 88 },
    { label: 'DP (TK)',      x: 126 },
    { label: 'TP (TK)',      x: 146 },
    { label: 'MRP (TK)',     x: 164 },
    { label: 'Variance',     x: 178 },
    { label: 'Margin %',     x: 192 },
  ];
  drawTableHeader(ctx, cols);

  filtered.forEach((p, i) => {
    maybePageBreak(ctx, 8, dynamicInfo.title, dynamicInfo.subtitle);
    const dp  = p.defaultPP  || 0;
    const tp  = p.defaultWSP || 0;
    const mrp = p.defaultMRP || 0;
    const vr  = tp - dp;
    const mgn = dp > 0 ? (vr / dp) * 100 : 0;
    drawTableRow(ctx, cols,
      [
        `${i+1}`,
        clamp(p.name, 28),
        clamp(p.company, 16),
        fmtTK(dp),
        fmtTK(tp),
        fmtTK(mrp),
        fmtTK(vr),
        `${mgn.toFixed(1)}%`,
      ],
      i % 2 === 0,
    );
  });
}

function genDayEnd(ctx: DocContext, opts: ReportOptions, dynamicInfo: DynamicReportInfo): void {
  drawPageHeader(ctx, dynamicInfo.title, dynamicInfo.subtitle);

  const fch = getFilteredChallans(opts);
  const companies = Array.from(new Set(opts.products.map(p => p.company).filter(Boolean))).sort()
    .filter(co => !opts.filterCompany || opts.filterCompany === 'All' || co === opts.filterCompany);

  const cols: ColDef[] = [
    { label: '#',          x: 15 },
    { label: 'Product',    x: 22 },
    { label: 'SKU',        x: 75 },
    { label: 'DP',         x: 97 },
    { label: 'TP',         x: 112 },
    { label: 'Opening',    x: 127 },
    { label: 'Sold',       x: 143 },
    { label: 'Closing',    x: 156 },
    { label: 'Sales Amt',  x: 170 },
    { label: 'Stock Amt',  x: 183 },
  ];

  companies.forEach(co => {
    const coProds = opts.products.filter(p => p.company === co).sort((a, b) => a.name.localeCompare(b.name));
    const coChallans = fch.filter(ch => ch.company === co);

    maybePageBreak(ctx, 18, dynamicInfo.title, dynamicInfo.subtitle);
    drawSectionHeading(ctx, `Settlement: ${ascii(co)}`);
    drawTableHeader(ctx, cols);

    let totSalesAmt = 0, totStockAmt = 0, totSalesQty = 0;
    coProds.forEach((p, i) => {
      maybePageBreak(ctx, 8, dynamicInfo.title, dynamicInfo.subtitle);
      const pc       = coChallans.filter(ch => (ch.productName || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase());
      const soldQty  = pc.reduce((s, ch) => s + Math.max(0, (ch.qty ?? 0) - (ch.returnedQty || 0) - (ch.damagedQty || 0)), 0);
      const salesAmt = pc.reduce((s, ch) => s + (ch.totalAmount ?? 0), 0);
      const grossQty = pc.reduce((s, ch) => s + ch.qty, 0);
      const opening  = p.currentStock + grossQty;
      const closing  = p.currentStock;
      const stockAmt = closing * (p.defaultPP || 0);

      totSalesAmt += salesAmt;
      totStockAmt += stockAmt;
      totSalesQty += soldQty;

      drawTableRow(ctx, cols,
        [
          `${i+1}`,
          clamp(p.name, 22),
          clamp(p.sku, 8),
          fmtNum(p.defaultPP || 0),
          fmtNum(p.defaultWSP || 0),
          fmtNum(opening),
          fmtNum(soldQty),
          fmtNum(closing),
          fmtNum(salesAmt),
          fmtNum(stockAmt),
        ],
        i % 2 === 0,
      );
    });

    drawTotalRow(ctx, cols, [
      '', 'SUBTOTAL', '', '', '', '', fmtNum(totSalesQty), '', fmtTK(totSalesAmt), fmtTK(totStockAmt)
    ]);
  });
}

function genClaims(ctx: DocContext, opts: ReportOptions, dynamicInfo: DynamicReportInfo): void {
  drawPageHeader(ctx, dynamicInfo.title, dynamicInfo.subtitle);

  const claimsList = (opts.claims || []).filter(c => {
    const inRange = (!opts.startDate || c.claimDate >= opts.startDate) && (!opts.endDate || c.claimDate <= opts.endDate);
    const inCo    = !opts.filterCompany || opts.filterCompany === 'All' || c.companyName === opts.filterCompany;
    const inSR    = !opts.filterSR      || opts.filterSR      === 'All' || c.srName?.toLowerCase() === opts.filterSR.toLowerCase();
    return inRange && inCo && inSR;
  });

  const totalQty   = claimsList.reduce((s, c) => s + (c.qty || 0), 0);
  const totalValue = claimsList.reduce((s, c) => s + (c.claimValue || 0), 0);
  const pending    = claimsList.filter(c => c.status === 'Pending').length;

  drawKpiRow(ctx, [
    { label: 'Total Claims',    value: fmtNum(claimsList.length), r: 99,  g: 102, b: 241 },
    { label: 'Total Claim Qty', value: fmtNum(totalQty),          r: 245, g: 158, b: 11  },
    { label: 'Claim Value',     value: fmtTK(totalValue),         r: 239, g: 68,  b: 68  },
    { label: 'Pending Claims',  value: fmtNum(pending),           r: 168, g: 85,  b: 247 },
  ]);

  const cols: ColDef[] = [
    { label: '#',        x: 15 },
    { label: 'Date',     x: 22 },
    { label: 'SR',       x: 48 },
    { label: 'Company',  x: 80 },
    { label: 'Product',  x: 115 },
    { label: 'Qty',      x: 155 },
    { label: 'Status',   x: 172 },
  ];
  drawTableHeader(ctx, cols);

  claimsList.forEach((c, i) => {
    maybePageBreak(ctx, 8, dynamicInfo.title, dynamicInfo.subtitle);
    drawTableRow(ctx, cols,
      [
        `${i+1}`,
        c.claimDate || '',
        clamp(c.srName, 14),
        clamp(c.companyName, 16),
        clamp(c.productName, 18),
        fmtNum(c.qty),
        c.status,
      ],
      i % 2 === 0,
      c.status === 'Rejected',
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API: PDF Export
// ─────────────────────────────────────────────────────────────────────────────

export function exportReportPDF(opts: ReportOptions): void {
  const estimatedPages = Math.max(1, Math.ceil(opts.products.length / 25) + Math.ceil(opts.challans.length / 30));
  const ctx = buildCtx(opts, estimatedPages);
  const dynamicInfo = getDynamicReportTitle(opts);

  switch (opts.type) {
    case 'stock':     genStock(ctx, opts, dynamicInfo);     break;
    case 'sales':     genSales(ctx, opts, dynamicInfo);     break;
    case 'damage':    genDamage(ctx, opts, dynamicInfo);    break;
    case 'profit':    genProfit(ctx, opts, dynamicInfo);    break;
    case 'margin':    genMargin(ctx, opts, dynamicInfo);    break;
    case 'pricelist': genPriceList(ctx, opts, dynamicInfo); break;
    case 'dayend':    genDayEnd(ctx, opts, dynamicInfo);    break;
    case 'claims':    genClaims(ctx, opts, dynamicInfo);    break;
  }

  const totalRendered = ctx.doc.getNumberOfPages();
  for (let pg = 1; pg <= totalRendered; pg++) {
    ctx.doc.setPage(pg);
    ctx.currentPage = pg;
    ctx.totalPages  = totalRendered;
    drawPageFooter(ctx);
  }

  const shop    = (opts.shopName || 'ERP').replace(/[^a-zA-Z0-9_]/g, '_');
  const dateTag = new Date().toISOString().split('T')[0];
  ctx.doc.save(`${shop}_${dynamicInfo.fileTag}_${dateTag}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API: Excel / CSV Export
// ─────────────────────────────────────────────────────────────────────────────

export function exportReportExcel(opts: ReportOptions): void {
  const fch = getFilteredChallans(opts);
  const dynamicInfo = getDynamicReportTitle(opts);
  let csv   = '';
  const row = (cells: (string | number)[]) =>
    cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',') + '\n';

  if (opts.type === 'stock') {
    csv += row(['#', 'Product Name', 'Company', 'SKU', 'Carton Size', 'Stock (Pieces)', 'Damaged (Pieces)', 'DP Rate', 'TP Rate', 'MRP', 'Stock Value (DP)']);
    getFilteredProducts(opts).forEach((p, i) => {
      csv += row([i + 1, p.name, p.company, p.sku, p.cartonSize || 24, p.currentStock, p.damagedStock || 0,
                  p.defaultPP || 0, p.defaultWSP || 0, p.defaultMRP || 0,
                  p.currentStock * (p.defaultPP || 0)]);
    });
  } else if (opts.type === 'sales') {
    csv += row(['#', 'Product', 'Company', 'SR', 'Delivery Man', 'Date', 'Qty', 'Returned', 'Damaged', 'Rate', 'Total Amount']);
    fch.forEach((ch, i) => {
      csv += row([i + 1, ch.productName, ch.company || '', ch.srName, ch.deliveryManName,
                  ch.createdAt?.split('T')[0] || '', ch.qty, ch.returnedQty || 0, ch.damagedQty || 0, ch.rate, ch.totalAmount]);
    });
  } else if (opts.type === 'pricelist') {
    csv += row(['#', 'Company', 'Product', 'SKU', 'Carton Multiplier', 'DP Rate', 'TP Rate', 'MRP', 'Margin %']);
    let i = 0;
    getFilteredProducts(opts)
      .sort((a, b) => a.company.localeCompare(b.company) || a.name.localeCompare(b.name))
      .forEach(p => {
        const mgn = (p.defaultPP || 0) > 0 ? ((((p.defaultWSP || 0) - p.defaultPP) / p.defaultPP) * 100).toFixed(2) : '0';
        csv += row([++i, p.company, p.name, p.sku, p.cartonSize || 24, p.defaultPP || 0, p.defaultWSP || 0, p.defaultMRP || 0, mgn]);
      });
  } else if (opts.type === 'damage') {
    csv += row(['#', 'Product', 'Company', 'Old Damaged Qty', 'New Damaged Qty', 'Total Damaged Qty', 'Damage Value (DP)', 'Recorded Sales Value']);
    let i = 0;
    getFilteredProducts(opts).forEach(p => {
      const hist   = p.damageHistory || [];
      const signed = hist.reduce((s, e) => s + (e.type === 'new' ? (e.deltaQty ?? e.qty) : 0), 0);
      const posD   = hist.reduce((s, e) => s + (e.type === 'new' && (e.deltaQty ?? e.qty) > 0 ? (e.deltaQty ?? e.qty) : 0), 0);
      const oldQty = Math.max(0, (p.damagedStock || 0) - signed);
      const newQty = Math.max(0, posD);
      const totQty = oldQty + newQty;
      const up     = p.defaultPP || 0;
      const salesV = fch.filter(ch => ch.productName?.toLowerCase() === p.name.toLowerCase())
                       .reduce((s, ch) => s + ch.totalAmount, 0);
      if (totQty > 0 || salesV > 0) {
        csv += row([++i, p.name, p.company, oldQty, newQty, totQty, totQty * up, salesV]);
      }
    });
  } else if (opts.type === 'profit') {
    csv += row(['#', 'Company', 'Revenue', 'Cost of Goods Sold (DP)', 'Net Profit', 'Profit Margin %']);
    const companies = Array.from(new Set(opts.products.map(p => p.company).filter(Boolean))).sort()
      .filter(co => !opts.filterCompany || opts.filterCompany === 'All' || co === opts.filterCompany);
    let i = 0;
    companies.forEach(co => {
      const cc   = fch.filter(ch => ch.company === co);
      const rev  = cc.reduce((s, ch) => s + (ch.totalAmount ?? 0), 0);
      const cost = cc.reduce((s, ch) => {
        const prod = opts.products.find(p => (p.name || '').trim().toLowerCase() === (ch.productName || '').trim().toLowerCase());
        const netQty = Math.max(0, ch.qty - (ch.returnedQty || 0) - (ch.damagedQty || 0));
        return s + (netQty * (prod?.defaultPP ?? ch.rate * 0.80));
      }, 0);
      const profit = rev - cost;
      const margin = rev > 0 ? (profit / rev) * 100 : 0;
      csv += row([++i, co, rev, cost, profit, `${margin.toFixed(2)}%`]);
    });
  } else if (opts.type === 'margin') {
    csv += row(['#', 'Product', 'Company', 'DP Rate', 'TP Rate', 'MRP', 'Variance (TP-DP)', 'Margin %']);
    let i = 0;
    getFilteredProducts(opts)
      .sort((a, b) => a.company.localeCompare(b.company) || a.name.localeCompare(b.name))
      .forEach(p => {
        const dp  = p.defaultPP  || 0;
        const tp  = p.defaultWSP || 0;
        const mrp = p.defaultMRP || 0;
        const vr  = tp - dp;
        const mgn = dp > 0 ? (vr / dp) * 100 : 0;
        csv += row([++i, p.name, p.company, dp, tp, mrp, vr, `${mgn.toFixed(2)}%`]);
      });
  } else if (opts.type === 'dayend') {
    csv += row(['#', 'Company', 'Product', 'SKU', 'DP', 'TP', 'Opening Stock', 'Sold Qty', 'Closing Stock', 'Sales Amount', 'Stock Valuation (DP)']);
    const companies = Array.from(new Set(opts.products.map(p => p.company).filter(Boolean))).sort()
      .filter(co => !opts.filterCompany || opts.filterCompany === 'All' || co === opts.filterCompany);
    let i = 0;
    companies.forEach(co => {
      const coProds = opts.products.filter(p => p.company === co).sort((a, b) => a.name.localeCompare(b.name));
      const coChallans = fch.filter(ch => ch.company === co);
      coProds.forEach(p => {
        const pc        = coChallans.filter(ch => (ch.productName || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase());
        const salesQty  = pc.reduce((s, ch) => s + Math.max(0, (ch.qty ?? 0) - (ch.returnedQty || 0) - (ch.damagedQty || 0)), 0);
        const salesAmt  = pc.reduce((s, ch) => s + (ch.totalAmount ?? 0), 0);
        const grossQty  = pc.reduce((s, ch) => s + ch.qty, 0);
        const opening   = p.currentStock + grossQty;
        const closing   = p.currentStock;
        const stockAmt  = closing * (p.defaultPP || 0);
        csv += row([++i, co, p.name, p.sku, p.defaultPP || 0, p.defaultWSP || 0, opening, salesQty, closing, salesAmt, stockAmt]);
      });
    });
  } else if (opts.type === 'claims') {
    csv += row(['#', 'Claim Date', 'SR', 'Company', 'Product', 'Quantity', 'Reason', 'Claim Value', 'Status']);
    const claimsList = (opts.claims || []).filter(c => {
      const inRange = (!opts.startDate || c.claimDate >= opts.startDate) && (!opts.endDate || c.claimDate <= opts.endDate);
      const inCo    = !opts.filterCompany || opts.filterCompany === 'All' || c.companyName === opts.filterCompany;
      const inSR    = !opts.filterSR      || opts.filterSR      === 'All' || c.srName?.toLowerCase() === opts.filterSR.toLowerCase();
      return inRange && inCo && inSR;
    });
    claimsList.forEach((c, i) => {
      csv += row([i + 1, c.claimDate, c.srName, c.companyName, c.productName, c.qty, c.reason, c.claimValue || 0, c.status]);
    });
  }

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  const shop = (opts.shopName || 'ERP').replace(/[^a-zA-Z0-9_]/g, '_');
  a.download = `${shop}_${dynamicInfo.fileTag}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API: Professional Filter-Respecting Browser Print Engine
// ─────────────────────────────────────────────────────────────────────────────

export function printReport(opts: ReportOptions): void {
  const fch = getFilteredChallans(opts);
  const fProds = getFilteredProducts(opts);
  const shop = opts.shopName || 'Bangla-Chain ERP';
  const subBrand = opts.shopSubBrand || 'Distribution Management System';
  const nowStr = new Date().toLocaleString('en-BD', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
  const dynamicInfo = getDynamicReportTitle(opts);

  // 1. Build Filter Badges HTML
  const filterBadges: string[] = [];
  if (opts.filterCompany && opts.filterCompany !== 'All') {
    filterBadges.push(`<div class="badge-item"><span class="badge-lbl">Company:</span> <span class="badge-val">${opts.filterCompany}</span></div>`);
  } else {
    filterBadges.push(`<div class="badge-item"><span class="badge-lbl">Company:</span> <span class="badge-val">All Companies (সকল কোম্পানি)</span></div>`);
  }

  if (opts.filterSR && opts.filterSR !== 'All') {
    filterBadges.push(`<div class="badge-item"><span class="badge-lbl">SR Officer:</span> <span class="badge-val">${opts.filterSR}</span></div>`);
  }
  if (opts.filterDM && opts.filterDM !== 'All') {
    filterBadges.push(`<div class="badge-item"><span class="badge-lbl">Delivery Man:</span> <span class="badge-val">${opts.filterDM}</span></div>`);
  }
  filterBadges.push(`<div class="badge-item"><span class="badge-lbl">Period:</span> <span class="badge-val">${opts.startDate} to ${opts.endDate}</span></div>`);
  if (opts.subTab) {
    const subName = opts.subTab === 'sr' ? 'SR Performance' : (opts.subTab === 'dm' ? 'Delivery Logistics' : (opts.subTab === 'product' ? 'Product Breakdown' : (opts.subTab === 'unit' ? 'Unit Breakdown' : 'Company Summary')));
    filterBadges.push(`<div class="badge-item"><span class="badge-lbl">Sub-View:</span> <span class="badge-val">${subName}</span></div>`);
  }

  // 2. Build Report-Specific Content & KPIs
  let kpisHtml = '';
  let tablesHtml = '';

  if (opts.type === 'stock') {
    const totalUnits   = fProds.reduce((s, p) => s + p.currentStock, 0);
    const totalDP      = fProds.reduce((s, p) => s + p.currentStock * (p.defaultPP || 0), 0);
    const totalDamaged = fProds.reduce((s, p) => s + (p.damagedStock || 0), 0);

    kpisHtml = `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-lbl">Total Products</div><div class="kpi-val text-indigo">${fProds.length}</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Stock Units</div><div class="kpi-val text-emerald">${fmtNum(totalUnits)}</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Damaged Stock</div><div class="kpi-val text-red">${fmtNum(totalDamaged)}</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Stock Value (DP)</div><div class="kpi-val text-amber">${fmtBDT(totalDP)}</div></div>
      </div>
    `;

    // Company summary if 'All'
    if (!opts.filterCompany || opts.filterCompany === 'All') {
      const byCompany = productsByCompany(opts);
      const sumRows = Object.keys(byCompany).sort().map((co, i) => {
        const prods = byCompany[co];
        const ctnSum = prods.reduce((s, p) => {
          const cs = (p.cartonSize && p.cartonSize > 1) ? p.cartonSize : 24;
          return s + (p.primaryUnit === 'Carton' ? p.currentStock : Math.floor(p.currentStock / cs));
        }, 0);
        const pcsSum = prods.reduce((s, p) => {
          const cs = (p.cartonSize && p.cartonSize > 1) ? p.cartonSize : 24;
          return s + (p.primaryUnit === 'Carton' ? 0 : p.currentStock % cs);
        }, 0);
        const totalRawPcs = prods.reduce((s, p) => {
          const cs = (p.cartonSize && p.cartonSize > 1) ? p.cartonSize : 24;
          return s + (p.primaryUnit === 'Carton' ? Math.round(p.currentStock * cs) : p.currentStock);
        }, 0);
        const dp = prods.reduce((s, p) => s + p.currentStock * (p.defaultPP || 0), 0);
        return `<tr>
          <td class="text-center">${i+1}</td>
          <td><b>${co}</b></td>
          <td class="text-center">${prods.length}</td>
          <td class="text-right font-mono">${ctnSum} Ctn + ${pcsSum} Pcs (${fmtNum(totalRawPcs)} pcs)</td>
          <td class="text-right font-mono font-bold">${fmtBDT(dp)}</td>
        </tr>`;
      }).join('');

      tablesHtml += `
        <div class="section-title">Company Summary (কোম্পানি অনুযায়ী মোট স্টক)</div>
        <table>
          <thead>
            <tr><th class="text-center" style="width:40px">#</th><th>Company / Brand</th><th class="text-center">Products</th><th class="text-right">Stock Qty (Ctn + Pcs)</th><th class="text-right">Valuation (DP)</th></tr>
          </thead>
          <tbody>
            ${sumRows}
            <tr class="total-row"><td></td><td>GRAND TOTAL</td><td class="text-center">${fProds.length}</td><td class="text-right">${fmtNum(totalUnits)} pcs</td><td class="text-right">${fmtBDT(totalDP)}</td></tr>
          </tbody>
        </table>
      `;
    }

    // Product-wise details
    const detRows = fProds.sort((a, b) => a.company.localeCompare(b.company) || a.name.localeCompare(b.name)).map((p, i) => {
      const dpVal = p.currentStock * (p.defaultPP || 0);
      return `<tr>
        <td class="text-center">${i+1}</td>
        <td><b>${p.name}</b></td>
        <td>${p.company}</td>
        <td class="font-mono text-center">${p.sku}</td>
        <td class="text-center">${p.cartonSize || 24}</td>
        <td class="text-right font-mono">${formatCtnPcs(p.currentStock, p.cartonSize, p.primaryUnit)}</td>
        <td class="text-center font-mono ${p.damagedStock ? 'text-red font-bold' : ''}">${p.damagedStock || 0}</td>
        <td class="text-right font-mono">${fmtBDT(p.defaultPP || 0)}</td>
        <td class="text-right font-mono font-bold">${fmtBDT(dpVal)}</td>
      </tr>`;
    }).join('');

    tablesHtml += `
      <div class="section-title">Product Stock Details (পণ্যভিত্তিক বিস্তারিত স্টক ও দর)</div>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width:35px">#</th>
            <th>Product Name</th>
            <th>Company</th>
            <th class="text-center">SKU</th>
            <th class="text-center">Ctn Size</th>
            <th class="text-right">Current Stock</th>
            <th class="text-center">Damaged</th>
            <th class="text-right">DP Rate</th>
            <th class="text-right">Total DP Value</th>
          </tr>
        </thead>
        <tbody>
          ${detRows}
          <tr class="total-row">
            <td colspan="5" class="text-right"><b>GRAND TOTAL:</b></td>
            <td class="text-right"><b>${fmtNum(totalUnits)} pcs</b></td>
            <td class="text-center"><b>${fmtNum(totalDamaged)}</b></td>
            <td></td>
            <td class="text-right"><b>${fmtBDT(totalDP)}</b></td>
          </tr>
        </tbody>
      </table>
    `;
  } else if (opts.type === 'sales') {
    const totalRev = fch.reduce((s, ch) => s + (ch.totalAmount || 0), 0);
    const totalQty = fch.reduce((s, ch) => s + (ch.qty || 0), 0);
    const totalRet = fch.reduce((s, ch) => s + (ch.returnedQty || 0), 0);
    const totalDmg = fch.reduce((s, ch) => s + (ch.damagedQty || 0), 0);
    const netQty   = Math.max(0, totalQty - totalRet - totalDmg);

    kpisHtml = `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-lbl">Delivered Orders</div><div class="kpi-val text-indigo">${fch.length}</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Net Units Sold</div><div class="kpi-val text-emerald">${fmtNum(netQty)} pcs</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Returns / Damages</div><div class="kpi-val text-red">${fmtNum(totalRet + totalDmg)}</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Total Net Sales</div><div class="kpi-val text-amber">${fmtBDT(totalRev)}</div></div>
      </div>
    `;

    if (opts.subTab === 'sr' || (opts.filterSR && opts.filterSR !== 'All')) {
      // SR performance view
      const activeSRs = opts.filterSR && opts.filterSR !== 'All'
        ? opts.srs.filter(s => s.name.toLowerCase() === opts.filterSR!.toLowerCase())
        : opts.srs;

      const srRows = activeSRs.map((sr, i) => {
        const sc = fch.filter(ch => ch.srName?.toLowerCase() === sr.name.toLowerCase());
        const u  = sc.reduce((s, ch) => s + ch.qty, 0);
        const r  = sc.reduce((s, ch) => s + (ch.returnedQty || 0), 0);
        const d  = sc.reduce((s, ch) => s + (ch.damagedQty || 0), 0);
        const v  = sc.reduce((s, ch) => s + ch.totalAmount, 0);
        if (u === 0 && v === 0) return '';
        return `<tr>
          <td class="text-center">${i+1}</td>
          <td><b>${sr.name}</b></td>
          <td>${sr.phone || '—'}</td>
          <td class="text-center">${sc.length}</td>
          <td class="text-right font-mono">${fmtNum(u)}</td>
          <td class="text-center font-mono ${r ? 'text-amber' : ''}">${r}</td>
          <td class="text-center font-mono ${d ? 'text-red' : ''}">${d}</td>
          <td class="text-right font-mono font-bold">${fmtBDT(v)}</td>
        </tr>`;
      }).filter(Boolean).join('');

      tablesHtml = `
        <div class="section-title">Sales Officer (SR) Performance (এসআর বিক্রয় পারফরম্যান্স)</div>
        <table>
          <thead>
            <tr><th class="text-center" style="width:35px">#</th><th>SR Name</th><th>Phone</th><th class="text-center">Orders</th><th class="text-right">Units Sold</th><th class="text-center">Returns</th><th class="text-center">Damages</th><th class="text-right">Net Revenue</th></tr>
          </thead>
          <tbody>
            ${srRows || '<tr><td colspan="8" class="text-center text-muted">No sales recorded for selected filter.</td></tr>'}
            <tr class="total-row"><td colspan="3"><b>TOTAL</b></td><td class="text-center"><b>${fch.length}</b></td><td class="text-right"><b>${fmtNum(totalQty)}</b></td><td class="text-center"><b>${totalRet}</b></td><td class="text-center"><b>${totalDmg}</b></td><td class="text-right"><b>${fmtBDT(totalRev)}</b></td></tr>
          </tbody>
        </table>
      `;
    } else if (opts.subTab === 'dm' || (opts.filterDM && opts.filterDM !== 'All')) {
      // Delivery man performance view
      const activeDMs = opts.filterDM && opts.filterDM !== 'All'
        ? opts.deliveryMen.filter(d => d.name.toLowerCase() === opts.filterDM!.toLowerCase())
        : opts.deliveryMen;

      const dmRows = activeDMs.map((dm, i) => {
        const dc = fch.filter(ch => ch.deliveryManName?.toLowerCase() === dm.name.toLowerCase());
        const u  = dc.reduce((s, ch) => s + ch.qty, 0);
        const r  = dc.reduce((s, ch) => s + (ch.returnedQty || 0), 0);
        const v  = dc.reduce((s, ch) => s + ch.totalAmount, 0);
        if (u === 0 && v === 0) return '';
        return `<tr>
          <td class="text-center">${i+1}</td>
          <td><b>${dm.name}</b></td>
          <td>${dm.vehicle || '—'}</td>
          <td class="text-center">${dc.length}</td>
          <td class="text-right font-mono">${fmtNum(u)}</td>
          <td class="text-center font-mono ${r ? 'text-amber' : ''}">${r}</td>
          <td class="text-right font-mono font-bold">${fmtBDT(v)}</td>
        </tr>`;
      }).filter(Boolean).join('');

      tablesHtml = `
        <div class="section-title">Delivery Agent Performance (ডেলিভারিম্যান সরবরাহ বিবরণ)</div>
        <table>
          <thead>
            <tr><th class="text-center" style="width:35px">#</th><th>Delivery Man</th><th>Vehicle / Phone</th><th class="text-center">Trips</th><th class="text-right">Delivered Units</th><th class="text-center">Returns</th><th class="text-right">Delivered Value</th></tr>
          </thead>
          <tbody>
            ${dmRows || '<tr><td colspan="7" class="text-center text-muted">No delivery records found.</td></tr>'}
            <tr class="total-row"><td colspan="3"><b>TOTAL</b></td><td class="text-center"><b>${fch.length}</b></td><td class="text-right"><b>${fmtNum(totalQty)}</b></td><td class="text-center"><b>${totalRet}</b></td><td class="text-right"><b>${fmtBDT(totalRev)}</b></td></tr>
          </tbody>
        </table>
      `;
    } else if (opts.subTab === 'product') {
      // Product-wise sales breakdown
      const productRows = fProds.map((p, i) => {
        const pc = fch.filter(ch => ch.productName?.toLowerCase() === p.name.toLowerCase());
        const u  = pc.reduce((s, ch) => s + ch.qty, 0);
        const r  = pc.reduce((s, ch) => s + (ch.returnedQty || 0), 0);
        const d  = pc.reduce((s, ch) => s + (ch.damagedQty || 0), 0);
        const v  = pc.reduce((s, ch) => s + ch.totalAmount, 0);
        if (u === 0 && v === 0) return '';
        return `<tr>
          <td class="text-center">${i+1}</td>
          <td><b>${p.name}</b></td>
          <td>${p.company}</td>
          <td class="font-mono text-center">${p.sku}</td>
          <td class="text-right font-mono">${formatCtnPcs(u, p.cartonSize, p.primaryUnit)}</td>
          <td class="text-center font-mono ${r ? 'text-amber' : ''}">${r}</td>
          <td class="text-center font-mono ${d ? 'text-red' : ''}">${d}</td>
          <td class="text-right font-mono font-bold">${fmtBDT(v)}</td>
        </tr>`;
      }).filter(Boolean).join('');

      tablesHtml = `
        <div class="section-title">Product-wise Sales Breakdown (পণ্যভিত্তিক মোট বিক্রয়)</div>
        <table>
          <thead>
            <tr><th class="text-center" style="width:35px">#</th><th>Product Name</th><th>Company</th><th class="text-center">SKU</th><th class="text-right">Units Sold</th><th class="text-center">Returns</th><th class="text-center">Damages</th><th class="text-right">Net Sales (৳)</th></tr>
          </thead>
          <tbody>
            ${productRows || '<tr><td colspan="8" class="text-center text-muted">No sales found for selected filter.</td></tr>'}
            <tr class="total-row"><td colspan="4"><b>TOTAL</b></td><td class="text-right"><b>${fmtNum(totalQty)} pcs</b></td><td class="text-center"><b>${totalRet}</b></td><td class="text-center"><b>${totalDmg}</b></td><td class="text-right"><b>${fmtBDT(totalRev)}</b></td></tr>
          </tbody>
        </table>
      `;
    } else {
      // Company-wise & Challan Log default
      const companies = Array.from(new Set(fProds.map(p => p.company).filter(Boolean))).sort();
      const coRows = companies.map((co, i) => {
        const cc = fch.filter(ch => ch.company === co);
        const u  = cc.reduce((s, ch) => s + ch.qty, 0);
        const r  = cc.reduce((s, ch) => s + (ch.returnedQty || 0), 0);
        const d  = cc.reduce((s, ch) => s + (ch.damagedQty || 0), 0);
        const v  = cc.reduce((s, ch) => s + ch.totalAmount, 0);
        return `<tr>
          <td class="text-center">${i+1}</td>
          <td><b>${co}</b></td>
          <td class="text-right font-mono">${fmtNum(u)}</td>
          <td class="text-center font-mono ${r ? 'text-amber' : ''}">${r}</td>
          <td class="text-center font-mono ${d ? 'text-red' : ''}">${d}</td>
          <td class="text-right font-mono font-bold">${fmtBDT(v)}</td>
        </tr>`;
      }).join('');

      const challanRows = fch.slice(0, 100).map((ch, i) => `<tr>
        <td class="text-center">${i+1}</td>
        <td><b>${ch.productName}</b><br><span style="font-size:9px;color:#64748b">${ch.company || ''}</span></td>
        <td>${ch.srName}</td>
        <td>${ch.deliveryManName || '—'}</td>
        <td class="text-center">${ch.createdAt ? ch.createdAt.split('T')[0] : '—'}</td>
        <td class="text-right font-mono">${ch.qty}</td>
        <td class="text-center font-mono">${ch.returnedQty || 0}</td>
        <td class="text-right font-mono font-bold">${fmtBDT(ch.totalAmount || 0)}</td>
      </tr>`).join('');

      tablesHtml = `
        <div class="section-title">Company-wise Sales Summary (কোম্পানিভিত্তিক বিক্রয় সংক্ষেপ)</div>
        <table>
          <thead>
            <tr><th class="text-center" style="width:35px">#</th><th>Company / Brand</th><th class="text-right">Sold Units</th><th class="text-center">Returns</th><th class="text-center">Damages</th><th class="text-right">Gross Sales (৳)</th></tr>
          </thead>
          <tbody>
            ${coRows}
            <tr class="total-row"><td></td><td>GRAND TOTAL</td><td class="text-right">${fmtNum(totalQty)}</td><td class="text-center">${totalRet}</td><td class="text-center">${totalDmg}</td><td class="text-right">${fmtBDT(totalRev)}</td></tr>
          </tbody>
        </table>

        <div class="section-title" style="margin-top:24px">Delivered Challans Log (সরবরাহকৃত চালান রেজিস্টার)</div>
        <table>
          <thead>
            <tr><th class="text-center" style="width:35px">#</th><th>Product</th><th>SR</th><th>Delivery Man</th><th class="text-center">Date</th><th class="text-right">Qty</th><th class="text-center">Return</th><th class="text-right">Amount (৳)</th></tr>
          </thead>
          <tbody>
            ${challanRows || '<tr><td colspan="8" class="text-center text-muted">No delivered challans in this period.</td></tr>'}
          </tbody>
        </table>
      `;
    }
  } else if (opts.type === 'damage') {
    const dmgRows = fProds.map(p => {
      const hist   = p.damageHistory || [];
      const signed = hist.reduce((s, e) => s + (e.type === 'new' ? (e.deltaQty ?? e.qty) : 0), 0);
      const posD   = hist.reduce((s, e) => s + (e.type === 'new' && (e.deltaQty ?? e.qty) > 0 ? (e.deltaQty ?? e.qty) : 0), 0);
      const oldQty = Math.max(0, (p.damagedStock || 0) - signed);
      const newQty = Math.max(0, posD);
      const totQty = oldQty + newQty;
      const up     = p.defaultPP || 0;
      const salesV = fch.filter(ch => ch.productName?.toLowerCase() === p.name.toLowerCase())
                       .reduce((s, ch) => s + ch.totalAmount, 0);
      return { name: p.name, sku: p.sku, co: p.company, oldQty, newQty, totQty, oldV: oldQty * up, newV: newQty * up, totV: totQty * up, salesV, up };
    }).filter(r => r.totQty > 0 || r.salesV > 0);

    const tDmgUnits = dmgRows.reduce((s, r) => s + r.totQty, 0);
    const tDmgVal   = dmgRows.reduce((s, r) => s + r.totV, 0);
    const tSalesVal = dmgRows.reduce((s, r) => s + r.salesV, 0);

    kpisHtml = `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-lbl">Damaged Products</div><div class="kpi-val text-red">${dmgRows.length}</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Total Damage Qty</div><div class="kpi-val text-amber">${fmtNum(tDmgUnits)} pcs</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Total Damage Loss (DP)</div><div class="kpi-val text-red">${fmtBDT(tDmgVal)}</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Recorded Sales Value</div><div class="kpi-val text-emerald">${fmtBDT(tSalesVal)}</div></div>
      </div>
    `;

    const dRows = dmgRows.map((r, i) => `<tr>
      <td class="text-center">${i+1}</td>
      <td><b>${r.name}</b></td>
      <td>${r.co}</td>
      <td class="text-center font-mono">${r.oldQty}</td>
      <td class="text-center font-mono">${r.newQty}</td>
      <td class="text-center font-mono font-bold text-red">${r.totQty}</td>
      <td class="text-right font-mono">${fmtBDT(r.up)}</td>
      <td class="text-right font-mono font-bold text-red">${fmtBDT(r.totV)}</td>
    </tr>`).join('');

    tablesHtml = `
      <div class="section-title">Damage Reconciliation Log (নষ্ট ও মেয়াদোত্তীর্ণ পণ্যের বিবরণ)</div>
      <table>
        <thead>
          <tr><th class="text-center" style="width:35px">#</th><th>Product</th><th>Company</th><th class="text-center">Prev Damage</th><th class="text-center">New Damage</th><th class="text-center">Total Dmg</th><th class="text-right">DP Rate</th><th class="text-right">Loss Valuation (DP)</th></tr>
        </thead>
        <tbody>
          ${dRows || '<tr><td colspan="8" class="text-center text-muted">No damages recorded for this filter.</td></tr>'}
          <tr class="total-row"><td colspan="5"><b>TOTAL</b></td><td class="text-center"><b>${fmtNum(tDmgUnits)}</b></td><td></td><td class="text-right"><b>${fmtBDT(tDmgVal)}</b></td></tr>
        </tbody>
      </table>
    `;
  } else if (opts.type === 'profit') {
    const companies = Array.from(new Set(fProds.map(p => p.company).filter(Boolean))).sort();
    const totalExpenses = opts.expenses
      .filter(e => e.expenseDate >= opts.startDate && e.expenseDate <= opts.endDate)
      .reduce((s, e) => s + (e.amount ?? 0), 0);

    let grandRev = 0, grandCost = 0, grandGrossProfit = 0;
    const pRows = companies.map(co => {
      const cc   = fch.filter(ch => ch.company === co);
      const rev  = cc.reduce((s, ch) => s + (ch.totalAmount ?? 0), 0);
      const cost = cc.reduce((s, ch) => {
        const prod = opts.products.find(p => (p.name || '').trim().toLowerCase() === (ch.productName || '').trim().toLowerCase());
        const netQty = Math.max(0, (ch.qty ?? 0) - (ch.returnedQty || 0) - (ch.damagedQty || 0));
        return s + (netQty * (prod?.defaultPP ?? ch.rate * 0.80));
      }, 0);
      const grossProfit = rev - cost;
      const margin = rev > 0 ? (grossProfit / rev) * 100 : 0;
      grandRev += rev; grandCost += cost; grandGrossProfit += grossProfit;
      return { co, rev, cost, grossProfit, margin };
    });
    const grandNetProfit = grandGrossProfit - totalExpenses;

    kpisHtml = `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-lbl">Total Revenue</div><div class="kpi-val text-indigo">${fmtBDT(grandRev)}</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Cost of Goods (COGS)</div><div class="kpi-val text-amber">${fmtBDT(grandCost)}</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Gross Profit</div><div class="kpi-val text-emerald">${fmtBDT(grandGrossProfit)}</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Operating Expenses</div><div class="kpi-val text-red">${fmtBDT(totalExpenses)}</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Net Profit</div><div class="kpi-val text-purple">${fmtBDT(grandNetProfit)}</div></div>
      </div>
    `;

    const rHtml = pRows.map((r, i) => `<tr>
      <td class="text-center">${i+1}</td>
      <td><b>${r.co}</b></td>
      <td class="text-right font-mono">${fmtBDT(r.rev)}</td>
      <td class="text-right font-mono">${fmtBDT(r.cost)}</td>
      <td class="text-right font-mono font-bold ${r.grossProfit >= 0 ? 'text-emerald' : 'text-red'}">${fmtBDT(r.grossProfit)}</td>
      <td class="text-right font-mono font-bold">${r.margin.toFixed(2)}%</td>
    </tr>`).join('');

    tablesHtml = `
      <div class="section-title">Company Profit & Margin Breakdown (কোম্পানিভিত্তিক লাভ ও মার্জিন)</div>
      <table>
        <thead>
          <tr><th class="text-center" style="width:35px">#</th><th>Company / Brand</th><th class="text-right">Sales Revenue</th><th class="text-right">COGS (DP)</th><th class="text-right">Gross Profit</th><th class="text-right">Margin %</th></tr>
        </thead>
        <tbody>
          ${rHtml}
          <tr class="total-row"><td></td><td>GRAND TOTAL</td><td class="text-right">${fmtBDT(grandRev)}</td><td class="text-right">${fmtBDT(grandCost)}</td><td class="text-right">${fmtBDT(grandGrossProfit)}</td><td class="text-right">${grandRev > 0 ? ((grandGrossProfit/grandRev)*100).toFixed(2) : 0}%</td></tr>
        </tbody>
      </table>
    `;
  } else if (opts.type === 'pricelist') {
    kpisHtml = `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-lbl">Catalog Products</div><div class="kpi-val text-indigo">${fProds.length}</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Active Companies</div><div class="kpi-val text-emerald">${Array.from(new Set(fProds.map(p => p.company))).length}</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Date of Pricing</div><div class="kpi-val text-amber">${opts.startDate}</div></div>
      </div>
    `;

    const plRows = fProds.sort((a, b) => a.company.localeCompare(b.company) || a.name.localeCompare(b.name)).map((p, i) => {
      const dp = p.defaultPP || 0;
      const tp = p.defaultWSP || 0;
      const mrp = p.defaultMRP || 0;
      const mgn = dp > 0 ? (((tp - dp) / dp) * 100).toFixed(1) : '0';
      return `<tr>
        <td class="text-center">${i+1}</td>
        <td><b>${p.name}</b></td>
        <td>${p.company}</td>
        <td class="font-mono text-center">${p.sku}</td>
        <td class="text-center">${p.cartonSize || 24} pcs/ctn</td>
        <td class="text-right font-mono font-bold">${fmtBDT(dp)}</td>
        <td class="text-right font-mono font-bold text-indigo">${fmtBDT(tp)}</td>
        <td class="text-right font-mono">${fmtBDT(mrp)}</td>
        <td class="text-right font-mono font-bold text-emerald">${mgn}%</td>
      </tr>`;
    }).join('');

    tablesHtml = `
      <div class="section-title">Official Product Price Schedule (মূল্য তালিকা - DP / TP / MRP)</div>
      <table>
        <thead>
          <tr><th class="text-center" style="width:35px">#</th><th>Product Name</th><th>Company</th><th class="text-center">SKU</th><th class="text-center">Packaging</th><th class="text-right">Dealer Price (DP)</th><th class="text-right">Trade Price (TP)</th><th class="text-right">MRP</th><th class="text-right">Margin %</th></tr>
        </thead>
        <tbody>${plRows}</tbody>
      </table>
    `;
  } else if (opts.type === 'margin') {
    const mRows = fProds.map((p, i) => {
      const dp = p.defaultPP || 0;
      const tp = p.defaultWSP || 0;
      const mrp = p.defaultMRP || 0;
      const vr = tp - dp;
      const mgn = dp > 0 ? ((vr / dp) * 100).toFixed(1) : '0';
      return `<tr>
        <td class="text-center">${i+1}</td>
        <td><b>${p.name}</b></td>
        <td>${p.company}</td>
        <td class="text-right font-mono">${fmtBDT(dp)}</td>
        <td class="text-right font-mono">${fmtBDT(tp)}</td>
        <td class="text-right font-mono">${fmtBDT(mrp)}</td>
        <td class="text-right font-mono font-bold text-emerald">+${fmtBDT(vr)}</td>
        <td class="text-right font-mono font-bold text-indigo">${mgn}%</td>
      </tr>`;
    }).join('');

    tablesHtml = `
      <div class="section-title">Margin Variance Schedule (লাভের মার্জিন বিশ্লেষণ)</div>
      <table>
        <thead>
          <tr><th class="text-center" style="width:35px">#</th><th>Product</th><th>Company</th><th class="text-right">DP</th><th class="text-right">TP</th><th class="text-right">MRP</th><th class="text-right">Variance (TP-DP)</th><th class="text-right">Margin %</th></tr>
        </thead>
        <tbody>${mRows}</tbody>
      </table>
    `;
  } else if (opts.type === 'dayend') {
    const companies = Array.from(new Set(fProds.map(p => p.company).filter(Boolean))).sort();
    const dRows = companies.map(co => {
      const coProds = fProds.filter(p => p.company === co);
      const coChallans = fch.filter(ch => ch.company === co);
      const rows = coProds.map((p, i) => {
        const pc = coChallans.filter(ch => (ch.productName || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase());
        const soldQty = pc.reduce((s, ch) => s + Math.max(0, (ch.qty ?? 0) - (ch.returnedQty || 0) - (ch.damagedQty || 0)), 0);
        const salesAmt = pc.reduce((s, ch) => s + (ch.totalAmount ?? 0), 0);
        const grossQty = pc.reduce((s, ch) => s + ch.qty, 0);
        const opening = p.currentStock + grossQty;
        const closing = p.currentStock;
        const stockAmt = closing * (p.defaultPP || 0);
        return `<tr>
          <td class="text-center">${i+1}</td>
          <td><b>${p.name}</b></td>
          <td class="font-mono text-center">${p.sku}</td>
          <td class="text-right font-mono">${fmtBDT(p.defaultPP || 0)}</td>
          <td class="text-right font-mono">${fmtBDT(p.defaultWSP || 0)}</td>
          <td class="text-center font-mono">${opening}</td>
          <td class="text-center font-mono font-bold text-emerald">${soldQty}</td>
          <td class="text-center font-mono">${closing}</td>
          <td class="text-right font-mono font-bold">${fmtBDT(salesAmt)}</td>
          <td class="text-right font-mono">${fmtBDT(stockAmt)}</td>
        </tr>`;
      }).join('');

      return `
        <div class="section-title" style="margin-top:16px">${co} — Daily Settlement</div>
        <table>
          <thead>
            <tr><th class="text-center" style="width:35px">#</th><th>Product</th><th class="text-center">SKU</th><th class="text-right">DP</th><th class="text-right">TP</th><th class="text-center">Opening</th><th class="text-center">Sold</th><th class="text-center">Closing</th><th class="text-right">Sales (৳)</th><th class="text-right">Stock (৳)</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }).join('');

    tablesHtml = dRows;
  } else if (opts.type === 'claims') {
    const claimsList = (opts.claims || []).filter(c => {
      const inRange = (!opts.startDate || c.claimDate >= opts.startDate) && (!opts.endDate || c.claimDate <= opts.endDate);
      const inCo    = !opts.filterCompany || opts.filterCompany === 'All' || c.companyName === opts.filterCompany;
      const inSR    = !opts.filterSR      || opts.filterSR      === 'All' || c.srName?.toLowerCase() === opts.filterSR.toLowerCase();
      return inRange && inCo && inSR;
    });

    const totalQty   = claimsList.reduce((s, c) => s + (c.qty || 0), 0);
    const totalValue = claimsList.reduce((s, c) => s + (c.claimValue || 0), 0);

    kpisHtml = `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-lbl">Total Claims</div><div class="kpi-val text-indigo">${claimsList.length}</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Total Claim Qty</div><div class="kpi-val text-amber">${fmtNum(totalQty)} pcs</div></div>
        <div class="kpi-card"><div class="kpi-lbl">Total Claim Value</div><div class="kpi-val text-red">${fmtBDT(totalValue)}</div></div>
      </div>
    `;

    const cRows = claimsList.map((c, i) => `<tr>
      <td class="text-center">${i+1}</td>
      <td class="text-center">${c.claimDate}</td>
      <td><b>${c.srName}</b></td>
      <td>${c.companyName}</td>
      <td>${c.productName}</td>
      <td class="text-center font-mono font-bold">${c.qty}</td>
      <td>${c.reason}</td>
      <td class="text-right font-mono font-bold">${fmtBDT(c.claimValue || 0)}</td>
      <td class="text-center"><span class="badge ${c.status === 'Approved' ? 'badge-green' : c.status === 'Rejected' ? 'badge-red' : 'badge-amber'}">${c.status}</span></td>
    </tr>`).join('');

    tablesHtml = `
      <div class="section-title">Claims & Damage Replacement Log (ক্লেইম ও ক্ষতিপূরণ লগ)</div>
      <table>
        <thead>
          <tr><th class="text-center" style="width:35px">#</th><th class="text-center">Date</th><th>SR</th><th>Company</th><th>Product</th><th class="text-center">Qty</th><th>Reason</th><th class="text-right">Value (৳)</th><th class="text-center">Status</th></tr>
        </thead>
        <tbody>
          ${cRows || '<tr><td colspan="9" class="text-center text-muted">No claims recorded for this filter.</td></tr>'}
        </tbody>
      </table>
    `;
  }

  // 3. Render HTML into Browser Print Window
  const w = window.open('', '_blank', 'width=1080,height=800');
  if (!w) { alert('Pop-up blocked — please allow pop-ups for this site.'); return; }

  w.document.write(`<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <title>${dynamicInfo.title} — ${shop}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans Bengali', sans-serif; font-size: 11px; color: #0f172a; background: #fff; padding: 24px 32px; line-height: 1.4; }
    @media print {
      body { padding: 6mm 8mm; font-size: 10.5px; }
      @page { size: A4 portrait; margin: 8mm 6mm; }
      .no-print { display: none !important; }
      tr { page-break-inside: avoid; }
      thead { display: table-header-group; }
    }
    
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 2.5px solid #0f172a; }
    .brand h1 { font-size: 19px; font-weight: 900; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px; }
    .brand p { font-size: 10px; font-weight: 600; color: #475569; margin-top: 2px; }
    .doc-meta { text-align: right; }
    .doc-meta .doc-type { font-size: 12.5px; font-weight: 900; text-transform: uppercase; color: #1e1b4b; background: #e0e7ff; padding: 4px 10px; display: inline-block; border-left: 3px solid #4338ca; }
    .doc-meta .doc-sub { font-size: 9px; color: #64748b; margin-top: 4px; font-weight: 600; }

    /* Filter Badges Bar */
    .filter-bar { display: flex; flex-wrap: wrap; gap: 8px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 12px; margin-bottom: 14px; }
    .badge-item { font-size: 9.5px; color: #334155; background: #ffffff; border: 1px solid #e2e8f0; padding: 3px 8px; display: inline-flex; align-items: center; gap: 4px; }
    .badge-lbl { font-weight: 800; color: #64748b; text-transform: uppercase; font-size: 8.5px; }
    .badge-val { font-weight: 700; color: #0f172a; }

    /* KPIs */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 16px; }
    .kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; border-left: 3.5px solid #6366f1; padding: 7px 10px; }
    .kpi-lbl { font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.3px; }
    .kpi-val { font-size: 13px; font-weight: 900; margin-top: 2px; font-family: monospace; }

    .text-indigo { color: #4338ca; }
    .text-emerald { color: #047857; }
    .text-amber { color: #b45309; }
    .text-red { color: #b91c1c; }
    .text-purple { color: #6b21a8; }
    .text-muted { color: #94a3b8; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 800; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    /* Section Headings */
    .section-title { font-size: 10.5px; font-weight: 900; text-transform: uppercase; color: #0f172a; background: #f1f5f9; padding: 5px 8px; border-left: 3px solid #0f172a; margin-top: 14px; margin-bottom: 6px; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
    thead tr { background: #0f172a; color: #ffffff; }
    thead th { padding: 6px 7px; text-align: left; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; }
    tbody tr { border-bottom: 1px solid #e2e8f0; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 5.5px 7px; color: #1e293b; }
    .total-row { background: #e2e8f0 !important; font-weight: 900; color: #0f172a; border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; }
    .total-row td { padding: 6px 7px; }

    /* Badges */
    .badge { display: inline-block; padding: 2px 6px; font-size: 8.5px; font-weight: 800; border-radius: 2px; }
    .badge-green { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .badge-amber { background: #fef9c3; color: #a16207; border: 1px solid #fde047; }
    .badge-red { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

    /* Signatures */
    .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 36px; margin-top: 40px; page-break-inside: avoid; }
    .sig-box { border-top: 1px solid #94a3b8; padding-top: 5px; text-align: center; font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; }

    /* Footer */
    .footer { margin-top: 20px; padding-top: 8px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 8.5px; color: #94a3b8; }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="brand">
      <h1>${shop}</h1>
      <p>${subBrand}</p>
    </div>
    <div class="doc-meta">
      <div class="doc-type">${dynamicInfo.title}</div>
      <div class="doc-sub">Printed: ${nowStr}</div>
      <div class="doc-sub">Prepared By: ${opts.generatedBy || 'Admin'}</div>
    </div>
  </div>

  <!-- Active Filter Badges Bar -->
  <div class="filter-bar">
    ${filterBadges.join('')}
  </div>

  <!-- KPIs -->
  ${kpisHtml}

  <!-- Data Tables -->
  ${tablesHtml}

  <!-- Signatures Block -->
  <div class="signatures">
    <div class="sig-box">Prepared By (SR / Operator)</div>
    <div class="sig-box">Verified By (Accountant / Storekeeper)</div>
    <div class="sig-box">Approved By (Dealer / Admin)</div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>Bangla-Chain DMS — Distribution & Enterprise Management Engine</span>
    <span>Generated on ${nowStr}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`);
  w.document.close();
}
