'use client';

import React from 'react';
import { MapPin, Clock, Plus, ShoppingBag } from 'lucide-react';
import type { Language }      from '../../translations';
import { translations }       from '../../translations';

interface DashboardFooterProps {
  language:   Language;
  onNavigate: (tab: string) => void;
}

export default function DashboardFooter({ language, onNavigate }: DashboardFooterProps) {
  const bn    = language === 'bn';
  const tDash = translations[language].dashboard;

  function handlePurchase() { onNavigate('purchase'); }
  function handleSales()    { onNavigate('sales');    }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Warehouse info */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
            <MapPin className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              {bn ? 'গুদাম' : 'Warehouse'}
            </p>
            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              {(tDash as Record<string, string>).primaryHubDesc}
            </p>
          </div>
        </div>

        {/* Daily lock */}
        <div className="flex items-start gap-3 md:border-x md:border-slate-100 md:px-4">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              {bn ? 'দৈনিক লক' : 'Daily Lock'}
            </p>
            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              {bn ? 'প্রতিদিন রাত ১০:০০ টায় স্বয়ংক্রিয়ভাবে লক' : 'Auto-lock at 10 PM daily'}
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 justify-end">
          <button
            id="dash-quick-procure"
            type="button"
            onClick={handlePurchase}
            className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2 shadow-sm active:scale-[0.97]"
          >
            <Plus className="w-3.5 h-3.5" />
            {bn ? 'নতুন ক্রয়' : 'New Purchase'}
          </button>
          <button
            id="dash-quick-sell"
            type="button"
            onClick={handleSales}
            className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px] font-bold hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-2 active:scale-[0.97]"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {bn ? 'বিক্রয়' : 'Sales'}
          </button>
        </div>
      </div>
    </div>
  );
}
