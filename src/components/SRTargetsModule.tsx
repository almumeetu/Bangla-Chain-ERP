'use client';

import React, { useState, useMemo } from 'react';
import {
  Target, TrendingUp, Award, Calendar, Building2,
  CheckCircle2, AlertTriangle, Sparkles, BarChart3, Plus,
  X, User, Trash2, Edit3
} from 'lucide-react';
import type { ChallanItem, SRTarget, SR, CompanyBrand } from '../types';
import type { Language } from '../translations';
import { formatBDT, getLocalDateString, getChallanDate } from './dashboard/dashboardUtils';

interface SRTargetsModuleProps {
  srName: string;
  srs: SR[];
  challans: ChallanItem[];
  targets: SRTarget[];
  setTargets?: (targets: SRTarget[] | ((prev: SRTarget[]) => SRTarget[])) => void;
  companies: CompanyBrand[];
  userRole?: 'admin' | 'sr';
  language: Language;
}

export default function SRTargetsModule({
  srName,
  srs,
  challans,
  targets,
  setTargets,
  companies,
  userRole = 'admin',
  language,
}: SRTargetsModuleProps) {
  const isBn = language === 'bn';
  const today = new Date();
  const currentMonthStr = getLocalDateString(today).substring(0, 7); // 'YYYY-MM'

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedSRName, setSelectedSRName] = useState(srName || (srs[0]?.name || ''));
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Target Modal Form State
  const [formSRName, setFormSRName] = useState(selectedSRName);
  const [formMonth, setFormMonth] = useState(currentMonthStr);
  const [formCompanyId, setFormCompanyId] = useState(companies[0]?.id || '');
  const [formAmount, setFormAmount] = useState<number>(100000);

  // Active SR Name to use for filtering
  const activeSRName = userRole === 'sr' ? srName : (selectedSRName || srName);

  // Find Current SR
  const currentSR = useMemo(() => {
    const norm = (activeSRName || '').trim().toLowerCase();
    return srs.find(s => s.name.trim().toLowerCase() === norm);
  }, [srs, activeSRName]);

  // Resolved primary company name
  const resolvedCompanyName = useMemo(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('erp_sr_company_name');
      if (stored) return stored;
    }
    if (currentSR?.companyName) return currentSR.companyName;
    if (currentSR?.companyId) {
      const comp = companies.find(c => c.id === currentSR.companyId || c.name.toLowerCase() === currentSR.companyId?.toLowerCase());
      if (comp) return comp.name;
    }
    return '';
  }, [currentSR, companies]);

  // SR's assigned companies (scoped to resolved company or all assigned)
  const assignedCompanies = useMemo(() => {
    if (resolvedCompanyName) {
      const matched = companies.filter(c => c.name.toLowerCase() === resolvedCompanyName.toLowerCase());
      if (matched.length > 0) return matched;
    }
    if (!currentSR || !currentSR.assignedCompanyIds?.length) return companies;
    return companies.filter(c => currentSR.assignedCompanyIds.includes(c.id));
  }, [currentSR, companies, resolvedCompanyName]);

  // Filter SR's challans for the selected month (scoped strictly to SR + resolved Company)
  const monthChallans = useMemo(() => {
    const norm = (activeSRName || '').trim().toLowerCase();
    return challans.filter(ch => {
      const isSR = (ch.srName || '').trim().toLowerCase() === norm;
      const matchComp = !resolvedCompanyName || (ch.company || '').trim().toLowerCase() === resolvedCompanyName.trim().toLowerCase();
      const dateStr = getChallanDate(ch.id, ch.createdAt);
      return isSR && matchComp && dateStr.startsWith(selectedMonth);
    });
  }, [challans, activeSRName, selectedMonth, resolvedCompanyName]);

  // Monthly Targets for this SR
  const srTargetsForMonth = useMemo(() => {
    const norm = (activeSRName || '').trim().toLowerCase();
    return targets.filter(t => (t.srName || '').trim().toLowerCase() === norm && t.month === selectedMonth);
  }, [targets, activeSRName, selectedMonth]);

  // Overall Total Target
  const overallTargetAmount = useMemo(() => {
    return srTargetsForMonth.reduce((sum, t) => sum + (t.targetAmount || 0), 0);
  }, [srTargetsForMonth]);

  // Overall Total Sales
  const overallSalesAmount = useMemo(() => {
    return monthChallans.reduce((sum, ch) => sum + (ch.totalAmount || 0), 0);
  }, [monthChallans]);

  const achievementRate = overallTargetAmount > 0 ? Math.round((overallSalesAmount / overallTargetAmount) * 100) : 0;

  // Days calculations
  const [year, month] = selectedMonth.split('-').map(Number);
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const currentDay = today.getDate();
  const daysRemaining = Math.max(0, totalDaysInMonth - currentDay);
  const remainingTarget = Math.max(0, overallTargetAmount - overallSalesAmount);
  const requiredDailyRunRate = daysRemaining > 0 ? Math.round(remainingTarget / daysRemaining) : 0;

  // Company-wise target & achievement breakdown
  const companyBreakdown = useMemo(() => {
    return assignedCompanies.map(c => {
      const tgt = srTargetsForMonth.find(t => t.companyId === c.id || (t.companyName || '').toLowerCase() === c.name.toLowerCase());
      const targetVal = tgt?.targetAmount || 0;

      const salesVal = monthChallans
        .filter(ch => (ch.company || '').trim().toLowerCase() === c.name.trim().toLowerCase())
        .reduce((sum, ch) => sum + (ch.totalAmount || 0), 0);

      const percent = targetVal > 0 ? Math.round((salesVal / targetVal) * 100) : 0;

      return {
        company: c,
        targetId: tgt?.id,
        target: targetVal,
        sales: salesVal,
        percent,
        remaining: Math.max(0, targetVal - salesVal),
      };
    });
  }, [assignedCompanies, srTargetsForMonth, monthChallans]);

  const handleOpenAddModal = (companyId?: string) => {
    setFormSRName(activeSRName || srs[0]?.name || '');
    setFormMonth(selectedMonth);
    if (companyId) setFormCompanyId(companyId);
    else setFormCompanyId(companies[0]?.id || '');
    const existing = srTargetsForMonth.find(t => t.companyId === companyId);
    setFormAmount(existing ? existing.targetAmount : 100000);
    setIsModalOpen(true);
  };

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setTargets) return;

    const targetSR = srs.find(s => s.name === formSRName) || currentSR;
    const targetComp = companies.find(c => c.id === formCompanyId);

    const existingIdx = targets.findIndex(t => 
      t.srName.trim().toLowerCase() === formSRName.trim().toLowerCase() && 
      t.month === formMonth && 
      (t.companyId === formCompanyId || (targetComp && t.companyName?.toLowerCase() === targetComp.name.toLowerCase()))
    );

    const newTarget: SRTarget = {
      id: existingIdx !== -1 ? targets[existingIdx].id : `tgt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      srId: targetSR?.id || 'sr_0',
      srName: formSRName,
      month: formMonth,
      companyId: formCompanyId,
      companyName: targetComp?.name || '',
      targetAmount: Number(formAmount) || 0,
      createdAt: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      setTargets(prev => prev.map((t, idx) => idx === existingIdx ? newTarget : t));
    } else {
      setTargets(prev => [newTarget, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteTarget = (targetId: string) => {
    if (!setTargets) return;
    if (confirm(isBn ? 'আপনি কি এই টার্গেটটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this target?')) {
      setTargets(prev => prev.filter(t => t.id !== targetId));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-rose-600" />
            {isBn ? 'সেলস টার্গেট ও পারফরম্যান্স' : 'Sales Target & Performance'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isBn
              ? 'কোম্পানি ও ব্র্যান্ডভিত্তিক মাসিক সেলস টার্গেট এবং অর্জনের রিয়েল-টাইম পরিসংখ্যান।'
              : 'Track monthly sales target achievements and required daily run rates per company brand.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Admin SR Selector */}
          {userRole === 'admin' && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
              <User className="w-4 h-4 text-indigo-600" />
              <select
                value={selectedSRName}
                onChange={(e) => setSelectedSRName(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {srs.map(sr => (
                  <option key={sr.id} value={sr.name}>{sr.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Month Picker */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Admin Add Target Button */}
          {userRole === 'admin' && (
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-200 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {isBn ? 'টার্গেট সেট করুন' : 'Set Target'}
            </button>
          )}
        </div>
      </div>

      {/* ── Main Progress Hero Card ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/40 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-300 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/30">
              {isBn ? `${activeSRName} — ${selectedMonth} এর সামগ্রিক লক্ষ্যমাত্রা` : `${activeSRName} — Target for ${selectedMonth}`}
            </span>
            <div className="flex items-baseline gap-3 mt-3">
              <h2 className="text-3xl sm:text-4xl font-black text-white">{achievementRate}%</h2>
              <span className="text-sm font-semibold text-slate-300">
                {formatBDT(overallSalesAmount)} {isBn ? 'অর্জিত' : 'Achieved'} / {overallTargetAmount > 0 ? formatBDT(overallTargetAmount) : (isBn ? 'টার্গেট নির্ধারিত হয়নি' : 'No target set')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {achievementRate >= 100 ? (
              <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                {isBn ? 'টার্গেট সম্পূর্ণ!' : 'Target Achieved!'}
              </div>
            ) : achievementRate >= 70 ? (
              <div className="px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                {isBn ? 'লক্ষ্যমাত্রার পথে' : 'On Track'}
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                {isBn ? 'গতি বৃদ্ধি প্রয়োজন' : 'Needs Acceleration'}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                achievementRate >= 100
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                  : achievementRate >= 70
                  ? 'bg-gradient-to-r from-indigo-400 to-purple-500'
                  : 'bg-gradient-to-r from-amber-400 to-rose-500'
              }`}
              style={{ width: `${Math.min(100, achievementRate)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Run-rate info */}
        {overallTargetAmount > 0 && daysRemaining > 0 && remainingTarget > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs bg-slate-800/60 p-4 rounded-xl border border-slate-700">
            <div>
              <span className="text-slate-400 block">{isBn ? 'মাসের অবশিষ্ট দিন' : 'Days Remaining in Month'}</span>
              <span className="font-bold text-white text-sm">{daysRemaining} {isBn ? 'দিন' : 'Days'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">{isBn ? 'টার্গেট পূরণ করতে দৈনিক সেলস প্রয়োজন' : 'Required Daily Run-Rate'}</span>
              <span className="font-bold text-amber-300 text-sm">{formatBDT(requiredDailyRunRate)} / {isBn ? 'দিন' : 'day'}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Company-wise Target Breakdown ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {isBn ? 'কোম্পানি / ব্র্যান্ডভিত্তিক টার্গেট বিবরণ' : 'Brand-wise Target Breakdown'}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {companyBreakdown.length} {isBn ? 'টি ব্র্যান্ড' : 'Brands'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companyBreakdown.map(({ company, targetId, target, sales, percent, remaining }) => (
            <div
              key={company.id}
              className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all space-y-3 relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{company.name}</h3>
                  <span className="text-[11px] text-slate-400">
                    {isBn ? 'লক্ষ্যমাত্রা:' : 'Target:'} <span className="font-semibold text-slate-700">{target > 0 ? formatBDT(target) : (isBn ? 'নির্ধারিত হয়নি' : 'Not set')}</span>
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    percent >= 100
                      ? 'bg-emerald-100 text-emerald-800'
                      : percent >= 70
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {percent}%
                  </span>

                  {userRole === 'admin' && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal(company.id)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                        title={isBn ? 'সম্পাদনা করুন' : 'Edit Target'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {targetId && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTarget(targetId)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title={isBn ? 'মুছে ফেলুন' : 'Delete Target'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Mini progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${percent >= 100 ? 'bg-emerald-500' : percent >= 70 ? 'bg-indigo-600' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, percent)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-500">
                  {isBn ? 'অর্জিত:' : 'Achieved:'} <strong className="text-slate-900 font-bold">{formatBDT(sales)}</strong>
                </span>
                {target > 0 && (
                  <span className="text-slate-500">
                    {isBn ? 'বাকি:' : 'Remaining:'} <strong className="text-amber-700 font-bold">{formatBDT(remaining)}</strong>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Admin Target Set/Edit Modal ────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-600" />
                {isBn ? 'SR সেলস টার্গেট নির্ধারণ করুন' : 'Set SR Sales Target'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'সেলস অফিসার (SR)' : 'Sales Officer (SR)'}</label>
                <select
                  value={formSRName}
                  onChange={e => setFormSRName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                  required
                >
                  {srs.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'মাস' : 'Month'}</label>
                  <input
                    type="month"
                    value={formMonth}
                    onChange={e => setFormMonth(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'কোম্পানি / ব্র্যান্ড' : 'Company / Brand'}</label>
                  <select
                    value={formCompanyId}
                    onChange={e => setFormCompanyId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isBn ? 'মাসিক লক্ষ্যমাত্রা (টাকা)' : 'Monthly Target Amount (৳)'}</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formAmount}
                  onChange={e => setFormAmount(Number(e.target.value))}
                  placeholder="e.g. 500000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 focus:outline-none focus:border-indigo-500 text-sm"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-md shadow-rose-200"
                >
                  {isBn ? 'সেভ করুন' : 'Save Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
