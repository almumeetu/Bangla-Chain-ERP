'use client';

import React, { useState, useMemo } from 'react';
import {
  Users, UserCheck, Truck, Search, Filter, Building2, Phone,
  Edit3, Trash2, Plus, X, ChevronDown, ChevronUp, AlertCircle, Copy, Check,
  Grid, List, Briefcase, ShieldCheck, Smartphone, Layers, BadgeCheck, PhoneCall
} from 'lucide-react';
import { SR, DeliveryMan, CompanyBrand } from '../types';
import { Language } from '../translations';
import { Customer } from '../lib/localStore';

interface PersonnelManagementProps {
  srs: SR[];
  deliveryMen: DeliveryMan[];
  companies: CompanyBrand[];
  customers: Customer[];
  language: Language;
  mode?: 'sr-only' | 'dsr-only' | 'both';
  onAddSR: () => void;
  onEditSR: (sr: SR) => void;
  onDeleteSR: (id: string) => void;
  onAddDM: () => void;
  onEditDM: (dm: DeliveryMan) => void;
  onDeleteDM: (id: string) => void;
}

type PersonnelTab = 'sr' | 'dsr';
type ViewLayout = 'cards' | 'table';
type GroupingMode = 'company' | 'flat';

const COMPANY_THEMES = [
  { border: 'border-blue-200',    bgHeader: 'bg-gradient-to-r from-blue-50/90 to-indigo-50/30', badge: 'bg-blue-100/90 text-blue-700 border-blue-200', icon: 'text-blue-600', avatarBg: 'bg-blue-50 text-blue-700 ring-blue-100/70' },
  { border: 'border-emerald-200', bgHeader: 'bg-gradient-to-r from-emerald-50/90 to-teal-50/30', badge: 'bg-emerald-100/90 text-emerald-700 border-emerald-200', icon: 'text-emerald-600', avatarBg: 'bg-emerald-50 text-emerald-750 ring-emerald-100/70' },
  { border: 'border-purple-200',  bgHeader: 'bg-gradient-to-r from-purple-50/90 to-violet-50/30', badge: 'bg-purple-100/90 text-purple-700 border-purple-200', icon: 'text-purple-600', avatarBg: 'bg-purple-50 text-purple-750 ring-purple-100/70' },
  { border: 'border-amber-200',   bgHeader: 'bg-gradient-to-r from-amber-50/90 to-orange-50/30', badge: 'bg-amber-100/90 text-amber-700 border-amber-200', icon: 'text-amber-600', avatarBg: 'bg-amber-50 text-amber-750 ring-amber-100/70' },
  { border: 'border-rose-200',    bgHeader: 'bg-gradient-to-r from-rose-50/90 to-pink-50/30', badge: 'bg-rose-100/90 text-rose-700 border-rose-200', icon: 'text-rose-600', avatarBg: 'bg-rose-50 text-rose-750 ring-rose-100/70' },
  { border: 'border-cyan-200',    bgHeader: 'bg-gradient-to-r from-cyan-50/90 to-sky-50/30', badge: 'bg-cyan-100/90 text-cyan-700 border-cyan-200', icon: 'text-cyan-600', avatarBg: 'bg-cyan-50 text-cyan-750 ring-cyan-100/70' },
];

