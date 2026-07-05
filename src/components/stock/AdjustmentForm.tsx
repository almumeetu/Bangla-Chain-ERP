'use client';

import React from 'react';
import { Package, TrendingUp, TrendingDown, Minus, Plus, CheckCircle2 } from 'lucide-react';
import type { Product }  from '../../types';
import type { Language } from '../../translations';

interface AdjustmentFormProps {
  language:       Language;
  product:        Product;
  newStockQty:    number;
  adjustReason:   string;
  variance:       number;
  quickReasons:   string[];
  onSetQty:       (qty: number) => void;
  onStepQty:      (step: number) => void;
  onSetReason:    (r: string) => void;
  onSubmit:       (e: React.FormEvent) => void;
}

const STEPS = [-50, -10, -1, +1, +10, +50] as const;

function handleQtyInputChange(
  e: React.ChangeEvent<HTMLInputElement>,
  onSetQty: (v: number) => void,
) {
  onSetQty(Number(e.target.value));
}

function handleReasonInputChange(
  e: React.ChangeEvent<HTMLInputElement>,
  onSetReason: (r: string) => void,
) {
  onSetReason(e.target.value);
}

export default function AdjustmentForm({
  language, product, newStockQty, adjustReason, variance,
  quickReasons, onSetQty, onStepQty, onSetReason, onSubmit,
}: AdjustmentFormProps) {
  const bn            = language === 'bn';
  const isSubmittable = variance !== 0 && adjustReason.trim();

  const variantBg = variance > 0 ? 'bg-emerald-50 border-emerald-200' : variance < 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200';
  const variantText = variance > 0 ? 'text-emerald-700' : variance < 0 ? 'text-rose-700' : 'text-slate-400';

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">

      {/* Product info */}
      <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Package className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-indigo-900 truncate">{product.name}</p>
          <p className="text-[10px] text-indigo-500 font-mono">{product.sku} · {product.company}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{bn ? 'বর্তমান স্টক' : 'Current Stock'}</p>
          <p className="text-lg font-extrabold text-slate-700 font-mono">{product.currentStock.toLocaleString()}</p>
          <p className="text-[9px] text-slate-400 font-semibold">Pcs</p>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{bn ? 'নতুন স্টক' : 'New Stock'}</p>
          <p className="text-lg font-extrabold text-indigo-700 font-mono">{newStockQty.toLocaleString()}</p>
          <p className="text-[9px] text-slate-400 font-semibold">Pcs</p>
        </div>
        <div className={`rounded-xl border p-3 text-center ${variantBg}`}>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{bn ? 'পার্থক্য' : 'Variance'}</p>
          <p className={`text-lg font-extrabold font-mono ${variantText}`}>{variance > 0 ? `+${variance}` : variance}</p>
          <div className="flex justify-center mt-0.5">
            {variance > 0 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : variance < 0 ? <TrendingDown className="w-3 h-3 text-rose-500" /> : <span className="text-[9px] text-slate-400">—</span>}
          </div>
        </div>
      </div>

      {/* Quantity controls */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
          {bn ? 'সংশোধিত স্টক পরিমাণ *' : 'Corrected Stock Quantity *'}
        </label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onStepQty(-1)}
            className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all cursor-pointer flex-shrink-0">
            <Minus className="w-4 h-4" />
          </button>
          <input type="number" min="0" required value={newStockQty}
            onChange={e => handleQtyInputChange(e, onSetQty)}
            className="flex-1 h-10 rounded-lg border-2 border-slate-200 bg-white px-4 text-base font-bold text-slate-900 font-mono outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-center"
          />
          <button type="button" onClick={() => onStepQty(+1)}
            className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all cursor-pointer flex-shrink-0">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-1.5 mt-2">
          {STEPS.map(step => (
            <button key={step} type="button" onClick={() => onStepQty(step)}
              className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${step < 0 ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100' : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
              {step > 0 ? `+${step}` : step}
            </button>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
          {bn ? 'সমন্বয়ের কারণ *' : 'Reason for Correction *'}
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {quickReasons.map(r => (
            <button key={r} type="button" onClick={() => onSetReason(r)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${adjustReason === r ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'}`}>
              {r}
            </button>
          ))}
        </div>
        <input type="text" required value={adjustReason}
          onChange={e => handleReasonInputChange(e, onSetReason)}
          placeholder={bn ? 'বা নিজে লিখুন...' : 'Or type a custom reason...'}
          className="w-full h-10 rounded-lg border-2 border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
        />
      </div>

      <button type="submit"
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${isSubmittable ? 'bg-slate-900 hover:bg-slate-700 text-white shadow-sm active:scale-[0.98]' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
        <CheckCircle2 className="w-4 h-4" />
        {bn ? 'স্টক আপডেট নিশ্চিত করুন' : 'Confirm Stock Correction'}
      </button>
    </form>
  );
}
