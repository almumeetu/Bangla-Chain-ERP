'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus, Calendar, Briefcase, UserCheck, Package,
  Trash2, CheckCircle, XCircle, FileText, Sliders, Layers,
  Settings, Pencil, X, Tag, Wallet, ArrowDownUp, Landmark,
  Download, Receipt
} from 'lucide-react';
import type { Claim, ClaimSettlement, Product, SR, CompanyBrand } from '../types';
import type { Language } from '../translations';
import type { ClaimReason } from '../lib/localStore';
import { useToast } from './ui/Toast';

interface ClaimManagementModuleProps {
  claims: Claim[];
  setClaims: (c: Claim[] | ((prev: Claim[]) => Claim[])) => void;
  claimSettlements: ClaimSettlement[];
  setClaimSettlements: (cs: ClaimSettlement[] | ((prev: ClaimSettlement[]) => ClaimSettlement[])) => void;
  products: Product[];
  setProducts?: (p: Product[] | ((prev: Product[]) => Product[])) => void;
  srs: SR[];
  companies: CompanyBrand[];
  claimReasons: ClaimReason[];
  setClaimReasons: (r: ClaimReason[] | ((prev: ClaimReason[]) => ClaimReason[])) => void;
  language: Language;
  defaultTab?: 'claims' | 'displays' | 'settlements';
  onTabChange?: (tab: 'claims' | 'displays' | 'settlements') => void;
}

