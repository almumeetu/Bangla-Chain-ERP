'use client';

import React from 'react';
import { ClipboardList, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Printer, Calendar } from 'lucide-react';
import type { StockAdjustment } from '../../types';
import type { Language }        from '../../translations';
import { printStockAdjustmentLog } from '../../lib/printUtils';

interface AdjustmentAuditLogProps {
  language:             Language;
  adjustments:          StockAdjustment[];
  paginatedAdjustments: StockAdjustment[];
  currentPage:          number;
  totalPages:           number;
  startIndex:           number;
  adjustmentStartDate:  string;
  adjustmentEndDate:    string;
  onPageChange:         (page: number) => void;
  onAdjustmentStartDateChange: (date: string) => void;
  onAdjustmentEndDateChange:   (date: string) => void;
  onResetAdjustmentDates:      () => void;
}

const ITEMS_PER_PAGE = 5;

export default function AdjustmentAuditLog({
  language, adjustments, paginatedAdjustments,
  currentPage, totalPages, startIndex,
  adjustmentStartDate, adjustmentEndDate,
  onPageChange, onAdjustmentStartDateChange, onAdjustmentEndDateChange, onResetAdjustmentDates,
}: AdjustmentAuditLogProps) {
  const bn = language === 'bn';

  function handlePrev() { onPageChange(Math.max(currentPage - 1, 1)); }
  function handleNext() { onPageChange(Math.min(currentPage + 1, totalPages)); }

  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, adjustments.length);
  const rangeLabel = bn
    ? `${adjustments.length} টির মধ্যে ${startIndex + 1}–${endIndex}`
    : `Showing ${startIndex + 1}–${endIndex} of ${adjustments.length}`;

  return (
    <div className="space-y-4">
      {/* Audit Log Header */}
      <div className="bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 rounded-2xl px-5 py-4 flex items-center justify-between border border-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-violet-300" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {bn ? 'অ্যাডজাস্টমেন্ট অডিট লগ' : 'Adjustment Audit Log'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {bn ? 'সকল স্টক পরিবর্তনের রেকর্ড' : 'Full history of all stock corrections'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          {adjustments.length > 0 && (
            <span className="text-[10px] bg-violet-500/20 border border-violet-400/30 text-violet-200 px-3 py-1 rounded-full font-mono font-bold">
              {adjustments.length} {bn ? 'রেকর্ড' : 'records'}
            </span>
          )}
          {adjustments.length > 0 && (
            <button
              type="button"
              onClick={() => printStockAdjustmentLog(adjustments)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all text-xs cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-violet-300" />
              {bn ? 'প্রিন্ট করুন' : 'Print Log'}
            </button>
          )}
        </div>
      </div>

      {adjustments.length === 0
        ? (
          <div className="bg-white rounded-xl border border-slate-200 border-dashed p-10 text-center">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">
              {bn ? 'এখনো কোনো সমন্বয় নেই।' : 'No adjustments recorded yet.'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {bn ? 'সব স্টক লেজারের সাথে মিলছে।' : 'All stocks align with the ledger.'}
            </p>
          </div>
        )
        : (
          <>
            <div className="bg-violet-50/60 border border-violet-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-violet-100 text-violet-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    {bn ? 'তারিখ ফিল্টার' : 'Date Filter'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold font-mono">
                    {paginatedAdjustments.length} / {adjustments.length}
                  </span>
                </div>
                {(adjustmentStartDate || adjustmentEndDate) && (
                  <button
                    type="button"
                    onClick={onResetAdjustmentDates}
                    className="text-[10px] text-violet-700 hover:text-violet-900 font-bold underline transition-colors cursor-pointer"
                  >
                    {bn ? 'ফিল্টার রিসেট' : 'Reset Date Filter'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{bn ? 'শুরুর তারিখ' : 'From Date'}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={adjustmentStartDate}
                      onChange={e => onAdjustmentStartDateChange(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-violet-200 bg-white text-xs font-semibold text-slate-750 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{bn ? 'শেষের তারিখ' : 'To Date'}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={adjustmentEndDate}
                      onChange={e => onAdjustmentEndDateChange(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-violet-200 bg-white text-xs font-semibold text-slate-750 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 text-white border-b border-slate-800">
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider">{bn ? 'পণ্য' : 'Product'}</th>
                    <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider">{bn ? 'আগে' : 'Before'}</th>
                    <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider">{bn ? 'পরে' : 'After'}</th>
                    <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider">{bn ? 'পরিবর্তন' : 'Change'}</th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider">{bn ? 'কারণ' : 'Reason'}</th>
                    <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider">{bn ? 'তারিখ' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAdjustments.map((adj, index) => {
                    const isIncrease = adj.qtyChanged > 0;
                    const changeClass = isIncrease
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200';

                    return (
                      <tr key={`${adj.id}-${index}`} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800 leading-tight">{adj.productName}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{adj.adjustedBy}</p>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-semibold text-slate-500">
                          {adj.oldQty.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">
                          {adj.newQty.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${changeClass}`}>
                            {isIncrease
                              ? <TrendingUp className="w-3 h-3" />
                              : <TrendingDown className="w-3 h-3" />}
                            {isIncrease ? `+${adj.qtyChanged}` : adj.qtyChanged}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 italic text-xs max-w-[180px] truncate">
                          &ldquo;{adj.reason}&rdquo;
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-[10px] whitespace-nowrap">
                          <span className="text-slate-700 font-bold">{new Date(adj.date).toLocaleDateString('en-BD')}</span>
                          <br />
                          <span className="text-slate-400">
                            {new Date(adj.date).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                <span className="text-slate-500 font-semibold">{rangeLabel}</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={handlePrev} disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    function handlePageClick() { onPageChange(page); }
                    return (
                      <button key={page} type="button" onClick={handlePageClick}
                        className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer transition-all ${currentPage === page ? 'bg-violet-700 text-white border-violet-700' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                        {page}
                      </button>
                    );
                  })}
                  <button type="button" onClick={handleNext} disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
}
