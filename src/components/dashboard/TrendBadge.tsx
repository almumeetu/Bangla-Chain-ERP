import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Language } from '../../translations';

interface TrendBadgeProps {
  value:    number;
  language: Language;
}

export default function TrendBadge({ value, language }: TrendBadgeProps) {
  const isStable = value === 0;
  const isUp     = value > 0;

  const stableEl = (
    <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
      {language === 'bn' ? 'স্থির' : 'Stable'}
    </span>
  );

  const trendEl = (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold border ${isUp ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isUp ? '+' : ''}{value.toFixed(1)}%
    </span>
  );

  return isStable ? stableEl : trendEl;
}
