'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus, Search, Calendar, Briefcase, UserCheck, Package,
  Trash2, AlertTriangle, CheckCircle, XCircle, FileText, Sliders, Layers
} from 'lucide-react';
import type { Claim, Product, SR, CompanyBrand } from '../types';
import type { Language } from '../translations';

interface ClaimManagementModuleProps {
  claims: Claim[];
  setClaims: (c: Claim[] | ((prev: Claim[]) => Claim[])) => void;
  products: Product[];
  srs: SR[];
  companies: CompanyBrand[];
  language: Language;
}

export default function ClaimManagementModule({
  claims,
  setClaims,
  products,
  srs,
  companies,
  language
}: ClaimManagementModuleProps) {
  const bn = language === 'bn';

  // Filters state
  const [companyFilter, setCompanyFilter] = useState('All');
  const [srFilter, setSrFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [claimDate, setClaimDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedSrId, setSelectedSrId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [reason, setReason] = useState('Damaged packaging');
  const [notes, setNotes] = useState('');

  // Handle company change in form (auto-filters products)
  const handleCompanyChangeInForm = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setSelectedProductId(''); // Reset product when company changes
  };

  // Filtered products for form based on selected company
  const filteredProductsForForm = useMemo(() => {
    if (!selectedCompanyId) return [];
    const comp = companies.find(c => c.id === selectedCompanyId);
    if (!comp) return [];
    return products.filter(p => p.company.toLowerCase() === comp.name.toLowerCase());
  }, [selectedCompanyId, companies, products]);

  // Handle claim form submission
  const handleAddClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId || !selectedSrId || !selectedProductId || qty <= 0) {
      alert(bn ? 'অনুগ্রহ করে সকল প্রয়োজনীয় ফিল্ড সঠিক তথ্য দিয়ে পূরণ করুন।' : 'Please fill in all required fields correctly.');
      return;
    }

    const company = companies.find(c => c.id === selectedCompanyId);
    const sr = srs.find(s => s.id === selectedSrId);
    const product = products.find(p => p.id === selectedProductId);

    if (!company || !sr || !product) return;

    const newClaim: Claim = {
      id: `claim-${Date.now()}`,
      claimDate,
      companyId: selectedCompanyId,
      companyName: company.name,
      srId: selectedSrId,
      srName: sr.name,
      productId: selectedProductId,
      productName: product.name,
      qty,
      reason,
      notes,
      status: 'Pending'
    };

    setClaims(prev => [...prev, newClaim]);

    // Reset form
    setSelectedCompanyId('');
    setSelectedSrId('');
    setSelectedProductId('');
    setQty(0);
    setReason('Damaged packaging');
    setNotes('');
    setClaimDate(new Date().toISOString().slice(0, 10));
    setShowFormModal(false);
  };

  // Handle status update
  const handleUpdateStatus = (claimId: string, status: 'Pending' | 'Approved' | 'Rejected') => {
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status } : c));
  };

  // Handle claim deletion
  const handleDeleteClaim = (claimId: string) => {
    if (confirm(bn ? 'আপনি কি নিশ্চিত যে এই ক্লেমটি ডিলিট করতে চান?' : 'Are you sure you want to delete this claim?')) {
      setClaims(prev => prev.filter(c => c.id !== claimId));
    }
  };

  // Filtered claims based on filter criteria
  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      const matchesCompany = companyFilter === 'All' || c.companyName === companyFilter;
      const matchesSr = srFilter === 'All' || c.srId === srFilter;
      const matchesStartDate = !startDate || c.claimDate >= startDate;
      const matchesEndDate = !endDate || c.claimDate <= endDate;
      const matchesSearch = !searchQuery || 
        c.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.srName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCompany && matchesSr && matchesStartDate && matchesEndDate && matchesSearch;
    });
  }, [claims, companyFilter, srFilter, startDate, endDate, searchQuery]);

  // Calculations for KPI Cards
  const totalClaimsCount = filteredClaims.length;
  const totalClaimsQty = filteredClaims.reduce((sum, c) => sum + c.qty, 0);
  const totalClaimsValue = useMemo(() => {
    return filteredClaims.reduce((sum, c) => {
      const prod = products.find(p => p.id === c.productId);
      const dp = prod ? prod.defaultPP : 0;
      return sum + c.qty * dp;
    }, 0);
  }, [filteredClaims, products]);

  // BDT formatter
  const formatBDT = useCallback((amount: number) => {
    return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }, []);

  const getStatusBadgeClass = (status: 'Pending' | 'Approved' | 'Rejected') => {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getCompanyBadgeStyle = (companyName: string) => {
    const c = companyName.toLowerCase();
    if (c === 'pran') return 'bg-orange-50 text-orange-700 border-orange-200';
    if (c === 'olympic') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (c === 'haque') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-slate-200 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {bn ? 'ক্লেম ম্যানেজমেন্ট' : 'Claim Management'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {bn 
              ? 'কোম্পানি এবং এসআর ভিত্তিক পণ্যের ক্লেম বা দাবিসমূহ পরিচালনা করুন।' 
              : 'Record, track, and analyze claims and return requests.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowFormModal(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 border border-slate-955 cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          {bn ? 'নতুন ক্লেম রেজিস্টার করুন' : 'Register New Claim'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Claims */}
        <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/20 rounded-2xl border border-blue-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-500/5 rounded-tl-full pointer-events-none" />
          <div className="p-3 bg-blue-500 rounded-xl text-white shadow-sm shadow-blue-200">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">
              {bn ? 'মোট ক্লেম সংখ্যা' : 'Total Claims'}
            </span>
            <span className="text-2xl font-black text-slate-855 font-mono tracking-tight">
              {totalClaimsCount} <span className="text-xs font-bold text-slate-500">{bn ? 'টি' : 'Claims'}</span>
            </span>
          </div>
        </div>

        {/* Card 2: Total Claim Quantity */}
        <div className="bg-gradient-to-br from-purple-50/70 to-fuchsia-50/20 rounded-2xl border border-purple-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-500/5 rounded-tl-full pointer-events-none" />
          <div className="p-3 bg-purple-500 rounded-xl text-white shadow-sm shadow-purple-200">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block">
              {bn ? 'মোট দাবি পণ্য পরিমাণ' : 'Total Claim Quantity'}
            </span>
            <span className="text-2xl font-black text-slate-855 font-mono tracking-tight">
              {totalClaimsQty.toLocaleString('en-BD')} <span className="text-xs font-bold text-slate-500">{bn ? 'টি' : 'Units'}</span>
            </span>
          </div>
        </div>

        {/* Card 3: Total Claim Value (DP) */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/20 rounded-2xl border border-emerald-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-tl-full pointer-events-none" />
          <div className="p-3 bg-emerald-500 rounded-xl text-white shadow-sm shadow-emerald-200">
            <span className="text-xl font-bold font-mono">৳</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
              {bn ? 'মোট ক্লেম মূল্য (ডিলার প্রাইস)' : 'Total Claim Value (DP)'}
            </span>
            <span className="text-2xl font-black text-slate-855 font-mono tracking-tight">
              {formatBDT(totalClaimsValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
              {bn ? 'ক্লেম ফিল্টার' : 'Claim Filters'}
            </span>
          </div>
          {(companyFilter !== 'All' || srFilter !== 'All' || startDate || endDate || searchQuery) && (
            <button
              onClick={() => {
                setCompanyFilter('All');
                setSrFilter('All');
                setStartDate('');
                setEndDate('');
                setSearchQuery('');
              }}
              className="text-[10px] text-indigo-600 hover:text-indigo-850 font-bold underline transition-colors cursor-pointer"
            >
              {bn ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Search Query */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {bn ? 'অনুসন্ধান (পণ্য, কারণ, নোট)' : 'Search (Product, Reason, Notes)'}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={bn ? 'অনুসন্ধান করুন...' : 'Search claims...'}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Company Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {bn ? 'কোম্পানি ফিল্টার' : 'Filter by Company'}
            </label>
            <select
              value={companyFilter}
              onChange={e => setCompanyFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/20 px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">{bn ? 'সকল কোম্পানি' : 'All Companies'}</option>
              {Array.from(new Set(claims.map(c => c.companyName).filter(Boolean))).map(cName => (
                <option key={cName} value={cName}>{cName}</option>
              ))}
            </select>
          </div>

          {/* SR Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {bn ? 'এসআর ফিল্টার' : 'Filter by SR'}
            </label>
            <select
              value={srFilter}
              onChange={e => setSrFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/20 px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">{bn ? 'সকল এসআর' : 'All SRs'}</option>
              {srs.map(sr => (
                <option key={sr.id} value={sr.id}>{sr.name}</option>
              ))}
            </select>
          </div>

          {/* Date range filter */}
          <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
            <label className="text-[10px] font-bold text-slate-500 tracking-wider block">
              {bn ? 'তারিখ পরিসীমা' : 'Date Range'}
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full h-10 px-2 rounded-xl border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all"
              />
              <span className="text-[10px] text-slate-400 font-bold">To</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full h-10 px-2 rounded-xl border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Claims Data Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-extrabold tracking-wider">
                <th className="px-5 py-4">{bn ? 'তারিখ' : 'Claim Date'}</th>
                <th className="px-5 py-4">{bn ? 'কোম্পানি' : 'Company'}</th>
                <th className="px-5 py-4">{bn ? 'এসআর' : 'SR'}</th>
                <th className="px-5 py-4">{bn ? 'পণ্য' : 'Product'}</th>
                <th className="px-5 py-4 text-center">{bn ? 'পরিমাণ' : 'Qty'}</th>
                <th className="px-5 py-4">{bn ? 'কারণ ও নোট' : 'Reason & Notes'}</th>
                <th className="px-5 py-4">{bn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="px-5 py-4 text-right">{bn ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400 font-semibold">
                    {bn ? 'কোন ক্লেম রেকর্ড খুঁজে পাওয়া যায়নি।' : 'No claim records found.'}
                  </td>
                </tr>
              ) : (
                filteredClaims.map(claim => {
                  const prod = products.find(p => p.id === claim.productId);
                  const dp = prod ? prod.defaultPP : 0;
                  const itemVal = claim.qty * dp;

                  return (
                    <tr key={claim.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3.5 text-xs font-semibold text-slate-600 font-mono whitespace-nowrap">
                        {claim.claimDate}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border shadow-sm ${getCompanyBadgeStyle(claim.companyName)}`}>
                          {claim.companyName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-700">
                        {claim.srName}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{claim.productName}</div>
                        {prod && (
                          <div className="text-[10px] text-slate-400 font-medium font-mono mt-0.5">
                            DP: {formatBDT(dp)} / {prod.primaryUnit === 'Carton' ? 'Ctn' : 'pc'}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-800 font-mono whitespace-nowrap">
                        <div>{claim.qty.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-400 font-medium mt-0.5">{bn ? 'মোট মূল্য: ' : 'Val: '}{formatBDT(itemVal)}</div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="text-xs font-bold text-slate-750">{claim.reason}</div>
                        {claim.notes && <div className="text-[10px] text-slate-400 italic mt-0.5 truncate" title={claim.notes}>{claim.notes}</div>}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(claim.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            claim.status === 'Approved' ? 'bg-emerald-500' :
                            claim.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {claim.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(claim.id, 'Approved')}
                                className="p-1 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer"
                                title="Approve Claim"
                              >
                                {bn ? 'অনুমোদন' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(claim.id, 'Rejected')}
                                className="p-1 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer"
                                title="Reject Claim"
                              >
                                {bn ? 'প্রত্যাখ্যান' : 'Reject'}
                              </button>
                            </>
                          )}
                          {claim.status !== 'Pending' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(claim.id, 'Pending')}
                              className="p-1 px-2 bg-slate-50 text-slate-650 hover:bg-slate-100 border border-slate-200 text-[9px] font-bold rounded-lg transition-all cursor-pointer"
                            >
                              {bn ? 'পেন্ডিং করুন' : 'Reset to Pending'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteClaim(claim.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100 border border-transparent hover:border-rose-100"
                            title="Delete claim"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Register New Claim */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddClaim} className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Sliders className="w-4.5 h-4.5 text-slate-750" />
                {bn ? 'নতুন ক্লেম এন্ট্রি' : 'Register New Claim'}
              </span>
              <button 
                type="button" 
                onClick={() => setShowFormModal(false)} 
                className="text-slate-400 hover:text-slate-800 focus:outline-none font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Claim Date */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'ক্লেম তারিখ *' : 'Claim Date *'}</label>
                <input
                  type="date"
                  required
                  value={claimDate}
                  onChange={e => setClaimDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              {/* Company Selection */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'কোম্পানি নির্বাচন *' : 'Select Company *'}</label>
                <select
                  required
                  value={selectedCompanyId}
                  onChange={e => handleCompanyChangeInForm(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-slate-850 focus:bg-white cursor-pointer text-slate-800"
                >
                  <option value="">{bn ? 'কোম্পানি সিলেক্ট করুন...' : 'Select a company...'}</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* SR Selection */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'এসআর নির্বাচন *' : 'Select SR *'}</label>
                <select
                  required
                  value={selectedSrId}
                  onChange={e => setSelectedSrId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-slate-855 focus:bg-white cursor-pointer text-slate-800"
                >
                  <option value="">{bn ? 'এসআর সিলেক্ট করুন...' : 'Select an SR...'}</option>
                  {srs.map(sr => (
                    <option key={sr.id} value={sr.id}>{sr.name}</option>
                  ))}
                </select>
              </div>

              {/* Product Selection */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  {bn ? 'পণ্য নির্বাচন *' : 'Select Product *'} 
                  {!selectedCompanyId && <span className="text-[10px] text-slate-400 font-normal ml-1">({bn ? 'প্রথমে কোম্পানি নির্বাচন করুন' : 'Select company first'})</span>}
                </label>
                <select
                  required
                  disabled={!selectedCompanyId}
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-slate-855 focus:bg-white cursor-pointer text-slate-800 disabled:opacity-50"
                >
                  <option value="">{bn ? 'পণ্য সিলেক্ট করুন...' : 'Select a product...'}</option>
                  {filteredProductsForForm.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'পরিমাণ (পিস/কার্টন) *' : 'Claim Quantity *'}</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={qty || ''}
                  onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                  placeholder={bn ? 'পরিমাণ লিখুন...' : 'Enter quantity...'}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'দাবির কারণ *' : 'Claim Reason *'}</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-slate-855 focus:bg-white cursor-pointer text-slate-800"
                >
                  <option value="Damaged packaging">{bn ? 'ক্ষতিগ্রস্ত প্যাকেজিং' : 'Damaged packaging'}</option>
                  <option value="Expired items">{bn ? 'মেয়াদোত্তীর্ণ পণ্য' : 'Expired items'}</option>
                  <option value="Shortage in shipment">{bn ? 'চালানে ঘাটতি' : 'Shortage in shipment'}</option>
                  <option value="Wrong product delivered">{bn ? 'ভুল পণ্য সরবরাহ' : 'Wrong product delivered'}</option>
                  <option value="Other">{bn ? 'অন্যান্য কারণ' : 'Other'}</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'অতিরিক্ত তথ্য (নোট)' : 'Notes'}</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={bn ? 'বিস্তারিত এখানে লিখুন...' : 'Enter additional claim details...'}
                  className="w-full h-20 p-3 rounded-lg border border-slate-200 bg-slate-50 font-semibold outline-none focus:border-slate-800 focus:bg-white resize-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 text-xs">
              <button 
                type="button" 
                onClick={() => setShowFormModal(false)} 
                className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button 
                type="submit" 
                className="px-4.5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-955 cursor-pointer shadow-sm"
              >
                {bn ? 'যুক্ত করুন' : 'Submit Claim'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
