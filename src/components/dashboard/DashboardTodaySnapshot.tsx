import React from 'react';
import { ShoppingBag, Wallet, TrendingUp } from 'lucide-react';
import type { Language } from '../../translations';
import TrendBadge from './TrendBadge';
import { formatBDT } from './dashboardUtils';

interface DashboardTodaySnapshotProps {
  language:                Language;
  todayStr:                string;
  todaysSales:             number;
  todaysExpensesTotal:     number;
  todaysNetProfit:         number;
  yesterdaysSales:         number;
  yesterdaysExpensesTotal: number;
  yesterdaysNetProfit:     number;
  salesChangePercent:      number;
  profitChangePercent:     number;
}

export default function DashboardTodaySnapshot({
  language, todayStr,
  todaysSales, todaysExpensesTotal, todaysNetProfit,
  yesterdaysSales, yesterdaysExpensesTotal, yesterdaysNetProfit,
  salesChangePercent, profitChangePercent,
}: DashboardTodaySnapshotProps) {
  const bn = language === 'bn';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <h3 className="font-bold text-slate-700 text-xs tracking-wide uppercase">
            {bn ? 'আজকের হিসাব' : "Today's Summary"}
          </h3>
        </div>
        <span className="text-[10px] font-medium text-slate-400">{todayStr}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">

        {/* Sales */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500">{bn ? 'আজকের বিক্রয়' : "Today's Sales"}</span>
            </div>
            <TrendBadge value={salesChangePercent} language={language} />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">{formatBDT(todaysSales)}</p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-medium">{bn ? 'গতকাল' : 'Yesterday'}</span>
            <span className="font-bold text-slate-600 font-mono">{formatBDT(yesterdaysSales)}</span>
          </div>
        </div>

        {/* Expenses */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center border border-rose-100">
              <Wallet className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">{bn ? 'আজকের খরচ' : "Today's Expenses"}</span>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">{formatBDT(todaysExpensesTotal)}</p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-medium">{bn ? 'অফিস ও পরিবহন' : 'Office & Transport'}</span>
            <span className="font-bold text-slate-600 font-mono">{formatBDT(yesterdaysExpensesTotal)}</span>
          </div>
        </div>

        {/* Profit */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${todaysNetProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <TrendingUp className={`w-4 h-4 ${todaysNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
              </div>
              <span className="text-[11px] font-semibold text-slate-500">{bn ? 'আজকের লাভ' : "Today's Profit"}</span>
            </div>
            <TrendBadge value={profitChangePercent} language={language} />
          </div>
          <p className={`text-2xl font-black font-mono tracking-tight ${todaysNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatBDT(todaysNetProfit)}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-medium">{bn ? 'গতকালের লাভ' : "Yesterday's Profit"}</span>
            <span className="font-bold text-slate-600 font-mono">{formatBDT(yesterdaysNetProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
