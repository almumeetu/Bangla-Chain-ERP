'use client';

import React from 'react';
import { ReceiptText, ArrowRight } from 'lucide-react';
import type { Language }     from '../../translations';
import type { ChallanItem }  from '../../types';
import { formatBDT }         from './dashboardUtils';

interface DashboardRecentDeliveriesProps {
  language:      Language;
  recentChallans:ChallanItem[];
  onNavigate:    (tab: string) => void;
}

function getStatusClass(status: ChallanItem['status']): string {
  if (status === 'Delivered') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'Shipped')   return 'bg-blue-50 text-blue-700 border-blue-100';
  return 'bg-amber-50 text-amber-700 border-amber-100';
}

function getStatusLabel(status: ChallanItem['status'], bn: boolean): string {
  if (status === 'Delivered') return bn ? 'সম্পন্ন'  : 'Delivered';
  if (status === 'Shipped')   return bn ? 'পাঠানো'  : 'Shipped';
  return bn ? 'মুলতুবি' : 'Pending';
}

export default function DashboardRecentDeliveries({
  language, recentChallans, onNavigate,
}: DashboardRecentDeliveriesProps) {
  const bn = language === 'bn';

  function handleViewAll() { onNavigate('delivery'); }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <ReceiptText className="w-4 h-4 text-slate-500" />
          <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">
            {bn ? 'সাম্প্রতিক ডেলিভারি' : 'Recent Deliveries'}
          </h4>
        </div>
        <button
          id="dash-btn-view-challans"
          type="button"
          onClick={handleViewAll}
          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
        >
          {bn ? 'সব দেখুন' : 'View All'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[600px]">
          <thead>
            <tr className="text-[9px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 bg-slate-50/30">
              <th className="text-left px-5 py-3">{bn ? 'পণ্য'      : 'Product'}</th>
              <th className="text-left px-4 py-3">{bn ? 'সেলসম্যান' : 'Salesman'}</th>
              <th className="text-left px-4 py-3">{bn ? 'মার্কেট'   : 'Market'}</th>
              <th className="text-right px-4 py-3">{bn ? 'পরিমাণ'   : 'Amount'}</th>
              <th className="text-center px-5 py-3">{bn ? 'অবস্থা'  : 'Status'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {recentChallans.map(ch => (
              <tr key={ch.id} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-bold text-slate-700 text-xs truncate max-w-[200px]">{ch.productName}</p>
                  <p className="text-[9px] text-slate-400 font-mono">{ch.attribute}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-600 text-xs">{ch.srName}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-medium">
                    {ch.routeName || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-black text-slate-800 font-mono">
                  {formatBDT(ch.totalAmount)}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${getStatusClass(ch.status)}`}>
                    {getStatusLabel(ch.status, bn)}
                  </span>
                </td>
              </tr>
            ))}
            {recentChallans.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                  {bn ? 'কোনো ডেলিভারি নেই' : 'No deliveries yet'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
