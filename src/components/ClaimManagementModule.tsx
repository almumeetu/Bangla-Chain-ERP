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
  defaultTab?: 'claims' | 'displays';
  onTabChange?: (tab: 'claims' | 'displays') => void;
}

export default function ClaimManagementModule({
  claims,
  setClaims,
  products,
  srs,
  companies,
  language,
  defaultTab = 'claims',
  onTabChange
}: ClaimManagementModuleProps) {
  const bn = language === 'bn';

  // Active tab state
  const [activeTab, setActiveTab] = useState<'claims' | 'displays'>(defaultTab);

  React.useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const handleTabSelect = (tab: 'claims' | 'displays') => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // Filters state
  const [companyFilter, setCompanyFilter] = useState('All');
  const [srFilter, setSrFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [formType, setFormType] = useState<'Claim' | 'Display'>('Claim');
  const [claimDate, setClaimDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedSrId, setSelectedSrId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [customClaimValue, setCustomClaimValue] = useState<number | ''>('');

  // Auto-calculate claim value based on Qty and Product DP (dealer price)
  React.useEffect(() => {
    if (formType === 'Claim' && selectedProductId && qty > 0) {
      const prod = products.find(p => p.id === selectedProductId);
      if (prod) {
        setCustomClaimValue(qty * prod.defaultPP);
      }
    }
  }, [selectedProductId, qty, formType, products]);

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
      id: `${formType === 'Display' ? 'display' : 'claim'}-${Date.now()}`,
      claimDate,
      companyId: selectedCompanyId,
      companyName: company.name,
      srId: selectedSrId,
      srName: sr.name,
      productId: selectedProductId,
      productName: product.name,
      qty,
      reason: formType === 'Display' ? (bn ? 'ডিসপ্লে প্রোগ্রাম' : 'Display Program') : reason,
      notes,
      status: 'Pending',
      type: formType,
      claimValue: formType === 'Display' ? undefined : (customClaimValue === '' ? 0 : Number(customClaimValue))
    };

    setClaims(prev => [...prev, newClaim]);

    // Reset form
    setSelectedCompanyId('');
    setSelectedSrId('');
    setSelectedProductId('');
    setQty(0);
    setReason('');
    setCustomClaimValue('');
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
    const confirmMsg = activeTab === 'displays'
      ? (bn ? 'আপনি কি নিশ্চিত যে এই ডিসপ্লে প্রোগ্রামটি ডিলিট করতে চান?' : 'Are you sure you want to delete this display program?')
      : (bn ? 'আপনি কি নিশ্চিত যে এই ক্লেমটি ডিলিট করতে চান?' : 'Are you sure you want to delete this claim?');
    if (confirm(confirmMsg)) {
      setClaims(prev => prev.filter(c => c.id !== claimId));
    }
  };

  // Filtered claims based on filter criteria
  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      const matchesType = activeTab === 'displays' ? c.type === 'Display' : c.type !== 'Display';
      if (!matchesType) return false;

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
  }, [claims, activeTab, companyFilter, srFilter, startDate, endDate, searchQuery]);

  // Calculations for KPI Cards
  const totalClaimsCount = filteredClaims.length;
  const totalClaimsQty = filteredClaims.reduce((sum, c) => sum + c.qty, 0);
  const totalClaimsValue = useMemo(() => {
    return filteredClaims.reduce((sum, c) => {
      if (c.type !== 'Display' && c.claimValue !== undefined) return sum + c.claimValue;
      const prod = products.find(p => p.id === c.productId);
      const dp = prod ? prod.defaultPP : 0;
      return sum + c.qty * dp;
    }, 0);
  }, [filteredClaims, products]);

  // Monthly claim value — claims in the current calendar month
  const monthlyClaimValue = useMemo(() => {
    const now = new Date();
    const yyyyMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return claims
      .filter(c => c.type !== 'Display' && c.claimDate.startsWith(yyyyMM))
      .reduce((sum, c) => {
        if (c.claimValue !== undefined) return sum + c.claimValue;
        const prod = products.find(p => p.id === c.productId);
        return sum + c.qty * (prod ? prod.defaultPP : 0);
      }, 0);
  }, [claims, products]);

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
            {activeTab === 'displays'
              ? (bn ? 'ডিসপ্লে প্রোগ্রাম ম্যানেজমেন্ট' : 'Display Program Management')
              : (bn ? 'ক্লেম ম্যানেজমেন্ট' : 'Claim Management')}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {activeTab === 'displays'
              ? (bn ? 'কোম্পানি এবং এসআর ভিত্তিক পণ্য প্রদর্শনী (Display) প্রোগ্রামসমূহ পরিচালনা করুন।' : 'Record, track, and analyze product displays and incentive programs.')
              : (bn ? 'কোম্পানি এবং এসআর ভিত্তিক পণ্যের ক্লেম বা দাবিসমূহ পরিচালনা করুন।' : 'Record, track, and analyze claims and return requests.')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormType(activeTab === 'displays' ? 'Display' : 'Claim');
            setShowFormModal(true);
          }}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 border border-slate-955 cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          {activeTab === 'displays'
            ? (bn ? 'নতুন ডিসপ্লে রেজিস্টার করুন' : 'Register New Display')
            : (bn ? 'নতুন ক্লেম রেজিস্টার করুন' : 'Register New Claim')}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Claims / Displays */}
        <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/20 rounded-2xl border border-blue-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-500/5 rounded-tl-full pointer-events-none" />
          <div className="p-3 bg-blue-500 rounded-xl text-white shadow-sm shadow-blue-200">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">
              {activeTab === 'displays' ? (bn ? 'মোট ডিসপ্লে' : 'Total Displays') : (bn ? 'মোট ক্লেম সংখ্যা' : 'Total Claims')}
            </span>
            <span className="text-2xl font-black text-slate-855 font-mono tracking-tight">
              {totalClaimsCount} <span className="text-xs font-bold text-slate-500">{activeTab === 'displays' ? (bn ? 'টি' : 'entries') : (bn ? 'টি' : 'entries')}</span>
            </span>
          </div>
        </div>

        {/* Card 2: Total Claim / Display Quantity */}
        <div className="bg-gradient-to-br from-purple-50/70 to-fuchsia-50/20 rounded-2xl border border-purple-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-500/5 rounded-tl-full pointer-events-none" />
          <div className="p-3 bg-purple-500 rounded-xl text-white shadow-sm shadow-purple-200">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block">
              {activeTab === 'displays' ? (bn ? 'মোট ডিসপ্লে পরিমাণ' : 'Total Display Qty') : (bn ? 'মোট ক্লেম পরিমাণ' : 'Total Claim Qty')}
            </span>
            <span className="text-2xl font-black text-slate-855 font-mono tracking-tight">
              {totalClaimsQty.toLocaleString('en-BD')} <span className="text-xs font-bold text-slate-500">{bn ? 'পিস' : 'pcs'}</span>
            </span>
          </div>
        </div>

        {/* Card 3: Total Claim Value */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/20 rounded-2xl border border-emerald-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-tl-full pointer-events-none" />
          <div className="p-3 bg-emerald-500 rounded-xl text-white shadow-sm shadow-emerald-200">
            <span className="text-xl font-bold font-mono">৳</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
              {activeTab === 'displays' ? (bn ? 'মোট ডিসপ্লে মূল্য' : 'Total Display Value') : (bn ? 'মোট ক্লেম মূল্য' : 'Total Claim Value')}
            </span>
            <span className="text-xl font-black text-emerald-700 font-mono tracking-tight block truncate">
              {formatBDT(totalClaimsValue)}
            </span>
          </div>
        </div>

        {/* Card 4: This Month's Claim Value — only for claims tab */}
        <div className={`bg-gradient-to-br rounded-2xl border p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300 ${
          activeTab === 'displays'
            ? 'from-slate-50/70 to-slate-50/20 border-slate-200'
            : 'from-amber-50/70 to-orange-50/20 border-amber-100'
        }`}>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 rounded-tl-full pointer-events-none" />
          <div className={`p-3 rounded-xl text-white shadow-sm ${
            activeTab === 'displays' ? 'bg-slate-400 shadow-slate-200' : 'bg-amber-500 shadow-amber-200'
          }`}>
            <span className="text-xl font-bold font-mono">৳</span>
          </div>
          <div className="min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              activeTab === 'displays' ? 'text-slate-400' : 'text-amber-600'
            }`}>
              {bn ? 'এই মাসের ক্লেম মূল্য' : 'This Month Claim Value'}
            </span>
            <span className={`text-xl font-black font-mono tracking-tight block truncate ${
              activeTab === 'displays' ? 'text-slate-400' : 'text-amber-700'
            }`}>
              {activeTab === 'displays' ? '—' : formatBDT(monthlyClaimValue)}
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
              {activeTab === 'displays' ? (bn ? 'ডিসপ্লে ফিল্টার' : 'Display Filters') : (bn ? 'ক্লেম ফিল্টার' : 'Claim Filters')}
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
              {activeTab === 'displays' ? (bn ? 'অনুসন্ধান (পণ্য, নোট)' : 'Search (Product, Notes)') : (bn ? 'অনুসন্ধান (পণ্য, কারণ, নোট)' : 'Search (Product, Reason, Notes)')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'displays' ? (bn ? 'ডিসপ্লে খুঁজুন...' : 'Search displays...') : (bn ? 'ক্লেম খুঁজুন...' : 'Search claims...')}
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
            <div className="flex items-center gap-2">
              <div className="relative flex items-center flex-1">
                <div className="absolute left-2 w-5 h-5 rounded bg-indigo-50 border border-indigo-200/60 flex items-center justify-center pointer-events-none z-10">
                  <Calendar className="w-3 h-3 text-indigo-500" />
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full h-10 pl-8 pr-1.5 rounded-xl border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-bold">To</span>
              <div className="relative flex items-center flex-1">
                <div className="absolute left-2 w-5 h-5 rounded bg-rose-50 border border-rose-200/60 flex items-center justify-center pointer-events-none z-10">
                  <Calendar className="w-3 h-3 text-rose-500" />
                </div>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full h-10 pl-8 pr-1.5 rounded-xl border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                />
              </div>
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
                <th className="px-5 py-4 whitespace-nowrap">{activeTab === 'displays' ? (bn ? 'তারিখ' : 'Date') : (bn ? 'তারিখ' : 'Claim Date')}</th>
                <th className="px-5 py-4 whitespace-nowrap">{bn ? 'কোম্পানি' : 'Company'}</th>
                <th className="px-5 py-4 whitespace-nowrap">{bn ? 'এসআর' : 'SR'}</th>
                <th className="px-5 py-4 whitespace-nowrap">{bn ? 'পণ্য' : 'Product'}</th>
                <th className="px-5 py-4 text-center whitespace-nowrap">{bn ? 'পরিমাণ' : 'Qty'}</th>
                <th className="px-5 py-4 whitespace-nowrap">{activeTab === 'displays' ? (bn ? 'নোট ও বিস্তারিত' : 'Notes & Details') : (bn ? 'কারণ ও নোট' : 'Reason & Notes')}</th>
                {activeTab !== 'displays' && <th className="px-5 py-4 text-right whitespace-nowrap">{bn ? 'ক্লেম মূল্য' : 'Claim Value'}</th>}
                <th className="px-5 py-4 whitespace-nowrap">{bn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="px-5 py-4 text-right whitespace-nowrap">{bn ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'displays' ? 8 : 9} className="px-5 py-10 text-center text-slate-400 font-semibold">
                    {activeTab === 'displays'
                      ? (bn ? 'কোন ডিসপ্লে রেকর্ড খুঁজে পাওয়া যায়নি।' : 'No display records found.')
                      : (bn ? 'কোন ক্লেম রেকর্ড খুঁজে পাওয়া যায়নি।' : 'No claim records found.')}
                  </td>
                </tr>
              ) : (
                filteredClaims.map(claim => {
                  const prod = products.find(p => p.id === claim.productId);
                  const dp = prod ? prod.defaultPP : 0;
                  const displayClaimValue = claim.type !== 'Display'
                    ? (claim.claimValue !== undefined ? claim.claimValue : claim.qty * dp)
                    : null;

                  return (
                    <tr key={claim.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3.5 text-xs font-semibold text-slate-600 font-mono whitespace-nowrap">
                        {claim.claimDate}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border shadow-2xs ${getCompanyBadgeStyle(claim.companyName)}`}>
                          {claim.companyName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-700 whitespace-nowrap">
                        {claim.srName}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 text-xs whitespace-nowrap">{claim.productName}</div>
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-800 font-mono whitespace-nowrap">
                        {claim.qty.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{bn ? 'পিস' : 'pcs'}</span>
                      </td>
                      <td className="px-5 py-3.5 max-w-[200px]">
                        {activeTab === 'displays' ? (
                          <div className="text-xs text-slate-600 whitespace-normal break-words">{claim.notes || '—'}</div>
                        ) : (
                          <>
                            <div className="text-xs font-semibold text-slate-755">{claim.reason || '—'}</div>
                            {claim.notes && <div className="text-[10px] text-slate-400 italic mt-0.5 truncate" title={claim.notes}>{claim.notes}</div>}
                          </>
                        )}
                      </td>
                      {activeTab !== 'displays' && (
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <span className="text-sm font-black text-emerald-700 font-mono">
                            {displayClaimValue !== null ? formatBDT(displayClaimValue) : '—'}
                          </span>
                        </td>
                      )}
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

      {/* MODAL: Register New Claim / Display */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddClaim} className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Sliders className="w-4.5 h-4.5 text-slate-750" />
                {formType === 'Display'
                  ? (bn ? 'নতুন ডিসপ্লে প্রোগ্রাম এন্ট্রি' : 'Register New Display Program')
                  : (bn ? 'নতুন ক্লেম এন্ট্রি' : 'Register New Claim')}
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
              {/* Date */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  {formType === 'Display' ? (bn ? 'ডিসপ্লে তারিখ *' : 'Display Date *') : (bn ? 'ক্লেম তারিখ *' : 'Claim Date *')}
                </label>
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
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-slate-855 focus:bg-white cursor-pointer text-slate-800"
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
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  {formType === 'Display' ? (bn ? 'পরিমাণ (পিস) *' : 'Display Quantity (Pcs) *') : (bn ? 'পরিমাণ (পিস/কার্টন) *' : 'Claim Quantity *')}
                </label>
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
              {formType !== 'Display' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'দাবির কারণ *' : 'Claim Reason *'}</label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder={bn ? 'দাবির কারণ লিখুন (যেমন: মেয়াদোত্তীর্ণ পণ্য, প্যাকেজিং নষ্ট)' : 'Enter custom claim reason (e.g. Expired, Damaged)...'}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white text-xs text-slate-800"
                  />
                </div>
              )}

              {/* Claim Value / Money */}
              {formType !== 'Display' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    {bn ? 'দাবির আর্থিক মূল্য (টাকা) *' : 'Claim Value / Refund (BDT) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={customClaimValue}
                    onChange={e => setCustomClaimValue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={bn ? 'টাকার পরিমাণ লিখুন...' : 'Enter refund money amount...'}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white text-xs font-mono text-slate-800"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  {formType === 'Display' ? (bn ? 'ডিসপ্লে বিবরণ / শপ বিবরণ (নোট)' : 'Display Description / Shop Details') : (bn ? 'অতিরিক্ত তথ্য (নোট)' : 'Notes')}
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={formType === 'Display' ? (bn ? 'দোকানের নাম, বিবরণ বা অফার বিস্তারিত লিখুন...' : 'Enter shop details, description or offer details...') : (bn ? 'বিস্তারিত এখানে লিখুন...' : 'Enter additional claim details...')}
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
                {formType === 'Display' ? (bn ? 'ডিসপ্লে যুক্ত করুন' : 'Submit Display') : (bn ? 'যুক্ত করুন' : 'Submit Claim')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
