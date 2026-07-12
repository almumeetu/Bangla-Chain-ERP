import { useMemo } from 'react';
import type { Product, ChallanItem, Procurement, ExpenseRecord, SR } from '../../types';

// ── Formatters ────────────────────────────────────────────────────────────────

export function formatBDT(amount: number): string {
  const formatted = new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return `${amount < 0 ? '-' : ''}৳${formatted}`;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function getLocalDateString(dateObj: Date): string {
  const offset    = dateObj.getTimezoneOffset();
  const localDate = new Date(dateObj.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
}

export function getChallanDate(id: string, createdAt?: string): string {
  // If the challan has a real createdAt timestamp (from Supabase), use it
  if (createdAt) return getLocalDateString(new Date(createdAt));

  // Legacy hardcoded IDs from the initial seed data
  const HARDCODED: Record<string, string> = {
    'ch-1': '2026-06-12',
    'ch-2': '2026-06-18',
    'ch-3': '2026-06-22',
    'ch-4': '2026-06-24',
    'ch-5': '2026-06-25',
  };
  if (HARDCODED[id]) return HARDCODED[id];

  // Fallback: try to parse a timestamp embedded in the id
  if (id.startsWith('ch-')) {
    const ms = Number(id.split('-')[1]);
    if (!isNaN(ms)) return new Date(ms).toISOString().split('T')[0];
  }

  return getLocalDateString(new Date());
}

// ── Company stock data ────────────────────────────────────────────────────────

export interface CompanyStockRow {
  brand:        string;
  units:        number;
  value:        number;
  damagedUnits: number;
  damagedValue: number;
  productCount: number;
}

export function buildCompanyStockData(products: Product[]): CompanyStockRow[] {
  const brands = Array.from(new Set(products.map(p => p.company)));
  return brands
    .map(brand => {
      const bp = products.filter(p => p.company === brand);
      return {
        brand,
        units:        bp.reduce((s, p) => s + p.currentStock, 0),
        value:        bp.reduce((s, p) => s + p.currentStock * p.defaultPP, 0),
        damagedUnits: bp.reduce((s, p) => s + (p.damagedStock ?? 0), 0),
        damagedValue: bp.reduce((s, p) => s + (p.damagedStock ?? 0) * p.defaultPP, 0),
        productCount: bp.length,
      };
    })
    .sort((a, b) => b.value - a.value);
}

// ── Metrics hook ──────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  todayStr:             string;
  todaysSales:          number;
  todaysExpensesTotal:  number;
  todaysNetProfit:      number;
  yesterdaysSales:      number;
  yesterdaysExpensesTotal: number;
  yesterdaysNetProfit:  number;
  salesChangePercent:   number;
  profitChangePercent:  number;
  totalSales:           number;
  totalProcurementCost: number;
  totalExpensesCost:    number;
  netProfit:            number;
  totalStockUnits:      number;
  totalStockValue:      number;
  totalDamagedQty:      number;
  totalDamagedVal:      number;
  lowStockProducts:     Product[];
  recentChallans:       ChallanItem[];
  companyStockData:     CompanyStockRow[];
  maxCompanyVal:        number;
  srSalesMap:           Map<string, { count: number; total: number }>;
}

export function useDashboardMetrics(
  products:     Product[],
  challans:     ChallanItem[],
  procurements: Procurement[],
  expenses:     ExpenseRecord[],
  srs:          SR[],
): DashboardMetrics {
  const todayStr     = getLocalDateString(new Date());
  const yesterdayObj = new Date(); yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayObj);

  const challansByDate = useMemo(() => {
    const today     = challans.filter(ch => getChallanDate(ch.id, ch.createdAt) === todayStr);
    const yesterday = challans.filter(ch => getChallanDate(ch.id, ch.createdAt) === yesterdayStr);
    return { today, yesterday };
  }, [challans, todayStr, yesterdayStr]);

  function sumSales(list: ChallanItem[]) {
    return list.filter(ch => ch.status === 'Delivered').reduce((s, ch) => s + Math.max(0, ch.totalAmount - (ch.returnedQty ?? 0) * ch.rate), 0);
  }
  function sumCOGS(list: ChallanItem[]) {
    return list.filter(ch => ch.status === 'Delivered').reduce((s, ch) => {
      const pp = products.find(p => p.name === ch.productName)?.defaultPP ?? ch.rate * 0.65;
      return s + (ch.qty - (ch.returnedQty ?? 0)) * pp;
    }, 0);
  }

  const todaysSales          = sumSales(challansByDate.today);
  const todaysCOGS           = sumCOGS(challansByDate.today);
  const todaysExpensesTotal  = expenses.filter(e => e.expenseDate === todayStr).reduce((s, e) => s + e.amount, 0);
  const todaysNetProfit      = todaysSales - todaysCOGS - todaysExpensesTotal;

  const yesterdaysSales         = sumSales(challansByDate.yesterday);
  const yesterdaysCOGS          = sumCOGS(challansByDate.yesterday);
  const yesterdaysExpensesTotal = expenses.filter(e => e.expenseDate === yesterdayStr).reduce((s, e) => s + e.amount, 0);
  const yesterdaysNetProfit     = yesterdaysSales - yesterdaysCOGS - yesterdaysExpensesTotal;

  const salesChangePercent  = yesterdaysSales > 0 ? ((todaysSales - yesterdaysSales) / yesterdaysSales) * 100 : todaysSales > 0 ? 100 : 0;
  const profitChangePercent = yesterdaysNetProfit !== 0 ? ((todaysNetProfit - yesterdaysNetProfit) / Math.abs(yesterdaysNetProfit)) * 100 : todaysNetProfit > 0 ? 100 : 0;

  const totalSales          = sumSales(challans);
  const totalProcurementCost= procurements.reduce((s, p) => s + p.globalTotal, 0);
  const totalExpensesCost   = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit           = totalSales - totalProcurementCost - totalExpensesCost;
  const totalStockUnits     = products.reduce((s, p) => s + p.currentStock, 0);
  const totalStockValue     = products.reduce((s, p) => s + p.currentStock * p.defaultPP, 0);
  const totalDamagedQty     = products.reduce((s, p) => s + (p.damagedStock ?? 0), 0);
  const totalDamagedVal     = products.reduce((s, p) => s + (p.damagedStock ?? 0) * p.defaultPP, 0);

  const lowStockProducts  = products.filter(p => p.currentStock < 600);
  const recentChallans    = [...challans].reverse().slice(0, 5);
  const companyStockData  = useMemo(() => buildCompanyStockData(products), [products]);
  const maxCompanyVal     = Math.max(...companyStockData.map(c => c.value), 1);

  const srSalesMap = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    srs.forEach(sr => {
      const srChallans = challans.filter(ch => ch.srName === sr.name);
      const srDeliveredChallans = srChallans.filter(ch => ch.status === 'Delivered');
      const total      = sumSales(srChallans);
      map.set(sr.id, { count: srDeliveredChallans.length, total });
    });
    return map;
  }, [srs, challans]);

  return {
    todayStr, todaysSales, todaysExpensesTotal, todaysNetProfit,
    yesterdaysSales, yesterdaysExpensesTotal, yesterdaysNetProfit,
    salesChangePercent, profitChangePercent,
    totalSales, totalProcurementCost, totalExpensesCost, netProfit,
    totalStockUnits, totalStockValue, totalDamagedQty, totalDamagedVal,
    lowStockProducts, recentChallans, companyStockData, maxCompanyVal, srSalesMap,
  };
}

// ── Brand colours ─────────────────────────────────────────────────────────────

export const BRAND_COLORS = [
  { bg: 'bg-blue-500',    light: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-100'    },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  { bg: 'bg-violet-500',  light: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-100'  },
  { bg: 'bg-amber-500',   light: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-100'   },
  { bg: 'bg-rose-500',    light: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-100'    },
  { bg: 'bg-cyan-500',    light: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-100'    },
] as const;

export const SR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
] as const;
