'use client';

import React from 'react';
import { Package, Search, AlertTriangle } from 'lucide-react';
import type { Product }  from '../../types';
import type { Language } from '../../translations';

interface ProductPickerProps {
  language:         Language;
  products:         Product[];
  filteredProducts: Product[];
  selectedProdId:   string | null;
  searchQuery:      string;
  onSearchChange:   (q: string) => void;
  onSelectProduct:  (id: string) => void;
}

function handleSearchInput(
  e: React.ChangeEvent<HTMLInputElement>,
  onChange: (q: string) => void,
) {
  onChange(e.target.value);
}

export default function ProductPicker({
  language, products, filteredProducts, selectedProdId,
  searchQuery, onSearchChange, onSelectProduct,
}: ProductPickerProps) {
  const bn = language === 'bn';

  return (
    <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Package className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            {bn ? 'পণ্য নির্বাচন করুন' : 'Select Product'}
          </span>
        </div>
        <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-mono font-semibold">
          {products.length} {bn ? 'টি' : 'items'}
        </span>
      </div>

      <div className="px-4 py-2.5 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearchInput(e, onSearchChange)}
            placeholder={bn ? 'পণ্য বা কোড খুঁজুন...' : 'Search product or SKU...'}
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[420px]">
        {filteredProducts.map(p => {
          const isLow      = p.currentStock < 600;
          const isSelected = p.id === selectedProdId;

          function handleClick() { onSelectProduct(p.id); }

          return (
            <button
              key={p.id}
              type="button"
              onClick={handleClick}
              className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
            >
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-800' : 'text-slate-800'}`}>{p.name}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku} · {p.company}</p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded border ${isLow ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                  {p.currentStock.toLocaleString()}
                </span>
              </div>
            </button>
          );
        })}
        {filteredProducts.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400 font-semibold">
            {bn ? 'কোনো পণ্য পাওয়া যায়নি।' : 'No products found.'}
          </div>
        )}
      </div>
    </div>
  );
}
