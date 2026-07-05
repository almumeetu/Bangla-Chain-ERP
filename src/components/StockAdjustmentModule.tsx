'use client';

import React from 'react';
import { Sliders, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import type { StockAdjustment, Product }  from '../types';
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
  adjustments, setAdjustments, products, setProducts, language,
}: StockAdjustmentModuleProps) {
  const hook = useStockAdjustment(products, setProducts, adjustments, setAdjustments, language);
  const bn   = language === 'bn';

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

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        <ProductPicker
          language={language}
          products={products}
          filteredProducts={hook.filteredProducts}
          selectedProdId={hook.selectedProdId}
          searchQuery={hook.searchQuery}
          onSearchChange={hook.handleSearchChange}
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
        onPageChange={hook.handlePageChange}
      />
    </div>
  );
}
