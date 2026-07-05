'use client';

import React from 'react';
import { ClipboardList, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { StockAdjustment } from '../../types';
import type { Language }        from '../../translations';

interface AdjustmentAuditLogProps {
  language:             Language;
  adjustments:          StockAdjustment[];
  paginatedAdjustments: StockAdjustment[];
  currentPage:          number;
  totalPages:           number;
  startIndex:           number;
  onPageChange:         (page: number) => void;
}

const ITEMS_PER_PAGE = 5;

export default function AdjustmentAuditLog({
  language, adjustments, paginatedAdjustments,
  currentPage, totalPages, startIndex, onPageChange,
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
      <div className="flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-slate-500" />
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          {bn ? 'অ্যাডজাস্টমেন্ট অডিট লগ' : 'Adjustment Audit Log'}
        </h3>
        {adjustments.length > 0 && (
          <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-mono font-semibold">
            {adjustments.length}
          </span>
        )}
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
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">{bn ? 'পণ্য'      : 'Product'}</th>
                    <th className="px-4 py-3 text-center">{bn ? 'আগে'    : 'Before'}</th>
                    <th className="px-4 py-3 text-center">{bn ? 'পরে'     : 'After'}</th>
                    <th className="px-4 py-3 text-center">{bn ? 'পরিবর্তন': 'Change'}</th>
                    <th className="px-4 py-3 text-left">{bn ? 'কারণ'       : 'Reason'}</th>
                    <th className="px-4 py-3 text-right">{bn ? 'তারিখ'    : 'Date'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAdjustments.map(adj => {
                    const isIncrease = adj.qtyChanged > 0;
                    const changeClass = isIncrease
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200';

                    return (
                      <tr key={adj.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 leading-tight">{adj.productName}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-semibold text-slate-500">
                          {adj.oldQty.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                          {adj.newQty.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${changeClass}`}>
                            {isIncrease
                              ? <TrendingUp className="w-3 h-3" />
                              : <TrendingDown className="w-3 h-3" />}
                            {isIncrease ? `+${adj.qtyChanged}` : adj.qtyChanged}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 italic max-w-[180px] truncate">
                          &ldquo;{adj.reason}&rdquo;
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400 font-mono text-[10px] whitespace-nowrap">
                          {new Date(adj.date).toLocaleDateString('en-BD')}
                          <br />
                          <span className="text-slate-300">
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
                        className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer transition-all ${currentPage === page ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
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
