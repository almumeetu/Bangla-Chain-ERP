'use client';

import React from 'react';
import { Users, AlertTriangle, ArrowRight } from 'lucide-react';
import type { Language } from '../../translations';
import type { Product, SR }   from '../../types';
import { formatBDT, SR_GRADIENTS } from './dashboardUtils';

interface DashboardSRAndAlertsProps {
  language:         Language;
  srs:              SR[];
  srSalesMap:       Map<string, { count: number; total: number }>;
  lowStockProducts: Product[];
  onNavigate:       (tab: string) => void;
}

function navigateStock(onNavigate: (tab: string) => void) {
  onNavigate('stock');
}

export default function DashboardSRAndAlerts({
  language, srs, srSalesMap, lowStockProducts, onNavigate,
}: DashboardSRAndAlertsProps) {
  const bn = language === 'bn';

  function handleAdjustStock() { navigateStock(onNavigate); }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

      {/* SR Leaderboard */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">
              {bn ? 'সেলস অফিসার (SR)' : 'Sales Officers'}
            </h4>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
            {bn ? 'মোট বিক্রয়' : 'Total Sales'}
          </span>
        </div>
        <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
          {srs.length > 0
            ? srs.map((sr, idx) => {
                const data    = srSalesMap.get(sr.id) ?? { count: 0, total: 0 };
                const gradient = SR_GRADIENTS[idx % SR_GRADIENTS.length];
                return (
                  <div key={sr.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-black text-slate-300 w-4 text-center">#{idx + 1}</span>
                      <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white text-[10px] shadow-sm`}>
                        {sr.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{sr.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{data.count} {bn ? 'অর্ডার' : 'orders'}</p>
                    </div>
                    <span className="text-xs font-black text-slate-800 font-mono shrink-0">{formatBDT(data.total)}</span>
                  </div>
                );
              })
            : <p className="text-center text-xs text-slate-400 py-8">{bn ? 'কোনো SR নেই' : 'No SRs found'}</p>}
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">
              {bn ? 'স্টক সতর্কতা' : 'Low Stock Alerts'}
            </h4>
          </div>
          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {lowStockProducts.length} {bn ? 'টি সতর্কতা' : 'alerts'}
          </span>
        </div>
        <div className="max-h-[260px] overflow-y-auto">
          {lowStockProducts.length > 0
            ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[9px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 bg-slate-50/30">
                    <th className="text-left px-5 py-2.5">{bn ? 'পণ্য' : 'Product'}</th>
                    <th className="text-left px-4 py-2.5">{bn ? 'কোড' : 'SKU'}</th>
                    <th className="text-right px-5 py-2.5">{bn ? 'বর্তমান স্টক' : 'Stock'}</th>
                    <th className="text-center px-4 py-2.5">{bn ? 'অবস্থা' : 'Status'}</th>
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
                      <td className="px-5 py-2.5 text-right font-bold text-slate-800 font-mono">
                        <div>{p.currentStock.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-450 font-normal">
                          ৳{(p.currentStock * p.defaultPP).toLocaleString('en-BD')}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${p.currentStock < 100 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                          {p.currentStock < 100 ? (bn ? 'জরুরি' : 'Critical') : (bn ? 'কম' : 'Low')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
            : (
              <div className="py-10 text-center">
                <p className="text-xs text-slate-400 font-semibold">🎉 {bn ? 'সব স্টক পর্যাপ্ত আছে' : 'All stock levels are healthy'}</p>
              </div>
            )}
        </div>
        <div className="px-5 py-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleAdjustStock}
            className="w-full py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
          >
            {bn ? 'স্টক সমন্বয় করুন' : 'Adjust Stock'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