const getShortCompanyName = (fullName: string): string => {
  if (!fullName) return '';
  const lower = fullName.toLowerCase();
  if (lower.includes('pran')) return 'Pran';
  if (lower.includes('cocola')) return 'Cocola';
  if (lower.includes('abul khair')) return 'Abul Khair';
  if (lower.includes('olympic')) return 'Olympic';
  if (lower.includes('haque')) return 'Haque';

  let cleaned = fullName
    .replace(/(?:dairy|food|products|industries|ltd|limited|group)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = cleaned.split(' ');
  if (words.length > 2) {
    return words.slice(0, 2).join(' ');
  }
  return cleaned || fullName;
};

export default function PersonnelManagement({
  srs,
  deliveryMen,
  companies,
  customers,
  language,
  mode = 'both',
  onAddSR,
  onEditSR,
  onDeleteSR,
  onAddDM,
  onEditDM,
  onDeleteDM
}: PersonnelManagementProps) {
  const bn = language === 'bn';

  // State
  const [activeTab, setActiveTab] = useState<PersonnelTab>(
    mode === 'dsr-only' ? 'dsr' : 'sr'
  );
  const [viewLayout, setViewLayout] = useState<ViewLayout>('cards');
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('company');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [collapsedCompanies, setCollapsedCompanies] = useState<Record<string, boolean>>({});
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Dynamic titles
  const getTitle = () => {
    if (mode === 'sr-only') return bn ? 'সেলস অফিসার (SR)' : 'Sales Officers (SR)';
    if (mode === 'dsr-only') return bn ? 'ডেলিভারি পার্সোনেল' : 'Delivery Personnel';
    return bn ? 'ফিল্ড ফোর্স ও ডেলিভারি টিম' : 'Field Force & Delivery Operations';
  };

  const getSubtitle = () => {
    if (mode === 'sr-only') return bn ? 'আন্তর্জাতিক মানের সেলস অফিসার ও টেরিটরি ডিরেক্টরি' : 'Sales Representative Directory & Territory Assignment';
    if (mode === 'dsr-only') return bn ? 'ডেলিভারি রাইডার ও ডিস্ট্রিবিউশন লজিস্টিকস রাইডার' : 'Delivery Driver & Dispatch Fleet Directory';
    return bn ? 'এন্টারপ্রাইজ ফিল্ড ফোর্স ডিরেক্টরি ও অপস কেন্দ্র' : 'Enterprise Field Force Personnel Directory';
  };

  const t = {
    title: getTitle(),
    subtitle: getSubtitle(),
    totalPersonnel: bn ? 'মোট ফিল্ড স্টাফ' : 'Total Field Staff',
    salesReps: bn ? 'সেলস অফিসার (SR)' : 'Sales Officers',
    deliveryAgents: bn ? 'ডেলিভারি রাইডার (DSR)' : 'Delivery Drivers',
    unassigned: bn ? 'বরাদ্দহীন স্টাফ' : 'Unassigned Staff',
    searchPlaceholder: bn ? 'নাম, মোবাইল বা গাড়ি দিয়ে স্টাফ খুঁজুন...' : 'Search personnel by name, phone, company...',
    allCompanies: bn ? 'সকল কোম্পানি' : 'All Companies',
    clearFilters: bn ? 'ফিল্টার মুছুন' : 'Reset Filters',
    addPersonnel: bn ? 'নতুন কর্মকর্তা যোগ করুন' : 'Add Field Staff',
    serialNo: bn ? 'ক্রমিক' : 'S/N',
    name: bn ? 'স্টাফ নাম ও বিবরণ' : 'Staff Member',
    contact: bn ? 'যোগাযোগ' : 'Contact',
    vehicle: bn ? 'যানবাহন' : 'Vehicle / Asset',
    actions: bn ? 'অ্যাকশন' : 'Actions',
    edit: bn ? 'এডিট' : 'Edit',
    delete: bn ? 'ডিলিট' : 'Delete',
    noResults: bn ? 'কোনো কর্মী পাওয়া যায়নি' : 'No field personnel match criteria',
    tryDifferentFilters: bn ? 'অন্য ফিল্টার বা সার্চ কিওয়ার্ড ব্যবহার করুন' : 'Try searching with a different term or company filter',
    assignedCompanies: bn ? 'নির্ধারিত কোম্পানি' : 'Assigned Companies',
  };

  // Helper to map company ID or name to human-readable Company Name
  const getCompanyDisplayName = React.useCallback((idOrName: string) => {
    if (!idOrName || idOrName === 'Unassigned') return 'Unassigned';
    const found = companies.find(
      c => c.id === idOrName || c.name.toLowerCase() === idOrName.toLowerCase()
    );
    return found ? found.name : idOrName;
  }, [companies]);

  // Calculate stats
  const totalSRs = srs.length;
  const totalDSRs = deliveryMen.length;
  const totalPersonnel = totalSRs + totalDSRs;
  const unassignedSRs = srs.filter(sr => !sr.assignedCompanyIds || sr.assignedCompanyIds.length === 0).length;
  const unassignedDSRs = deliveryMen.filter(dm => !dm.assignedCompanyIds || dm.assignedCompanyIds.length === 0).length;

  // Filter SRs
  const filteredSRs = useMemo(() => {
    return srs.filter(sr => {
      const matchesSearch = !searchQuery || 
        sr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sr.phone && sr.phone.includes(searchQuery)) ||
        (sr.loginUsername && sr.loginUsername.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const srCompanies = (sr.assignedCompanyIds || []).map(getCompanyDisplayName);
      const targetFilter = getCompanyDisplayName(companyFilter);
      
      const matchesCompany = companyFilter === 'All' ||
        (companyFilter === 'Unassigned' 
          ? (!sr.assignedCompanyIds || sr.assignedCompanyIds.length === 0)
          : srCompanies.includes(targetFilter) || (sr.assignedCompanyIds || []).includes(companyFilter));
      
      return matchesSearch && matchesCompany;
    });
  }, [srs, searchQuery, companyFilter, getCompanyDisplayName]);

  // Filter Delivery Men
  const filteredDMs = useMemo(() => {
    return deliveryMen.filter(dm => {
      const matchesSearch = !searchQuery || 
        dm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dm.phone && dm.phone.includes(searchQuery)) ||
        (dm.vehicle && dm.vehicle.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const dmCompanies = (dm.assignedCompanyIds || []).map(getCompanyDisplayName);
      const targetFilter = getCompanyDisplayName(companyFilter);

      const matchesCompany = companyFilter === 'All' ||
        (companyFilter === 'Unassigned'
          ? (!dm.assignedCompanyIds || dm.assignedCompanyIds.length === 0)
          : dmCompanies.includes(targetFilter) || (dm.assignedCompanyIds || []).includes(companyFilter));
      
      return matchesSearch && matchesCompany;
    });
  }, [deliveryMen, searchQuery, companyFilter, getCompanyDisplayName]);

  // Group by company
  const groupedSRs = useMemo(() => {
    const groups: Record<string, SR[]> = {};
    filteredSRs.forEach(sr => {
      const rawList = sr.assignedCompanyIds && sr.assignedCompanyIds.length > 0
        ? sr.assignedCompanyIds
        : ['Unassigned'];
      
      const displayNames = Array.from(new Set(rawList.map(getCompanyDisplayName)));

      displayNames.forEach(compName => {
        if (!groups[compName]) groups[compName] = [];
        if (!groups[compName].some(existing => existing.id === sr.id)) {
          groups[compName].push(sr);
        }
      });
    });
    return groups;
  }, [filteredSRs, getCompanyDisplayName]);

  const groupedDMs = useMemo(() => {
    const groups: Record<string, DeliveryMan[]> = {};
    filteredDMs.forEach(dm => {
      const rawList = dm.assignedCompanyIds && dm.assignedCompanyIds.length > 0
        ? dm.assignedCompanyIds
        : ['Unassigned'];
      
      const displayNames = Array.from(new Set(rawList.map(getCompanyDisplayName)));

      displayNames.forEach(compName => {
        if (!groups[compName]) groups[compName] = [];
        if (!groups[compName].some(existing => existing.id === dm.id)) {
          groups[compName].push(dm);
        }
      });
    });
    return groups;
  }, [filteredDMs, getCompanyDisplayName]);

  const toggleCompanyCollapse = (companyName: string) => {
    setCollapsedCompanies(prev => ({
      ...prev,
      [companyName]: !prev[companyName]
    }));
  };

  // Copy phone handler
  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Helper for Initials Avatar
  const getInitials = (name: string) => {
    if (!name) return 'SR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };



  const getCompanyTheme = (companyName: string) => {
    if (companyName === 'Unassigned') return {
      border: 'border-slate-200', bgHeader: 'bg-slate-50', badge: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: 'text-slate-400', avatar: 'from-slate-600 to-slate-800'
    };
    const resolvedName = getCompanyDisplayName(companyName);
    const idx = companies.findIndex(c => c.name.toLowerCase() === resolvedName.toLowerCase() || c.id === companyName);
    const charCode = resolvedName ? resolvedName.charCodeAt(0) : 0;
    return COMPANY_THEMES[(idx >= 0 ? idx : charCode) % COMPANY_THEMES.length];
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCompanyFilter('All');
  };

  const hasActiveFilters = searchQuery !== '' || companyFilter !== 'All';

  const renderSRCompanyGroup = (companyName: string, compSRs: SR[]) => {
    const isCollapsed = collapsedCompanies[companyName];
    const isUnassigned = companyName === 'Unassigned';
    const theme = getCompanyTheme(companyName);
    return (
      <div 
        key={companyName}
        className={`bg-white border ${theme.border} border-l-4 rounded-none shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden`}
      >
        {/* Company Section Header */}
        <div
          onClick={() => toggleCompanyCollapse(companyName)}
          className={`px-5 py-4 border-b ${theme.border} flex items-center justify-between cursor-pointer select-none transition-colors ${theme.bgHeader}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-white text-slate-800 border border-slate-200/80 flex items-center justify-center shadow-2xs font-extrabold text-sm shrink-0">
              {companyName[0].toUpperCase()}
            </div>
            <div>
              <h3 className={`font-black text-xs uppercase tracking-wider ${
                isUnassigned ? 'text-slate-500 italic' : 'text-slate-900'
              }`}>
                {companyName}
              </h3>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                {compSRs.length} {bn ? 'জন রেজিস্টার্ড অফিসার' : 'Assigned Officers'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-none border ${theme.badge}`}>
              {compSRs.length} SR
            </span>
            <div className={`w-7 h-7 rounded-none flex items-center justify-center ${theme.icon}`}>
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Body: Cards or Mini Table */}
        {!isCollapsed && (
          <div className="p-4 bg-slate-50/40">
            {viewLayout === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {compSRs.map(sr => (
                  <SRCard 
                    key={sr.id} 
                    sr={sr} 
                    companies={companies} 
                    getCompanyDisplayName={getCompanyDisplayName}
                    copiedPhone={copiedPhone}
                    onCopyPhone={handleCopyPhone}
                    onEdit={() => onEditSR(sr)}
                    onDelete={() => onDeleteSR(sr.id)}
                    language={language}
                    hideAssignedCompanies={true}
                  />
                ))}
              </div>
            ) : (
              <SRTableView 
                srs={compSRs}
                companies={companies}
                getCompanyDisplayName={getCompanyDisplayName}
                copiedPhone={copiedPhone}
                onCopyPhone={handleCopyPhone}
                onEdit={onEditSR}
                onDelete={onDeleteSR}
                language={language}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDMCompanyGroup = (companyName: string, compDMs: DeliveryMan[]) => {
    const isCollapsed = collapsedCompanies[companyName];
    const isUnassigned = companyName === 'Unassigned';
    const theme = getCompanyTheme(companyName);
    return (
      <div 
        key={companyName}
        className={`bg-white border ${theme.border} border-l-4 rounded-none shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden`}
      >
        {/* Company Section Header */}
        <div
          onClick={() => toggleCompanyCollapse(companyName)}
          className={`px-5 py-4 border-b ${theme.border} flex items-center justify-between cursor-pointer select-none transition-colors ${theme.bgHeader}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-white text-slate-800 border border-slate-200/80 flex items-center justify-center shadow-2xs font-extrabold text-sm shrink-0">
              {companyName[0].toUpperCase()}
            </div>
            <div>
              <h3 className={`font-black text-xs uppercase tracking-wider ${
                isUnassigned ? 'text-slate-500 italic' : 'text-slate-900'
              }`}>
                {companyName}
              </h3>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                {compDMs.length} {bn ? 'জন ডেলিভারি রাইডার' : 'Delivery Drivers'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-none border ${theme.badge}`}>
              {compDMs.length} DSR
            </span>
            <div className={`w-7 h-7 rounded-none flex items-center justify-center ${theme.icon}`}>
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Body: Cards or Mini Table */}
        {!isCollapsed && (
          <div className="p-4 bg-slate-50/40">
            {viewLayout === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {compDMs.map(dm => (
                  <DMCard 
                    key={dm.id} 
                    dm={dm} 
                    companies={companies} 
                    getCompanyDisplayName={getCompanyDisplayName}
                    copiedPhone={copiedPhone}
                    onCopyPhone={handleCopyPhone}
                    onEdit={() => onEditDM(dm)}
                    onDelete={() => onDeleteDM(dm.id)}
                    language={language}
                    hideAssignedCompanies={true}
                  />
                ))}
              </div>
            ) : (
              <DMTableView 
                dms={compDMs}
                companies={companies}
                getCompanyDisplayName={getCompanyDisplayName}
                copiedPhone={copiedPhone}
                onCopyPhone={handleCopyPhone}
                onEdit={onEditDM}
                onDelete={onDeleteDM}
                language={language}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">


      {/* ── International ERP KPI Dashboard Bar ── */}
      {mode === 'both' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Staff */}
          <div className="bg-white border border-slate-200/90 rounded-none p-5 shadow-xs hover:shadow-md transition-all duration-300 relative group overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t.totalPersonnel}</span>
              <div className="w-9 h-9 rounded-none bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                <Users className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-slate-900 tracking-tight">{totalPersonnel}</div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-none bg-emerald-500" />
              <span className="text-[10px] font-semibold text-slate-500">{bn ? 'সক্রিয় ফিল্ড সদস্য' : 'Active field workforce'}</span>
            </div>
          </div>

          {/* Sales Officers */}
          <div 
            onClick={() => setActiveTab('sr')}
            className={`bg-white border rounded-none p-5 shadow-xs hover:shadow-md transition-all duration-300 relative group cursor-pointer overflow-hidden ${
              activeTab === 'sr' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">{t.salesReps}</span>
              <div className="w-9 h-9 rounded-none bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                <UserCheck className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-blue-600 tracking-tight">{totalSRs}</div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-none border border-blue-200/60">
                {bn ? 'অর্ডার বুকিং টিম' : 'Order booking force'}
              </span>
            </div>
          </div>

          {/* Delivery Staff */}
          <div 
            onClick={() => setActiveTab('dsr')}
            className={`bg-white border rounded-none p-5 shadow-xs hover:shadow-md transition-all duration-300 relative group cursor-pointer overflow-hidden ${
              activeTab === 'dsr' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest">{t.deliveryAgents}</span>
              <div className="w-9 h-9 rounded-none bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                <Truck className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-emerald-600 tracking-tight">{totalDSRs}</div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-none border border-emerald-200/60">
                {bn ? 'লজিস্টিকস ও চালান ডেলিভারি' : 'Logistics & delivery fleet'}
              </span>
            </div>
          </div>

          {/* Unassigned */}
          <div className="bg-white border border-slate-200/90 rounded-none p-5 shadow-xs hover:shadow-md transition-all duration-300 relative group overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest">{t.unassigned}</span>
              <div className="w-9 h-9 rounded-none bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                <AlertCircle className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-amber-600 tracking-tight">{unassignedSRs + unassignedDSRs}</div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-none border border-amber-200/60">
                {bn ? 'কোম্পানি ট্যাগ ফাঁকা' : 'Needs company mapping'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── International ERP Control Toolbar (Tab, Search, View Controls) ── */}
      <div className="bg-white border border-slate-200/90 rounded-none p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Role Tab Switcher (SR vs DSR) */}
          {mode === 'both' && (
            <div className="bg-slate-100/90 p-1.5 rounded-none flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setActiveTab('sr')}
                className={`px-5 py-2.5 rounded-none text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'sr'
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <UserCheck className={`w-4 h-4 ${activeTab === 'sr' ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{t.salesReps} ({totalSRs})</span>
              </button>
              <button
                onClick={() => setActiveTab('dsr')}
                className={`px-5 py-2.5 rounded-none text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'dsr'
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Truck className={`w-4 h-4 ${activeTab === 'dsr' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{t.deliveryAgents} ({totalDSRs})</span>
              </button>
            </div>
          )}

          {/* Controls: Search, Company Filter, Grouping & Layout Switcher */}
          <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-none text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-slate-800 transition-all placeholder:text-slate-400"
              />
            </div>



            {/* Grouping Mode Switcher */}
            {viewLayout === 'cards' && (
              <div className="bg-slate-100 p-1 rounded-none flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setGroupingMode('company')}
                className={`px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  groupingMode === 'company'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Group by Company Brand"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">{bn ? 'কোম্পানি গ্রুপিং' : 'By Company'}</span>
              </button>
              <button
                type="button"
                onClick={() => setGroupingMode('flat')}
                className={`px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  groupingMode === 'flat'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Master Flat Directory"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">{bn ? 'একক তালিকা' : 'Master List'}</span>
              </button>
            </div>
            )}

            {/* View Layout Switcher (Cards vs Table) */}
            <div className="bg-slate-100 p-1 rounded-none flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewLayout('cards')}
                className={`p-2 rounded-none text-xs transition-all cursor-pointer ${
                  viewLayout === 'cards'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Card Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('table')}
                className={`p-2 rounded-none text-xs transition-all cursor-pointer ${
                  viewLayout === 'table'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Data Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="h-10 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-none transition-all cursor-pointer shrink-0 flex items-center gap-1 border border-rose-200/60"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t.clearFilters}</span>
              </button>
            )}

            <button
              type="button"
              onClick={activeTab === 'sr' ? onAddSR : onAddDM}
              className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-none transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer shrink-0 border border-indigo-500"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addPersonnel}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Company Tabs Switcher ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
        <button
          onClick={() => setCompanyFilter('All')}
          className={`px-4 py-2.5 rounded-none text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
            companyFilter === 'All'
              ? 'bg-slate-900 border-slate-950 text-white shadow-sm'
              : 'bg-white border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          {bn ? 'সকল কোম্পানি' : 'All Companies'}
        </button>
        {companies.map(c => {
          const resolvedName = getCompanyDisplayName(c.id);
          const companyIdx = companies.findIndex(comp => comp.name.toLowerCase() === resolvedName.toLowerCase() || comp.id === c.id);
          const charCode = resolvedName ? resolvedName.charCodeAt(0) : 0;
          const themeIdx = (companyIdx >= 0 ? companyIdx : charCode) % COMPANY_THEMES.length;
          
          const activeStyles = [
            'bg-blue-600 border-blue-700 text-white shadow-sm',
            'bg-emerald-600 border-emerald-700 text-white shadow-sm',
            'bg-purple-600 border-purple-700 text-white shadow-sm',
            'bg-amber-600 border-amber-700 text-white shadow-sm',
            'bg-rose-600 border-rose-700 text-white shadow-sm',
            'bg-cyan-600 border-cyan-700 text-white shadow-sm',
          ];
          const activeClass = activeStyles[themeIdx];
          const isSelected = companyFilter === c.name || companyFilter === c.id;

          return (
            <button
              key={c.id}
              onClick={() => setCompanyFilter(c.name)}
              className={`px-4 py-2.5 rounded-none text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                isSelected
                  ? activeClass
                  : 'bg-white border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {getShortCompanyName(c.name)}
            </button>
          );
        })}
        <button
          onClick={() => setCompanyFilter('Unassigned')}
          className={`px-4 py-2.5 rounded-none text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
            companyFilter === 'Unassigned'
              ? 'bg-amber-600 border-amber-700 text-white shadow-sm'
              : 'bg-white border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          {bn ? 'বরাদ্দহীন' : 'Unassigned'}
        </button>
      </div>

      {/* ── PERSONNEL DIRECTORY CONTENT ── */}
      {activeTab === 'sr' ? (
        // ── SR TAB CONTENT ──
        filteredSRs.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-none p-16 text-center shadow-xs">
            <div className="w-16 h-16 rounded-none bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
              <UserCheck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800 mb-1">{t.noResults}</h3>
            <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">{t.tryDifferentFilters}</p>
          </div>
        ) : (groupingMode === 'company' && viewLayout === 'cards') ? (
          // ── GROUPED BY COMPANY VIEW ──
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <div className="space-y-5">
              {Object.entries(groupedSRs)
                .filter((_, idx) => idx % 2 === 0)
                .map(([companyName, compSRs]) => renderSRCompanyGroup(companyName, compSRs))}
            </div>
            <div className="space-y-5">
              {Object.entries(groupedSRs)
                .filter((_, idx) => idx % 2 === 1)
                .map(([companyName, compSRs]) => renderSRCompanyGroup(companyName, compSRs))}
            </div>
          </div>
        ) : (
          // ── FLAT MASTER LIST VIEW ──
          <div className="bg-white border border-slate-200/90 rounded-none p-5 shadow-xs">
            {viewLayout === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSRs.map(sr => (
                  <SRCard 
                    key={sr.id} 
                    sr={sr} 
                    companies={companies} 
                    getCompanyDisplayName={getCompanyDisplayName}
                    copiedPhone={copiedPhone}
                    onCopyPhone={handleCopyPhone}
                    onEdit={() => onEditSR(sr)}
                    onDelete={() => onDeleteSR(sr.id)}
                    language={language}
                  />
                ))}
              </div>
            ) : (
              <SRTableView 
                srs={filteredSRs}
                companies={companies}
                getCompanyDisplayName={getCompanyDisplayName}
                copiedPhone={copiedPhone}
                onCopyPhone={handleCopyPhone}
                onEdit={onEditSR}
                onDelete={onDeleteSR}
                language={language}
              />
            )}
          </div>
        )
      ) : (
        // ── DSR TAB CONTENT ──
        filteredDMs.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-none p-16 text-center shadow-xs">
            <div className="w-16 h-16 rounded-none bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800 mb-1">{t.noResults}</h3>
            <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">{t.tryDifferentFilters}</p>
          </div>
        ) : (groupingMode === 'company' && viewLayout === 'cards') ? (
          // ── DSR GROUPED BY COMPANY VIEW ──
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <div className="space-y-5">
              {Object.entries(groupedDMs)
                .filter((_, idx) => idx % 2 === 0)
                .map(([companyName, compDMs]) => renderDMCompanyGroup(companyName, compDMs))}
            </div>
            <div className="space-y-5">
              {Object.entries(groupedDMs)
                .filter((_, idx) => idx % 2 === 1)
                .map(([companyName, compDMs]) => renderDMCompanyGroup(companyName, compDMs))}
            </div>
          </div>
        ) : (
          // ── DSR FLAT MASTER LIST VIEW ──
          <div className="bg-white border border-slate-200/90 rounded-none p-5 shadow-xs">
            {viewLayout === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDMs.map(dm => (
                  <DMCard 
                    key={dm.id} 
                    dm={dm} 
                    companies={companies} 
                    getCompanyDisplayName={getCompanyDisplayName}
                    copiedPhone={copiedPhone}
                    onCopyPhone={handleCopyPhone}
                    onEdit={() => onEditDM(dm)}
                    onDelete={() => onDeleteDM(dm.id)}
                    language={language}
                  />
                ))}
              </div>
            ) : (
              <DMTableView 
                dms={filteredDMs}
                companies={companies}
                getCompanyDisplayName={getCompanyDisplayName}
                copiedPhone={copiedPhone}
                onCopyPhone={handleCopyPhone}
                onEdit={onEditDM}
                onDelete={onDeleteDM}
                language={language}
              />
            )}
          </div>
        )
      )}
    </div>
  );
}

// ── SUB-COMPONENT: International ERP SR Card ───────────────────────────
interface SRCardProps {
  sr: SR;
  companies: CompanyBrand[];
  getCompanyDisplayName: (id: string) => string;
  copiedPhone: string | null;
  onCopyPhone: (phone: string, e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  language: Language;
  hideAssignedCompanies?: boolean;
}

function SRCard({ sr, companies, getCompanyDisplayName, copiedPhone, onCopyPhone, onEdit, onDelete, language, hideAssignedCompanies }: SRCardProps) {
  const bn = language === 'bn';
  const assignedCompanyNames = Array.from(new Set((sr.assignedCompanyIds || []).map(getCompanyDisplayName)));
  const initials = sr.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const primaryCompany = sr.assignedCompanyIds?.[0] || 'Unassigned';
  const resolvedName = getCompanyDisplayName(primaryCompany);
  const companyIdx = companies.findIndex(c => c.name.toLowerCase() === resolvedName.toLowerCase() || c.id === primaryCompany);
  const charCode = resolvedName ? resolvedName.charCodeAt(0) : 0;
  const theme = primaryCompany === 'Unassigned' 
    ? { avatarBg: 'bg-slate-100 text-slate-700 ring-slate-200/50' }
    : COMPANY_THEMES[(companyIdx >= 0 ? companyIdx : charCode) % COMPANY_THEMES.length];

  return (
    <div className="bg-white border border-slate-200/90 rounded-none p-4 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top bar: Avatar + Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-none ${theme.avatarBg} font-extrabold text-sm flex items-center justify-center shrink-0 ring-4 relative`}>
              <span className="absolute inset-0 rounded-none bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              {initials}
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                {sr.name}
              </h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-none border border-indigo-200/60 mt-1">
                <BadgeCheck className="w-3 h-3 text-indigo-500" />
                {bn ? 'সেলস অফিসার (SR)' : 'Sales Officer (SR)'}
              </span>
            </div>
          </div>

          <span className="w-2.5 h-2.5 rounded-none bg-emerald-500 ring-4 ring-emerald-50 shrink-0 mt-1" title="Active Personnel" />
        </div>

        {/* Assigned Companies Chips */}
        {!hideAssignedCompanies && (
          <div className="space-y-1 mb-3">
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{bn ? 'অ্যাসাইনড কোম্পানি:' : 'Assigned Companies:'}</p>
            <div className="flex flex-wrap gap-1">
              {assignedCompanyNames.length > 0 ? (
                assignedCompanyNames.map(cName => {
                  const compIdx = companies.findIndex(c => c.name.toLowerCase() === cName.toLowerCase() || c.id === cName);
                  const charCode = cName ? cName.charCodeAt(0) : 0;
                  const cTheme = compIdx >= 0 || cName !== 'Unassigned'
                    ? COMPANY_THEMES[(compIdx >= 0 ? compIdx : charCode) % COMPANY_THEMES.length]
                    : { badge: 'bg-slate-100 text-slate-700 border-slate-200/70' };
                  return (
                    <span key={cName} className={`px-2 py-0.5 rounded-none text-[10px] font-bold border ${cTheme.badge}`}>
                      {cName}
                    </span>
                  );
                })
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 italic">Unassigned</span>
              )}
            </div>
          </div>
        )}

        {/* Mobile Contact Box */}
        {sr.phone && (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/70 rounded-none px-2.5 py-1.5 mb-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-mono font-semibold text-[11px]">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{sr.phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => onCopyPhone(sr.phone, e)}
                className="p-1 hover:bg-slate-200 rounded-none text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Copy phone number"
              >
                {copiedPhone === sr.phone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
              <a
                href={`tel:${sr.phone}`}
                onClick={e => e.stopPropagation()}
                className="p-1 hover:bg-blue-100 rounded-none text-blue-600 transition-colors cursor-pointer"
                title="Call Phone"
              >
                <PhoneCall className="w-3 h-3 text-blue-600" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[10px] font-semibold text-slate-400 font-mono">ID: {sr.id}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-none transition-colors cursor-pointer"
            title="Edit Officer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
            title="Delete Officer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SUB-COMPONENT: International ERP DSR Card ───────────────────────────
interface DMCardProps {
  dm: DeliveryMan;
  companies: CompanyBrand[];
  getCompanyDisplayName: (id: string) => string;
  copiedPhone: string | null;
  onCopyPhone: (phone: string, e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  language: Language;
  hideAssignedCompanies?: boolean;
}

function DMCard({ dm, companies, getCompanyDisplayName, copiedPhone, onCopyPhone, onEdit, onDelete, language, hideAssignedCompanies }: DMCardProps) {
  const bn = language === 'bn';
  const assignedCompanyNames = Array.from(new Set((dm.assignedCompanyIds || []).map(getCompanyDisplayName)));
  const initials = dm.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const primaryCompany = dm.assignedCompanyIds?.[0] || 'Unassigned';
  const resolvedName = getCompanyDisplayName(primaryCompany);
  const companyIdx = companies.findIndex(c => c.name.toLowerCase() === resolvedName.toLowerCase() || c.id === primaryCompany);
  const charCode = resolvedName ? resolvedName.charCodeAt(0) : 0;
  const theme = primaryCompany === 'Unassigned' 
    ? { avatarBg: 'bg-slate-100 text-slate-700 ring-slate-200/50' }
    : COMPANY_THEMES[(companyIdx >= 0 ? companyIdx : charCode) % COMPANY_THEMES.length];

  return (
    <div className="bg-white border border-slate-200/90 rounded-none p-4 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top bar: Avatar + Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-none ${theme.avatarBg} font-extrabold text-sm flex items-center justify-center shrink-0 ring-4 relative`}>
              <span className="absolute inset-0 rounded-none bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              {initials}
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">
                {dm.name}
              </h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-none border border-emerald-200/60 mt-1">
                <Truck className="w-3 h-3 text-emerald-600" />
                {bn ? 'ডেলিভারি রাইডার' : 'Delivery Driver'}
              </span>
            </div>
          </div>

          <span className="w-2.5 h-2.5 rounded-none bg-emerald-500 ring-4 ring-emerald-50 shrink-0 mt-1" title="Active Logistics Driver" />
        </div>

        {/* Assigned Companies Chips */}
        {!hideAssignedCompanies && (
          <div className="space-y-1 mb-3">
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{bn ? 'অ্যাসাইনড কোম্পানি:' : 'Assigned Companies:'}</p>
            <div className="flex flex-wrap gap-1">
              {assignedCompanyNames.length > 0 ? (
                assignedCompanyNames.map(cName => {
                  const compIdx = companies.findIndex(c => c.name.toLowerCase() === cName.toLowerCase() || c.id === cName);
                  const charCode = cName ? cName.charCodeAt(0) : 0;
                  const cTheme = compIdx >= 0 || cName !== 'Unassigned'
                    ? COMPANY_THEMES[(compIdx >= 0 ? compIdx : charCode) % COMPANY_THEMES.length]
                    : { badge: 'bg-slate-100 text-slate-700 border-slate-200/70' };
                  return (
                    <span key={cName} className={`px-2 py-0.5 rounded-none text-[10px] font-bold border ${cTheme.badge}`}>
                      {cName}
                    </span>
                  );
                })
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 italic">Unassigned</span>
              )}
            </div>
          </div>
        )}

        {/* Vehicle Info */}
        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-none px-2.5 py-1.5 mb-3 flex items-center justify-between text-xs">
          <span className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider">{bn ? 'যানবাহন:' : 'Vehicle:'}</span>
          <span className="font-bold text-emerald-900 text-[11px] truncate max-w-[140px]">{dm.vehicle || 'Not Assigned'}</span>
        </div>

        {/* Mobile Contact Box */}
        {dm.phone && (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/70 rounded-none px-2.5 py-1.5 mb-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-mono font-semibold text-[11px]">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{dm.phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => onCopyPhone(dm.phone, e)}
                className="p-1 hover:bg-slate-200 rounded-none text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Copy phone number"
              >
                {copiedPhone === dm.phone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
              <a
                href={`tel:${dm.phone}`}
                onClick={e => e.stopPropagation()}
                className="p-1 hover:bg-emerald-100 rounded-none text-emerald-600 transition-colors cursor-pointer"
                title="Call Phone"
              >
                <PhoneCall className="w-3 h-3 text-emerald-600" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[10px] font-semibold text-slate-400 font-mono">ID: {dm.id}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-none transition-colors cursor-pointer"
            title="Edit Delivery Driver"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
            title="Delete Delivery Driver"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SUB-COMPONENT: SR Enterprise Table View ────────────────────────────
interface SRTableViewProps {
  srs: SR[];
  companies: CompanyBrand[];
  getCompanyDisplayName: (id: string) => string;
  copiedPhone: string | null;
  onCopyPhone: (phone: string, e: React.MouseEvent) => void;
  onEdit: (sr: SR) => void;
  onDelete: (id: string) => void;
  language: Language;
}

function SRTableView({ srs, companies, getCompanyDisplayName, copiedPhone, onCopyPhone, onEdit, onDelete, language }: SRTableViewProps) {
  const bn = language === 'bn';

  return (
    <div className="overflow-x-auto border border-slate-200/80 rounded-none bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            <th className="px-4 py-3 w-10 text-center">#</th>
            <th className="px-4 py-3">{bn ? 'কর্মকর্তার নাম ও পদবী' : 'Officer Name & Role'}</th>
            <th className="px-4 py-3">{bn ? 'অ্যাসাইনড কোম্পানি' : 'Assigned Companies'}</th>
            <th className="px-4 py-3">{bn ? 'যোগাযোগ' : 'Contact Phone'}</th>
            <th className="px-4 py-3 text-right">{bn ? 'অ্যাকশন' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {srs.map((sr, idx) => {
            const initials = sr.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const companyNames = Array.from(new Set((sr.assignedCompanyIds || []).map(getCompanyDisplayName)));
            const primaryCompany = sr.assignedCompanyIds?.[0] || 'Unassigned';
            const resolvedName = getCompanyDisplayName(primaryCompany);
            const companyIdx = companies.findIndex(c => c.name.toLowerCase() === resolvedName.toLowerCase() || c.id === primaryCompany);
            const charCode = resolvedName ? resolvedName.charCodeAt(0) : 0;
            const theme = primaryCompany === 'Unassigned'
              ? { avatarBg: 'bg-slate-100 text-slate-700 ring-slate-200/50' }
              : COMPANY_THEMES[(companyIdx >= 0 ? companyIdx : charCode) % COMPANY_THEMES.length];

            return (
              <tr key={sr.id} className="hover:bg-slate-50/80 transition-colors group text-xs">
                <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-400">
                  {(idx + 1).toString().padStart(2, '0')}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-none ${theme.avatarBg} font-extrabold text-xs flex items-center justify-center shrink-0 ring-2 relative`}>
                      <span className="absolute inset-0 rounded-none bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {initials}
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-[13px]">{sr.name}</p>
                      <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                        {bn ? 'সেলস অফিসার (SR)' : 'Sales Officer (SR)'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {companyNames.length > 0 ? (
                      companyNames.map(cName => {
                        const compIdx = companies.findIndex(c => c.name.toLowerCase() === cName.toLowerCase() || c.id === cName);
                        const charCode = cName ? cName.charCodeAt(0) : 0;
                        const cTheme = compIdx >= 0 || cName !== 'Unassigned'
                          ? COMPANY_THEMES[(compIdx >= 0 ? compIdx : charCode) % COMPANY_THEMES.length]
                          : { badge: 'bg-slate-100 text-slate-700 border-slate-200/70' };
                        return (
                          <span key={cName} className={`px-2 py-0.5 rounded-none text-[10px] font-bold border ${cTheme.badge}`}>
                            {cName}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 italic font-medium">Unassigned</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono">
                  {sr.phone ? (
                    <div className="inline-flex items-center gap-1.5 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sr.phone}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEdit(sr)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-none transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(sr.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
                      title="Delete"
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
  );
}

// ── SUB-COMPONENT: DSR Enterprise Table View ────────────────────────────
interface DMTableViewProps {
  dms: DeliveryMan[];
  companies: CompanyBrand[];
  getCompanyDisplayName: (id: string) => string;
  copiedPhone: string | null;
  onCopyPhone: (phone: string, e: React.MouseEvent) => void;
  onEdit: (dm: DeliveryMan) => void;
  onDelete: (id: string) => void;
  language: Language;
}

function DMTableView({ dms, companies, getCompanyDisplayName, copiedPhone, onCopyPhone, onEdit, onDelete, language }: DMTableViewProps) {
  const bn = language === 'bn';

  return (
    <div className="overflow-x-auto border border-slate-200/80 rounded-none bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            <th className="px-4 py-3 w-10 text-center">#</th>
            <th className="px-4 py-3">{bn ? 'রাইডার নাম ও পদবী' : 'Driver Name & Role'}</th>
            <th className="px-4 py-3">{bn ? 'অ্যাসাইনড কোম্পানি' : 'Assigned Companies'}</th>
            <th className="px-4 py-3">{bn ? 'যানবাহন' : 'Vehicle'}</th>
            <th className="px-4 py-3">{bn ? 'যোগাযোগ' : 'Contact Phone'}</th>
            <th className="px-4 py-3 text-right">{bn ? 'অ্যাকশন' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {dms.map((dm, idx) => {
            const initials = dm.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const companyNames = Array.from(new Set((dm.assignedCompanyIds || []).map(getCompanyDisplayName)));
            const primaryCompany = dm.assignedCompanyIds?.[0] || 'Unassigned';
            const resolvedName = getCompanyDisplayName(primaryCompany);
            const companyIdx = companies.findIndex(c => c.name.toLowerCase() === resolvedName.toLowerCase() || c.id === primaryCompany);
            const charCode = resolvedName ? resolvedName.charCodeAt(0) : 0;
            const theme = primaryCompany === 'Unassigned'
              ? { avatarBg: 'bg-slate-100 text-slate-700 ring-slate-200/50' }
              : COMPANY_THEMES[(companyIdx >= 0 ? companyIdx : charCode) % COMPANY_THEMES.length];

            return (
              <tr key={dm.id} className="hover:bg-slate-50/80 transition-colors group text-xs">
                <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-400">
                  {(idx + 1).toString().padStart(2, '0')}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-none ${theme.avatarBg} font-extrabold text-xs flex items-center justify-center shrink-0 ring-2 relative`}>
                      <span className="absolute inset-0 rounded-none bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {initials}
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-[13px]">{dm.name}</p>
                      <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                        {bn ? 'ডেলিভারি রাইডার (DSR)' : 'Delivery Driver (DSR)'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {companyNames.length > 0 ? (
                      companyNames.map(cName => {
                        const compIdx = companies.findIndex(c => c.name.toLowerCase() === cName.toLowerCase() || c.id === cName);
                        const charCode = cName ? cName.charCodeAt(0) : 0;
                        const cTheme = compIdx >= 0 || cName !== 'Unassigned'
                          ? COMPANY_THEMES[(compIdx >= 0 ? compIdx : charCode) % COMPANY_THEMES.length]
                          : { badge: 'bg-slate-100 text-slate-700 border-slate-200/70' };
                        return (
                          <span key={cName} className={`px-2 py-0.5 rounded-none text-[10px] font-bold border ${cTheme.badge}`}>
                            {cName}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 italic font-medium">Unassigned</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {dm.vehicle || 'No Vehicle'}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-mono">
                  {dm.phone ? (
                    <div className="inline-flex items-center gap-1.5 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dm.phone}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEdit(dm)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-none transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(dm.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
                      title="Delete"
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
  );
}
