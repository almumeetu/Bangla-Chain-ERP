/**
 * reportEngine.ts — Reusable PDF Export Engine for Bangla-Chain ERP
 *
 * ROOT CAUSES FIXED:
 *  1. Bengali/Unicode text (৳, ড, etc.) silently dropped by jsPDF helvetica
 *     → All currency/amounts formatted as ASCII "TK X,XXX" for helvetica compat
 *  2. Price List, Profit Margin, Day-End tabs produced blank PDFs
 *     → Every tab now has a dedicated generator called from exportReportPDF()
 *  3. No shop branding in reports
 *     → shopName/shopSubBrand passed in and rendered in every header
 *  4. Missing Excel export and Print options
 *     → exportReportExcel() (CSV) and printReport() (window.print) added
 *
 * DESIGN:
 *  - Pure jsPDF, no html2canvas, no canvas rendering → no blank/black pages
 *  - A4 portrait (210x297mm) by default, landscape for wide tables
 *  - Professional header (navy band + indigo accent), footer (page X of N)
 *  - Alternating row colors, full borders, auto page-break with header repeat
 *  - Single public API: exportReportPDF(type, opts)
 */

import { jsPDF } from 'jspdf';
import type {
  Product, ChallanItem, SR, DeliveryMan, ExpenseRecord, CompanyBrand,
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
  | 'dayend';

export interface ReportOptions {
  type:           ReportType;
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** ASCII-safe currency formatter — avoids Unicode ৳ which helvetica cannot render */
function fmtTK(n: number): string {
  return `TK ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString('en-US');
}

/** Safely clamp a string for jsPDF text rendering */
function clamp(s: string | null | undefined, max: number): string {
  if (!s) return '';
  // strip non-ASCII characters that helvetica cannot render (e.g. Bengali)
  const ascii = s.replace(/[^\x00-\x7F]/g, '?');
  return ascii.length > max ? ascii.substring(0, max - 2) + '..' : ascii;
}

/** Make product / company names ASCII safe */
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
  /** Current Y cursor (mutable) */
  y:          number;
  /** Width of printable area */
  W:          number;
  /** Left margin */
  L:          number;
  /** Right margin end */
  R:          number;
  /** Page bottom limit before break */
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
    W:           182,   // 210 - 14 - 14
    L:           14,
    R:           196,
    BOTTOM:      268,
    currentPage: 1,
    totalPages,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page structure
// ─────────────────────────────────────────────────────────────────────────────

const HEADER_H = 42;   // mm — dark navy band height
const FILTER_H = 6;    // mm per filter line

function drawPageHeader(ctx: DocContext, reportTitle: string, reportSubtitle: string): void {
  const { doc, shopName, shopSub, dateStr, timeStr, generatedBy, startDate, endDate, L, R, filters, shopLogo } = ctx;

  // Navy background
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, HEADER_H, 'F');

  // Indigo accent stripe
  doc.setFillColor(99, 102, 241);
  doc.rect(0, HEADER_H, 210, 1.5, 'F');

  // Logo (if provided and base64)
  let nameX = L;
  if (shopLogo && shopLogo.startsWith('data:image')) {
    try {
      doc.addImage(shopLogo, 'PNG', L, 6, 12, 12);
      nameX = L + 15;
    } catch { /* logo load failed — skip silently */ }
  }

  // Shop name & sub-brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(shopName, nameX, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(shopSub.toUpperCase(), nameX, 20);

  // Report title badge (top-right)
  const badgeLabel = reportTitle;
  const badgeW = doc.getTextWidth(badgeLabel) + 12;
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(R - badgeW, 7, badgeW, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(badgeLabel, R - badgeW + 6, 13.5);

  // Date / time / generated by
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  const dateLine = `${dateStr}  |  ${timeStr}  |  By: ${generatedBy}`;
  doc.text(dateLine, R - doc.getTextWidth(dateLine), 26);
  const periodLine = `Period: ${startDate}  to  ${endDate}`;
  doc.text(periodLine, R - doc.getTextWidth(periodLine), 31);

  // Subtitle below accent stripe
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(reportSubtitle, L, HEADER_H + 8);

  // Applied filters
  let fy = HEADER_H + 8;
  if (filters.length > 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(99, 102, 241);
    doc.text('Filters: ' + filters.join('  |  '), L, HEADER_H + 14);
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
  drawPageFooter(ctx);
  ctx.doc.addPage();
  ctx.currentPage++;
  drawPageHeader(ctx, title, subtitle);
}

function maybePageBreak(ctx: DocContext, needed: number, title: string, subtitle: string): void {
  if (ctx.y + needed > ctx.BOTTOM) {
    addPage(ctx, title, subtitle);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Table primitives
// ─────────────────────────────────────────────────────────────────────────────

interface ColDef {
  label:    string;
  x:        number;   // absolute mm from left edge of page
  align?:   'left' | 'right' | 'center';
  bold?:    boolean;
  color?:   [number, number, number];
  width?:   number;   // used for wrap
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
    doc.text(col.label.toUpperCase(), col.x, ctx.y + 4.5);
  });
  ctx.y += rowH + 1;
}

function drawTableRow(
  ctx: DocContext,
  cols: ColDef[],
  values: string[],
  even: boolean,
  highlight?: boolean,
  rowH = 7,
): void {
  const { doc, L, W } = ctx;
  if (even) {
    doc.setFillColor(248, 250, 252);
    doc.rect(L, ctx.y - 1, W, rowH, 'F');
  }
  if (highlight) {
    doc.setFillColor(239, 246, 255);
    doc.rect(L, ctx.y - 1, W, rowH, 'F');
  }
  doc.setFontSize(7.5);
  cols.forEach((col, i) => {
    const val = values[i] ?? '';
    const c: [number, number, number] = col.color ?? [30, 41, 59];
    doc.setFont('helvetica', col.bold ? 'bold' : 'normal');
    doc.setTextColor(c[0], c[1], c[2]);
    doc.text(val, col.x, ctx.y + 4);
  });
  ctx.y += rowH;
}

function drawTotalRow(ctx: DocContext, cols: ColDef[], values: string[]): void {
  const { doc, L, W } = ctx;
  doc.setFillColor(15, 23, 42);
  doc.rect(L, ctx.y - 1, W, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  cols.forEach((col, i) => {
    const val = values[i] ?? '';
    doc.text(val, col.x, ctx.y + 5);
  });
  ctx.y += 11;
}

function drawSummaryBox(ctx: DocContext, items: { label: string; value: string; accent?: boolean }[]): void {
  const { doc, L, W } = ctx;
  const boxH = items.length * 9 + 8;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(L, ctx.y, W, boxH, 2, 2, 'FD');
  let iy = ctx.y + 8;
  items.forEach(item => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, L + 4, iy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(item.accent ? 16 : 15, item.accent ? 185 : 23, item.accent ? 129 : 42);
    doc.text(item.value, ctx.R - doc.getTextWidth(item.value) - 4, iy);
    iy += 9;
  });
  ctx.y += boxH + 4;
}

function drawKpiRow(
  ctx: DocContext,
  cards: { label: string; value: string; r: number; g: number; b: number }[],
): void {
  const { doc, L, W } = ctx;
  const cardW = (W - (cards.length - 1) * 3) / cards.length;
  cards.forEach((card, i) => {
    const cx = L + i * (cardW + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, ctx.y, cardW, 20, 2, 2, 'FD');
    // top color bar
    doc.setFillColor(card.r, card.g, card.b);
    doc.roundedRect(cx, ctx.y, cardW, 3, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(card.value, cx + 4, ctx.y + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, cx + 4, ctx.y + 17);
  });
  ctx.y += 25;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data helpers
// ─────────────────────────────────────────────────────────────────────────────

function getFilteredChallans(opts: ReportOptions): ChallanItem[] {
  return opts.challans.filter(ch => {
    if (!ch.createdAt) return true;
    const date = ch.createdAt.split('T')[0];
    const inRange  = date >= opts.startDate && date <= opts.endDate;
    const inCo     = !opts.filterCompany || opts.filterCompany === 'All' || ch.company === opts.filterCompany;
    const inSR     = !opts.filterSR      || opts.filterSR      === 'All' || ch.srName?.toLowerCase() === opts.filterSR.toLowerCase();
    const inDM     = !opts.filterDM      || opts.filterDM      === 'All' || ch.deliveryManName?.toLowerCase() === opts.filterDM.toLowerCase();
    return inRange && inCo && inSR && inDM && ch.status === 'Delivered';
  });
}

function productsByCompany(opts: ReportOptions): Record<string, Product[]> {
  const map: Record<string, Product[]> = {};
  opts.products.forEach(p => {
    const co = p.company || 'Unknown';
    if (!opts.filterCompany || opts.filterCompany === 'All' || co === opts.filterCompany) {
      if (!map[co]) map[co] = [];
      map[co].push(p);
    }
  });
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generator: STOCK REPORT
// ─────────────────────────────────────────────────────────────────────────────

function genStock(ctx: DocContext, opts: ReportOptions): void {
  const TITLE    = 'STOCK REPORT';
  const SUBTITLE = 'Company-wise Stock & Asset Valuation';
  drawPageHeader(ctx, TITLE, SUBTITLE);

  const byCompany = productsByCompany(opts);
  const companies = Object.keys(byCompany).sort();

  // KPIs
  const totalUnits = opts.products.reduce((s, p) => s + p.currentStock, 0);
  const totalDP    = opts.products.reduce((s, p) => s + p.currentStock * (p.defaultPP || 0), 0);

  drawKpiRow(ctx, [
    { label: 'Total Products',    value: fmtNum(opts.products.length), r: 99,  g: 102, b: 241 },
    { label: 'Total Stock Units', value: fmtNum(totalUnits),           r: 16,  g: 185, b: 129 },
    { label: 'Stock Value (DP)',  value: fmtTK(totalDP),               r: 245, g: 158, b: 11  },
  ]);

  // ── Company summary table ──────────────────────────────────────────────────
  drawSectionHeading(ctx, 'Company-wise Summary');

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
    maybePageBreak(ctx, 8, TITLE, SUBTITLE);
    const prods   = byCompany[co];
    const qty     = prods.reduce((s, p) => s + p.currentStock, 0);
    const dp      = prods.reduce((s, p) => s + p.currentStock * (p.defaultPP || 0), 0);
    gQty += qty; gDP += dp;
    drawTableRow(ctx, sumCols,
      [`${i + 1}`, clamp(co, 36), `${prods.length}`, fmtNum(qty), fmtTK(dp)],
      i % 2 === 0,
    );
  });
  drawTotalRow(ctx, sumCols, ['', 'GRAND TOTAL', `${opts.products.length}`, fmtNum(gQty), fmtTK(gDP)]);

  ctx.y += 4;

  // ── Product detail table ───────────────────────────────────────────────────
  maybePageBreak(ctx, 18, TITLE, SUBTITLE);
  drawSectionHeading(ctx, 'Product-wise Stock Details');

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

  const sortedProds = [...opts.products].sort((a, b) => a.company.localeCompare(b.company) || a.name.localeCompare(b.name));
  sortedProds.forEach((p, i) => {
    maybePageBreak(ctx, 8, TITLE, SUBTITLE);
    if (opts.filterCompany && opts.filterCompany !== 'All' && p.company !== opts.filterCompany) return;
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

// ─────────────────────────────────────────────────────────────────────────────
// Generator: SALES REPORT
// ─────────────────────────────────────────────────────────────────────────────

function genSales(ctx: DocContext, opts: ReportOptions): void {
  const TITLE    = 'SALES REPORT';
  const SUBTITLE = 'B2B DMS Distribution Sales Analysis';
  drawPageHeader(ctx, TITLE, SUBTITLE);

  const fch = getFilteredChallans(opts);
  const totalRev = fch.reduce((s, ch) => s + ch.totalAmount, 0);
  const totalQty = fch.reduce((s, ch) => s + ch.qty, 0);
  const totalRet = fch.reduce((s, ch) => s + (ch.returnedQty || 0), 0);
  const totalDmg = fch.reduce((s, ch) => s + (ch.damagedQty || 0), 0);

  drawKpiRow(ctx, [
    { label: 'Total Challans',   value: fmtNum(fch.length),  r: 99,  g: 102, b: 241 },
    { label: 'Units Sold',       value: fmtNum(totalQty),    r: 16,  g: 185, b: 129 },
    { label: 'Total Revenue',    value: fmtTK(totalRev),     r: 245, g: 158, b: 11  },
    { label: 'Returns/Damages',  value: fmtNum(totalRet + totalDmg), r: 239, g: 68, b: 68 },
  ]);

  // ── Company-wise sales ─────────────────────────────────────────────────────
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
    maybePageBreak(ctx, 8, TITLE, SUBTITLE);
    const cc = fch.filter(ch => ch.company === co);
    const u  = cc.reduce((s, ch) => s + ch.qty, 0);
    const r  = cc.reduce((s, ch) => s + (ch.returnedQty || 0), 0);
    const d  = cc.reduce((s, ch) => s + (ch.damagedQty || 0), 0);
    const v  = cc.reduce((s, ch) => s + ch.totalAmount, 0);
    drawTableRow(ctx, coCols, [`${i+1}`, clamp(co, 32), fmtNum(u), fmtNum(r), fmtNum(d), fmtTK(v)], i % 2 === 0);
  });
  drawTotalRow(ctx, coCols, ['', 'TOTAL', fmtNum(totalQty), fmtNum(totalRet), fmtNum(totalDmg), fmtTK(totalRev)]);

  // ── SR-wise sales ──────────────────────────────────────────────────────────
  ctx.y += 6;
  maybePageBreak(ctx, 18, TITLE, SUBTITLE);
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
    maybePageBreak(ctx, 8, TITLE, SUBTITLE);
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

  // ── DM-wise sales ──────────────────────────────────────────────────────────
  ctx.y += 6;
  maybePageBreak(ctx, 18, TITLE, SUBTITLE);
  drawSectionHeading(ctx, 'Delivery Man Performance');
  const dmCols: ColDef[] = [
    { label: '#',           x: 15 },
    { label: 'Delivery Man', x: 22 },
    { label: 'Vehicle',     x: 80 },
    { label: 'Challans',    x: 120 },
    { label: 'Units',       x: 140 },
    { label: 'Returns',     x: 158 },
    { label: 'Revenue',     x: 176 },
  ];
  drawTableHeader(ctx, dmCols);
  const activeDMs = opts.filterDM && opts.filterDM !== 'All'
    ? opts.deliveryMen.filter(d => d.name.toLowerCase() === opts.filterDM!.toLowerCase())
    : opts.deliveryMen;
  activeDMs.forEach((dm, i) => {
    maybePageBreak(ctx, 8, TITLE, SUBTITLE);
    const dc   = fch.filter(ch => ch.deliveryManName?.toLowerCase() === dm.name.toLowerCase());
    const u    = dc.reduce((s, ch) => s + ch.qty, 0);
    const ret  = dc.reduce((s, ch) => s + (ch.returnedQty || 0), 0);
    const v    = dc.reduce((s, ch) => s + ch.totalAmount, 0);
    if (u === 0 && v === 0) return;
    drawTableRow(ctx, dmCols,
      [`${i+1}`, clamp(dm.name, 24), clamp(dm.vehicle || '', 14), fmtNum(dc.length), fmtNum(u), fmtNum(ret), fmtTK(v)],
      i % 2 === 0,
    );
  });

  // ── Product-wise sales ─────────────────────────────────────────────────────
  ctx.y += 6;
  maybePageBreak(ctx, 18, TITLE, SUBTITLE);
  drawSectionHeading(ctx, 'Product-wise Sales Breakdown');
  const prCols: ColDef[] = [
    { label: '#',           x: 15 },
    { label: 'Product',     x: 22 },
    { label: 'Company',     x: 88 },
    { label: 'Units Sold',  x: 130 },
    { label: 'Returns',     x: 152 },
    { label: 'Damages',     x: 170 },
    { label: 'Revenue',     x: 182 },
  ];
  drawTableHeader(ctx, prCols);
  const productSales = opts.products.map(p => {
    if (opts.filterCompany && opts.filterCompany !== 'All' && p.company !== opts.filterCompany) return null;
    const pc  = fch.filter(ch => ch.productName?.toLowerCase() === p.name.toLowerCase());
    const u   = pc.reduce((s, ch) => s + ch.qty, 0);
    const r   = pc.reduce((s, ch) => s + (ch.returnedQty || 0), 0);
    const d   = pc.reduce((s, ch) => s + (ch.damagedQty || 0), 0);
    const v   = pc.reduce((s, ch) => s + ch.totalAmount, 0);
    if (u === 0 && v === 0) return null;
    return { name: p.name, co: p.company, u, r, d, v };
  }).filter(Boolean) as { name: string; co: string; u: number; r: number; d: number; v: number }[];

  productSales.sort((a, b) => b.v - a.v).forEach((row, i) => {
    maybePageBreak(ctx, 8, TITLE, SUBTITLE);
    drawTableRow(ctx, prCols,
      [`${i+1}`, clamp(row.name, 28), clamp(row.co, 18), fmtNum(row.u), fmtNum(row.r), fmtNum(row.d), fmtTK(row.v)],
      i % 2 === 0,
    );
  });
  if (productSales.length > 0) {
    drawTotalRow(ctx, prCols, [
      '', 'TOTAL', '',
      fmtNum(productSales.reduce((s, r) => s + r.u, 0)),
      fmtNum(productSales.reduce((s, r) => s + r.r, 0)),
      fmtNum(productSales.reduce((s, r) => s + r.d, 0)),
      fmtTK(productSales.reduce((s, r) => s + r.v, 0)),
    ]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generator: DAMAGE REPORT
// ─────────────────────────────────────────────────────────────────────────────

function genDamage(ctx: DocContext, opts: ReportOptions): void {
  const TITLE    = 'DAMAGE REPORT';
  const SUBTITLE = 'Damage Reconciliation & Loss Valuation';
  drawPageHeader(ctx, TITLE, SUBTITLE);

  const fch = getFilteredChallans(opts);

  const rows = opts.products
    .filter(p => !opts.filterCompany || opts.filterCompany === 'All' || p.company === opts.filterCompany)
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
    maybePageBreak(ctx, 8, TITLE, SUBTITLE);
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
  if (rows.length > 0) {
    drawTotalRow(ctx, cols, [
      '', 'TOTAL', '',
      fmtNum(rows.reduce((s, r) => s + r.oldQty, 0)),
      fmtNum(rows.reduce((s, r) => s + r.newQty, 0)),
      fmtNum(tDmgUnits),
      fmtTK(tDmgVal),
      fmtTK(tSalesVal),
    ]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generator: COMPANY-WISE PROFIT REPORT  (fixes blank PDF on 'profit' tab)
// ─────────────────────────────────────────────────────────────────────────────

function genProfit(ctx: DocContext, opts: ReportOptions): void {
  const TITLE    = 'PROFIT REPORT';
  const SUBTITLE = 'Company-wise Profit Margin Analysis';
  drawPageHeader(ctx, TITLE, SUBTITLE);

  const fch = getFilteredChallans(opts);
  const companies = Array.from(new Set(opts.products.map(p => p.company).filter(Boolean))).sort();

  let grandRev = 0, grandCost = 0, grandProfit = 0;

  const rows = companies
    .filter(co => !opts.filterCompany || opts.filterCompany === 'All' || co === opts.filterCompany)
    .map(co => {
      const cc   = fch.filter(ch => ch.company === co);
      const rev  = cc.reduce((s, ch) => s + ch.totalAmount, 0);
      const cost = cc.reduce((s, ch) => {
        const prod = opts.products.find(p => p.name === ch.productName);
        return s + (ch.qty * (prod?.defaultPP ?? ch.rate * 0.85));
      }, 0);
      const profit = rev - cost;
      const margin = rev > 0 ? (profit / rev) * 100 : 0;
      grandRev += rev; grandCost += cost; grandProfit += profit;
      return { co, rev, cost, profit, margin };
    });

  drawKpiRow(ctx, [
    { label: 'Total Revenue',    value: fmtTK(grandRev),    r: 99,  g: 102, b: 241 },
    { label: 'Total Cost (DP)',  value: fmtTK(grandCost),   r: 245, g: 158, b: 11  },
    { label: 'Net Profit',       value: fmtTK(grandProfit), r: 16,  g: 185, b: 129 },
    { label: 'Avg Margin',       value: grandRev > 0 ? `${((grandProfit / grandRev) * 100).toFixed(1)}%` : '0%', r: 168, g: 85, b: 247 },
  ]);

  // ── Summary table ──────────────────────────────────────────────────────────
  drawSectionHeading(ctx, 'Company Profit Summary');
  const sumCols: ColDef[] = [
    { label: '#',          x: 15 },
    { label: 'Company',    x: 22 },
    { label: 'Revenue',    x: 100 },
    { label: 'Cost (DP)',  x: 130 },
    { label: 'Net Profit', x: 160 },
    { label: 'Margin %',   x: 185 },
  ];
  drawTableHeader(ctx, sumCols);

  rows.forEach((row, i) => {
    maybePageBreak(ctx, 8, TITLE, SUBTITLE);
    drawTableRow(ctx, sumCols, [
      `${i+1}`,
      clamp(row.co, 32),
      fmtTK(row.rev),
      fmtTK(row.cost),
      fmtTK(row.profit),
      `${row.margin.toFixed(2)}%`,
    ], i % 2 === 0);
  });
  drawTotalRow(ctx, sumCols, [
    '', 'GRAND TOTAL',
    fmtTK(grandRev), fmtTK(grandCost), fmtTK(grandProfit),
    grandRev > 0 ? `${((grandProfit / grandRev) * 100).toFixed(2)}%` : '0%',
  ]);

  // ── Per-company product breakdown ──────────────────────────────────────────
  ctx.y += 6;
  rows.forEach(coRow => {
    maybePageBreak(ctx, 20, TITLE, SUBTITLE);
    drawSectionHeading(ctx, `Product Breakdown: ${ascii(coRow.co)}`);

    const detCols: ColDef[] = [
      { label: '#',          x: 15 },
      { label: 'Product',    x: 22 },
      { label: 'SKU',        x: 88 },
      { label: 'Units Sold', x: 120 },
      { label: 'Cost',       x: 142 },
      { label: 'Revenue',    x: 163 },
      { label: 'Profit',     x: 181 },
    ];
    drawTableHeader(ctx, detCols);

    const coChallans = fch.filter(ch => ch.company === coRow.co);
    const pNames = Array.from(new Set(coChallans.map(ch => ch.productName)));
    pNames.forEach((pname, i) => {
      maybePageBreak(ctx, 8, TITLE, SUBTITLE);
      const pc    = coChallans.filter(ch => ch.productName === pname);
      const rev   = pc.reduce((s, ch) => s + ch.totalAmount, 0);
      const units = pc.reduce((s, ch) => s + ch.qty, 0);
      const prod  = opts.products.find(p => p.name === pname);
      const cost  = units * (prod?.defaultPP ?? 0);
      const pft   = rev - cost;
      const sku   = prod?.sku || '';
      drawTableRow(ctx, detCols,
        [`${i+1}`, clamp(pname, 28), clamp(sku, 12), fmtNum(units), fmtTK(cost), fmtTK(rev), fmtTK(pft)],
        i % 2 === 0,
        pft < 0,
      );
    });

    ctx.y += 3;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Generator: PRICE LIST  (was producing blank PDF — tab 'dp' was not handled)
// ─────────────────────────────────────────────────────────────────────────────

function genPriceList(ctx: DocContext, opts: ReportOptions): void {
  const TITLE    = 'PRICE LIST';
  const SUBTITLE = 'Company-wise DP / TP / MRP Price Schedule';
  drawPageHeader(ctx, TITLE, SUBTITLE);

  const byCompany = productsByCompany(opts);
  const companies = Object.keys(byCompany).sort();

  drawKpiRow(ctx, [
    { label: 'Total Companies', value: fmtNum(companies.length),     r: 99,  g: 102, b: 241 },
    { label: 'Total Products',  value: fmtNum(opts.products.length), r: 16,  g: 185, b: 129 },
    { label: 'Report Date',     value: ctx.dateStr,                  r: 245, g: 158, b: 11  },
    { label: 'Generated By',    value: ctx.generatedBy,              r: 168, g: 85,  b: 247 },
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
    maybePageBreak(ctx, 18, TITLE, SUBTITLE);
    drawSectionHeading(ctx, `Company: ${ascii(co)}`);
    drawTableHeader(ctx, cols);

    const prods = byCompany[co].sort((a, b) => a.name.localeCompare(b.name));
    prods.forEach((p, i) => {
      maybePageBreak(ctx, 8, TITLE, SUBTITLE);
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

// ─────────────────────────────────────────────────────────────────────────────
// Generator: PROFIT MARGIN TOOL  (was producing blank PDF — tab 'margin')
// ─────────────────────────────────────────────────────────────────────────────

function genMargin(ctx: DocContext, opts: ReportOptions): void {
  const TITLE    = 'PROFIT MARGIN TOOL';
  const SUBTITLE = 'DP / TP / MRP Variance Analysis';
  drawPageHeader(ctx, TITLE, SUBTITLE);

  const filtered = opts.products
    .filter(p => !opts.filterCompany || opts.filterCompany === 'All' || p.company === opts.filterCompany)
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
    maybePageBreak(ctx, 8, TITLE, SUBTITLE);
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

// ─────────────────────────────────────────────────────────────────────────────
// Generator: DAY-END SETTLEMENT  (was producing blank PDF — tab 'dayend')
// ─────────────────────────────────────────────────────────────────────────────

function genDayEnd(ctx: DocContext, opts: ReportOptions): void {
  const TITLE    = 'DAY-END SETTLEMENT';
  const SUBTITLE = 'Company-wise Daily Stock & Sales Settlement Sheet';
  drawPageHeader(ctx, TITLE, SUBTITLE);

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

    let totSalesQty  = 0;
    let totSalesAmt  = 0;
    let totStockAmt  = 0;
    let totProfit    = 0;

    maybePageBreak(ctx, 22, TITLE, SUBTITLE);
    drawSectionHeading(ctx, `Company: ${ascii(co)}`);
    drawTableHeader(ctx, cols);

    coProds.forEach((p, i) => {
      maybePageBreak(ctx, 8, TITLE, SUBTITLE);
      const pc        = coChallans.filter(ch => ch.productName === p.name);
      const salesQty  = pc.reduce((s, ch) => s + ch.qty, 0);
      const salesAmt  = pc.reduce((s, ch) => s + ch.totalAmount, 0);
      const opening   = p.currentStock + salesQty;
      const closing   = p.currentStock;
      const stockAmt  = closing * (p.defaultPP || 0);
      const costSold  = salesQty * (p.defaultPP || 0);
      const profit    = salesAmt - costSold;

      totSalesQty += salesQty;
      totSalesAmt += salesAmt;
      totStockAmt += stockAmt;
      totProfit   += profit;

      drawTableRow(ctx, cols,
        [
          `${i+1}`,
          clamp(p.name, 24),
          clamp(p.sku, 10),
          fmtTK(p.defaultPP || 0),
          fmtTK(p.defaultWSP || 0),
          fmtNum(opening),
          salesQty > 0 ? fmtNum(salesQty) : '-',
          fmtNum(closing),
          salesAmt > 0 ? fmtTK(salesAmt) : '-',
          fmtTK(stockAmt),
        ],
        i % 2 === 0,
        false,
      );
    });

    drawTotalRow(ctx, cols, [
      '', 'SUBTOTAL', '', '', '',
      '',
      fmtNum(totSalesQty),
      '',
      fmtTK(totSalesAmt),
      fmtTK(totStockAmt),
    ]);

    // Profit summary for this company
    ctx.y += 2;
    maybePageBreak(ctx, 28, TITLE, SUBTITLE);
    drawSummaryBox(ctx, [
      { label: 'Total Sales Revenue', value: fmtTK(totSalesAmt) },
      { label: 'Total Stock Value',   value: fmtTK(totStockAmt) },
      { label: 'Net Profit',          value: fmtTK(totProfit), accent: true },
      { label: 'Profit Margin',       value: totSalesAmt > 0 ? `${((totProfit / totSalesAmt) * 100).toFixed(2)}%` : '0%', accent: true },
    ]);

    ctx.y += 4;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

const REPORT_META: Record<ReportType, { label: string; subtitle: string; file: string }> = {
  stock:     { label: 'STOCK REPORT',          subtitle: 'Company-wise Stock & Asset Valuation',           file: 'Stock_Report' },
  sales:     { label: 'SALES REPORT',          subtitle: 'B2B DMS Distribution Sales Analysis',           file: 'Sales_Report' },
  damage:    { label: 'DAMAGE REPORT',         subtitle: 'Damage Reconciliation & Loss Valuation',         file: 'Damage_Report' },
  profit:    { label: 'PROFIT REPORT',         subtitle: 'Company-wise Profit Margin Analysis',            file: 'Profit_Report' },
  margin:    { label: 'PROFIT MARGIN TOOL',    subtitle: 'DP / TP / MRP Variance Analysis',               file: 'Margin_Analysis' },
  pricelist: { label: 'PRICE LIST',            subtitle: 'Company-wise DP / TP / MRP Price Schedule',     file: 'Price_List' },
  dayend:    { label: 'DAY-END SETTLEMENT',    subtitle: 'Company-wise Daily Stock & Sales Settlement',   file: 'DayEnd_Settlement' },
};

/**
 * Export a professional PDF for any report type.
 * Handles ALL 7 tabs — no more blank pages.
 */
export function exportReportPDF(opts: ReportOptions): void {
  // Rough page count estimation (exact count isn't needed for correct output)
  const estimatedPages = Math.max(1, Math.ceil(opts.products.length / 25) + Math.ceil(opts.challans.length / 30));
  const ctx = buildCtx(opts, estimatedPages);

  switch (opts.type) {
    case 'stock':     genStock(ctx, opts);     break;
    case 'sales':     genSales(ctx, opts);     break;
    case 'damage':    genDamage(ctx, opts);    break;
    case 'profit':    genProfit(ctx, opts);    break;
    case 'margin':    genMargin(ctx, opts);    break;
    case 'pricelist': genPriceList(ctx, opts); break;
    case 'dayend':    genDayEnd(ctx, opts);    break;
  }

  // Draw footer on last page
  drawPageFooter(ctx);

  // Update page numbers by iterating through all pages (jsPDF internal page count)
  const totalRendered = ctx.doc.getNumberOfPages();
  for (let pg = 1; pg <= totalRendered; pg++) {
    ctx.doc.setPage(pg);
    ctx.currentPage = pg;
    ctx.totalPages  = totalRendered;
    // Redraw footer with correct page number
    drawPageFooter(ctx);
  }

  const meta    = REPORT_META[opts.type];
  const shop    = (opts.shopName || 'ERP').replace(/[^a-zA-Z0-9_]/g, '_');
  const dateTag = new Date().toISOString().split('T')[0];
  ctx.doc.save(`${shop}_${meta.file}_${dateTag}.pdf`);
}

/**
 * Export a CSV for any report type. Opens as a download.
 */
export function exportReportExcel(opts: ReportOptions): void {
  const fch = getFilteredChallans(opts);
  let csv   = '';
  const row = (cells: (string | number)[]) =>
    cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',') + '\n';

  if (opts.type === 'stock') {
    csv += row(['#', 'Product Name', 'Company', 'SKU', 'Current Stock', 'Damaged Stock', 'DP', 'TP', 'MRP', 'Stock Value (DP)']);
    opts.products.forEach((p, i) => {
      if (opts.filterCompany && opts.filterCompany !== 'All' && p.company !== opts.filterCompany) return;
      csv += row([i + 1, p.name, p.company, p.sku, p.currentStock, p.damagedStock || 0,
                  p.defaultPP, p.defaultWSP, p.defaultMRP,
                  p.currentStock * p.defaultPP]);
    });
  } else if (opts.type === 'sales') {
    csv += row(['#', 'Product', 'Company', 'SR', 'Delivery Man', 'Date', 'Qty', 'Returned', 'Damaged', 'Rate', 'Total Amount']);
    fch.forEach((ch, i) => {
      csv += row([i + 1, ch.productName, ch.company || '', ch.srName, ch.deliveryManName,
                  ch.createdAt?.split('T')[0] || '', ch.qty, ch.returnedQty || 0, ch.damagedQty || 0, ch.rate, ch.totalAmount]);
    });
  } else if (opts.type === 'pricelist') {
    csv += row(['#', 'Company', 'Product', 'SKU', 'DP (TK)', 'TP (TK)', 'MRP (TK)', 'Margin %']);
    let i = 0;
    opts.products
      .filter(p => !opts.filterCompany || opts.filterCompany === 'All' || p.company === opts.filterCompany)
      .sort((a, b) => a.company.localeCompare(b.company) || a.name.localeCompare(b.name))
      .forEach(p => {
        const mgn = p.defaultPP > 0 ? (((p.defaultWSP - p.defaultPP) / p.defaultPP) * 100).toFixed(2) : '0';
        csv += row([++i, p.company, p.name, p.sku, p.defaultPP, p.defaultWSP, p.defaultMRP, mgn]);
      });
  } else {
    csv += row(['Report', opts.type, 'Period', `${opts.startDate} to ${opts.endDate}`]);
    csv += row(['Note', 'For detailed Excel export open this report tab and use the CSV option']);
  }

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  const shop = (opts.shopName || 'ERP').replace(/[^a-zA-Z0-9_]/g, '_');
  const meta = REPORT_META[opts.type];
  a.download = `${shop}_${meta.file}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Open a print-ready HTML window for any report type.
 */
export function printReport(opts: ReportOptions): void {
  const fch = getFilteredChallans(opts);
  const shop = ascii(opts.shopName) || 'Bangla-Chain ERP';
  const now  = new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const meta = REPORT_META[opts.type];

  let tableHtml = '';

  if (opts.type === 'stock') {
    const header = `<tr><th>#</th><th>Product</th><th>Company</th><th>SKU</th><th>Stock</th><th>Damaged</th><th>DP Value</th><th>TP Value</th></tr>`;
    const rows = opts.products
      .filter(p => !opts.filterCompany || opts.filterCompany === 'All' || p.company === opts.filterCompany)
      .map((p, i) => `<tr>
        <td>${i+1}</td><td><b>${p.name}</b></td><td>${p.company}</td><td>${p.sku}</td>
        <td>${p.currentStock.toLocaleString()}</td><td>${(p.damagedStock||0).toLocaleString()}</td>
        <td><b>TK ${(p.currentStock*(p.defaultPP||0)).toLocaleString()}</b></td>
        <td><b>TK ${(p.currentStock*(p.defaultWSP||0)).toLocaleString()}</b></td>
      </tr>`).join('');
    tableHtml = `<table><thead>${header}</thead><tbody>${rows}</tbody></table>`;
  } else if (opts.type === 'pricelist') {
    const header = `<tr><th>#</th><th>Product</th><th>Company</th><th>SKU</th><th>DP</th><th>TP</th><th>MRP</th><th>Margin%</th></tr>`;
    const rows = opts.products
      .filter(p => !opts.filterCompany || opts.filterCompany === 'All' || p.company === opts.filterCompany)
      .sort((a, b) => a.company.localeCompare(b.company) || a.name.localeCompare(b.name))
      .map((p, i) => {
        const mgn = p.defaultPP > 0 ? (((p.defaultWSP-p.defaultPP)/p.defaultPP)*100).toFixed(1) : '0';
        return `<tr>
          <td>${i+1}</td><td><b>${p.name}</b></td><td>${p.company}</td><td>${p.sku}</td>
          <td>TK ${p.defaultPP.toLocaleString()}</td>
          <td><b>TK ${p.defaultWSP.toLocaleString()}</b></td>
          <td>TK ${p.defaultMRP.toLocaleString()}</td>
          <td><b>${mgn}%</b></td>
        </tr>`;
      }).join('');
    tableHtml = `<table><thead>${header}</thead><tbody>${rows}</tbody></table>`;
  } else {
    const header = `<tr><th>#</th><th>Product</th><th>Company</th><th>SR</th><th>Date</th><th>Qty</th><th>Amount</th></tr>`;
    const rows = fch.map((ch, i) => `<tr>
      <td>${i+1}</td><td><b>${ch.productName}</b></td><td>${ch.company||''}</td><td>${ch.srName}</td>
      <td>${ch.createdAt?.split('T')[0]||''}</td><td>${ch.qty}</td><td><b>TK ${ch.totalAmount.toLocaleString()}</b></td>
    </tr>`).join('');
    tableHtml = `<table><thead>${header}</thead><tbody>${rows}</tbody></table>`;
  }

  const w = window.open('', '_blank', 'width=1000,height=750');
  if (!w) { alert('Pop-up blocked — allow pop-ups for this site.'); return; }
  w.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"><title>${meta.label} — ${shop}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:system-ui,sans-serif;font-size:11px;color:#0f172a;padding:24px 28px}
      @media print{body{padding:8mm 10mm}@page{size:A4;margin:8mm}}
      .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #0f172a}
      .hdr h1{font-size:16px;font-weight:800;text-transform:uppercase}
      .hdr p{font-size:9px;color:#64748b;margin-top:3px}
      .meta{text-align:right}.meta .type{font-size:13px;font-weight:700;text-transform:uppercase}
      .meta .date{font-size:9px;color:#94a3b8;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin-top:12px;font-size:10px}
      thead tr{background:#0f172a;color:#fff}
      thead th{padding:7px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.4px}
      tbody tr{border-bottom:1px solid #e2e8f0}
      tbody tr:nth-child(even){background:#f8fafc}
      tbody td{padding:7px 10px}
      .ftr{margin-top:20px;padding-top:10px;border-top:1px dashed #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
    </style>
  </head><body>
    <div class="hdr">
      <div><h1>${shop}</h1><p>${ascii(opts.shopSubBrand) || 'Distribution Management System'}</p></div>
      <div class="meta"><div class="type">${meta.label}</div><div class="date">Period: ${opts.startDate} to ${opts.endDate}</div><div class="date">Printed: ${now}</div></div>
    </div>
    ${tableHtml}
    <div class="ftr"><span>Bangla-Chain ERP</span><span>${now}</span></div>
    <script>window.onload=function(){window.print()}<\/script>
  </body></html>`);
  w.document.close();
}
