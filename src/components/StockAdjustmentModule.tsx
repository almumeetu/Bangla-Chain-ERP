'use client';

import React from 'react';
import { Sliders, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import type { StockAdjustment, Product, Category }  from '../types';
import type { Language }                  from '../translations';

import { useStockAdjustment }  from './stock/useStockAdjustment';
import ProductPicker           from './stock/ProductPicker';
import AdjustmentForm          from './stock/AdjustmentForm';
import AdjustmentAuditLog      from './stock/AdjustmentAuditLog';

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
  adjustments, setAdjustments, products, setProducts, categories, language,
}: StockAdjustmentModuleProps) {
  const hook = useStockAdjustment(products, setProducts, adjustments, setAdjustments, language);
  const bn   = language === 'bn';

  // Group products by company
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

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-300" />
            {bn ? 'স্টক অ্যাডজাস্টমেন্ট' : 'Stock Adjustments & Corrections'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {bn
              ? 'গুদামের বাস্তব স্টক গণনা করে যেকোনো গরমিল দ্রুত সমন্বয় করুন।'
              : 'Select a product, set the correct quantity, save — done.'}
          </p>
        </div>
      </div>

      {/* Company-wise Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(companyStats).map(([company, stats]) => {
          const styles = getCompanyStyles(company);
          return (
            <div key={company} className={`p-4.5 rounded-2xl border shadow-sm flex flex-col justify-between relative overflow-hidden group transition-all duration-300 ${styles.border}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{company} {bn ? 'স্টক' : 'Stock'}</span>
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
  );
}
