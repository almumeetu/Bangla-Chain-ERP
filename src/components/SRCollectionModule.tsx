'use client';

import React, { useState, useMemo } from 'react';
import {
  Wallet, DollarSign, CheckCircle, Clock, Search,
  Plus, History, CreditCard, Filter, X, ArrowUpRight
} from 'lucide-react';
import type { ChallanItem, SRCollection, SR } from '../types';
import type { Language } from '../translations';
import { formatBDT, getLocalDateString } from './dashboard/dashboardUtils';

interface SRCollectionModuleProps {
  srName: string;
  srs: SR[];
  challans: ChallanItem[];
  setChallans: (ch: ChallanItem[] | ((prev: ChallanItem[]) => ChallanItem[])) => void;
  collections: SRCollection[];
  setCollections: (cols: SRCollection[] | ((prev: SRCollection[]) => SRCollection[])) => void;
  language: Language;
}

export default function SRCollectionModule({
  srName,
  srs,
  challans,
  setChallans,
  collections,
  setCollections,
  language,
}: SRCollectionModuleProps) {
  const isBn = language === 'bn';
  const todayStr = getLocalDateString(new Date());

  // Find Current SR
  const currentSR = useMemo(() => {
    const norm = (srName || '').trim().toLowerCase();
    return srs.find(s => s.name.trim().toLowerCase() === norm);
  }, [srs, srName]);

  // Resolved primary company name
  const resolvedCompanyName = useMemo(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('erp_sr_company_name');
      if (stored) return stored;
    }
    if (currentSR?.companyName) return currentSR.companyName;
    if (currentSR?.companyId) return currentSR.companyId;
    return '';
  }, [currentSR]);

  // SR's challans (scoped strictly to SR + resolved Company)
  const srChallans = useMemo(() => {
    const norm = (srName || '').trim().toLowerCase();
    return challans.filter(ch => {
      const matchSR = (ch.srName || '').trim().toLowerCase() === norm;
      const matchCompany = !resolvedCompanyName || (ch.company || '').trim().toLowerCase() === resolvedCompanyName.trim().toLowerCase();
      return matchSR && matchCompany;
    });
  }, [challans, srName, resolvedCompanyName]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'delivered'>('pending');

  // Modal State
  const [selectedChallan, setSelectedChallan] = useState<ChallanItem | null>(null);
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Bank' | 'Cheque'>('Cash');
  const [notes, setNotes] = useState('');

  // Collections for this SR
  const srCollections = useMemo(() => {
    const norm = (srName || '').trim().toLowerCase();
    return collections
      .filter(c => (c.srName || '').trim().toLowerCase() === norm)
      .sort((a, b) => new Date(b.collectedAt || 0).getTime() - new Date(a.collectedAt || 0).getTime());
  }, [collections, srName]);

  // Map of collected amounts per challan
  const challanCollectedMap = useMemo(() => {
    const map: Record<string, number> = {};
    srCollections.forEach(c => {
      map[c.challanId] = (map[c.challanId] || 0) + c.amount;
    });
    return map;
  }, [srCollections]);

  // Summary Metrics
  const totalOutstandingDue = useMemo(() => {
    return srChallans
      .filter(ch => ch.status !== 'Delivered')
      .reduce((sum, ch) => {
        const collected = challanCollectedMap[ch.id] || 0;
        return sum + Math.max(0, (ch.totalAmount || 0) - collected);
      }, 0);
  }, [srChallans, challanCollectedMap]);

  const todayCollectedTotal = useMemo(() => {
    return srCollections
      .filter(c => {
        const d = c.collectedAt ? getLocalDateString(new Date(c.collectedAt)) : '';
        return d === todayStr;
      })
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [srCollections, todayStr]);

  const thisMonthKey = todayStr.substring(0, 7);
  const monthCollectedTotal = useMemo(() => {
    return srCollections
      .filter(c => {
        const d = c.collectedAt ? getLocalDateString(new Date(c.collectedAt)) : '';
        return d.startsWith(thisMonthKey);
      })
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [srCollections, thisMonthKey]);

  // Filtered Challans list
  const filteredChallans = useMemo(() => {
    return srChallans.filter(ch => {
      if (statusFilter === 'pending' && ch.status === 'Delivered') return false;
      if (statusFilter === 'delivered' && ch.status !== 'Delivered') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchId = ch.id.toLowerCase().includes(q);
        const matchProd = (ch.productName || '').toLowerCase().includes(q);
        const matchCust = (ch.customerName || '').toLowerCase().includes(q) || (ch.deliveryManName || '').toLowerCase().includes(q) || (ch.routeName || '').toLowerCase().includes(q);
        if (!matchId && !matchProd && !matchCust) return false;
      }
      return true;
    });
  }, [srChallans, statusFilter, searchTerm]);

  // Open modal
  function handleOpenCollectModal(ch: ChallanItem) {
    setSelectedChallan(ch);
    const collected = challanCollectedMap[ch.id] || 0;
    const remaining = Math.max(0, (ch.totalAmount || 0) - collected);
    setCollectAmount(String(remaining || ch.totalAmount || 0));
    setPaymentMethod('Cash');
    setNotes('');
  }

  // Submit Collection
  function handleSubmitCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChallan) return;

    const amt = parseFloat(collectAmount) || 0;
    if (amt <= 0) {
      alert(isBn ? 'সঠিক টাকার পরিমাণ লিখুন।' : 'Please enter a valid amount.');
      return;
    }

    const newRecord: SRCollection = {
      id: `col-${Date.now()}`,
      srId: currentSR?.id || 'sr-default',
      srName: srName || 'SR',
      challanId: selectedChallan.id,
      customerId: selectedChallan.customerId,
      companyId: selectedChallan.company,
      customerName: selectedChallan.customerName || selectedChallan.deliveryManName || selectedChallan.routeName || 'Customer',
      amount: amt,
      paymentMethod,
      collectedAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
    };

    setCollections(prev => [newRecord, ...prev]);

    // Check if challan is fully collected
    const prevCollected = challanCollectedMap[selectedChallan.id] || 0;
    const newTotalCollected = prevCollected + amt;

    if (newTotalCollected >= (selectedChallan.totalAmount || 0)) {
      setChallans(prev => prev.map(ch => ch.id === selectedChallan.id ? { ...ch, status: 'Delivered' } : ch));
    }

    setSelectedChallan(null);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-600" />
            {isBn ? 'ফিল্ড কালেকশন ও বকেয়া আদায়' : 'Field Collection & Dues Recovery'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isBn
              ? 'দোকানদার ও গ্রাহকদের নিকট থেকে সংগৃহীত অর্থ এন্ট্রি করুন এবং বকেয়া সমন্বয় করুন।'
              : 'Record cash & mobile payments collected from retail shops and update challan statuses.'}
          </p>
        </div>
      </div>

      {/* ── KPI Metric Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Outstanding Dues */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {isBn ? 'মোট বাকি / বকেয়া' : 'Total Outstanding Due'}
          </span>
          <h3 className="text-2xl font-black text-amber-700 mt-2">{formatBDT(totalOutstandingDue)}</h3>
          <p className="text-xs text-slate-400 mt-1">
            {isBn ? 'অনাদায়ী চালানের মোট মূল্য' : 'Pending from active orders'}
          </p>
        </div>

        {/* Today Collected */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {isBn ? 'আজকের আদায়' : "Today's Collection"}
          </span>
          <h3 className="text-2xl font-black text-emerald-700 mt-2">{formatBDT(todayCollectedTotal)}</h3>
          <p className="text-xs text-slate-400 mt-1">
            {isBn ? 'আজকের মোট সংগৃহীত অর্থ' : 'Cash collected today'}
          </p>
        </div>

        {/* This Month Collected */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {isBn ? 'চলতি মাসের মোট আদায়' : 'This Month Total'}
          </span>
          <h3 className="text-2xl font-black text-indigo-700 mt-2">{formatBDT(monthCollectedTotal)}</h3>
          <p className="text-xs text-slate-400 mt-1">
            {isBn ? 'চলতি মাসের সংগ্রহ' : 'Collections this month'}
          </p>
        </div>
      </div>

      {/* ── Invoices / Challans for Collection ───────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            {isBn ? 'চালানের তালিকা ও কালেকশন' : 'Invoices & Collection Action'}
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isBn ? 'চালান / পণ্য খুঁজুন...' : 'Search challan / product...'}
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${statusFilter === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                {isBn ? 'বাকি' : 'Pending'}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('delivered')}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${statusFilter === 'delivered' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                {isBn ? 'পরিশোধিত' : 'Delivered'}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                {isBn ? 'সব' : 'All'}
              </button>
            </div>
          </div>
        </div>

        {filteredChallans.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            {isBn ? 'কোনো চালান পাওয়া যায়নি।' : 'No challans found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">{isBn ? 'চালান আইডি' : 'Challan ID'}</th>
                  <th className="py-3 px-3">{isBn ? 'পণ্য ও ব্র্যান্ড' : 'Product & Brand'}</th>
                  <th className="py-3 px-3">{isBn ? 'মোট মূল্য' : 'Total Amount'}</th>
                  <th className="py-3 px-3">{isBn ? 'সংগৃহীত' : 'Collected'}</th>
                  <th className="py-3 px-3">{isBn ? 'অবশিষ্ট বাকি' : 'Balance Due'}</th>
                  <th className="py-3 px-3">{isBn ? 'অবস্থা' : 'Status'}</th>
                  <th className="py-3 px-3 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChallans.map((ch) => {
                  const collected = challanCollectedMap[ch.id] || 0;
                  const remaining = Math.max(0, (ch.totalAmount || 0) - collected);

                  return (
                    <tr key={ch.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{ch.id}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block truncate max-w-[200px]">{ch.productName}</span>
                        <span className="text-[10px] text-slate-400">{ch.company}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">{formatBDT(ch.totalAmount)}</td>
                      <td className="py-3 px-3 font-semibold text-emerald-700">{formatBDT(collected)}</td>
                      <td className="py-3 px-3 font-bold text-amber-700">{formatBDT(remaining)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                          ch.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ch.status === 'Shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ch.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {ch.status !== 'Delivered' && (
                          <button
                            type="button"
                            onClick={() => handleOpenCollectModal(ch)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            {isBn ? 'টাকা আদায়' : 'Collect'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Collection Logs History Table ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              {isBn ? 'টাকা জমার ইতিহাস (কালেকশন লগ)' : 'Collection History Log'}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {srCollections.length} {isBn ? 'টি কালেকশন' : 'Entries'}
          </span>
        </div>

        {srCollections.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            {isBn ? 'কোনো কালেকশন লগ পাওয়া যায়নি।' : 'No collection records found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">{isBn ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                  <th className="py-3 px-3">{isBn ? 'চালান আইডি' : 'Challan ID'}</th>
                  <th className="py-3 px-3">{isBn ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="py-3 px-3">{isBn ? 'পদ্ধতি' : 'Method'}</th>
                  <th className="py-3 px-3">{isBn ? 'মন্তব্য' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {srCollections.map((col) => (
                  <tr key={col.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {col.collectedAt ? new Date(col.collectedAt).toLocaleString(isBn ? 'bn-BD' : 'en-US') : '-'}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-indigo-600">{col.challanId}</td>
                    <td className="py-3 px-3 font-bold text-emerald-700">{formatBDT(col.amount)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {col.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-[200px] truncate">{col.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Collection Modal ────────────────────────────────────────────────── */}
      {selectedChallan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                {isBn ? 'টাকা কালেকশন এন্ট্রি' : 'Record Payment Collection'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedChallan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCollection} className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isBn ? 'চালান আইডি:' : 'Challan ID:'}</span>
                  <span className="font-mono font-bold text-slate-900">{selectedChallan.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isBn ? 'পণ্য:' : 'Product:'}</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[200px]">{selectedChallan.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isBn ? 'মোট মূল্য:' : 'Total Amount:'}</span>
                  <span className="font-bold text-slate-900">{formatBDT(selectedChallan.totalAmount)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isBn ? 'আদায়কৃত টাকার পরিমাণ (৳)' : 'Collection Amount (৳)'}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cash', 'bKash', 'Nagad', 'Bank', 'Cheque'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        paymentMethod === method
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isBn ? 'মন্তব্য (ঐচ্ছিক)' : 'Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isBn ? 'যেমন: ক্যাশ গ্রহণ করা হলো...' : 'e.g. Received cash...'}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedChallan(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {isBn ? 'কালেকশন সংরক্ষণ' : 'Save Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
