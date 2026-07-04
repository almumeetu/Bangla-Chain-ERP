'use client';

import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Package,
  AlertTriangle,
  RotateCcw
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
  language
}: StockAdjustmentModuleProps) {
  const tCommon = translations[language].common;

  // Stock Adjustment Form State
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [newStockQty, setNewStockQty] = useState<number>(products[0]?.currentStock || 0);
  const [adjustReason, setAdjustReason] = useState('');

  // Pagination for Adjustments log
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Handle Commit Stock Adjustment
  const handleCommitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();

    const targetProduct = products.find(p => p.id === selectedProdId);
    if (!targetProduct) {
      alert(language === 'bn' ? 'অনুগ্রহ করে একটি সঠিক পণ্য নির্বাচন করুন' : 'Please select a valid product');
      return;
    }

    if (newStockQty < 0) {
      alert(language === 'bn' ? 'স্টকের পরিমাণ ঋণাত্মক হতে পারবে না' : 'Quantity cannot be negative');
      return;
    }

    if (!adjustReason.trim()) {
      alert(language === 'bn' ? 'স্টক পরিবর্তনের কারণ উল্লেখ করুন' : 'Please provide a short justification or reason for this manual correction.');
      return;
    }

    const oldQty = targetProduct.currentStock;
    const qtyChanged = newStockQty - oldQty;

    if (qtyChanged === 0) {
      alert(language === 'bn' ? 'নতুন স্টক বর্তমান স্টকের সমান! কোনো পরিবর্তনের প্রয়োজন নেই।' : 'New quantity is equal to current stock. No change needed!');
      return;
    }

    const newAdjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      productId: targetProduct.id,
      productName: targetProduct.name,
      attributeValue: 'Standard',
      oldQty,
      newQty: newStockQty,
      qtyChanged,
      adjustedBy: language === 'bn' ? 'ডিলার/মালিক (অ্যাডমিন)' : 'Owner/Dealer (Admin)',
      reason: adjustReason.trim(),
      date: new Date().toISOString()
    };

    // Update adjustments list
    setAdjustments(prev => [newAdjustment, ...prev]);

    // Update Product stock level reactively
    setProducts(prevProducts => prevProducts.map(p => {
      if (p.id === selectedProdId) {
        return { ...p, currentStock: newStockQty };
      }
      return p;
    }));

    // Reset Form
    setAdjustReason('');
    alert(language === 'bn' ? 'স্টক সফলভাবে আপডেট করা হয়েছে!' : 'Stock adjusted successfully! Product catalog level was dynamically synchronized.');
  };

  // Auto fill form when product selection changes or quick adjust clicked
  const selectProductForAdjustment = (id: string) => {
    setSelectedProdId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setNewStockQty(prod.currentStock);
    }
  };

  // Pagination helper
  const totalAdjustments = adjustments.length;
  const totalPages = Math.ceil(totalAdjustments / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdjustments = adjustments.slice(startIndex, startIndex + itemsPerPage);

  const selectedProduct = products.find(p => p.id === selectedProdId);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 md:p-6 text-white border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-300" />
            {language === 'bn' ? 'গুদাম স্টক অ্যাডজাস্টমেন্ট' : 'Stock Adjustments & Corrections'}
          </h2>
          <p className="text-slate-300 text-xs">
            {language === 'bn' 
              ? 'গুদামের বাস্তব স্টক গণনা করে যেকোনো গরমিল দ্রুত সমন্বয় করুন।' 
              : 'Manually reconcile warehouse physical counts and correct inventory discrepancies.'}
          </p>
        </div>
      </div>

      {/* Main Grid: Stock Grid & Form Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Grid: Current Stock Levels Table (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-400" />
              {language === 'bn' ? 'গুদাম পণ্য ও বর্তমান স্টক তালিকা' : 'Warehouse Stock Levels'}
            </span>
            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-mono font-semibold">
              {products.length} Products
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[9px] font-bold text-slate-500">
                  <th className="px-4 py-3 w-10 text-center">#</th>
                  <th className="px-4 py-3">{language === 'bn' ? 'পণ্যের নাম' : 'Product Name'}</th>
                  <th className="px-4 py-3">{language === 'bn' ? 'কোম্পানি' : 'Company'}</th>
                  <th className="px-4 py-3 text-center">{language === 'bn' ? 'স্টক পরিমাণ' : 'Current Stock'}</th>
                  <th className="px-4 py-3 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p, idx) => {
                  const isLow = p.currentStock < 600;
                  const isSelected = p.id === selectedProdId;

                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isSelected ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-center text-slate-400 font-mono font-medium">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-semibold">{p.company}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold border inline-block text-[11px] ${
                          isLow 
                            ? 'bg-rose-50 text-rose-700 border-rose-150 animate-pulse' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-150'
                        }`}>
                          {p.currentStock.toLocaleString('en-BD')} Pcs
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => selectProductForAdjustment(p.id)}
                          className="px-2.5 py-1 rounded-md text-[10px] font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                        >
                          {language === 'bn' ? 'সমন্বয় করুন' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Correction Form (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-1.5 text-slate-800">
              <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                {language === 'bn' ? 'স্টক সমন্বয় ফর্ম' : 'Adjustment Console'}
              </h3>
            </div>

            {selectedProduct ? (
              <form onSubmit={handleCommitAdjustment} className="space-y-4 text-xs">
                <div>
                  <label className="mb-1.5 block font-bold text-slate-500 uppercase tracking-wide">
                    {language === 'bn' ? 'নির্বাচিত পণ্য' : 'Selected Product'}
                  </label>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">
                    <p className="font-bold text-slate-900">{selectedProduct.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {selectedProduct.sku} | Brand: {selectedProduct.company}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">
                      {language === 'bn' ? 'বর্তমান স্টক' : 'Current Stock'}
                    </span>
                    <span className="font-mono text-sm font-extrabold text-slate-800 block mt-0.5">
                      {selectedProduct.currentStock}
                    </span>
                  </div>

                  <div className="bg-indigo-50/20 p-2.5 rounded-lg border border-indigo-100 text-center">
                    <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-wider block">
                      {language === 'bn' ? 'পার্থক্য' : 'Variance'}
                    </span>
                    <span className={`font-mono text-sm font-extrabold block mt-0.5 ${
                      newStockQty - selectedProduct.currentStock > 0 
                        ? 'text-emerald-600' 
                        : newStockQty - selectedProduct.currentStock === 0 
                        ? 'text-slate-500' 
                        : 'text-rose-600'
                    }`}>
                      {newStockQty - selectedProduct.currentStock > 0 ? `+${newStockQty - selectedProduct.currentStock}` : newStockQty - selectedProduct.currentStock}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block font-bold text-slate-700 uppercase tracking-wide">
                    {language === 'bn' ? 'সংশোধিত নতুন স্টক *' : 'New Corrected Stock *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(Number(e.target.value))}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-bold text-slate-700 uppercase tracking-wide">
                    {language === 'bn' ? 'সমন্বয়ের কারণ *' : 'Correction Reason *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'bn' ? 'যেমন: বার্ষিক অডিট ডিসক্রিপেন্সি' : 'e.g. Damage disposal / audit audit'}
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-transform active:scale-95 text-center border border-slate-950 cursor-pointer shadow-sm"
                >
                  {language === 'bn' ? 'স্টক আপডেট সম্পন্ন করুন' : 'Confirm Correction'}
                </button>
              </form>
            ) : (
              <div className="text-center py-12 text-slate-400 font-semibold text-xs bg-slate-50 border border-slate-200 rounded-xl">
                {language === 'bn' ? 'একটি পণ্য সিলেক্ট করুন।' : 'Select a product to adjust.'}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Section: Adjustments History Log */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-500" />
            {language === 'bn' ? 'স্টক সংশোধনের অডিট ট্রেইল (ইতিহাস)' : 'Manual Reconciliation Audit Logs'}
          </span>
        </div>

        {adjustments.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 font-semibold shadow-sm">
            {language === 'bn' ? 'কোনো ম্যানুয়াল স্টক অ্যাডজাস্টমেন্ট রেকর্ড নেই।' : 'No manual stock adjustments recorded. All stocks align with ledger.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedAdjustments.map((adj, index) => {
              const globalIndex = startIndex + index + 1;
              const isIncrease = adj.qtyChanged > 0;

              return (
                <div 
                  key={adj.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-800 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                >
                  <div className="absolute -right-20 -top-20 w-36 h-36 rounded-full bg-slate-50 group-hover:bg-slate-100/50 transition-all duration-500 pointer-events-none" />
                  
                  <div className="space-y-2.5 relative z-10 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] font-bold text-slate-400">
                        {new Date(adj.date).toLocaleString('en-BD')}
                      </span>
                      <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        #{globalIndex}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors text-sm leading-snug line-clamp-1">
                      {adj.productName}
                    </h4>

                    <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Type: {adj.adjustedBy.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-between relative z-10 text-center">
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'bn' ? 'পূর্ববর্তী' : 'Old'}</span>
                      <span className="font-mono text-xs font-semibold text-slate-500">{adj.oldQty} Pcs</span>
                    </div>
                    <div className="text-slate-400 flex items-center justify-center">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'bn' ? 'নতুন স্টক' : 'New'}</span>
                      <span className="font-mono text-xs font-bold text-slate-800">{adj.newQty} Pcs</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'bn' ? 'পরিবর্তন' : 'Change'}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono border inline-block ${
                        isIncrease 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {isIncrease ? `+${adj.qtyChanged}` : adj.qtyChanged}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 relative z-10 text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed font-semibold">
                    &ldquo;{adj.reason}&rdquo;
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-xs shadow-sm">
            <span className="text-slate-500 font-semibold">
              Showing <span className="font-semibold text-slate-700">{startIndex + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(startIndex + itemsPerPage, totalAdjustments)}</span> of <span className="font-semibold text-slate-700">{totalAdjustments}</span> records
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-655 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                      currentPage === page 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-655 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
