'use client';

import React, { useMemo } from 'react';
import {
  ShoppingBag, CheckCircle, Clock, DollarSign,
  TrendingUp, Truck, Calendar, MapPin, Building2,
  ArrowRight, Award, AlertCircle, Sparkles, Plus, Wallet
} from 'lucide-react';
import type {
  Product, ChallanItem, SR, Route, CompanyBrand,
  SRAttendance, SRCollection, SRTarget
} from '../types';
import type { Language } from '../translations';
import { formatBDT, getLocalDateString, getChallanDate } from './dashboard/dashboardUtils';

interface SRDashboardProps {
  srName: string;
  srs: SR[];
  products: Product[];
  challans: ChallanItem[];
  routes: Route[];
  companies: CompanyBrand[];
  attendance: SRAttendance[];
  collections: SRCollection[];
  targets: SRTarget[];
  onNavigate: (tab: any, subTab?: string) => void;
  language: Language;
}

export default function SRDashboard({
  srName,
  srs,
  products,
  challans,
  routes,
  companies,
  attendance,
  collections,
  targets,
  onNavigate,
  language,
}: SRDashboardProps) {
  const isBn = language === 'bn';

  // ── Find Current SR object ──────────────────────────────────────────────────
  const currentSR = useMemo(() => {
    const norm = (srName || '').trim().toLowerCase();
    return srs.find(s => s.name.trim().toLowerCase() === norm);
  }, [srs, srName]);

  // Resolved primary company name
  const resolvedCompanyName = useMemo(() => {
    if (typeof window !== 'undefined') {
      const storedName = sessionStorage.getItem('erp_sr_company_name');
      if (storedName) return storedName;
    }
    if (currentSR?.companyName) return currentSR.companyName;
    if (currentSR?.companyId) {
      const comp = companies.find(c => c.id === currentSR.companyId || c.name.toLowerCase() === currentSR.companyId?.toLowerCase());
      if (comp) return comp.name;
    }
    if (currentSR?.assignedCompanyIds?.length) {
      const compId = currentSR.assignedCompanyIds[0];
      const comp = companies.find(c => c.id === compId || c.name.toLowerCase() === compId.toLowerCase());
      if (comp) return comp.name;
    }
    return companies[0]?.name || '';
  }, [currentSR, companies]);

  // Assigned companies
  const assignedCompanies = useMemo(() => {
    if (!currentSR || !currentSR.assignedCompanyIds?.length) {
      return resolvedCompanyName ? companies.filter(c => c.name.toLowerCase() === resolvedCompanyName.toLowerCase()) : companies;
    }
    return companies.filter(c => currentSR.assignedCompanyIds.includes(c.id) || (resolvedCompanyName && c.name.toLowerCase() === resolvedCompanyName.toLowerCase()));
  }, [currentSR, companies, resolvedCompanyName]);

  // Assigned route
  const assignedRoute = useMemo(() => {
    if (!currentSR) return null;
    return routes.find(r => r.assignedSRId === currentSR.id) || null;
  }, [currentSR, routes]);

  // Filter SR's challans (scoped strictly to SR + resolved Company)
  const srChallans = useMemo(() => {
    const norm = (srName || '').trim().toLowerCase();
    return challans.filter(ch => {
      const matchSR = (ch.srName || '').trim().toLowerCase() === norm;
      const matchCompany = !resolvedCompanyName || (ch.company || '').trim().toLowerCase() === resolvedCompanyName.trim().toLowerCase();
      return matchSR && matchCompany;
    });
  }, [challans, srName, resolvedCompanyName]);

  // Today's date string
  const todayStr = getLocalDateString(new Date());

  // Today's attendance record
  const todayAttendance = useMemo(() => {
    return attendance.find(a => (a.srName || '').trim().toLowerCase() === (srName || '').trim().toLowerCase() && a.date === todayStr);
  }, [attendance, srName, todayStr]);

  // Today's orders
  const todaysChallans = useMemo(() => {
    return srChallans.filter(ch => getChallanDate(ch.id, ch.createdAt) === todayStr);
  }, [srChallans, todayStr]);

  // Metrics
  const todaysSalesTotal = useMemo(() => {
    return todaysChallans.reduce((sum, ch) => sum + (ch.totalAmount || 0), 0);
  }, [todaysChallans]);

  const todaysUnitsSold = useMemo(() => {
    return todaysChallans.reduce((sum, ch) => sum + (ch.totalQty || ch.qty || 0), 0);
  }, [todaysChallans]);

  const todaysCollections = useMemo(() => {
    const norm = (srName || '').trim().toLowerCase();
    const todayCols = collections.filter(c => {
      const colDate = c.collectedAt ? getLocalDateString(new Date(c.collectedAt)) : '';
      return (c.srName || '').trim().toLowerCase() === norm && colDate === todayStr;
    });
    return todayCols.reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [collections, srName, todayStr]);

  const totalOutstandingDue = useMemo(() => {
    return srChallans
      .filter(ch => ch.status !== 'Delivered')
      .reduce((sum, ch) => sum + (ch.totalAmount || 0), 0);
  }, [srChallans]);

  // Current Month Target & Achievement
  const currentMonthKey = todayStr.substring(0, 7); // 'YYYY-MM'
  const monthlyTarget = useMemo(() => {
    const norm = (srName || '').trim().toLowerCase();
    const srTgt = targets.filter(t => {
      const matchSR = (t.srName || '').trim().toLowerCase() === norm;
      const matchMonth = t.month === currentMonthKey;
      const matchCompany = !resolvedCompanyName || (t.companyName || '').toLowerCase() === resolvedCompanyName.toLowerCase();
      return matchSR && matchMonth && matchCompany;
    });
    return srTgt.reduce((sum, t) => sum + (t.targetAmount || 0), 0);
  }, [targets, srName, currentMonthKey, resolvedCompanyName]);

  const monthlySales = useMemo(() => {
    return srChallans
      .filter(ch => {
        const d = getChallanDate(ch.id, ch.createdAt);
        return d.startsWith(currentMonthKey);
      })
      .reduce((sum, ch) => sum + (ch.totalAmount || 0), 0);
  }, [srChallans, currentMonthKey]);

  const targetPercent = monthlyTarget > 0 ? Math.min(100, Math.round((monthlySales / monthlyTarget) * 100)) : 0;

  // Recent 5 orders
  const recentOrders = useMemo(() => {
    return [...srChallans]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);
  }, [srChallans]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Hero Banner ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                {isBn ? 'সেলস অফিসার পোর্টাল' : 'Sales Officer Portal'}
              </span>
              {todayAttendance?.dayStart ? (
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {isBn ? 'ফিল্ডে সক্রিয়' : 'On Duty'}
                </span>
              ) : (
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {isBn ? 'দিনের কাজ শুরু হয়নি' : 'Day Not Started'}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isBn ? `স্বাগতম, ${srName || 'সেলস অফিসার'}` : `Welcome, ${srName || 'Sales Officer'}`}
            </h1>

            <p className="text-sm text-slate-300 max-w-xl">
              {isBn
                ? 'আপনার আজকের লক্ষ্যমাত্রা, নতুন অর্ডার বুকিং এবং কালেকশন ট্র্যাক করুন।'
                : 'Track your daily target achievements, book sales orders, and manage field collections.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                {new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
              {resolvedCompanyName && (
                <span className="flex items-center gap-1.5 bg-indigo-900/60 text-indigo-200 px-3 py-1.5 rounded-lg border border-indigo-700/60 font-bold">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  {isBn ? 'কোম্পানি: ' : 'Company: '} {resolvedCompanyName}
                </span>
              )}
              {assignedRoute && (
                <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {assignedRoute.name} ({assignedRoute.area})
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Group */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('sales')}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {isBn ? 'নতুন অর্ডার বুকিং' : 'New Order Booking'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('delivery')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4 text-emerald-400" />
              {isBn ? 'ডেলিভারি চালান' : 'Delivery Challans'}
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Metric Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Bookings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isBn ? 'আজকের বুকিং' : "Today's Orders"}
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{formatBDT(todaysSalesTotal)}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="font-bold text-purple-600">{todaysChallans.length}</span> {isBn ? 'টি অর্ডার' : 'orders'} ({todaysUnitsSold} {isBn ? 'পিস/কার্টুন' : 'units'})
            </p>
          </div>
        </div>

        {/* Today's Collections */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isBn ? 'আজকের কালেকশন' : "Today's Collection"}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-700">{formatBDT(todaysCollections)}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {isBn ? 'আজকের সংগৃহীত অর্থ' : 'Cash/bKash collected today'}
            </p>
          </div>
        </div>

        {/* Outstanding Dues */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isBn ? 'বকেয়া চালান' : 'Pending Dues'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-700">{formatBDT(totalOutstandingDue)}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {isBn ? 'ডেলিভারি/টাকা বাকি' : 'Undelivered/Unpaid orders'}
            </p>
          </div>
        </div>

        {/* Monthly Target Progress */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isBn ? 'মাসিক লক্ষ্যমাত্রা' : 'Monthly Target'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-black text-slate-900">{targetPercent}%</h3>
              <span className="text-xs text-slate-500 font-semibold">{formatBDT(monthlySales)} / {monthlyTarget > 0 ? formatBDT(monthlyTarget) : 'N/A'}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, targetPercent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Assigned Companies / Brands ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {isBn ? 'বরাদ্দকৃত কোম্পানি / ব্র্যান্ড' : 'Assigned Companies & Brands'}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {assignedCompanies.length} {isBn ? 'টি ব্র্যান্ড' : 'Brands'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {assignedCompanies.map((c) => {
            const companyProductCount = products.filter(p => p.company.trim().toLowerCase() === c.name.trim().toLowerCase()).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onNavigate('sales')}
                className="group flex flex-col p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                  {c.name}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  {companyProductCount} {isBn ? 'টি পণ্য' : 'Products'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Recent Orders Table ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900">
              {isBn ? 'সাম্প্রতিক বুকিং অর্ডার' : 'Recent Booked Orders'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('delivery')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
          >
            {isBn ? 'সব দেখুন' : 'View All'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            {isBn ? 'কোনো সাম্প্রতিক অর্ডার নেই। নতুন অর্ডার বুকিং করুন।' : 'No recent orders found. Book a new sales order.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">{isBn ? 'চালান নং / তারিখ' : 'Challan / Date'}</th>
                  <th className="py-3 px-3">{isBn ? 'পণ্য' : 'Product'}</th>
                  <th className="py-3 px-3">{isBn ? 'পরিমাণ' : 'Qty'}</th>
                  <th className="py-3 px-3">{isBn ? 'মোট মূল্য' : 'Amount'}</th>
                  <th className="py-3 px-3">{isBn ? 'অবস্থা' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((ch) => {
                  const dateStr = getChallanDate(ch.id, ch.createdAt);
                  return (
                    <tr key={ch.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-800 block">{ch.id}</span>
                        <span className="text-[11px] text-slate-400">{dateStr}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block truncate max-w-[200px]">{ch.productName}</span>
                        <span className="text-[10px] text-slate-400">{ch.company}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {ch.totalQty || ch.qty}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {formatBDT(ch.totalAmount)}
                      </td>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
