'use client';

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Box, 
  DollarSign, 
  AlertTriangle, 
  Plus, 
  ArrowRight,
  MapPin,
  Clock,
  Briefcase,
  FileText
} from 'lucide-react';
import { Product, ChallanItem, Procurement, ExpenseRecord, SR } from '../types';
import { translations, Language } from '../translations';

interface DashboardProps {
  products: Product[];
  challans: ChallanItem[];
  procurements: Procurement[];
  expenses: ExpenseRecord[];
  srs: SR[];
  onNavigate: (tab: any) => void;
  onDownloadPDF: (view: 'dashboard' | 'procurement' | 'accounting') => void;
  language: Language;
}

export default function Dashboard({ 
  products, 
  challans, 
  procurements, 
  expenses, 
  srs,
  onNavigate, 
  onDownloadPDF,
  language
}: DashboardProps) {
  const tCommon = translations[language].common;
  const tDash = translations[language].dashboard;

  // Calculators
  const totalSales = challans.reduce((sum, ch) => {
    if (ch.status !== 'Returned') {
      return sum + ch.totalAmount;
    }
    return sum;
  }, 0);

  // Procurements total
  const totalProcurementCost = procurements.reduce((sum, pr) => sum + pr.globalTotal, 0);

  // Expenses total
  const totalExpensesCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Net Profit: Revenue - Procurements - Expenses
  const netProfit = totalSales - totalProcurementCost - totalExpensesCost;

  // Calculate Due Amount from Procurement invoices
  const dueAmount = procurements.reduce((sum, pr) => {
    if (pr.paymentStatus === 'Pending') {
      return sum + pr.globalTotal;
    } else if (pr.paymentStatus === 'Partial') {
      return sum + (pr.globalTotal * 0.4); // Assume 40% remains due for partial records
    }
    return sum;
  }, 0);

  // Today vs Yesterday Quick Report Calculations
  const getChallanDate = (id: string) => {
    if (id === 'ch-1') return '2026-06-12';
    if (id === 'ch-2') return '2026-06-18';
    if (id === 'ch-3') return '2026-06-22';
    if (id === 'ch-4') return '2026-06-24';
    if (id === 'ch-5') return '2026-06-25';
    if (id.startsWith('ch-')) {
      const parts = id.split('-');
      const ms = Number(parts[1]);
      if (!isNaN(ms)) {
        return new Date(ms).toISOString().split('T')[0];
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  const getLocalDateString = (dateObj: Date) => {
    const offset = dateObj.getTimezoneOffset();
    const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const todayStr = getLocalDateString(new Date());

  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateString(d);
  })();

  // Today's metrics
  const todaysChallans = challans.filter(ch => getChallanDate(ch.id) === todayStr && ch.status !== 'Returned');
  const todaysSales = todaysChallans.reduce((sum, ch) => sum + ch.totalAmount, 0);

  const todaysCOGS = todaysChallans.reduce((sum, ch) => {
    const prod = products.find(p => p.name === ch.productName);
    const purchasePrice = prod ? prod.defaultPP : (ch.rate * 0.65);
    return sum + (ch.qty * purchasePrice);
  }, 0);

  const todaysExpensesTotal = expenses
    .filter(exp => exp.expenseDate === todayStr)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const todaysNetProfit = todaysSales - todaysCOGS - todaysExpensesTotal;

  // Yesterday's metrics
  const yesterdaysChallans = challans.filter(ch => getChallanDate(ch.id) === yesterdayStr && ch.status !== 'Returned');
  const yesterdaysSales = yesterdaysChallans.reduce((sum, ch) => sum + ch.totalAmount, 0);

  const yesterdaysCOGS = yesterdaysChallans.reduce((sum, ch) => {
    const prod = products.find(p => p.name === ch.productName);
    const purchasePrice = prod ? prod.defaultPP : (ch.rate * 0.65);
    return sum + (ch.qty * purchasePrice);
  }, 0);

  const yesterdaysExpensesTotal = expenses
    .filter(exp => exp.expenseDate === yesterdayStr)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const yesterdaysNetProfit = yesterdaysSales - yesterdaysCOGS - yesterdaysExpensesTotal;

  // Trend percentages
  const salesChangePercent = yesterdaysSales > 0 
    ? ((todaysSales - yesterdaysSales) / yesterdaysSales) * 100 
    : todaysSales > 0 ? 100 : 0;

  const profitChangePercent = yesterdaysNetProfit !== 0 
    ? ((todaysNetProfit - yesterdaysNetProfit) / Math.abs(yesterdaysNetProfit)) * 100 
    : todaysNetProfit > 0 ? 100 : 0;

  // Inventory Turnover Rate (COGS / Total Stock Valuation)
  const totalStockValue = products.reduce((sum, p) => sum + (p.currentStock * p.defaultPP), 0);
  const todaysTurnoverRate = totalStockValue > 0 ? (todaysCOGS / totalStockValue) * 100 : 0;
  const yesterdaysTurnoverRate = totalStockValue > 0 ? (yesterdaysCOGS / totalStockValue) * 100 : 0;

  const turnoverChangePercent = yesterdaysTurnoverRate > 0 
    ? ((todaysTurnoverRate - yesterdaysTurnoverRate) / yesterdaysTurnoverRate) * 100 
    : todaysTurnoverRate > 0 ? 100 : 0;

  const todaysTurnoverAnnualized = (todaysTurnoverRate / 100) * 365;

  // Stock highlights
  const lowStockProducts = products.filter(p => p.currentStock < 600);

  // Recent Challans
  const recentChallans = [...challans].reverse().slice(0, 4);

  // Format BDT helper
  const formatBDT = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    return `৳${formatted}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner - Monochrome Minimalist Layout */}
      <div className="bg-white rounded-xl p-6 md:p-8 border border-slate-205 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all duration-300 relative overflow-hidden">
        <div className="space-y-2 flex-1 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-[11px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
            {tCommon.systemOperational}
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{tDash.welcomeTitle}</h2>
          <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
            {tDash.welcomeSub}
          </p>
        </div>
        <div className="shrink-0 relative z-10">
          <button
            onClick={() => onDownloadPDF('dashboard')}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all shadow-sm shrink-0 cursor-pointer border border-slate-950"
          >
            <FileText className="w-4 h-4 text-white" />
            {tDash.downloadReport}
          </button>
        </div>
      </div>

      {/* Today's Quick Pulse & Operations Report */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900"></span>
            </span>
            <h3 className="font-semibold text-slate-800 text-xs tracking-wider uppercase">
              {tDash.quickReportTitle}
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 font-mono tracking-wide">
            {tDash.periodLabel}: {todayStr} &bull; {tDash.compareYesterday} ({yesterdayStr})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's Sales */}
          <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200 flex flex-col justify-between hover:bg-white hover:border-slate-350 hover:shadow-sm transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-450 uppercase tracking-wider block">{tDash.todaySales}</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-semibold text-slate-900 font-mono">{formatBDT(todaysSales)}</span>
                {salesChangePercent !== 0 ? (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    {salesChangePercent >= 0 ? '+' : ''}{salesChangePercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">{tCommon.stable}</span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-4 border-t border-slate-100 pt-3 flex justify-between items-center">
              <span>{tDash.yesterdaySales}</span>
              <span className="font-mono font-semibold text-slate-600">{formatBDT(yesterdaysSales)}</span>
            </div>
          </div>

          {/* Today's Net Profit */}
          <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200 flex flex-col justify-between hover:bg-white hover:border-slate-350 hover:shadow-sm transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-450 uppercase tracking-wider block">{tDash.todayProfit}</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-semibold font-mono text-slate-900">
                  {formatBDT(todaysNetProfit)}
                </span>
                {profitChangePercent !== 0 ? (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    {profitChangePercent >= 0 ? '+' : ''}{profitChangePercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">{tCommon.stable}</span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-4 border-t border-slate-100 pt-3 flex justify-between items-center">
              <span>{tDash.estMargin}</span>
              <span className="font-semibold text-slate-600">
                {todaysSales > 0 ? `${((todaysNetProfit / todaysSales) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* Inventory Turnover */}
          <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200 flex flex-col justify-between hover:bg-white hover:border-slate-350 hover:shadow-sm transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-455 uppercase tracking-wider block">{tDash.todayTurnover}</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-semibold text-slate-900 font-mono">
                  {todaysTurnoverRate.toFixed(3)}%
                </span>
                {turnoverChangePercent !== 0 ? (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    {turnoverChangePercent >= 0 ? '+' : ''}{turnoverChangePercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">{tCommon.stable}</span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-4 border-t border-slate-100 pt-3 flex justify-between items-center">
              <span>{tDash.projectedAnnual}</span>
              <span className="font-mono font-semibold text-slate-600">{todaysTurnoverAnnualized.toFixed(2)}x / Year</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Yield / Profit */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 flex flex-col justify-between hover:border-slate-400 hover:shadow-sm transition-all duration-300 group">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{tDash.calculatedYield}</span>
            <div className="p-3 rounded-lg transition-transform group-hover:scale-110 bg-slate-100 text-slate-805 border border-slate-200">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-semibold font-mono tracking-tight text-slate-900">
              {formatBDT(netProfit)}
            </h3>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {tDash.yieldDescription}
            </p>
          </div>
        </div>

        {/* Due Amount */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 flex flex-col justify-between hover:border-slate-400 hover:shadow-sm transition-all duration-300 group">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Due Amount</span>
            <div className="p-3 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg transition-transform group-hover:scale-110">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-slate-900 font-mono tracking-tight">{formatBDT(dueAmount)}</h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-405 animate-pulse" />
              <span className="text-xs text-slate-500 font-medium">Outstanding liabilities</span>
            </div>
          </div>
        </div>

        {/* Active Wholesale Revenue */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 flex flex-col justify-between hover:border-slate-400 hover:shadow-sm transition-all duration-300 group">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{tDash.activeRevenue}</span>
            <div className="p-3 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg transition-transform group-hover:scale-110">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-slate-900 font-mono tracking-tight">{formatBDT(totalSales)}</h3>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {tDash.activeChallansCount.replace('{count}', String(challans.filter(c => c.status !== 'Returned').length))}
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 flex flex-col justify-between hover:border-slate-400 hover:shadow-sm transition-all duration-300 group">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{tDash.operatingExpenses}</span>
            <div className="p-3 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg transition-transform group-hover:scale-110">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-slate-900 font-mono tracking-tight">{formatBDT(totalExpensesCost)}</h3>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {tDash.expensesCount.replace('{count}', String(expenses.length))}
            </p>
          </div>
        </div>

      </div>

      {/* DMS Analytics Grid: Brand Stock Asset Value & SR Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Brand Warehousing Stock Asset Summary */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-slate-400 transition-all duration-300">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm tracking-tight">Brand Stock Valuation</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Dealer inventory assets grouped by brand</p>
              </div>
              <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-slate-200">
                In Warehouse
              </span>
            </div>

            <div className="space-y-3.5">
              {['Pran', 'Olympic', 'Haque'].map(brand => {
                const brandProds = products.filter(p => p.company === brand);
                const totalUnits = brandProds.reduce((sum, p) => sum + p.currentStock, 0);
                const totalVal = brandProds.reduce((sum, p) => sum + (p.currentStock * p.defaultPP), 0);
                
                return (
                  <div key={brand} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/30">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{brand}</span>
                      <span className="text-[11px] text-slate-550 font-medium block mt-0.5">{totalUnits.toLocaleString()} units stocked</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-900 font-mono block text-sm">{formatBDT(totalVal)}</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold mt-0.5">Import Cost Asset</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SR Sales Representative Leaderboard */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-slate-400 transition-all duration-300">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm tracking-tight">Sales Reps (SR) Leaderboard</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Wholesale supply performance by Sales Representative</p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                Active Supplies
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="px-3 py-2 text-xs font-semibold text-slate-700 w-10 text-center">Rank</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-700">Representative Name</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-700 text-center">Supply Trips</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-700 text-right">Total Wholesale Supplied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {srs.map((sr, idx) => {
                    const srChallans = challans.filter(ch => ch.srName === sr.name && ch.status !== 'Returned');
                    const totalAmt = srChallans.reduce((sum, ch) => sum + ch.totalAmount, 0);
                    const runCount = srChallans.length;
                    
                    return (
                      <tr key={sr.id} className="hover:bg-slate-50/50 transition-all duration-150">
                        <td className="py-3 px-3 text-center text-slate-400 font-mono font-medium">#{idx + 1}</td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-800 text-xs">{sr.name}</p>
                          <p className="text-[10px] text-slate-405 font-mono">{sr.phone}</p>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-650 font-mono font-medium">{runCount} dispatches</td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-semibold text-slate-900 font-mono">{formatBDT(totalAmt)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Low Stock Alert & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Low Stock Alerts */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm tracking-tight">{tDash.lowStockWarnings}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{tDash.lowStockDesc}</p>
              </div>
              <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-full font-semibold border border-slate-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                {tDash.alertsCount.replace('{count}', String(lowStockProducts.length))}
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
              {lowStockProducts.map(p => (
                <div key={p.id} className="py-3 flex items-center justify-between group hover:bg-slate-50/50 px-2 rounded-lg transition-all duration-200">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-850 font-mono">{p.currentStock} {tCommon.units}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{tCommon.reorderRec}</span>
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  🎉 All stock counts are healthy.
                </div>
              )}
            </div>
          </div>

          <button
            id="dash-btn-adjust-stock"
            onClick={() => onNavigate('stock-adjustment')}
            className="w-full mt-6 py-2.5 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {tDash.adjustInventories}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recent Challans Activity */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-205 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm tracking-tight">{tDash.recentChallans}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{tDash.recentChallansDesc}</p>
            </div>
            <button
              id="dash-btn-view-challans"
              onClick={() => onNavigate('challan')}
              className="text-slate-800 hover:text-slate-950 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer underline decoration-slate-300"
            >
              {tDash.manageSheets}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="px-3 py-3 text-sm font-semibold text-slate-700">{tDash.tableName}</th>
                  <th className="px-3 py-3 text-sm font-semibold text-slate-700">{tDash.tableNavSr || tDash.tableSr}</th>
                  <th className="px-3 py-3 text-sm font-semibold text-slate-700">{tDash.tableClients}</th>
                  <th className="px-3 py-3 text-sm font-semibold text-slate-700 text-right">{tDash.tableValue}</th>
                  <th className="px-3 py-3 text-sm font-semibold text-slate-700 text-center">{tDash.tableStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentChallans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-blue-50/30 transition-all duration-200">
                    <td className="py-4 px-3">
                      <p className="font-semibold text-slate-700 text-xs">{ch.productName}</p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{ch.attribute}</span>
                    </td>
                    <td className="py-4 px-3">
                      <p className="text-slate-650 font-semibold text-xs">{ch.srName}</p>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{ch.deliveryManName}</span>
                    </td>
                    <td className="py-4 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {ch.customerNames.slice(0, 1).map((c, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-650 rounded text-[10px] font-semibold truncate block max-w-[110px] border border-slate-200">
                            {c}
                          </span>
                        ))}
                        {ch.customerNames.length > 1 && (
                          <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px] font-semibold border border-slate-350">
                            +{ch.customerNames.length - 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-3 text-right font-semibold text-slate-700 font-mono">{formatBDT(ch.totalAmount)}</td>
                    <td className="py-4 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        ch.status === 'Delivered' ? 'bg-slate-900 text-white border-slate-950' :
                        ch.status === 'Shipped' ? 'bg-slate-200 text-slate-800 border-slate-300' :
                        ch.status === 'Returned' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {ch.status === 'Delivered' ? tCommon.delivered :
                         ch.status === 'Shipped' ? tCommon.shipped :
                         ch.status === 'Returned' ? tCommon.returned :
                         tCommon.pending}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Quick Launchpad & Hub Distribution */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-850 font-semibold text-xs uppercase tracking-wide">
            <MapPin className="w-4 h-4 text-slate-600" />
            {tDash.primaryHub}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            {tDash.primaryHubDesc}
          </p>
        </div>

        <div className="space-y-2 border-t md:border-t-0 md:border-x border-slate-200 px-0 md:px-6 py-4 md:py-0">
          <div className="flex items-center gap-2 text-slate-850 font-semibold text-xs uppercase tracking-wide">
            <Clock className="w-4 h-4 text-slate-600" />
            {tDash.autoStockLock}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            {tDash.autoStockLockDesc}
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <button
            id="dash-quick-procure"
            onClick={() => onNavigate('procurement')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all shadow-sm shrink-0 cursor-pointer border border-slate-950"
          >
            <Plus className="w-4 h-4 text-white" />
            {tDash.newProcInvoice}
          </button>
          <button
            id="dash-quick-sell"
            onClick={() => onNavigate('sell')}
            className="h-11 rounded-lg border-2 border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <ShoppingBag className="w-4 h-4 text-slate-550" />
            {tDash.salesTerminal}
          </button>
        </div>
      </div>
    </div>
  );
}
