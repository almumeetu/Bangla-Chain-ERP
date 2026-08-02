'use client';

import React from 'react';
import { Sliders, ArrowRightLeft, CheckCircle2, Calendar, Search, History, Wrench, Printer } from 'lucide-react';
import type { StockAdjustment, Product, Category, Procurement }  from '../types';
import type { Language }                  from '../translations';

import { useStockAdjustment }  from './stock/useStockAdjustment';
import ProductPicker           from './stock/ProductPicker';
import AdjustmentForm          from './stock/AdjustmentForm';
import AdjustmentAuditLog      from './stock/AdjustmentAuditLog';
import { printInventoryValuation } from '../lib/printUtils';

// ── Props ─────────────────────────────────────────────────────────────────────

interface StockAdjustmentModuleProps {
  attributes:    any[];
  setAttributes: React.Dispatch<React.SetStateAction<any[]>>;
  adjustments:   StockAdjustment[];
  setAdjustments:React.Dispatch<React.SetStateAction<StockAdjustment[]>>;
  products:      Product[];
  setProducts:   React.Dispatch<React.SetStateAction<Product[]>>;
  categories:    Category[];
  language:      Language;
  procurements?: Procurement[];
  challans?:     any[];
}

// ── Empty-state panels ────────────────────────────────────────────────────────

function EmptyConsole({ language }: { language: Language }) {
  const bn = language === 'bn';
  return (
    <div className="h-full min-h-[300px] bg-white rounded-xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center p-8 gap-3">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
        <ArrowRightLeft className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm font-bold text-slate-500">
        {bn ? 'বাম দিক থেকে একটি পণ্য সিলেক্ট করুন' : 'Select a product from the left'}
      </p>
      <p className="text-xs text-slate-400">
        {bn ? 'সিলেক্ট করলে এখানে অ্যাডজাস্টমেন্ট ফর্ম আসবে' : 'The adjustment form will appear here'}
      </p>
    </div>
  );
}

