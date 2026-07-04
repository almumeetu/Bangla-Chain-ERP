'use client';

import React, { useState } from 'react';
import {
  Sliders, ArrowRightLeft, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, Package, CheckCircle2,
  Minus, Plus, AlertTriangle, ClipboardList, Search
} from 'lucide-react';
import { StockAdjustment, Product } from '../types';
import { translations, Language } from '../translations';

interface StockAdjustmentModuleProps {
  attributes: any[];
  setAttributes: React.Dispatch<React.SetStateAction<any[]>>;
  adjustments: StockAdjustment[];
  setAdjustments: React.Dispatch<React.SetStateAction<StockAdjustment[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  language: Language;
}

export default function StockAdjustmentModule({
  adjustments,
  setAdjustments,
  products,
  setProducts,
  language,
}: StockAdjustmentModuleProps) {

  const [selectedProdId, setSelectedProdId] = useState<string | null>(null);
  const [newStockQty, setNewStockQty]       = useState<number>(0);
  const [adjustReason, setAdjustReason]     = useState('');
  const [searchQuery, setSearchQuery]       = useState('');
  const [submitted, setSubmitted]           = useState(false);
  const [currentPage, setCurrentPage]       = useState(1);
  const itemsPerPage = 5;

  const selectedProduct = products.find(p => p.id === selectedProdId) ?? null;
  const variance = selectedProduct ? newStockQty - selectedProduct.currentStock : 0;

  const QUICK_REASONS = language === 'bn'
    ? ['বার্ষিক অডিট', 'ক্ষতিগ্রস্ত পণ্য', 'চুরি/ঘাটতি', 'ভুল এন্ট্রি সংশোধন', 'নতুন স্টক গণনা']
    : ['Annual Audit', 'Damage Disposal', 'Theft / Shortage', 'Wrong Entry Fix', 'Physical Recount'];

  const selectProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    setSelectedProdId(id);
    setNewStockQty(prod.currentStock);
    setAdjustReason('');
    setSubmitted(false);
  };

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (newStockQty < 0) { alert(language === 'bn' ? 'ঋণাত্মক স্টক সম্ভব নয়।' : 'Stock cannot be negative.'); return; }
    if (!adjustReason.trim()) { alert(language === 'bn' ? 'কারণ লিখুন।' : 'Please provide a reason.'); return; }
    if (variance === 0) { alert(language === 'bn' ? 'কোনো পরিবর্তন নেই।' : 'No change detected.'); return; }

