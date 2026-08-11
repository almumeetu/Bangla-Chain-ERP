import React from 'react';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import type { Language } from '../../translations';

interface TrendBadgeProps {
  /** Percentage change value. Pass `null` when there is no prior period data. */
  value:    number | null;
  language: Language;
}

export default function TrendBadge({ value, language }: TrendBadgeProps) {
  // No prior data — show "New" badge instead of a misleading percentage
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-none text-[9px] font-bold border bg-indigo-50 text-indigo-600 border-indigo-100">
        <Sparkles className="w-3 h-3" />
        {language === 'bn' ? 'নতুন' : 'New'}
      </span>
    );
  }

  const isStable = value === 0;
  const isUp     = value > 0;

  if (isStable) {
    return (
      <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-none border border-slate-100">
        {language === 'bn' ? 'স্থির' : 'Stable'}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-none text-[9px] font-bold border ${isUp ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isUp ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}