function SuccessPanel({
  language, productName, onReset,
}: { language: Language; productName: string; onReset: () => void }) {
  const bn = language === 'bn';
  return (
    <div className="h-full min-h-[300px] bg-white rounded-xl border border-emerald-200 flex flex-col items-center justify-center text-center p-8 gap-4">
      <CheckCircle2 className="w-12 h-12 text-emerald-500" />
      <div>
        <p className="text-sm font-bold text-slate-800 mb-1">
          {bn ? 'স্টক আপডেট সম্পন্ন!' : 'Stock Updated Successfully!'}
        </p>
        <p className="text-xs text-slate-500">{productName}</p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer transition-all"
      >
        {bn ? 'আরেকটি পণ্য ঠিক করুন' : 'Adjust Another Product'}
      </button>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StockAdjustmentModule({
  adjustments, setAdjustments, products, setProducts, categories, language, procurements = [], challans = [],
}: StockAdjustmentModuleProps) {
  const getLocalDateString = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const [activeTab, setActiveTab] = React.useState<'adjustments' | 'history'>('adjustments');
  const [stockHistoryDate, setStockHistoryDate] = React.useState<string>(() => getLocalDateString(new Date()));
  
  // History tab filter states
  const [historySearch, setHistorySearch] = React.useState('');
  const [historyCompanyFilter, setHistoryCompanyFilter] = React.useState('All');

  const hook = useStockAdjustment(products, setProducts, adjustments, setAdjustments, language);
  const bn   = language === 'bn';

  // Group products by company (for adjustments dashboard tab)
  const companyStats = products.reduce((acc, p) => {
    const company = p.company || 'Unknown';
    if (!acc[company]) {
      acc[company] = {
        uniqueProducts: 0,
        totalStock: 0,
        totalValue: 0
      };
    }
    acc[company].uniqueProducts += 1;
    acc[company].totalStock += p.currentStock;
    acc[company].totalValue += p.currentStock * p.defaultPP;
    return acc;
  }, {} as Record<string, { uniqueProducts: number; totalStock: number; totalValue: number }>);

  const getCompanyStyles = (companyName: string) => {
    const c = companyName.toLowerCase();
    if (c.includes('pran')) {
      return {
        border: 'border-orange-200 bg-orange-50/20 hover:border-orange-500 hover:bg-orange-50/30',
        text: 'text-orange-700',
        iconBg: 'bg-orange-100/50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white border-orange-200/50',
        valueText: 'text-orange-850',
        borderBottom: 'border-orange-100'
      };
    }
    if (c.includes('olympic')) {
      return {
        border: 'border-blue-200 bg-blue-50/20 hover:border-blue-500 hover:bg-blue-50/30',
        text: 'text-blue-700',
        iconBg: 'bg-blue-100/50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white border-blue-200/50',
        valueText: 'text-blue-850',
        borderBottom: 'border-blue-100'
      };
    }
    if (c.includes('haque')) {
      return {
        border: 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-500 hover:bg-emerald-50/30',
        text: 'text-emerald-700',
        iconBg: 'bg-emerald-100/50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white border-emerald-200/50',
        valueText: 'text-emerald-850',
        borderBottom: 'border-emerald-100'
      };
    }
    if (c.includes('coca')) {
      return {
        border: 'border-red-200 bg-red-50/20 hover:border-red-500 hover:bg-red-50/30',
        text: 'text-red-700',
        iconBg: 'bg-red-100/50 text-red-600 group-hover:bg-red-600 group-hover:text-white border-red-200/50',
        valueText: 'text-red-850',
        borderBottom: 'border-red-100'
      };
    }
    return {
      border: 'border-purple-200 bg-purple-50/20 hover:border-purple-500 hover:bg-purple-50/30',
      text: 'text-purple-700',
      iconBg: 'bg-purple-100/50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white border-purple-200/50',
      valueText: 'text-purple-855',
      borderBottom: 'border-purple-100'
    };
  };

  // ── Historic stock calculation helper ─────────────────────────────────────────
  const getHistoricStockForProduct = (product: Product, targetDate: string) => {
    if (product.createdAt && product.createdAt.slice(0, 10) > targetDate) {
      return 0;
    }
    let stock = product.currentStock;

    procurements.forEach(proc => {
      const procDate = proc.deliveryDate || proc.invoiceDate || (proc.createdAt ? proc.createdAt.slice(0, 10) : null);
      if (procDate && procDate > targetDate) {
        const item = proc.items.find(i => i.productId === product.id);
        if (item) {
          stock -= (item.qty + (item.bonusQty || 0));
        }
      }
    });

    challans.forEach(challan => {
      const challanDate = challan.createdAt.slice(0, 10);
      if (challanDate && challanDate > targetDate) {
        if (challan.productName === product.name) {
          stock += (challan.totalQty - (challan.returnedQty || 0));
        }
      }
    });

    adjustments.forEach(adj => {
      if (adj.productId === product.id && adj.date && adj.date > targetDate) {
        stock -= adj.qtyChanged;
      }
    });

    return Math.max(0, stock);
  };

  // ── Stock layout formatting helper ──────────────────────────────────────────
  const formatStock = (stock: number, size: number, primaryUnit?: string) => {
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

    if (language === 'bn') {
      if (cartons === 0 && pieces > 0) {
        return `${pieces} পিস`;
      }
      if (pieces === 0) {
        return `${cartons} কার্টন`;
      }
      return `${cartons} কার্টন, ${pieces} পিস`;
    }

    if (cartons === 0 && pieces > 0) {
      return `${pieces} Pcs`;
    }
    if (pieces === 0) {
      return `${cartons} Ctn`;
    }
    return `${cartons} Ctn, ${pieces} Pcs`;
  };

  const formatBDT = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  };

  // Compute stats for historical view
  const todayStr = getLocalDateString(new Date());
  const yesterdayStr = getLocalDateString(new Date(Date.now() - 86400000));
  const sevenDaysAgoStr = getLocalDateString(new Date(Date.now() - 7 * 86400000));

  const targetDate = stockHistoryDate || todayStr;
  const historicProducts = products.map(p => {
    const hStock = getHistoricStockForProduct(p, targetDate);
    const tpPrice = p.primaryUnit === 'Carton'
      ? (p.pricePerCarton || p.defaultWSP)
      : (p.pricePerPiece || p.defaultWSP);
    
    return {
      ...p,
      historicStock: hStock,
      valuationDP: hStock * p.defaultPP,
      valuationTP: hStock * tpPrice,
    };
  });

  const filteredHistoric = historicProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(historySearch.toLowerCase()) || p.sku.toLowerCase().includes(historySearch.toLowerCase());
    const matchesCompany = historyCompanyFilter === 'All' || p.company === historyCompanyFilter;
    return matchesSearch && matchesCompany;
  });

  const totalValuationDP = filteredHistoric.reduce((sum, p) => sum + p.valuationDP, 0);
  const totalValuationTP = filteredHistoric.reduce((sum, p) => sum + p.valuationTP, 0);
  const totalStockVolumePcs = filteredHistoric.reduce((sum, p) => sum + p.historicStock, 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-300" />
            {bn ? 'স্টক অ্যাডজাস্টমেন্ট ও ইনভেন্টরি ইতিহাস' : 'Stock Adjustments & Inventory History'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {bn
              ? 'গুদামের বাস্তব স্টক সমন্বয় করুন অথবা ইনভেন্টরি ইতিহাস ও মূল্যমান রিপোর্ট বিশ্লেষণ করুন।'
              : 'Correct warehouse stock variances or analyze historical inventory valuation snapshots.'}
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border border-slate-200 gap-1.5 bg-slate-50/80 p-1.5 rounded-2xl shadow-inner max-w-md">
        <button
          onClick={() => setActiveTab('adjustments')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 ${
            activeTab === 'adjustments'
              ? 'bg-indigo-600 text-white shadow-md font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          {bn ? 'লাইভ সমন্বয়' : 'Live Adjustments'}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-md font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          {bn ? 'ইনভেন্টরি ইতিহাস ও মূল্য' : 'Stock History & Valuation'}
        </button>
      </div>

      {activeTab === 'adjustments' ? (
        // ── LIVE ADJUSTMENTS TAB ──────────────────────────────────────────────────────
        <div className="space-y-6">
          {/* Company-wise Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(companyStats).map(([company, stats]) => {
              const styles = getCompanyStyles(company);
              return (
                <div key={company} className={`p-4.5 rounded-2xl border shadow-sm flex flex-col justify-between relative overflow-hidden group transition-all duration-300 ${styles.border}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">{company} {bn ? 'স্টক' : 'Stock'}</span>
                      <span className={`text-lg font-black font-mono mt-1 block ${styles.text}`}>
                        {stats.totalStock.toLocaleString()} <span className="text-xs font-bold text-slate-500">Pcs</span>
                      </span>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors duration-300 ${styles.iconBg}`}>
                      <Sliders className="w-4 h-4" />
                    </div>
                  </div>
                  <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs text-slate-550 ${styles.borderBottom}`}>
                    <div>
                      <span className="text-slate-450 font-bold">{bn ? 'আইটেম:' : 'Items:'}</span> <span className="font-extrabold text-slate-800">{stats.uniqueProducts}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-450 font-bold">{bn ? 'মূল্য (DP):' : 'Value (DP):'}</span> <span className={`font-black font-mono ${styles.valueText}`}>৳{stats.totalValue.toLocaleString('en-BD')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <ProductPicker
              language={language}
              products={products}
              filteredProducts={hook.filteredProducts}
              selectedProdId={hook.selectedProdId}
              searchQuery={hook.searchQuery}
              selectedCompany={hook.selectedCompany}
              selectedCategory={hook.selectedCategory}
              categories={categories}
              onSearchChange={hook.handleSearchChange}
              onCompanyChange={hook.handleCompanyChange}
              onCategoryChange={hook.handleCategoryChange}
              onSelectProduct={hook.handleSelectProduct}
            />

            <div className="lg:col-span-7">
              {!hook.selectedProduct && <EmptyConsole language={language} />}

              {hook.selectedProduct && hook.submitted && (
                <SuccessPanel
                  language={language}
                  productName={hook.selectedProduct.name}
                  onReset={hook.handleReset}
                />
              )}

              {hook.selectedProduct && !hook.submitted && (
                <AdjustmentForm
                  language={language}
                  product={hook.selectedProduct}
                  newStockQty={hook.newStockQty}
                  adjustReason={hook.adjustReason}
                  variance={hook.variance}
                  quickReasons={hook.quickReasons}
                  onSetQty={hook.handleSetQty}
                  onStepQty={hook.handleStepQty}
                  onSetReason={hook.handleSetReason}
                  onSubmit={hook.handleCommit}
                />
              )}
            </div>
          </div>

          {/* Audit log */}
          <AdjustmentAuditLog
            language={language}
            adjustments={adjustments}
            paginatedAdjustments={hook.paginatedAdjustments}
            currentPage={hook.currentPage}
            totalPages={hook.totalPages}
            startIndex={hook.startIndex}
            adjustmentStartDate={hook.adjustmentStartDate}
            adjustmentEndDate={hook.adjustmentEndDate}
            onPageChange={hook.handlePageChange}
            onAdjustmentStartDateChange={hook.handleAdjustmentStartDateChange}
            onAdjustmentEndDateChange={hook.handleAdjustmentEndDateChange}
            onResetAdjustmentDates={hook.handleResetAdjustmentDates}
          />
        </div>
      ) : (
        // ── INVENTORY HISTORY & VALUATION TAB ─────────────────────────────────────────
        <div className="space-y-6">
          
          {/* Beautiful highlighted selector header */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-md relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stockHistoryDate ? 'bg-indigo-400 animate-ping' : 'bg-slate-500'}`} />
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono border border-indigo-500/10">
                    {bn ? 'ইনভেন্টরি ইতিহাস ও মূল্য' : 'Inventory History & Valuation'}
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tight mt-2.5">
                  {bn ? 'কোন দিনের স্টক ও মূল্য দেখতে চান?' : 'Select Stock History Date'}
                </h3>
                <p className="text-slate-350 text-xs font-medium max-w-xl">
                  {bn 
                    ? 'অতীতের যেকোনো তারিখ নির্বাচন করে ঐ দিনের পণ্যের স্টক, স্টক মূল্যায়ন এবং ইনভেন্টরি অবস্থা দেখুন।' 
                    : 'Select any previous date to view historical product stock, stock valuation, and inventory status.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                {/* Presets */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStockHistoryDate(todayStr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      stockHistoryDate === todayStr
                        ? 'bg-white text-indigo-950 shadow-md'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    {bn ? 'আজকে' : 'Today'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockHistoryDate(yesterdayStr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      stockHistoryDate === yesterdayStr
                        ? 'bg-white text-indigo-950 shadow-md'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    {bn ? 'গতকাল' : 'Yesterday'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockHistoryDate(sevenDaysAgoStr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      stockHistoryDate === sevenDaysAgoStr
                        ? 'bg-white text-indigo-950 shadow-md'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    {bn ? '৭ দিন আগে' : '7 Days Ago'}
                  </button>
                </div>

                {/* Calendar Input */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none z-10" />
                  <input
                    type="date"
                    value={stockHistoryDate}
                    onChange={e => setStockHistoryDate(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-white/20 bg-white/10 text-white text-xs font-bold outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition-all cursor-pointer shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center gap-4.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  {bn ? 'মোট স্টক পরিমাণ' : 'Total Stock Volume'}
                </span>
                <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
                  {totalStockVolumePcs.toLocaleString()} <span className="text-xs font-bold text-slate-500">Pcs</span>
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center gap-4.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <span className="text-2xl font-bold font-mono">৳</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  {bn ? 'ইনভেন্টরি মূল্য (DP/ক্রয়মূল্য)' : 'Inventory Value (DP/Cost)'}
                </span>
                <span className="text-xl font-black text-emerald-700 font-mono tracking-tight">
                  {formatBDT(totalValuationDP)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center gap-4.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <span className="text-2xl font-bold font-mono">৳</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  {bn ? 'ইনভেন্টরি মূল্য (TP/বিক্রয়মূল্য)' : 'Inventory Value (TP/Wholesale)'}
                </span>
                <span className="text-xl font-black text-amber-700 font-mono tracking-tight">
                  {formatBDT(totalValuationTP)}
                </span>
              </div>
            </div>
          </div>

          {/* Filtering & Action Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  placeholder={bn ? 'পণ্য বা SKU খুঁজুন...' : 'Search product or SKU...'}
                  className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                />
              </div>

              <select
                value={historyCompanyFilter}
                onChange={e => setHistoryCompanyFilter(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-slate-50/20 px-3.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="All">{bn ? 'সকল কোম্পানি' : 'All Companies'}</option>
                {Array.from(new Set(products.map(p => p.company).filter(Boolean))).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => printInventoryValuation(targetDate, filteredHistoric, totalValuationDP, totalValuationTP)}
              className="inline-flex h-10 items-center justify-center gap-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer transition-all active:scale-95 shadow-md shrink-0 border border-indigo-700"
            >
              <Printer className="w-3.5 h-3.5" />
              {bn ? 'মূল্যমান রিপোর্ট প্রিন্ট করুন' : 'Print Valuation Report'}
            </button>
          </div>

          {/* Historical Table */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-extrabold tracking-wider">
                    <th className="px-5 py-4 text-center" style={{ width: '50px' }}>#</th>
                    <th className="px-5 py-4">{bn ? 'পণ্যের নাম' : 'Product Name'}</th>
                    <th className="px-5 py-4">{bn ? 'কোম্পানি' : 'Company'}</th>
                    <th className="px-5 py-4">{bn ? 'স্টক পরিমাণ' : 'Stock Quantity'}</th>
                    <th className="px-5 py-4 text-right">{bn ? 'ডিলার মূল্য (DP)' : 'Dealer Price (DP)'}</th>
                    <th className="px-5 py-4 text-right">{bn ? 'পাইকারি মূল্য (TP)' : 'Trade Price (TP)'}</th>
                    <th className="px-5 py-4 text-right">{bn ? 'স্টক মূল্য (DP)' : 'Stock Value (DP)'}</th>
                    <th className="px-5 py-4 text-right">{bn ? 'স্টক মূল্য (TP)' : 'Stock Value (TP)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistoric.length > 0 ? (
                    filteredHistoric.map((p, idx) => {
                      const tpPrice = p.primaryUnit === 'Carton'
                        ? (p.pricePerCarton || p.defaultWSP)
                        : (p.pricePerPiece || p.defaultWSP);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5 text-center text-xs font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900 text-sm mb-0.5">{p.name}</div>
                            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{p.sku}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-slate-50 border-slate-200 text-slate-600 shadow-sm">
                              {p.company}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border bg-slate-50 text-slate-750 border-slate-200">
                              {formatStock(p.historicStock, p.cartonSize || 24, p.primaryUnit)}
                            </span>
                            {p.primaryUnit !== 'Carton' && (
                              <span className="text-[10px] text-slate-400 ml-1.5 font-medium">
                                ({p.historicStock.toLocaleString()} Pcs)
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-right text-slate-600 font-medium font-mono">
                            {formatBDT(p.defaultPP)}/{p.primaryUnit === 'Carton' ? 'Ctn' : 'pc'}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-right text-indigo-600 font-bold font-mono">
                            {formatBDT(tpPrice)}/{p.primaryUnit === 'Carton' ? 'Ctn' : 'pc'}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-right text-emerald-600 font-bold font-mono">
                            {formatBDT(p.valuationDP)}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-right text-slate-900 font-extrabold font-mono">
                            {formatBDT(p.valuationTP)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-xs font-bold text-slate-400">
                        {bn ? 'কোন পণ্য পাওয়া যায়নি।' : 'No products found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
