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
      {/* Welcome Banner - Premium Modern Dark Gradient */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all duration-300 relative overflow-hidden group">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500 pointer-events-none" />
        <div className="absolute -left-12 -bottom-24 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-3 flex-1 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-indigo-500/15 text-indigo-300 text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            {tCommon.systemOperational}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{tDash.welcomeTitle}</h2>
          <p className="text-slate-350 text-sm max-w-2xl leading-relaxed">
            {tDash.welcomeSub}
          </p>
        </div>
        <div className="shrink-0 relative z-10">
          <button
            onClick={() => onDownloadPDF('dashboard')}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 hover:bg-slate-100 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-850" />
            {tDash.downloadReport}
          </button>
        </div>
      </div>      {/* 🚀 চার্টটি প্রধান কাজের সহজ বোতাম (Quick Action Launcher) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Button 1: New Sales */}
        <button
          id="quick-action-sales"
          onClick={() => onNavigate('sales')}
          className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-50/60 border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-500 hover:shadow-md active:scale-98 transition-all text-left cursor-pointer group"
        >
          <div className="p-3 bg-emerald-600 text-white rounded-xl group-hover:scale-110 transition-transform shadow-md">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-850 text-sm">{language === 'bn' ? '১. মেমো তৈরি (বিক্রয়)' : '1. Create Sales Memo'}</h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{language === 'bn' ? 'দোকানে মাল বিক্রির রশিদ করুন' : 'Record client order & cash memo'}</p>
          </div>
        </button>

        {/* Button 2: Company Purchase */}
        <button
          id="quick-action-purchase"
          onClick={() => onNavigate('purchase')}
          className="flex items-center gap-4 p-5 rounded-2xl bg-blue-50/60 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-500 hover:shadow-md active:scale-98 transition-all text-left cursor-pointer group"
        >
          <div className="p-3 bg-blue-600 text-white rounded-xl group-hover:scale-110 transition-transform shadow-md">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-850 text-sm">{language === 'bn' ? '২. কোম্পানি থেকে ক্রয় (স্টক)' : '2. Purchase from Company'}</h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{language === 'bn' ? 'কোম্পানি থেকে স্টক বুঝে নিন' : 'Inward stock from supplier'}</p>
          </div>
        </button>

        {/* Button 3: Delivery Challan */}
        <button
          id="quick-action-delivery"
          onClick={() => onNavigate('delivery')}
          className="flex items-center gap-4 p-5 rounded-2xl bg-amber-50/60 border-2 border-amber-200 hover:bg-amber-50 hover:border-amber-500 hover:shadow-md active:scale-98 transition-all text-left cursor-pointer group"
        >
          <div className="p-3 bg-amber-600 text-white rounded-xl group-hover:scale-110 transition-transform shadow-md">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-850 text-sm">{language === 'bn' ? '৩. ডেলিভারি চালান' : '3. Delivery Challan'}</h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{language === 'bn' ? 'সেলস অফিসারের চালান করুন' : 'Generate salesman delivery'}</p>
          </div>
        </button>

        {/* Button 4: Accounts Expenses */}
        <button
          id="quick-action-accounts"
          onClick={() => onNavigate('accounts')}
          className="flex items-center gap-4 p-5 rounded-2xl bg-rose-50/60 border-2 border-rose-200 hover:bg-rose-50 hover:border-rose-500 hover:shadow-md active:scale-98 transition-all text-left cursor-pointer group"
        >
          <div className="p-3 bg-rose-600 text-white rounded-xl group-hover:scale-110 transition-transform shadow-md">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-850 text-sm">{language === 'bn' ? '৪. দৈনিক খরচ লিখুন' : '4. Record Daily Expenses'}</h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{language === 'bn' ? 'অফিস বা যাতায়াত খরচ লিখুন' : 'Track daily transport/office costs'}</p>
          </div>
        </button>

      </div>

      {/* Today's Quick Pulse & Operations Report */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-650"></span>
            </span>
            <h3 className="font-semibold text-slate-855 text-xs tracking-wider uppercase font-sans">
              {language === 'bn' ? 'আজকের ব্যবসার সারসংক্ষেপ (খুব সহজে)' : "Today's Business Summary"}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wide">
            {tDash.periodLabel}: {todayStr} &bull; {tDash.compareYesterday} ({yesterdayStr})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's Sales */}
          <div className="bg-slate-50/40 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between border-t-4 border-t-blue-500 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">{tDash.todaySales}</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">{formatBDT(todaysSales)}</span>
                {salesChangePercent !== 0 ? (
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    salesChangePercent >= 0 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {salesChangePercent >= 0 ? '+' : ''}{salesChangePercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400">{tCommon.stable}</span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-4 border-t border-slate-100 pt-3 flex justify-between items-center">
              <span>{tDash.yesterdaySales}</span>
              <span className="font-mono font-semibold text-slate-655">{formatBDT(yesterdaysSales)}</span>
            </div>
          </div>

          {/* Today's Expenses */}
          <div className="bg-slate-50/40 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between border-t-4 border-t-rose-500 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">{language === 'bn' ? 'আজকের খরচ' : "Today's Expenses"}</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">{formatBDT(todaysExpensesTotal)}</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-4 border-t border-slate-100 pt-3 flex justify-between items-center">
              <span>{language === 'bn' ? 'দৈনিক যাতায়াত ও অফিস বিল' : 'Daily office and transport bills'}</span>
            </div>
          </div>

          {/* Today's Net Profit */}
          <div className="bg-slate-50/40 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between border-t-4 border-t-emerald-500 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">{tDash.todayProfit}</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {formatBDT(todaysNetProfit)}
                </span>
                {profitChangePercent !== 0 ? (
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    profitChangePercent >= 0 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {profitChangePercent >= 0 ? '+' : ''}{profitChangePercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400">{tCommon.stable}</span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-4 border-t border-slate-100 pt-3 flex justify-between items-center">
              <span>{language === 'bn' ? 'বিক্রি থেকে কেনার খরচ বাদ দিয়ে লাভ' : 'Estimated daily profit margin'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Yield / Profit */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 border-l-4 border-l-emerald-500 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tDash.calculatedYield}</span>
            <div className="p-2.5 rounded-xl transition-transform group-hover:scale-110 bg-emerald-50 text-emerald-650 border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-900">
              {formatBDT(netProfit)}
            </h3>
            <p className="text-xs text-slate-505 mt-2 font-medium">
              {tDash.yieldDescription}
            </p>
          </div>
        </div>

        {/* Due Amount */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 border-l-4 border-l-amber-500 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Amount</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl transition-transform group-hover:scale-110">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{formatBDT(dueAmount)}</h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-slate-505 font-medium">Outstanding dues</span>
            </div>
          </div>
        </div>

        {/* Active Wholesale Revenue */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 border-l-4 border-l-blue-500 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tDash.activeRevenue}</span>
            <div className="p-2.5 bg-blue-50 text-blue-650 border border-blue-100 rounded-xl transition-transform group-hover:scale-110">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{formatBDT(totalSales)}</h3>
            <p className="text-xs text-slate-550 mt-2 font-medium">
              {tDash.activeChallansCount.replace('{count}', String(challans.filter(c => c.status !== 'Returned').length))}
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 border-l-4 border-l-rose-500 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tDash.operatingExpenses}</span>
            <div className="p-2.5 bg-rose-50 text-rose-650 border border-rose-100 rounded-xl transition-transform group-hover:scale-110">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{formatBDT(totalExpensesCost)}</h3>
            <p className="text-xs text-slate-550 mt-2 font-medium">
              {tDash.expensesCount.replace('{count}', String(expenses.length))}
            </p>
          </div>
        </div>

      </div>

      {/* DMS Analytics Grid: Brand Stock Asset Value & SR Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Stock by Company */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-slate-400 transition-all duration-300">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm tracking-tight">{tDash.stockByCompany}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{tDash.stockByCompanyDesc}</p>
              </div>
              <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-slate-200">
                {tDash.inWarehouse}
              </span>
            </div>

            <div className="space-y-3.5">
              {Array.from(new Set(products.map(p => p.company))).map(brand => {
                const brandProds = products.filter(p => p.company === brand);
                const totalUnits = brandProds.reduce((sum, p) => sum + p.currentStock, 0);
                const totalVal = brandProds.reduce((sum, p) => sum + (p.currentStock * p.defaultPP), 0);
                
                return (
                  <div key={brand} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/30">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{brand}</span>
                      <span className="text-[11px] text-slate-550 font-medium block mt-0.5">{totalUnits.toLocaleString()} {tDash.unitsStocked}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-900 font-mono block text-sm">{formatBDT(totalVal)}</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold mt-0.5">{tDash.stockValue}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Salesmen Today */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-slate-400 transition-all duration-300">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm tracking-tight">{tDash.topSalesmenToday}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{tDash.topSalesmenDesc}</p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                {tDash.totalSold}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="px-3 py-2 text-xs font-semibold text-slate-700 w-10 text-center">#</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-700">{tDash.tableSr}</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-700 text-center">{tDash.recentChallans}</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-700 text-right">{tDash.tableValue}</th>
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
                        <td className="py-3 px-3 text-center text-slate-650 font-mono font-medium">{runCount} deliveries</td>
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
                    <p className="text-[10px] text-slate-400 font-mono">{p.sku}</p>
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
            onClick={() => onNavigate('stock')}
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
              onClick={() => onNavigate('delivery')}
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
                      <div className="flex items-center gap-1.5">
                        {ch.customerNames.slice(0, 1).map((c, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-650 rounded text-[10px] font-semibold truncate block max-w-[95px] border border-slate-200" title={c}>
                            {c}
                          </span>
                        ))}
                        {ch.customerNames.length > 1 && (
                          <span className="px-1.5 py-0.5 bg-slate-200 text-slate-805 rounded text-[10px] font-semibold border border-slate-300 shrink-0">
                            +{ch.customerNames.length - 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-3 text-right font-semibold text-slate-700 font-mono">{formatBDT(ch.totalAmount)}</td>
                    <td className="py-4 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap inline-block ${
                        ch.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        ch.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        ch.status === 'Returned' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-705 border-amber-200'
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
            onClick={() => onNavigate('purchase')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all shadow-sm shrink-0 cursor-pointer border border-slate-950"
          >
            <Plus className="w-4 h-4 text-white" />
            {tDash.newProcInvoice}
          </button>
          <button
            id="dash-quick-sell"
            onClick={() => onNavigate('sales')}
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
