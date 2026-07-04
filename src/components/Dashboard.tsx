'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Box, 
  DollarSign, 
  AlertTriangle, 
  Plus, 
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Clock,
  Briefcase,
  FileText,
  Package,
  Users,
  BarChart3,
  Truck,
  Activity,
  ChevronRight,
  Wallet,
  CircleDollarSign,
  ReceiptText,
  Store,
  ShieldAlert,
  Layers
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

  // ─── Calculations ─────────────────────────────────────────────
  const totalSales = challans.reduce((sum, ch) => {
    const netAmount = ch.totalAmount - ((ch.returnedQty || 0) * ch.rate);
    return sum + Math.max(0, netAmount);
  }, 0);

  const totalProcurementCost = procurements.reduce((sum, pr) => sum + pr.globalTotal, 0);
  const totalExpensesCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const totalDamagedQty = products.reduce((sum, p) => sum + (p.damagedStock || 0), 0);
  const totalDamagedVal = products.reduce((sum, p) => sum + ((p.damagedStock || 0) * p.defaultPP), 0);

  const netProfit = totalSales - totalProcurementCost - totalExpensesCost;

  const totalStockUnits = products.reduce((sum, p) => sum + p.currentStock, 0);
  const totalStockValue = products.reduce((sum, p) => sum + (p.currentStock * p.defaultPP), 0);

  // ─── Date helpers ─────────────────────────────────────────────
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

  // ─── Today's metrics ─────────────────────────────────────────
  const todaysChallans = challans.filter(ch => getChallanDate(ch.id) === todayStr);
  const todaysSales = todaysChallans.reduce((sum, ch) => {
    const netAmount = ch.totalAmount - ((ch.returnedQty || 0) * ch.rate);
    return sum + Math.max(0, netAmount);
  }, 0);

  const todaysCOGS = todaysChallans.reduce((sum, ch) => {
    const prod = products.find(p => p.name === ch.productName);
    const purchasePrice = prod ? prod.defaultPP : (ch.rate * 0.65);
    return sum + ((ch.qty - (ch.returnedQty || 0)) * purchasePrice);
  }, 0);

  const todaysExpensesTotal = expenses
    .filter(exp => exp.expenseDate === todayStr)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const todaysNetProfit = todaysSales - todaysCOGS - todaysExpensesTotal;

  // Yesterday's metrics
  const yesterdaysChallans = challans.filter(ch => getChallanDate(ch.id) === yesterdayStr);
  const yesterdaysSales = yesterdaysChallans.reduce((sum, ch) => {
    const netAmount = ch.totalAmount - ((ch.returnedQty || 0) * ch.rate);
    return sum + Math.max(0, netAmount);
  }, 0);

  const yesterdaysCOGS = yesterdaysChallans.reduce((sum, ch) => {
    const prod = products.find(p => p.name === ch.productName);
    const purchasePrice = prod ? prod.defaultPP : (ch.rate * 0.65);
    return sum + ((ch.qty - (ch.returnedQty || 0)) * purchasePrice);
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

  // Stock highlights
  const lowStockProducts = products.filter(p => p.currentStock < 600);

  // Recent Challans
  const recentChallans = [...challans].reverse().slice(0, 5);

  // Company data
  const companyBrands = useMemo(() => Array.from(new Set(products.map(p => p.company))), [products]);
  
  const companyStockData = useMemo(() => {
    return companyBrands.map(brand => {
      const brandProds = products.filter(p => p.company === brand);
      return {
        brand,
        units: brandProds.reduce((sum, p) => sum + p.currentStock, 0),
        value: brandProds.reduce((sum, p) => sum + (p.currentStock * p.defaultPP), 0),
        damagedUnits: brandProds.reduce((sum, p) => sum + (p.damagedStock || 0), 0),
        damagedValue: brandProds.reduce((sum, p) => sum + ((p.damagedStock || 0) * p.defaultPP), 0),
        productCount: brandProds.length
      };
    }).sort((a, b) => b.value - a.value);
  }, [products, companyBrands]);

  const maxCompanyVal = Math.max(...companyStockData.map(c => c.value), 1);

  // Format BDT helper
  const formatBDT = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
    return `${amount < 0 ? '-' : ''}৳${formatted}`;
  };

  const formatCompact = (n: number) => {
    if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `৳${(n / 1000).toFixed(1)}K`;
    return formatBDT(n);
  };

  // Trend badge component
  const TrendBadge = ({ value }: { value: number }) => {
    if (value === 0) return (
      <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
        {language === 'bn' ? 'স্থির' : 'Stable'}
      </span>
    );
    const isUp = value > 0;
    return (
      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold border ${
        isUp 
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
          : 'bg-rose-50 text-rose-600 border-rose-100'
      }`}>
        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isUp ? '+' : ''}{value.toFixed(1)}%
      </span>
    );
  };

  // Color palette for companies
  const brandColors = [
    { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100' },
    { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
    { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: WELCOME HEADER — Minimal, Informative
      ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center shadow-md shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
              {language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {language === 'bn' 
                ? `আজকের তারিখ: ${new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` 
                : `Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {language === 'bn' ? 'সিস্টেম সচল' : 'System Active'}
          </span>
          <button
            onClick={() => onDownloadPDF('dashboard')}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-[11px] font-bold text-white hover:bg-slate-800 active:scale-[0.97] transition-all cursor-pointer shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            {language === 'bn' ? 'রিপোর্ট' : 'Report'}
          </button>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: QUICK ACTIONS — 4 Big Buttons
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: 'quick-action-sales',
            icon: ShoppingBag,
            title: language === 'bn' ? 'বিক্রয় মেমো' : 'Sales Memo',
            desc: language === 'bn' ? 'নতুন বিক্রয় করুন' : 'Create new sale',
            color: 'emerald',
            tab: 'sales'
          },
          {
            id: 'quick-action-purchase',
            icon: Package,
            title: language === 'bn' ? 'স্টক রিসিভ' : 'Receive Stock',
            desc: language === 'bn' ? 'কোম্পানি থেকে মাল আনুন' : 'From company',
            color: 'blue',
            tab: 'purchase'
          },
          {
            id: 'quick-action-delivery',
            icon: Truck,
            title: language === 'bn' ? 'ডেলিভারি চালান' : 'Delivery Challan',
            desc: language === 'bn' ? 'SR-কে মাল দিন' : 'Send to SR',
            color: 'amber',
            tab: 'delivery'
          },
          {
            id: 'quick-action-accounts',
            icon: Wallet,
            title: language === 'bn' ? 'খরচ লিখুন' : 'Add Expense',
            desc: language === 'bn' ? 'দৈনিক খরচ রেকর্ড' : 'Daily expenses',
            color: 'rose',
            tab: 'accounts'
          }
        ].map(action => {
          const colorMap: Record<string, { iconBg: string; hoverBorder: string; hoverBg: string; shadow: string }> = {
            emerald: { iconBg: 'bg-emerald-600', hoverBorder: 'hover:border-emerald-300', hoverBg: 'hover:bg-emerald-50/40', shadow: 'shadow-emerald-100' },
            blue: { iconBg: 'bg-blue-600', hoverBorder: 'hover:border-blue-300', hoverBg: 'hover:bg-blue-50/40', shadow: 'shadow-blue-100' },
            amber: { iconBg: 'bg-amber-600', hoverBorder: 'hover:border-amber-300', hoverBg: 'hover:bg-amber-50/40', shadow: 'shadow-amber-100' },
            rose: { iconBg: 'bg-rose-600', hoverBorder: 'hover:border-rose-300', hoverBg: 'hover:bg-rose-50/40', shadow: 'shadow-rose-100' }
          };
          const c = colorMap[action.color];
          return (
            <button
              key={action.id}
              id={action.id}
              onClick={() => onNavigate(action.tab)}
              className={`flex items-center gap-3 p-3.5 rounded-xl bg-white border border-slate-200 ${c.hoverBorder} ${c.hoverBg} hover:shadow-md active:scale-[0.97] transition-all text-left cursor-pointer group`}
            >
              <div className={`p-2.5 ${c.iconBg} text-white rounded-lg group-hover:scale-110 transition-transform shadow-sm ${c.shadow}`}>
                <action.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-800 text-xs truncate">{action.title}</h4>
                <p className="text-[10px] text-slate-400 font-medium truncate">{action.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 ml-auto shrink-0 group-hover:text-slate-500 transition-colors" />
            </button>
          );
        })}
      </div>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: TODAY'S SNAPSHOT — 3 Clean Cards
      ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="font-bold text-slate-700 text-xs tracking-wide uppercase">
              {language === 'bn' ? 'আজকের হিসাব' : "Today's Summary"}
            </h3>
          </div>
          <span className="text-[10px] font-medium text-slate-400">
            {todayStr}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Today's Sales */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {language === 'bn' ? 'আজকের বিক্রয়' : "Today's Sales"}
                </span>
              </div>
              <TrendBadge value={salesChangePercent} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">{formatBDT(todaysSales)}</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-medium">
                {language === 'bn' ? 'গতকাল' : 'Yesterday'}
              </span>
              <span className="font-bold text-slate-600 font-mono">{formatBDT(yesterdaysSales)}</span>
            </div>
          </div>

          {/* Today's Expenses */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center border border-rose-100">
                  <Wallet className="w-4 h-4 text-rose-600" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {language === 'bn' ? 'আজকের খরচ' : "Today's Expenses"}
                </span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">{formatBDT(todaysExpensesTotal)}</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-medium">
                {language === 'bn' ? 'অফিস ও পরিবহন' : 'Office & Transport'}
              </span>
              <span className="font-bold text-slate-600 font-mono">{formatBDT(yesterdaysExpensesTotal)}</span>
            </div>
          </div>

          {/* Today's Profit */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  todaysNetProfit >= 0 
                    ? 'bg-emerald-50 border-emerald-100' 
                    : 'bg-rose-50 border-rose-100'
                }`}>
                  <TrendingUp className={`w-4 h-4 ${todaysNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {language === 'bn' ? 'আজকের লাভ' : "Today's Profit"}
                </span>
              </div>
              <TrendBadge value={profitChangePercent} />
            </div>
            <div>
              <p className={`text-2xl font-black font-mono tracking-tight ${
                todaysNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {formatBDT(todaysNetProfit)}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-medium">
                {language === 'bn' ? 'গতকালের লাভ' : "Yesterday's Profit"}
              </span>
              <span className="font-bold text-slate-600 font-mono">{formatBDT(yesterdaysNetProfit)}</span>
            </div>
          </div>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 4: OVERALL KPIs — 5 Clean Metric Cards
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Net Profit */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'মোট লাভ' : 'Net Profit'}
            </span>
          </div>
          <p className={`text-lg font-black font-mono tracking-tight ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatBDT(netProfit)}
          </p>
          <p className="text-[9px] text-slate-400 font-medium mt-1">
            {language === 'bn' ? 'বিক্রয় − ক্রয় − খরচ' : 'Sales − Purchase − Expenses'}
          </p>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-blue-600" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'মোট বিক্রয়' : 'Total Sales'}
            </span>
          </div>
          <p className="text-lg font-black text-slate-900 font-mono tracking-tight">{formatBDT(totalSales)}</p>
          <p className="text-[9px] text-slate-400 font-medium mt-1">
            {language === 'bn' ? `${challans.length}টি ডেলিভারি` : `${challans.length} deliveries`}
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-rose-400 to-rose-600" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center border border-rose-100">
              <DollarSign className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'মোট খরচ' : 'Total Expenses'}
            </span>
          </div>
          <p className="text-lg font-black text-slate-900 font-mono tracking-tight">{formatBDT(totalExpensesCost)}</p>
          <p className="text-[9px] text-slate-400 font-medium mt-1">
            {language === 'bn' ? `${expenses.length}টি এন্ট্রি` : `${expenses.length} entries`}
          </p>
        </div>

        {/* Total Stock Value */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-400 to-indigo-600" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'স্টক মূল্য' : 'Stock Value'}
            </span>
          </div>
          <p className="text-lg font-black text-slate-900 font-mono tracking-tight">{formatBDT(totalStockValue)}</p>
          <p className="text-[9px] text-slate-400 font-medium mt-1">
            {language === 'bn' ? `${totalStockUnits.toLocaleString()} ইউনিট` : `${totalStockUnits.toLocaleString()} units`}
          </p>
        </div>

        {/* Total Damages */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all group relative overflow-hidden col-span-2 lg:col-span-1">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-400 to-amber-600" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'মোট ড্যামেজ' : 'Damages'}
            </span>
          </div>
          <p className="text-lg font-black text-slate-900 font-mono tracking-tight">{formatBDT(totalDamagedVal)}</p>
          <p className="text-[9px] text-slate-400 font-medium mt-1">
            {language === 'bn' ? `${totalDamagedQty}টি পণ্য` : `${totalDamagedQty} items`}
          </p>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 5: COMPANY STOCK & DAMAGE — Side by Side
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Company Stock Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-slate-500" />
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">
                {language === 'bn' ? 'কোম্পানি ভিত্তিক স্টক' : 'Stock by Company'}
              </h4>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
              {language === 'bn' ? 'গুদামে' : 'In Warehouse'}
            </span>
          </div>

          <div className="p-4 space-y-2 max-h-[340px] overflow-y-auto">
            {companyStockData.map((comp, i) => {
              const pct = (comp.value / maxCompanyVal) * 100;
              const c = brandColors[i % brandColors.length];
              return (
                <div key={comp.brand} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-slate-200 transition-all group">
                  <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center text-white font-bold text-[11px] shrink-0 shadow-sm`}>
                    {comp.brand[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 truncate">{comp.brand}</span>
                      <span className="text-xs font-black text-slate-800 font-mono shrink-0 ml-2">{formatBDT(comp.value)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                        <div className={`h-full ${c.bg} rounded-full transition-all duration-700`} style={{ width: `${Math.max(6, pct)}%` }} />
                      </div>
                      <span className="text-[9px] font-semibold text-slate-400 shrink-0 w-14 text-right">
                        {comp.units.toLocaleString()} {language === 'bn' ? 'পিস' : 'pcs'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {companyStockData.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-8">{language === 'bn' ? 'কোনো পণ্য নেই' : 'No products found'}</p>
            )}
          </div>
        </div>

        {/* Company Damage Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">
                {language === 'bn' ? 'কোম্পানি ভিত্তিক ড্যামেজ' : 'Damages by Company'}
              </h4>
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-100">
              {language === 'bn' ? 'ড্যামেজ' : 'Damage'}
            </span>
          </div>

          <div className="p-4 space-y-2 max-h-[340px] overflow-y-auto">
            {companyStockData.map((comp, i) => {
              const maxDmg = Math.max(...companyStockData.map(c => c.damagedValue), 1);
              const pct = comp.damagedValue > 0 ? (comp.damagedValue / maxDmg) * 100 : 0;
              return (
                <div key={comp.brand} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-slate-200 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-[11px] shrink-0">
                    {comp.brand[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 truncate">{comp.brand}</span>
                      <span className={`text-xs font-black font-mono shrink-0 ml-2 ${comp.damagedValue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {comp.damagedValue > 0 ? formatBDT(comp.damagedValue) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-400 rounded-full transition-all duration-700" style={{ width: `${Math.max(pct > 0 ? 6 : 0, pct)}%` }} />
                      </div>
                      <span className="text-[9px] font-semibold text-slate-400 shrink-0 w-14 text-right">
                        {comp.damagedUnits.toLocaleString()} {language === 'bn' ? 'পিস' : 'pcs'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 6: SR LEADERBOARD & LOW STOCK — Side by Side
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* SR Leaderboard */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">
                {language === 'bn' ? 'সেলস অফিসার (SR)' : 'Sales Officers'}
              </h4>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
              {language === 'bn' ? 'মোট বিক্রয়' : 'Total Sales'}
            </span>
          </div>

          <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            {srs.length > 0 ? srs.map((sr, idx) => {
              const srChallans = challans.filter(ch => ch.srName === sr.name);
              const totalAmt = srChallans.reduce((sum, ch) => {
                const netAmount = ch.totalAmount - ((ch.returnedQty || 0) * ch.rate);
                return sum + Math.max(0, netAmount);
              }, 0);

              const avatarGradients = [
                'from-blue-500 to-indigo-600',
                'from-purple-500 to-pink-500',
                'from-emerald-500 to-teal-500',
                'from-amber-500 to-orange-500'
              ];

              return (
                <div key={sr.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-black text-slate-300 w-4 text-center">#{idx + 1}</span>
                    <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarGradients[idx % avatarGradients.length]} flex items-center justify-center font-bold text-white text-[10px] shadow-sm`}>
                      {sr.name[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{sr.name}</p>
                    <p className="text-[9px] text-slate-400 font-mono">{srChallans.length} {language === 'bn' ? 'অর্ডার' : 'orders'}</p>
                  </div>
                  <span className="text-xs font-black text-slate-800 font-mono shrink-0">{formatBDT(totalAmt)}</span>
                </div>
              );
            }) : (
              <p className="text-center text-xs text-slate-400 py-8">{language === 'bn' ? 'কোনো SR নেই' : 'No SRs found'}</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">
                {language === 'bn' ? 'স্টক সতর্কতা' : 'Low Stock Alerts'}
              </h4>
            </div>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {lowStockProducts.length} {language === 'bn' ? 'টি সতর্কতা' : 'alerts'}
            </span>
          </div>

          <div className="max-h-[260px] overflow-y-auto">
            {lowStockProducts.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[9px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 bg-slate-50/30">
                    <th className="text-left px-5 py-2.5">{language === 'bn' ? 'পণ্য' : 'Product'}</th>
                    <th className="text-left px-4 py-2.5">{language === 'bn' ? 'কোড' : 'SKU'}</th>
                    <th className="text-right px-5 py-2.5">{language === 'bn' ? 'বর্তমান স্টক' : 'Stock'}</th>
                    <th className="text-center px-4 py-2.5">{language === 'bn' ? 'অবস্থা' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lowStockProducts.map(p => (
                    <tr key={p.id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="px-5 py-2.5">
                        <p className="font-bold text-slate-700 text-xs truncate max-w-[180px]">{p.name}</p>
                        <p className="text-[9px] text-slate-400">{p.company}</p>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500">{p.sku}</td>
                      <td className="px-5 py-2.5 text-right font-bold text-slate-800 font-mono">{p.currentStock}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          p.currentStock < 100 
                            ? 'bg-rose-50 text-rose-600 border-rose-100' 
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {p.currentStock < 100 
                            ? (language === 'bn' ? 'জরুরি' : 'Critical') 
                            : (language === 'bn' ? 'কম' : 'Low')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-10 text-center">
                <p className="text-xs text-slate-400 font-semibold">🎉 {language === 'bn' ? 'সব স্টক পর্যাপ্ত আছে' : 'All stock levels are healthy'}</p>
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('stock')}
              className="w-full py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              {language === 'bn' ? 'স্টক সমন্বয় করুন' : 'Adjust Stock'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 7: RECENT DELIVERIES TABLE
      ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-slate-500" />
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">
              {language === 'bn' ? 'সাম্প্রতিক ডেলিভারি' : 'Recent Deliveries'}
            </h4>
          </div>
          <button
            id="dash-btn-view-challans"
            onClick={() => onNavigate('delivery')}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            {language === 'bn' ? 'সব দেখুন' : 'View All'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="text-[9px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 bg-slate-50/30">
                <th className="text-left px-5 py-3">{language === 'bn' ? 'পণ্য' : 'Product'}</th>
                <th className="text-left px-4 py-3">{language === 'bn' ? 'সেলসম্যান' : 'Salesman'}</th>
                <th className="text-left px-4 py-3">{language === 'bn' ? 'মার্কেট' : 'Market'}</th>
                <th className="text-right px-4 py-3">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                <th className="text-center px-5 py-3">{language === 'bn' ? 'অবস্থা' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentChallans.map(ch => (
                <tr key={ch.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-bold text-slate-700 text-xs truncate max-w-[200px]">{ch.productName}</p>
                    <p className="text-[9px] text-slate-400 font-mono">{ch.attribute}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-600 text-xs">{ch.srName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-medium">
                      {ch.routeName || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-slate-800 font-mono">{formatBDT(ch.totalAmount)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                      ch.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      ch.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {ch.status === 'Delivered' ? (language === 'bn' ? 'সম্পন্ন' : 'Delivered') :
                       ch.status === 'Shipped' ? (language === 'bn' ? 'পাঠানো' : 'Shipped') :
                       (language === 'bn' ? 'মুলতুবি' : 'Pending')}
                    </span>
                  </td>
                </tr>
              ))}
              {recentChallans.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                    {language === 'bn' ? 'কোনো ডেলিভারি নেই' : 'No deliveries yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 8: FOOTER — Warehouse Info & Quick Links
      ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
              <MapPin className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                {language === 'bn' ? 'গুদাম' : 'Warehouse'}
              </p>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                {tDash.primaryHubDesc}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 md:border-x md:border-slate-100 md:px-4">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                {language === 'bn' ? 'দৈনিক লক' : 'Daily Lock'}
              </p>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                {language === 'bn' ? 'প্রতিদিন রাত ১০:০০ টায় স্বয়ংক্রিয়ভাবে লক' : 'Auto-lock at 10 PM daily'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              id="dash-quick-procure"
              onClick={() => onNavigate('purchase')}
              className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2 shadow-sm active:scale-[0.97]"
            >
              <Plus className="w-3.5 h-3.5" />
              {language === 'bn' ? 'নতুন ক্রয়' : 'New Purchase'}
            </button>
            <button
              id="dash-quick-sell"
              onClick={() => onNavigate('sales')}
              className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px] font-bold hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-2 active:scale-[0.97]"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {language === 'bn' ? 'বিক্রয়' : 'Sales'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
