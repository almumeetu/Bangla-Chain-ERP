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
import { Product, ChallanItem, Procurement, ExpenseRecord } from '../types';
import { translations, Language } from '../translations';

interface DashboardProps {
  products: Product[];
  challans: ChallanItem[];
  procurements: Procurement[];
  expenses: ExpenseRecord[];
  onNavigate: (tab: any) => void;
  onDownloadPDF: (view: 'dashboard' | 'procurement' | 'accounting') => void;
  language: Language;
}

export default function Dashboard({ 
  products, 
  challans, 
  procurements, 
  expenses, 
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
    <div className="space-y-8">
      {/* Welcome Banner - Minimalist, white background, no heavy gradients */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all duration-300">
        <div className="space-y-3 flex-1">
          <span className="bg-indigo-50 text-indigo-700 text-[11px] font-mono font-semibold tracking-wider uppercase px-3 py-1 rounded-full border border-indigo-100">
            {tCommon.systemOperational}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">{tDash.welcomeTitle}</h2>
          <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
            {tDash.welcomeSub}
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={() => onDownloadPDF('dashboard')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white font-semibold text-xs px-5 py-3.5 rounded-xl shadow-sm border border-indigo-500 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            {tDash.downloadReport}
          </button>
        </div>
      </div>

      {/* Today's Quick Pulse & Operations Report */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <h3 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase">
              {tDash.quickReportTitle}
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wide">
            {tDash.periodLabel}: {todayStr} &bull; {tDash.compareYesterday} ({yesterdayStr})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's Sales */}
          <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100/80 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{tDash.todaySales}</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xl font-bold text-slate-900 font-mono">{formatBDT(todaysSales)}</span>
                {salesChangePercent !== 0 ? (
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    salesChangePercent >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {salesChangePercent >= 0 ? '+' : ''}{salesChangePercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">{tCommon.stable}</span>
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-3 flex justify-between items-center">
              <span>{tDash.yesterdaySales}</span>
              <span className="font-mono font-bold text-slate-600">{formatBDT(yesterdaysSales)}</span>
            </div>
          </div>

          {/* Today's Net Profit */}
          <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100/80 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{tDash.todayProfit}</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-xl font-bold font-mono ${todaysNetProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                  {formatBDT(todaysNetProfit)}
                </span>
                {profitChangePercent !== 0 ? (
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    profitChangePercent >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {profitChangePercent >= 0 ? '+' : ''}{profitChangePercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">{tCommon.stable}</span>
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-3 flex justify-between items-center">
              <span>{tDash.estMargin}</span>
              <span className="font-bold text-slate-600">
                {todaysSales > 0 ? `${((todaysNetProfit / todaysSales) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* Inventory Turnover */}
          <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100/80 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{tDash.todayTurnover}</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xl font-bold text-slate-900 font-mono">
                  {todaysTurnoverRate.toFixed(3)}%
                </span>
                {turnoverChangePercent !== 0 ? (
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    turnoverChangePercent >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {turnoverChangePercent >= 0 ? '+' : ''}{turnoverChangePercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">{tCommon.stable}</span>
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-3 flex justify-between items-center">
              <span>{tDash.projectedAnnual}</span>
              <span className="font-mono font-bold text-slate-600">{todaysTurnoverAnnualized.toFixed(2)}x / Year</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards - Generous layout, large bold key numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Yield / Profit */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/85 flex flex-col justify-between hover:border-indigo-200 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{tDash.calculatedYield}</span>
            <div className={`p-2 rounded-xl ${netProfit >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className={`text-3xl font-black font-mono tracking-tight ${netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              {formatBDT(netProfit)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              {tDash.yieldDescription}
            </p>
          </div>
        </div>

        {/* Due Amount */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/85 flex flex-col justify-between hover:border-amber-200 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Due Amount</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 font-mono tracking-tight">{formatBDT(dueAmount)}</h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[10px] text-slate-400 font-medium">Outstanding credit liabilities</span>
            </div>
          </div>
        </div>

        {/* Active Wholesale Revenue */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/85 flex flex-col justify-between hover:border-emerald-200 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{tDash.activeRevenue}</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 font-mono tracking-tight">{formatBDT(totalSales)}</h3>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              {tDash.activeChallansCount.replace('{count}', String(challans.filter(c => c.status !== 'Returned').length))}
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/85 flex flex-col justify-between hover:border-rose-200 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{tDash.operatingExpenses}</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 font-mono tracking-tight">{formatBDT(totalExpensesCost)}</h3>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              {tDash.expensesCount.replace('{count}', String(expenses.length))}
            </p>
          </div>
        </div>

      </div>

      {/* Grid: Low Stock Alert & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Low Stock Alerts */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/85 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm tracking-tight">{tDash.lowStockWarnings}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{tDash.lowStockDesc}</p>
              </div>
              <span className="bg-amber-50 text-amber-700 text-[10px] px-2.5 py-1 rounded-full font-bold border border-amber-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {tDash.alertsCount.replace('{count}', String(lowStockProducts.length))}
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
              {lowStockProducts.map(p => (
                <div key={p.id} className="py-3 flex items-center justify-between group">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{p.name}</p>
                    <p className="text-[9px] text-slate-400 font-mono">SKU: {p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-rose-600 font-mono">{p.currentStock} {tCommon.units}</p>
                    <span className="text-[9px] text-slate-400 font-medium">{tCommon.reorderRec}</span>
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  🎉 All stock counts are healthy.
                </div>
              )}
            </div>
          </div>

          <button
            id="dash-btn-adjust-stock"
            onClick={() => onNavigate('stock-adjustment')}
            className="w-full mt-6 py-3 px-4 bg-slate-50 text-slate-700 hover:text-white hover:bg-slate-900 active:scale-95 transition-all rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 cursor-pointer"
          >
            {tDash.adjustInventories}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recent Challans Activity */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/85 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm tracking-tight">{tDash.recentChallans}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{tDash.recentChallansDesc}</p>
            </div>
            <button
              id="dash-btn-view-challans"
              onClick={() => onNavigate('challan')}
              className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              {tDash.manageSheets}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100 pb-2">
                  <th className="py-3 px-1">{tDash.tableName}</th>
                  <th className="py-3 px-1">{tDash.tableSr}</th>
                  <th className="py-3 px-1">{tDash.tableClients}</th>
                  <th className="py-3 px-1 text-right">{tDash.tableValue}</th>
                  <th className="py-3 px-1 text-center">{tDash.tableStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentChallans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-1">
                      <p className="font-bold text-slate-700 text-xs">{ch.productName}</p>
                      <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{ch.attribute}</span>
                    </td>
                    <td className="py-4 px-1">
                      <p className="text-slate-600 font-semibold text-xs">{ch.srName}</p>
                      <span className="text-[9px] text-indigo-500 font-mono block mt-0.5">{ch.deliveryManName}</span>
                    </td>
                    <td className="py-4 px-1">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {ch.customerNames.slice(0, 1).map((c, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-semibold truncate block max-w-[110px]">
                            {c}
                          </span>
                        ))}
                        {ch.customerNames.length > 1 && (
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold">
                            +{ch.customerNames.length - 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-1 text-right font-bold text-slate-700 font-mono">{formatBDT(ch.totalAmount)}</td>
                    <td className="py-4 px-1 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        ch.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                        ch.status === 'Shipped' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        ch.status === 'Returned' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
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
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wide">
            <MapPin className="w-4 h-4 text-indigo-500" />
            {tDash.primaryHub}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {tDash.primaryHubDesc}
          </p>
        </div>

        <div className="space-y-2 border-t md:border-t-0 md:border-x border-slate-200/80 px-0 md:px-6 py-4 md:py-0">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wide">
            <Clock className="w-4 h-4 text-indigo-500" />
            {tDash.autoStockLock}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {tDash.autoStockLockDesc}
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <button
            id="dash-quick-procure"
            onClick={() => onNavigate('procurement')}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {tDash.newProcInvoice}
          </button>
          <button
            id="dash-quick-sell"
            onClick={() => onNavigate('sell')}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            {tDash.salesTerminal}
          </button>
        </div>
      </div>
    </div>
  );
}