export default function ClaimManagementModule({
  claims, setClaims, claimSettlements, setClaimSettlements,
  products, setProducts,
  srs, companies, claimReasons, setClaimReasons,
  language, defaultTab = 'claims', onTabChange
}: ClaimManagementModuleProps) {
  const bn = language === 'bn';
  const { success, error, warning } = useToast();

  // ── Tab ──────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'claims' | 'displays' | 'settlements'>(defaultTab);
  React.useEffect(() => { if (defaultTab) setActiveTab(defaultTab); }, [defaultTab]);
  const handleTabSelect = (tab: 'claims' | 'displays' | 'settlements') => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [companyFilter, setCompanyFilter] = useState('All');
  const [srFilter, setSrFilter] = useState('All');
  const [reasonFilter, setReasonFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ── Reason management panel state ────────────────────────────────────────────
  const [showReasonPanel, setShowReasonPanel] = useState(false);
  const [newReasonLabel, setNewReasonLabel] = useState('');
  const [editingReasonId, setEditingReasonId] = useState<string | null>(null);
  const [editingReasonLabel, setEditingReasonLabel] = useState('');

  // ── Reason CRUD handlers ─────────────────────────────────────────────────────
  const handleAddReason = () => {
    const label = newReasonLabel.trim();
    if (!label) return;
    if (claimReasons.some(r => r.label.toLowerCase() === label.toLowerCase())) {
      warning(bn ? 'কারণ বিদ্যমান' : 'Already exists', bn ? 'এই কারণটি ইতিমধ্যে বিদ্যমান।' : 'This reason already exists.');
      return;
    }
    setClaimReasons(prev => [...prev, { id: `cr-${Date.now()}`, label }]);
    setNewReasonLabel('');
  };

  const handleUpdateReason = (id: string) => {
    const label = editingReasonLabel.trim();
    if (!label) return;
    setClaimReasons(prev => prev.map(r => r.id === id ? { ...r, label } : r));
    setEditingReasonId(null);
    setEditingReasonLabel('');
  };

  const handleDeleteReason = (id: string) => {
    if (!confirm(bn ? 'এই কারণটি ডিলিট করবেন?' : 'Delete this reason?')) return;
    setClaimReasons(prev => prev.filter(r => r.id !== id));
    // Clear the reason filter if the deleted reason was selected
    const deleted = claimReasons.find(r => r.id === id);
    if (deleted && reasonFilter === deleted.label) setReasonFilter('All');
  };

  // ── SR filter cascade ────────────────────────────────────────────────────────
  const filteredSrsForFilter = useMemo(() => {
    if (companyFilter === 'All') return srs;
    const comp = companies.find(c =>
      c.id === companyFilter ||
      c.name.toLowerCase().includes(companyFilter.toLowerCase()) ||
      companyFilter.toLowerCase().includes(c.name.toLowerCase())
    );
    if (!comp) return srs;
    return srs.filter(sr => (sr.assignedCompanyIds || []).some(
      cid => cid === comp.id || cid.toLowerCase() === comp.name.toLowerCase()
    ));
  }, [companyFilter, companies, srs]);

  React.useEffect(() => {
    if (companyFilter !== 'All' && srFilter !== 'All') {
      const isSrInCompany = filteredSrsForFilter.some(sr => sr.id === srFilter);
      if (!isSrInCompany) setSrFilter('All');
    }
  }, [companyFilter, filteredSrsForFilter, srFilter]);

  // ── Form modal state ─────────────────────────────────────────────────────────
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

  // Auto-calculate claim value
  React.useEffect(() => {
    if (formType === 'Claim' && selectedProductId && qty > 0) {
      const prod = products.find(p => p.id === selectedProductId || p.name === selectedProductId);
      if (prod) setCustomClaimValue(qty * (prod.defaultPP || prod.defaultWSP));
    }
  }, [selectedProductId, qty, formType, products]);

  const handleCompanyChangeInForm = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setSelectedProductId('');
    setSelectedSrId('');
  };

  const filteredSrsForForm = useMemo(() => {
    if (!selectedCompanyId) return [];
    const comp = companies.find(c => c.id === selectedCompanyId || c.name === selectedCompanyId);
    const compName = comp ? comp.name : selectedCompanyId;
    return srs.filter(sr => (sr.assignedCompanyIds || []).some(
      cid => cid === selectedCompanyId || cid.toLowerCase() === compName.toLowerCase()
    ));
  }, [selectedCompanyId, srs, companies]);

  const filteredProductsForForm = useMemo(() => {
    if (!selectedCompanyId) return [];
    const comp = companies.find(c => c.id === selectedCompanyId || c.name === selectedCompanyId);
    const compName = comp ? comp.name : selectedCompanyId;
    return products.filter(p => (p.company || '').toLowerCase() === compName.toLowerCase());
  }, [selectedCompanyId, companies, products]);

  // ── Form submit ───────────────────────────────────────────────────────────────
  const handleAddClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId || !selectedSrId || !selectedProductId || qty <= 0) {
      error(bn ? 'অসম্পূর্ণ তথ্য' : 'Incomplete Form', bn ? 'অনুগ্রহ করে সকল প্রয়োজনীয় ফিল্ড পূরণ করুন।' : 'Please fill in all required fields.');
      return;
    }
    const company = companies.find(c => c.id === selectedCompanyId || c.name === selectedCompanyId);
    const sr = srs.find(s => s.id === selectedSrId || s.name === selectedSrId);
    const product = products.find(p => p.id === selectedProductId || p.name === selectedProductId);
    if (!company || !sr || !product) return;

    const finalReason = formType === 'Display'
      ? (bn ? 'ডিসপ্লে প্রোগ্রাম' : 'Display Program')
      : (reason.trim() || (bn ? 'সাধারণ ড্যামেজ' : 'General Damage'));

    const newClaim: Claim = {
      id: `${formType === 'Display' ? 'display' : 'claim'}-${Date.now()}`,
      claimDate, companyId: company.id, companyName: company.name,
      srId: sr.id, srName: sr.name,
      productId: product.id, productName: product.name,
      qty, reason: finalReason, notes, status: 'Pending', type: formType,
      claimValue: formType === 'Display' ? undefined : (customClaimValue === '' ? 0 : Number(customClaimValue))
    };
    setClaims(prev => [...prev, newClaim]);
    setSelectedCompanyId(''); setSelectedSrId(''); setSelectedProductId('');
    setQty(0); setReason(''); setCustomClaimValue(''); setNotes('');
    setClaimDate(new Date().toISOString().slice(0, 10));
    setShowFormModal(false);
    success(
      formType === 'Display' ? (bn ? 'ডিসপ্লে যুক্ত হয়েছে' : 'Display Added') : (bn ? 'ক্লেম যুক্ত হয়েছে' : 'Claim Submitted'),
      formType === 'Display' ? (bn ? 'নতুন ডিসপ্লে সফলভাবে রেকর্ড করা হয়েছে।' : 'New display program recorded successfully.') : (bn ? 'নতুন ক্লেম সফলভাবে রেকর্ড করা হয়েছে।' : 'New claim recorded successfully.')
    );
  };

  // ── Status + delete handlers ─────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  // IMPORTANT: Claims & Display are kept as COMPLETELY SEPARATE hisab/register.
  // They intentionally do NOT sync with damagedStock, currentStock, or any other
  // module. Damage tracking is handled independently via the DirectoryModule
  // Damage tab. Claims are purely for financial / replacement record-keeping.
  // ═══════════════════════════════════════════════════════════════════════════════
  const handleUpdateStatus = (claimId: string, status: 'Pending' | 'Approved' | 'Rejected') => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim || claim.status === status) return;
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status } : c));
  };

  const handleDeleteClaim = (claimId: string) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;
    const msg = activeTab === 'displays'
      ? (bn ? 'এই ডিসপ্লেটি ডিলিট করবেন?' : 'Delete this display?')
      : (bn ? 'এই ক্লেমটি ডিলিট করবেন?' : 'Delete this claim?');
    if (!confirm(msg)) return;
    setClaims(prev => prev.filter(c => c.id !== claimId));
  };

  // ── Settlement: form state ──────────────────────────────────────────────────
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().slice(0, 10));
  const [settlementCompanyId, setSettlementCompanyId] = useState('');
  const [settlementMonth, setSettlementMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [settlementAmount, setSettlementAmount] = useState<number | ''>('');
  const [settlementPaymentMode, setSettlementPaymentMode] = useState('Bank Transfer');
  const [settlementReference, setSettlementReference] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');

  const handleAddSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementCompanyId || settlementAmount === '' || Number(settlementAmount) <= 0) {
      error(bn ? 'অসম্পূর্ণ তথ্য' : 'Incomplete Form', bn ? 'কোম্পানি ও পরিমাণ আবশ্যক।' : 'Company and amount are required.');
      return;
    }
    const company = companies.find(c => c.id === settlementCompanyId || c.name === settlementCompanyId);
    if (!company) return;
    const newSettlement: ClaimSettlement = {
      id: `settle-${Date.now()}`,
      settlementDate,
      monthKey: settlementMonth,
      companyId: company.id,
      companyName: company.name,
      amount: Number(settlementAmount),
      paymentMode: settlementPaymentMode,
      referenceNo: settlementReference,
      notes: settlementNotes,
      recordedAt: new Date().toISOString(),
    };
    setClaimSettlements(prev => [newSettlement, ...prev]);
    setSettlementCompanyId(''); setSettlementAmount('');
    setSettlementReference(''); setSettlementNotes('');
    setSettlementDate(new Date().toISOString().slice(0, 10));
    setSettlementMonth(new Date().toISOString().slice(0, 7));
    setSettlementPaymentMode('Bank Transfer');
    setShowSettlementModal(false);
    success(
      bn ? 'সেটলমেন্ট যুক্ত হয়েছে' : 'Settlement Recorded',
      bn ? 'কোম্পানি থেকে প্রাপ্ত ক্লেম টাকা রেকর্ড করা হয়েছে।' : 'Claim amount received from company recorded successfully.'
    );
  };

  const handleDeleteSettlement = (id: string) => {
    if (!confirm(bn ? 'এই সেটলমেন্টটি ডিলিট করবেন?' : 'Delete this settlement record?')) return;
    setClaimSettlements(prev => prev.filter(s => s.id !== id));
  };

  // ── Filtered claims ───────────────────────────────────────────────────────────
  const filteredClaims = useMemo(() => claims.filter(c => {
    const matchesType = activeTab === 'displays' ? c.type === 'Display' : c.type !== 'Display';
    if (!matchesType) return false;
    const matchesCompany = companyFilter === 'All' || c.companyName === companyFilter;
    const matchesSr = srFilter === 'All' || c.srId === srFilter;
    const matchesReason = reasonFilter === 'All' || c.reason.toLowerCase() === reasonFilter.toLowerCase();
    const matchesStart = !startDate || c.claimDate >= startDate;
    const matchesEnd = !endDate || c.claimDate <= endDate;
    return matchesCompany && matchesSr && matchesReason && matchesStart && matchesEnd;
  }), [claims, activeTab, companyFilter, srFilter, reasonFilter, startDate, endDate]);

  // ── KPI calcs ─────────────────────────────────────────────────────────────────
  const totalClaimsCount = filteredClaims.length;
  const totalClaimsQty   = filteredClaims.reduce((s, c) => s + c.qty, 0);
  const totalClaimsValue = useMemo(() => filteredClaims.reduce((s, c) => {
    if (c.type !== 'Display' && c.claimValue !== undefined) return s + c.claimValue;
    const prod = products.find(p => p.id === c.productId);
    return s + c.qty * (prod ? prod.defaultPP : 0);
  }, 0), [filteredClaims, products]);

  const monthlyClaimValue = useMemo(() => {
    const yyyyMM = new Date().toISOString().slice(0, 7);
    return claims
      .filter(c => c.type !== 'Display' && c.claimDate.startsWith(yyyyMM))
      .reduce((s, c) => {
        if (c.claimValue !== undefined) return s + c.claimValue;
        const prod = products.find(p => p.id === c.productId);
        return s + c.qty * (prod ? prod.defaultPP : 0);
      }, 0);
  }, [claims, products]);

  const formatBDT = useCallback((n: number) =>
    `৳${n.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`, []);

  // ── Settlement filters ───────────────────────────────────────────────────────
  const [settleCompanyFilter, setSettleCompanyFilter] = useState('All');
  const [settleMonthFilter, setSettleMonthFilter] = useState('');
  const [settleStartDate, setSettleStartDate] = useState('');
  const [settleEndDate, setSettleEndDate] = useState('');

  // ── Settlement KPIs & filtered data ──────────────────────────────────────────
  const filteredSettlements = useMemo(() => claimSettlements.filter(s => {
    const matchesCompany = settleCompanyFilter === 'All' || s.companyName === settleCompanyFilter || s.companyId === settleCompanyFilter;
    const matchesMonth = !settleMonthFilter || s.monthKey === settleMonthFilter;
    const matchesStart = !settleStartDate || s.settlementDate >= settleStartDate;
    const matchesEnd = !settleEndDate || s.settlementDate <= settleEndDate;
    return matchesCompany && matchesMonth && matchesStart && matchesEnd;
  }), [claimSettlements, settleCompanyFilter, settleMonthFilter, settleStartDate, settleEndDate]);

  const totalSettledAmount = useMemo(() =>
    filteredSettlements.reduce((s, c) => s + c.amount, 0), [filteredSettlements]);

  const totalClaimedAllTime = useMemo(() => {
    const claimOnly = claims.filter(c => c.type !== 'Display');
    return claimOnly.reduce((s, c) => {
      if (c.claimValue !== undefined) return s + c.claimValue;
      const prod = products.find(p => p.id === c.productId);
      return s + c.qty * (prod ? prod.defaultPP : 0);
    }, 0);
  }, [claims, products]);

  const totalSettledAllTime = useMemo(() =>
    claimSettlements.reduce((s, c) => s + c.amount, 0), [claimSettlements]);

  const pendingClaimBalance = useMemo(() =>
    Math.max(0, totalClaimedAllTime - totalSettledAllTime), [totalClaimedAllTime, totalSettledAllTime]);

  const monthlySettled = useMemo(() => {
    const yyyyMM = new Date().toISOString().slice(0, 7);
    return claimSettlements
      .filter(s => s.monthKey === yyyyMM)
      .reduce((s, c) => s + c.amount, 0);
  }, [claimSettlements]);

  // Claim vs Settlement per company (overview)
  const companyWiseClaimVsSettle = useMemo(() => {
    const map: Record<string, { company: string; claimed: number; settled: number; pending: number; }> = {};
    companies.forEach(c => {
      map[c.id] = { company: c.name, claimed: 0, settled: 0, pending: 0 };
    });
    claims.filter(c => c.type !== 'Display').forEach(c => {
      const key = c.companyId || c.companyName;
      if (!map[key]) map[key] = { company: c.companyName, claimed: 0, settled: 0, pending: 0 };
      const prod = products.find(p => p.id === c.productId);
      const val = c.claimValue !== undefined ? c.claimValue : c.qty * (prod ? prod.defaultPP : 0);
      map[key].claimed += val;
    });
    claimSettlements.forEach(s => {
      const key = s.companyId || s.companyName;
      if (!map[key]) map[key] = { company: s.companyName, claimed: 0, settled: 0, pending: 0 };
      map[key].settled += s.amount;
    });
    Object.values(map).forEach(m => { m.pending = Math.max(0, m.claimed - m.settled); });
    return Object.values(map).filter(m => m.claimed > 0 || m.settled > 0);
  }, [companies, claims, claimSettlements, products]);

  const getStatusClass = (s: 'Pending' | 'Approved' | 'Rejected') =>
    s === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    s === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
    'bg-amber-50 text-amber-700 border-amber-200';

  const getCompanyBadge = (name: string) => {
    const PALETTES = [
      'bg-orange-50 text-orange-700 border-orange-200',
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-violet-50 text-violet-700 border-violet-200',
      'bg-rose-50 text-rose-700 border-rose-200',
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-cyan-50 text-cyan-700 border-cyan-200',
      'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
      'bg-teal-50 text-teal-700 border-teal-200',
      'bg-indigo-50 text-indigo-700 border-indigo-200',
      'bg-lime-50 text-lime-700 border-lime-200',
      'bg-pink-50 text-pink-700 border-pink-200',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return PALETTES[Math.abs(hash) % PALETTES.length];
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*                    SETTLEMENT TAB UI                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'settlements' ? (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-slate-200 rounded-none shadow-sm">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {bn ? 'মাসিক ক্লেম সেটলমেন্ট' : 'Monthly Claim Settlement'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {bn
                  ? 'কোম্পানি থেকে ক্লেম হিসেবে প্রাপ্ত টাকার রেকর্ড ও কোম্পানি-ভিত্তিক দাবি বনাম বাস্তবায়ন ওভারভিউ।'
                  : 'Record claim money received from companies. Company-wise claim vs settlement overview & history.'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowSettlementModal(true)}
                className="inline-flex h-10 items-center gap-2 rounded-none bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-800 border border-emerald-900 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <Wallet className="w-3.5 h-3.5" />
                {bn ? 'নতুন সেটলমেন্ট এন্ট্রি' : 'Record New Settlement'}
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/20 rounded-none border border-amber-100 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-none text-white shadow-sm shadow-amber-200"><Receipt className="w-6 h-6" /></div>
              <div className="min-w-0">
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">{bn ? 'মোট দাবি (ক্লেম)' : 'Total Claimed'}</span>
                <span className="text-xl font-black text-amber-700 font-mono block truncate">{formatBDT(totalClaimedAllTime)}</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/20 rounded-none border border-emerald-100 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-500 rounded-none text-white shadow-sm shadow-emerald-200"><Landmark className="w-6 h-6" /></div>
              <div className="min-w-0">
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">{bn ? 'মোট প্রাপ্ত (সেটলড)' : 'Total Settled'}</span>
                <span className="text-xl font-black text-emerald-700 font-mono block truncate">{formatBDT(totalSettledAllTime)}</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-rose-50/70 to-pink-50/20 rounded-none border border-rose-100 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-rose-500 rounded-none text-white shadow-sm shadow-rose-200"><ArrowDownUp className="w-6 h-6" /></div>
              <div className="min-w-0">
                <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">{bn ? 'বাকি দাবি (পেন্ডিং)' : 'Pending Balance'}</span>
                <span className="text-xl font-black text-rose-700 font-mono block truncate">{formatBDT(pendingClaimBalance)}</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/20 rounded-none border border-indigo-100 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-500 rounded-none text-white shadow-sm shadow-indigo-200"><Calendar className="w-6 h-6" /></div>
              <div className="min-w-0">
                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">{bn ? 'এই মাসে প্রাপ্ত' : 'Received This Month'}</span>
                <span className="text-xl font-black text-indigo-700 font-mono block truncate">{formatBDT(monthlySettled)}</span>
              </div>
            </div>
          </div>

          {/* Claim vs Settlement Overview (Company-wise) */}
          <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50/60">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-none uppercase tracking-wider font-mono">
                  {bn ? 'কোম্পানি ভিত্তিক দাবি বনাম প্রাপ্তি' : 'Claim vs Settlement by Company'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">{companyWiseClaimVsSettle.length} {bn ? 'টি কোম্পানি' : 'companies'}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-extrabold tracking-wider">
                    <th className="px-5 py-3 whitespace-nowrap">{bn ? 'কোম্পানি' : 'Company'}</th>
                    <th className="px-5 py-3 text-right whitespace-nowrap">{bn ? 'মোট দাবি' : 'Total Claimed'}</th>
                    <th className="px-5 py-3 text-right whitespace-nowrap">{bn ? 'মোট প্রাপ্ত' : 'Total Settled'}</th>
                    <th className="px-5 py-3 text-right whitespace-nowrap">{bn ? 'পেন্ডিং ব্যালেন্স' : 'Pending Balance'}</th>
                    <th className="px-5 py-3 text-center whitespace-nowrap">{bn ? 'স্ট্যাটাস' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companyWiseClaimVsSettle.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-semibold">
                      {bn ? 'এখনো কোনো দাবি বা সেটলমেন্ট নেই।' : 'No claims or settlements recorded yet.'}
                    </td></tr>
                  ) : companyWiseClaimVsSettle.map(row => {
                    const pct = row.claimed > 0 ? Math.min(100, (row.settled / row.claimed) * 100) : 0;
                    return (
                      <tr key={row.company} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-none text-xs font-bold border ${getCompanyBadge(row.company)}`}>{row.company}</span>
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-slate-800 font-mono whitespace-nowrap">{formatBDT(row.claimed)}</td>
                        <td className="px-5 py-3 text-right font-black text-emerald-700 font-mono whitespace-nowrap">{formatBDT(row.settled)}</td>
                        <td className="px-5 py-3 text-right font-mono whitespace-nowrap">
                          {row.pending > 0
                            ? <span className="font-black text-rose-600">{formatBDT(row.pending)}</span>
                            : <span className="font-bold text-emerald-600">{bn ? 'সম্পূর্ণ' : 'Fully Settled'}</span>}
                        </td>
                        <td className="px-5 py-3 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-24 h-2 bg-slate-100 rounded-none overflow-hidden">
                              <div
                                className={`h-full rounded-none ${pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 font-mono">{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Settlement Filters */}
          <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] bg-teal-50 text-teal-700 font-extrabold px-2.5 py-0.5 rounded-none uppercase tracking-wider font-mono">
                {bn ? 'সেটলমেন্ট ইতিহাস ফিল্টার' : 'Settlement History Filters'}
              </span>
              {(settleCompanyFilter !== 'All' || settleMonthFilter || settleStartDate || settleEndDate) && (
                <button onClick={() => { setSettleCompanyFilter('All'); setSettleMonthFilter(''); setSettleStartDate(''); setSettleEndDate(''); }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer">
                  {bn ? 'ফিল্টার রিসেট' : 'Reset Filters'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{bn ? 'কোম্পানি' : 'Company'}</label>
                <select value={settleCompanyFilter} onChange={e => setSettleCompanyFilter(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50/20 px-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all cursor-pointer">
                  <option value="All">{bn ? 'সকল কোম্পানি' : 'All Companies'}</option>
                  {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{bn ? 'সেটলমেন্ট মাস' : 'Settlement Month'}</label>
                <input type="month" value={settleMonthFilter} onChange={e => setSettleMonthFilter(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50/20 px-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all" />
              </div>
              <div className="space-y-1.5 sm:col-span-2 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{bn ? 'তারিখ রেঞ্জ' : 'Date Range'}</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={settleStartDate} onChange={e => setSettleStartDate(e.target.value)}
                    className="w-full h-10 px-2 rounded-none border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 outline-none focus:border-emerald-500" />
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">—</span>
                  <input type="date" value={settleEndDate} onChange={e => setSettleEndDate(e.target.value)}
                    className="w-full h-10 px-2 rounded-none border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 outline-none focus:border-emerald-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Settlement History Table */}
          <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-3 bg-slate-50/60 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">
                {bn ? 'সেটলমেন্ট ইতিহাস' : 'Settlement History'}
                <span className="ml-2 text-[9px] font-normal text-slate-400 font-mono">
                  ({filteredSettlements.length} {bn ? 'টি রেকর্ড' : 'records'} · {formatBDT(totalSettledAmount)})
                </span>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-extrabold tracking-wider">
                    <th className="px-5 py-3 whitespace-nowrap">{bn ? 'সেটলমেন্ট তারিখ' : 'Settlement Date'}</th>
                    <th className="px-5 py-3 whitespace-nowrap">{bn ? 'মাস' : 'Month'}</th>
                    <th className="px-5 py-3 whitespace-nowrap">{bn ? 'কোম্পানি' : 'Company'}</th>
                    <th className="px-5 py-3 text-right whitespace-nowrap">{bn ? 'প্রাপ্ত টাকা' : 'Amount Received'}</th>
                    <th className="px-5 py-3 whitespace-nowrap">{bn ? 'পেমেন্ট মাধ্যম' : 'Payment Mode'}</th>
                    <th className="px-5 py-3 whitespace-nowrap">{bn ? 'রেফারেন্স' : 'Reference'}</th>
                    <th className="px-5 py-3 whitespace-nowrap">{bn ? 'নোট' : 'Notes'}</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">{bn ? 'অ্যাকশন' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSettlements.length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400 font-semibold">
                      {bn ? 'কোনো সেটলমেন্ট রেকর্ড পাওয়া যায়নি।' : 'No settlement records found.'}
                    </td></tr>
                  ) : filteredSettlements.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3 text-xs font-semibold text-slate-600 font-mono whitespace-nowrap">{s.settlementDate}</td>
                      <td className="px-5 py-3 text-xs font-bold text-slate-500 font-mono whitespace-nowrap">{s.monthKey}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-none text-xs font-bold border ${getCompanyBadge(s.companyName)}`}>{s.companyName}</span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <span className="text-sm font-black text-emerald-700 font-mono">{formatBDT(s.amount)}</span>
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap">{s.paymentMode || '—'}</td>
                      <td className="px-5 py-3 text-xs font-mono text-slate-600 whitespace-nowrap">{s.referenceNo || '—'}</td>
                      <td className="px-5 py-3 max-w-[200px]">
                        <div className="text-[10px] text-slate-500 whitespace-normal break-words italic">{s.notes || '—'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteSettlement(s.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-none text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                            title={bn ? 'ডিলিট' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>

          {/* Header — Claims / Displays */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-slate-200 rounded-none shadow-sm">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {activeTab === 'displays'
                  ? (bn ? 'ডিসপ্লে প্রোগ্রাম ম্যানেজমেন্ট' : 'Display Program Management')
                  : (bn ? 'ক্লেম ম্যানেজমেন্ট' : 'Claim Management')}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {activeTab === 'displays'
                  ? (bn ? 'কোম্পানি ও এসআর ভিত্তিক ডিসপ্লে প্রোগ্রাম পরিচালনা।' : 'Record, track, and analyze product display programs.')
                  : (bn ? 'কোম্পানি ও এসআর ভিত্তিক ক্লেম পরিচালনা।' : 'Record, track, and analyze claims and return requests.')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeTab !== 'displays' && (
                <button
                  type="button"
                  onClick={() => setShowReasonPanel(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-none border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all shadow-sm"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {bn ? 'ক্লেম কারণ সম্পাদনা' : 'Manage Reasons'}
                </button>
              )}
              <button
                type="button"
                onClick={() => { setFormType(activeTab === 'displays' ? 'Display' : 'Claim'); setShowFormModal(true); }}
                className="inline-flex h-10 items-center gap-2 rounded-none bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                {activeTab === 'displays' ? (bn ? 'নতুন ডিসপ্লে' : 'Register New Display') : (bn ? 'নতুন ক্লেম' : 'Register New Claim')}
              </button>
            </div>
          </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/20 rounded-none border border-blue-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500 rounded-none text-white shadow-sm shadow-blue-200"><FileText className="w-6 h-6" /></div>
          <div>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">
              {activeTab === 'displays' ? (bn ? 'মোট ডিসপ্লে' : 'Total Displays') : (bn ? 'মোট ক্লেম' : 'Total Claims')}
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">{totalClaimsCount} <span className="text-xs font-bold text-slate-500">{bn ? 'টি' : 'entries'}</span></span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50/70 to-fuchsia-50/20 rounded-none border border-purple-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-500 rounded-none text-white shadow-sm shadow-purple-200"><Package className="w-6 h-6" /></div>
          <div>
            <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block">
              {activeTab === 'displays' ? (bn ? 'মোট পরিমাণ' : 'Total Display Qty') : (bn ? 'মোট পরিমাণ' : 'Total Claim Qty')}
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">{totalClaimsQty.toLocaleString('en-BD')} <span className="text-xs font-bold text-slate-500">{bn ? 'পিস' : 'pcs'}</span></span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/20 rounded-none border border-emerald-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500 rounded-none text-white shadow-sm shadow-emerald-200"><span className="text-xl font-bold font-mono">৳</span></div>
          <div className="min-w-0">
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
              {activeTab === 'displays' ? (bn ? 'মোট ডিসপ্লে মূল্য' : 'Total Display Value') : (bn ? 'মোট ক্লেম মূল্য' : 'Total Claim Value')}
            </span>
            <span className="text-xl font-black text-emerald-700 font-mono block truncate">{formatBDT(totalClaimsValue)}</span>
          </div>
        </div>
        <div className={`bg-gradient-to-br rounded-none border p-5 shadow-sm flex items-center gap-4 ${activeTab === 'displays' ? 'from-slate-50/70 to-slate-50/20 border-slate-200' : 'from-amber-50/70 to-orange-50/20 border-amber-100'}`}>
          <div className={`p-3 rounded-none text-white shadow-sm ${activeTab === 'displays' ? 'bg-slate-400' : 'bg-amber-500 shadow-amber-200'}`}><span className="text-xl font-bold font-mono">৳</span></div>
          <div className="min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${activeTab === 'displays' ? 'text-slate-400' : 'text-amber-600'}`}>{bn ? 'এই মাসের ক্লেম' : 'This Month Claim'}</span>
            <span className={`text-xl font-black font-mono block truncate ${activeTab === 'displays' ? 'text-slate-400' : 'text-amber-700'}`}>{activeTab === 'displays' ? '—' : formatBDT(monthlyClaimValue)}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-none uppercase tracking-wider font-mono">
            {activeTab === 'displays' ? (bn ? 'ডিসপ্লে ফিল্টার' : 'Display Filters') : (bn ? 'ক্লেম ফিল্টার' : 'Claim Filters')}
          </span>
          {(companyFilter !== 'All' || srFilter !== 'All' || reasonFilter !== 'All' || startDate || endDate) && (
            <button onClick={() => { setCompanyFilter('All'); setSrFilter('All'); setReasonFilter('All'); setStartDate(''); setEndDate(''); }}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer">
              {bn ? 'ফিল্টার রিসেট' : 'Reset Filters'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{bn ? 'কোম্পানি' : 'Company'}</label>
            <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}
              className="h-10 w-full rounded-none border border-slate-200 bg-slate-50/20 px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer">
              <option value="All">{bn ? 'সকল কোম্পানি' : 'All Companies'}</option>
              {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{bn ? 'এসআর' : 'SR'}</label>
            <select value={srFilter} onChange={e => setSrFilter(e.target.value)}
              className="h-10 w-full rounded-none border border-slate-200 bg-slate-50/20 px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer">
              <option value="All">{bn ? 'সকল এসআর' : 'All SRs'}</option>
              {filteredSrsForFilter.map(sr => <option key={sr.id} value={sr.id}>{sr.name}</option>)}
            </select>
          </div>
          {activeTab !== 'displays' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{bn ? 'কারণ' : 'Reason'}</label>
              <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value)}
                className="h-10 w-full rounded-none border border-slate-200 bg-slate-50/20 px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer">
                <option value="All">{bn ? 'সকল কারণ' : 'All Reasons'}</option>
                {claimReasons.map(r => <option key={r.id} value={r.label}>{r.label}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{bn ? 'তারিখ' : 'Date Range'}</label>
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full h-10 px-2 rounded-none border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 outline-none focus:border-indigo-500" />
              <span className="text-[10px] text-slate-400 font-bold shrink-0">—</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full h-10 px-2 rounded-none border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 outline-none focus:border-indigo-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-extrabold tracking-wider">
                <th className="px-5 py-4 whitespace-nowrap">{bn ? 'তারিখ' : 'Date'}</th>
                <th className="px-5 py-4 whitespace-nowrap">{bn ? 'কোম্পানি' : 'Company'}</th>
                <th className="px-5 py-4 whitespace-nowrap">{bn ? 'এসআর' : 'SR'}</th>
                <th className="px-5 py-4 whitespace-nowrap">{bn ? 'পণ্য' : 'Product'}</th>
                <th className="px-5 py-4 text-center whitespace-nowrap">{bn ? 'পরিমাণ' : 'Qty'}</th>
                <th className="px-5 py-4 whitespace-nowrap">{activeTab === 'displays' ? (bn ? 'নোট' : 'Notes') : (bn ? 'কারণ ও নোট' : 'Reason & Notes')}</th>
                {activeTab !== 'displays' && <th className="px-5 py-4 text-right whitespace-nowrap">{bn ? 'ক্লেম মূল্য' : 'Claim Value'}</th>}
                <th className="px-5 py-4 whitespace-nowrap">{bn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="px-4 py-4 text-center whitespace-nowrap">{bn ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.length === 0 ? (
                <tr><td colSpan={activeTab === 'displays' ? 8 : 9} className="px-5 py-10 text-center text-slate-400 font-semibold">
                  {activeTab === 'displays' ? (bn ? 'কোনো ডিসপ্লে পাওয়া যায়নি।' : 'No display records found.') : (bn ? 'কোনো ক্লেম পাওয়া যায়নি।' : 'No claim records found.')}
                </td></tr>
              ) : filteredClaims.map(claim => {
                const prod = products.find(p => p.id === claim.productId);
                const displayValue = claim.type !== 'Display'
                  ? (claim.claimValue !== undefined ? claim.claimValue : claim.qty * (prod ? prod.defaultPP : 0))
                  : null;
                return (
                  <tr key={claim.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-600 font-mono whitespace-nowrap">{claim.claimDate}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-none text-xs font-bold border ${getCompanyBadge(claim.companyName)}`}>{claim.companyName}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-700 whitespace-nowrap">{claim.srName}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-900 whitespace-nowrap">{claim.productName}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-800 font-mono whitespace-nowrap">{claim.qty.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{bn ? 'পিস' : 'pcs'}</span></td>
                    <td className="px-5 py-3.5 max-w-[200px]">
                      {activeTab === 'displays'
                        ? <div className="text-xs text-slate-600 whitespace-normal break-words">{claim.notes || '—'}</div>
                        : <><div className="text-xs font-semibold text-slate-700">{claim.reason || '—'}</div>
                           {claim.notes && <div className="text-[10px] text-slate-400 italic mt-0.5 truncate" title={claim.notes}>{claim.notes}</div>}</>}
                    </td>
                    {activeTab !== 'displays' && (
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <span className="text-sm font-black text-emerald-700 font-mono">{displayValue !== null ? formatBDT(displayValue) : '—'}</span>
                      </td>
                    )}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <select
                        value={claim.status}
                        onChange={e => handleUpdateStatus(claim.id, e.target.value as 'Pending' | 'Approved' | 'Rejected')}
                        className={`h-7 pl-2.5 pr-6 text-[10px] font-bold uppercase tracking-wide border rounded-none outline-none cursor-pointer appearance-none transition-colors ${
                          claim.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:border-emerald-400'
                            : claim.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 focus:border-rose-400'
                            : 'bg-amber-50 text-amber-700 border-amber-200 focus:border-amber-400'
                        }`}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                      >
                        <option value="Pending">{bn ? 'অপেক্ষমাণ' : 'Pending'}</option>
                        <option value="Approved">{bn ? 'অনুমোদিত' : 'Approved'}</option>
                        <option value="Rejected">{bn ? 'প্রত্যাখ্যাত' : 'Rejected'}</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteClaim(claim.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-none text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                          title={bn ? 'ডিলিট' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: Manage Claim Reasons ─────────────────────────────────────────── */}
      {showReasonPanel && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-none border border-slate-200 w-full max-w-md shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-indigo-600" />
                {bn ? 'ক্লেম কারণ পরিচালনা' : 'Manage Claim Reasons'}
              </span>
              <button type="button" onClick={() => setShowReasonPanel(false)}
                className="text-slate-400 hover:text-slate-800 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Add new reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {bn ? 'নতুন কারণ যোগ করুন' : 'Add New Reason'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newReasonLabel}
                    onChange={e => setNewReasonLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddReason(); } }}
                    placeholder={bn ? 'কারণ লিখুন...' : 'Type a reason label...'}
                    className="flex-1 h-10 px-3 rounded-none border border-slate-200 bg-slate-50 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-800"
                  />
                  <button type="button" onClick={handleAddReason}
                    className="h-10 px-4 bg-slate-900 text-white text-xs font-bold rounded-none hover:bg-slate-800 cursor-pointer shrink-0 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />{bn ? 'যোগ করুন' : 'Add'}
                  </button>
                </div>
              </div>

              {/* Existing reasons list */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {bn ? 'বিদ্যমান কারণসমূহ' : 'Existing Reasons'}
                  <span className="ml-2 text-[10px] font-normal text-slate-400">({claimReasons.length})</span>
                </label>
                {claimReasons.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-none">
                    {bn ? 'কোনো কারণ তৈরি হয়নি।' : 'No reasons created yet.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {claimReasons.map(r => (
                      <div key={r.id} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-none group">
                        {editingReasonId === r.id ? (
                          <>
                            <input
                              type="text"
                              value={editingReasonLabel}
                              onChange={e => setEditingReasonLabel(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleUpdateReason(r.id); } if (e.key === 'Escape') setEditingReasonId(null); }}
                              autoFocus
                              className="flex-1 h-8 px-2 rounded-none border border-indigo-400 bg-white text-xs font-semibold outline-none text-slate-800"
                            />
                            <button type="button" onClick={() => handleUpdateReason(r.id)}
                              className="h-8 px-3 bg-indigo-600 text-white text-[10px] font-bold rounded-none hover:bg-indigo-700 cursor-pointer shrink-0">
                              {bn ? 'সেভ' : 'Save'}
                            </button>
                            <button type="button" onClick={() => setEditingReasonId(null)}
                              className="h-8 px-2 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-none hover:bg-slate-300 cursor-pointer shrink-0">
                              {bn ? 'বাতিল' : 'Cancel'}
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{r.label}</span>
                            <button type="button"
                              onClick={() => { setEditingReasonId(r.id); setEditingReasonLabel(r.label); }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-none cursor-pointer transition-all border border-transparent hover:border-indigo-100"
                              title={bn ? 'সম্পাদনা' : 'Edit'}>
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button type="button" onClick={() => handleDeleteReason(r.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-none cursor-pointer transition-all border border-transparent hover:border-rose-100"
                              title={bn ? 'ডিলিট' : 'Delete'}>
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 shrink-0">
              <button type="button" onClick={() => setShowReasonPanel(false)}
                className="w-full h-10 rounded-none border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer">
                {bn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Register New Claim / Display ─────────────────────────────────── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddClaim} className="bg-white rounded-none border border-slate-200 w-full max-w-md shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-slate-700" />
                {formType === 'Display' ? (bn ? 'নতুন ডিসপ্লে এন্ট্রি' : 'Register New Display') : (bn ? 'নতুন ক্লেম এন্ট্রি' : 'Register New Claim')}
              </span>
              <button type="button" onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-800 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto">
              {/* Date */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{formType === 'Display' ? (bn ? 'ডিসপ্লে তারিখ *' : 'Display Date *') : (bn ? 'ক্লেম তারিখ *' : 'Claim Date *')}</label>
                <input type="date" required value={claimDate} onChange={e => setClaimDate(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white" />
              </div>

              {/* Company */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'কোম্পানি *' : 'Select Company *'}</label>
                <select required value={selectedCompanyId} onChange={e => handleCompanyChangeInForm(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-slate-800 focus:bg-white cursor-pointer text-slate-800">
                  <option value="">{bn ? 'কোম্পানি সিলেক্ট করুন...' : 'Select a company...'}</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* SR */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  {bn ? 'এসআর *' : 'Select SR *'}
                  {!selectedCompanyId && <span className="text-[10px] text-slate-400 font-normal ml-1">({bn ? 'প্রথমে কোম্পানি' : 'Select company first'})</span>}
                </label>
                <select required disabled={!selectedCompanyId} value={selectedSrId} onChange={e => setSelectedSrId(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-slate-800 focus:bg-white cursor-pointer text-slate-800 disabled:opacity-50">
                  <option value="">{bn ? 'এসআর সিলেক্ট করুন...' : 'Select an SR...'}</option>
                  {filteredSrsForForm.map(sr => <option key={sr.id} value={sr.id}>{sr.name}</option>)}
                </select>
              </div>

              {/* Product */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  {bn ? 'পণ্য *' : 'Select Product *'}
                  {!selectedCompanyId && <span className="text-[10px] text-slate-400 font-normal ml-1">({bn ? 'প্রথমে কোম্পানি' : 'Select company first'})</span>}
                </label>
                <select required disabled={!selectedCompanyId} value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-slate-800 focus:bg-white cursor-pointer text-slate-800 disabled:opacity-50">
                  <option value="">{bn ? 'পণ্য সিলেক্ট করুন...' : 'Select a product...'}</option>
                  {filteredProductsForForm.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Qty */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{formType === 'Display' ? (bn ? 'পরিমাণ *' : 'Quantity *') : (bn ? 'ক্লেম পরিমাণ *' : 'Claim Quantity *')}</label>
                <input type="number" min="1" required value={qty || ''} onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                  placeholder={bn ? 'পরিমাণ লিখুন...' : 'Enter quantity...'}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white" />
              </div>

              {/* Reason — only for Claims */}
              {formType !== 'Display' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">{bn ? 'ক্লেম কারণ *' : 'Claim Reason *'}</label>
                    <button type="button" onClick={() => { setShowFormModal(false); setShowReasonPanel(true); }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer flex items-center gap-1">
                      <Settings className="w-3 h-3" />{bn ? 'কারণ পরিচালনা' : 'Manage Reasons'}
                    </button>
                  </div>
                  {claimReasons.length === 0 ? (
                    <div className="text-[11px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-3 py-2 rounded-none mb-2">
                      {bn
                        ? 'কোনো কারণ তৈরি হয়নি। উপরে "কারণ পরিচালনা" থেকে তৈরি করুন।'
                        : 'No reasons created yet. Click "Manage Reasons" above to add some.'}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {claimReasons.map(r => (
                        <button key={r.id} type="button" onClick={() => setReason(r.label)}
                          className={`px-2.5 py-1 rounded-none text-[10px] font-semibold border transition-all cursor-pointer ${
                            reason === r.label
                              ? 'bg-indigo-600 text-white border-indigo-700 font-bold'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <input type="text" required value={reason} onChange={e => setReason(e.target.value)}
                    placeholder={bn ? 'কারণ সিলেক্ট করুন বা নতুন লিখুন...' : 'Select a reason above or type a custom one...'}
                    className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white text-xs text-slate-800" />
                </div>
              )}

              {/* Claim Value */}
              {formType !== 'Display' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'দাবির আর্থিক মূল্য (টাকা) *' : 'Claim Value / Refund (BDT) *'}</label>
                  <input type="number" min="0" required value={customClaimValue} onChange={e => setCustomClaimValue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={bn ? 'টাকার পরিমাণ...' : 'Enter refund amount...'}
                    className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white text-xs font-mono text-slate-800" />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  {formType === 'Display' ? (bn ? 'ডিসপ্লে বিবরণ (নোট)' : 'Display Description / Notes') : (bn ? 'অতিরিক্ত তথ্য (নোট)' : 'Notes')}
                </label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder={formType === 'Display' ? (bn ? 'দোকানের নাম বা বিবরণ...' : 'Shop details or offer description...') : (bn ? 'বিস্তারিত লিখুন...' : 'Additional details...')}
                  className="w-full h-20 p-3 rounded-none border border-slate-200 bg-slate-50 font-semibold outline-none focus:border-slate-800 focus:bg-white resize-none" />
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 text-xs shrink-0">
              <button type="button" onClick={() => setShowFormModal(false)}
                className="px-4 py-2.5 rounded-none border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button type="submit"
                className="px-4.5 py-2.5 rounded-none bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">
                {formType === 'Display' ? (bn ? 'ডিসপ্লে যুক্ত করুন' : 'Submit Display') : (bn ? 'যুক্ত করুন' : 'Submit Claim')}
              </button>
            </div>
          </form>
        </div>
      )}

        </>
      )}

      {/* ── MODAL: Record New Claim Settlement ──────────────────────────────── */}
      {showSettlementModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddSettlement} className="bg-white rounded-none border border-slate-200 w-full max-w-md shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-600" />
                {bn ? 'ক্লেম সেটলমেন্ট এন্ট্রি' : 'Record Claim Settlement'}
              </span>
              <button type="button" onClick={() => setShowSettlementModal(false)} className="text-slate-400 hover:text-slate-800 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto">
              {/* Settlement Date */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'পেমেন্ট প্রাপ্তির তারিখ *' : 'Settlement Date *'}</label>
                <input type="date" required value={settlementDate} onChange={e => setSettlementDate(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white" />
              </div>

              {/* Company */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'কোম্পানি *' : 'Select Company *'}</label>
                <select required value={settlementCompanyId} onChange={e => setSettlementCompanyId(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-slate-800 focus:bg-white cursor-pointer text-slate-800">
                  <option value="">{bn ? 'কোম্পানি সিলেক্ট করুন...' : 'Select a company...'}</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Settlement Month */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'সেটলমেন্টের মাস (YYYY-MM) *' : 'Settlement Month *'}</label>
                <input type="month" required value={settlementMonth} onChange={e => setSettlementMonth(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white font-mono" />
              </div>

              {/* Amount */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'প্রাপ্ত টাকার পরিমাণ (৳) *' : 'Amount Received (BDT) *'}</label>
                <input type="number" min="0" step="0.01" required value={settlementAmount} onChange={e => setSettlementAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={bn ? 'টাকার পরিমাণ লিখুন...' : 'Enter received amount...'}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white text-sm font-mono text-slate-800" />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'পেমেন্ট মাধ্যম' : 'Payment Mode'}</label>
                <select value={settlementPaymentMode} onChange={e => setSettlementPaymentMode(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-slate-800 focus:bg-white cursor-pointer text-slate-800">
                  <option value="Bank Transfer">{bn ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer'}</option>
                  <option value="Cash">{bn ? 'নগদ' : 'Cash'}</option>
                  <option value="Cheque">{bn ? 'চেক' : 'Cheque'}</option>
                  <option value="bKash">{bn ? 'বিকাশ' : 'bKash'}</option>
                  <option value="Nagad">{bn ? 'নগদ' : 'Nagad'}</option>
                  <option value="Adjustment">{bn ? 'অ্যাডজাস্টমেন্ট' : 'Bill Adjustment'}</option>
                </select>
              </div>

              {/* Reference */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'রেফারেন্স নম্বর' : 'Reference No.'}</label>
                <input type="text" value={settlementReference} onChange={e => setSettlementReference(e.target.value)}
                  placeholder={bn ? 'চেক নম্বর / ট্রান্সাকশন আইডি...' : 'Cheque no. / Transaction ID...'}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white text-xs font-mono text-slate-800" />
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{bn ? 'নোট / বিবরণ' : 'Notes / Remarks'}</label>
                <textarea value={settlementNotes} onChange={e => setSettlementNotes(e.target.value)}
                  placeholder={bn ? 'অতিরিক্ত তথ্য...' : 'Additional details...'}
                  className="w-full h-20 p-3 rounded-none border border-slate-200 bg-slate-50 font-semibold outline-none focus:border-slate-800 focus:bg-white resize-none" />
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 text-xs shrink-0">
              <button type="button" onClick={() => setShowSettlementModal(false)}
                className="px-4 py-2.5 rounded-none border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button type="submit"
                className="px-4.5 py-2.5 rounded-none bg-emerald-700 text-white font-semibold hover:bg-emerald-800 border border-emerald-900 cursor-pointer shadow-sm">
                {bn ? 'সেভ করুন' : 'Save Settlement'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
