'use client';

import React from 'react';
import { BarChart3, FileText } from 'lucide-react';
import type { Language } from '../../translations';

interface DashboardHeaderProps {
  language:      Language;
  onDownloadPDF: () => void;
}

function buildDateLabel(language: Language) {
  const locale  = language === 'bn' ? 'bn-BD' : 'en-US';
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const date    = new Date().toLocaleDateString(locale, options);
  return language === 'bn' ? `আজকের তারিখ: ${date}` : `Today: ${date}`;
}

export default function DashboardHeader({ language, onDownloadPDF }: DashboardHeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center shadow-md shrink-0">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
            {language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {buildDateLabel(language)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {language === 'bn' ? 'সিস্টেম সচল' : 'System Active'}
        </span>
        <button
          onClick={onDownloadPDF}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-[11px] font-bold text-white hover:bg-slate-800 active:scale-[0.97] transition-all cursor-pointer shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          {language === 'bn' ? 'রিপোর্ট' : 'Report'}
        </button>
      </div>
    </div>
  );
}