    const newAdj: StockAdjustment = {
      id: `adj-${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      attributeValue: 'Standard',
      oldQty: selectedProduct.currentStock,
      newQty: newStockQty,
      qtyChanged: variance,
      adjustedBy: language === 'bn' ? 'ডিলার/মালিক (অ্যাডমিন)' : 'Owner/Dealer (Admin)',
      reason: adjustReason.trim(),
      date: new Date().toISOString(),
    };

    setAdjustments(prev => [newAdj, ...prev]);
    setProducts(prev => prev.map(p => p.id === selectedProdId ? { ...p, currentStock: newStockQty } : p));
    setSubmitted(true);
    setAdjustReason('');
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(adjustments.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdjustments = adjustments.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-300" />
            {language === 'bn' ? 'স্টক অ্যাডজাস্টমেন্ট' : 'Stock Adjustments & Corrections'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {language === 'bn'
              ? 'গুদামের বাস্তব স্টক গণনা করে যেকোনো গরমিল দ্রুত সমন্বয় করুন।'
              : 'Select a product, set the correct quantity, save — done.'}
          </p>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── LEFT: Product Picker ── */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                {language === 'bn' ? 'পণ্য নির্বাচন করুন' : 'Select Product'}
              </span>
            </div>
            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-mono font-semibold">
              {products.length} {language === 'bn' ? 'টি' : 'items'}
            </span>
          </div>

          {/* Search */}
          <div className="px-4 py-2.5 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={language === 'bn' ? 'পণ্য বা কোড খুঁজুন...' : 'Search product or SKU...'}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Product list */}
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[420px]">
            {filteredProducts.map(p => {
              const isLow      = p.currentStock < 600;
              const isSelected = p.id === selectedProdId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectProduct(p.id)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 border-l-4 border-l-indigo-500'
                      : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-800' : 'text-slate-800'}`}>{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku} · {p.company}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                    <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded border ${
                      isLow
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {p.currentStock.toLocaleString()}
                    </span>
                  </div>
                </button>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                {language === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি।' : 'No products found.'}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Adjustment Console ── */}
        <div className="lg:col-span-7">
          {!selectedProduct ? (
            <div className="h-full min-h-[300px] bg-white rounded-xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center p-8 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-500">
                {language === 'bn' ? 'বাম দিক থেকে একটি পণ্য সিলেক্ট করুন' : 'Select a product from the left'}
              </p>
              <p className="text-xs text-slate-400">
                {language === 'bn' ? 'সিলেক্ট করলে এখানে অ্যাডজাস্টমেন্ট ফর্ম আসবে' : 'The adjustment form will appear here'}
              </p>
            </div>
          ) : submitted ? (
            <div className="h-full min-h-[300px] bg-white rounded-xl border border-emerald-200 flex flex-col items-center justify-center text-center p-8 gap-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <div>
                <p className="text-sm font-bold text-slate-800 mb-1">
                  {language === 'bn' ? 'স্টক আপডেট সম্পন্ন!' : 'Stock Updated Successfully!'}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedProduct.name}
                </p>
              </div>
              <button
                onClick={() => { setSubmitted(false); setSelectedProdId(null); }}
                className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer transition-all"
              >
                {language === 'bn' ? 'আরেকটি পণ্য ঠিক করুন' : 'Adjust Another Product'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleCommit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">

              {/* Product info card */}
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4.5 h-4.5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-indigo-900 truncate">{selectedProduct.name}</p>
                  <p className="text-[10px] text-indigo-500 font-mono">{selectedProduct.sku} · {selectedProduct.company}</p>
                </div>
              </div>

              {/* Stock stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {language === 'bn' ? 'বর্তমান স্টক' : 'Current Stock'}
                  </p>
                  <p className="text-lg font-extrabold text-slate-700 font-mono">{selectedProduct.currentStock.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400 font-semibold">Pcs</p>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {language === 'bn' ? 'নতুন স্টক' : 'New Stock'}
                  </p>
                  <p className="text-lg font-extrabold text-indigo-700 font-mono">{newStockQty.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400 font-semibold">Pcs</p>
                </div>

                <div className={`rounded-xl border p-3 text-center ${
                  variance > 0 ? 'bg-emerald-50 border-emerald-200' :
                  variance < 0 ? 'bg-rose-50 border-rose-200' :
                  'bg-slate-50 border-slate-200'
                }`}>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {language === 'bn' ? 'পার্থক্য' : 'Variance'}
                  </p>
                  <p className={`text-lg font-extrabold font-mono ${
                    variance > 0 ? 'text-emerald-700' : variance < 0 ? 'text-rose-700' : 'text-slate-400'
                  }`}>
                    {variance > 0 ? `+${variance}` : variance}
                  </p>
                  <div className="flex justify-center mt-0.5">
                    {variance > 0 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> :
                     variance < 0 ? <TrendingDown className="w-3 h-3 text-rose-500" /> :
                     <span className="text-[9px] text-slate-400">—</span>}
                  </div>
                </div>
              </div>

              {/* Quantity input with +/- controls */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                  {language === 'bn' ? 'সংশোধিত স্টক পরিমাণ *' : 'Corrected Stock Quantity *'}
                </label>
                <div className="flex items-center gap-2">
                  <button type="button"
                    onClick={() => setNewStockQty(q => Math.max(0, q - 1))}
                    className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all cursor-pointer flex-shrink-0">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number" min="0" required
                    value={newStockQty}
                    onChange={e => setNewStockQty(Math.max(0, Number(e.target.value)))}
                    className="flex-1 h-10 rounded-lg border-2 border-slate-200 bg-white px-4 text-base font-bold text-slate-900 font-mono outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-center"
                  />
                  <button type="button"
                    onClick={() => setNewStockQty(q => q + 1)}
                    className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all cursor-pointer flex-shrink-0">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {/* Quick step buttons */}
                <div className="flex gap-1.5 mt-2">
                  {[-50, -10, -1, +1, +10, +50].map(step => (
                    <button key={step} type="button"
                      onClick={() => setNewStockQty(q => Math.max(0, q + step))}
                      className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        step < 0
                          ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}>
                      {step > 0 ? `+${step}` : step}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason input + quick reason chips */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                  {language === 'bn' ? 'সমন্বয়ের কারণ *' : 'Reason for Correction *'}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {QUICK_REASONS.map(r => (
                    <button key={r} type="button"
                      onClick={() => setAdjustReason(r)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                        adjustReason === r
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text" required
                  placeholder={language === 'bn' ? 'বা নিজে লিখুন...' : 'Or type a custom reason...'}
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full h-10 rounded-lg border-2 border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Submit */}
              <button type="submit"
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  variance !== 0 && adjustReason.trim()
                    ? 'bg-slate-900 hover:bg-slate-700 text-white shadow-sm active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}>
                <CheckCircle2 className="w-4 h-4" />
                {language === 'bn' ? 'স্টক আপডেট নিশ্চিত করুন' : 'Confirm Stock Correction'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Audit Log ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {language === 'bn' ? 'অ্যাডজাস্টমেন্ট অডিট লগ' : 'Adjustment Audit Log'}
            </h3>
            {adjustments.length > 0 && (
              <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-mono font-semibold">
                {adjustments.length}
              </span>
            )}
          </div>
        </div>

        {adjustments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 border-dashed p-10 text-center">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">
              {language === 'bn' ? 'এখনো কোনো সমন্বয় নেই।' : 'No adjustments recorded yet.'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'bn' ? 'সব স্টক লেজারের সাথে মিলছে।' : 'All stocks align with the ledger.'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">{language === 'bn' ? 'পণ্য' : 'Product'}</th>
                    <th className="px-4 py-3 text-center">{language === 'bn' ? 'আগে' : 'Before'}</th>
                    <th className="px-4 py-3 text-center">{language === 'bn' ? 'পরে' : 'After'}</th>
                    <th className="px-4 py-3 text-center">{language === 'bn' ? 'পরিবর্তন' : 'Change'}</th>
                    <th className="px-4 py-3 text-left">{language === 'bn' ? 'কারণ' : 'Reason'}</th>
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAdjustments.map(adj => {
                    const isIncrease = adj.qtyChanged > 0;
                    return (
                      <tr key={adj.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 leading-tight">{adj.productName}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-semibold text-slate-500">{adj.oldQty.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">{adj.newQty.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            isIncrease
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {isIncrease ? `+${adj.qtyChanged}` : adj.qtyChanged}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 italic max-w-[180px] truncate">&ldquo;{adj.reason}&rdquo;</td>
                        <td className="px-4 py-3 text-right text-slate-400 font-mono text-[10px] whitespace-nowrap">
                          {new Date(adj.date).toLocaleDateString('en-BD')}<br />
                          <span className="text-slate-300">{new Date(adj.date).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                <span className="text-slate-500 font-semibold">
                  {language === 'bn'
                    ? `${adjustments.length} টির মধ্যে ${startIndex + 1}–${Math.min(startIndex + itemsPerPage, adjustments.length)}`
                    : `Showing ${startIndex + 1}–${Math.min(startIndex + itemsPerPage, adjustments.length)} of ${adjustments.length}`}
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer transition-all ${
                        currentPage === page ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}>
                      {page}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
