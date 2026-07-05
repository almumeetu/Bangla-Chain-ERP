import React from 'react';
import { Store, ShieldAlert } from 'lucide-react';
import type { Language } from '../../translations';
import { formatBDT, type CompanyStockRow, BRAND_COLORS } from './dashboardUtils';

interface DashboardCompanyStockProps {
  language:        Language;
  companyStockData:CompanyStockRow[];
  maxCompanyVal:   number;
}

export default function DashboardCompanyStock({
  language, companyStockData, maxCompanyVal,
}: DashboardCompanyStockProps) {
  const bn      = language === 'bn';
  const maxDmg  = Math.max(...companyStockData.map(c => c.damagedValue), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

      {/* Stock by company */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-slate-500" />
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">
              {bn ? 'কোম্পানি ভিত্তিক স্টক' : 'Stock by Company'}
            </h4>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
            {bn ? 'গুদামে' : 'In Warehouse'}
          </span>
        </div>
        <div className="p-4 space-y-2 max-h-[340px] overflow-y-auto">
          {companyStockData.map((comp, i) => {
            const pct = (comp.value / maxCompanyVal) * 100;
            const c   = BRAND_COLORS[i % BRAND_COLORS.length];
            return (
              <div key={comp.brand} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-slate-200 transition-all">
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
                      {comp.units.toLocaleString()} {bn ? 'পিস' : 'pcs'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {companyStockData.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-8">{bn ? 'কোনো পণ্য নেই' : 'No products found'}</p>
          )}
        </div>
      </div>

      {/* Damage by company */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">
              {bn ? 'কোম্পানি ভিত্তিক ড্যামেজ' : 'Damages by Company'}
            </h4>
          </div>
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-100">
            {bn ? 'ড্যামেজ' : 'Damage'}
          </span>
        </div>
        <div className="p-4 space-y-2 max-h-[340px] overflow-y-auto">
          {companyStockData.map(comp => {
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
                      {comp.damagedUnits.toLocaleString()} {bn ? 'পিস' : 'pcs'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
