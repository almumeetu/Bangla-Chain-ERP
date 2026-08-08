'use client';

import React, { useState, useMemo } from 'react';
import {
  Users, UserCheck, Truck, Search, Filter, Building2, Phone, MapPin,
  Edit3, Trash2, Plus, X, ChevronDown, ChevronUp, MoreVertical, Eye, Store
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
  mode?: 'sr-only' | 'dsr-only' | 'both'; // New prop to control display mode
  onAddSR: () => void;
  onEditSR: (sr: SR) => void;
  onDeleteSR: (id: string) => void;
  onAddDM: () => void;
  onEditDM: (dm: DeliveryMan) => void;
  onDeleteDM: (id: string) => void;
}

type PersonnelTab = 'sr' | 'dsr';

export default function PersonnelManagement({
  srs,
  deliveryMen,
  companies,
  customers,
  language,
  mode = 'both', // Default to showing both tabs
  onAddSR,
  onEditSR,
  onDeleteSR,
  onAddDM,
  onEditDM,
  onDeleteDM
}: PersonnelManagementProps) {
  // State - activeTab based on mode
  const [activeTab, setActiveTab] = useState<PersonnelTab>(
    mode === 'dsr-only' ? 'dsr' : 'sr'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [collapsedCompanies, setCollapsedCompanies] = useState<Record<string, boolean>>({});

  // Translations - Dynamic based on mode
  const getTitle = () => {
    if (mode === 'sr-only') {
      return language === 'bn' ? 'সেলস অফিসার (SR)' : 'Sales Officers (SR)';
    }
    if (mode === 'dsr-only') {
      return language === 'bn' ? 'ডেলিভারি পার্সোনেল' : 'Delivery Personnel';
    }
    return language === 'bn' ? 'সেলস রিপ্রেজেন্টেটিভ ও ডেলিভারি এজেন্ট' : 'Sales Representatives & Delivery Agents';
  };

  const getSubtitle = () => {
    if (mode === 'sr-only') {
      return language === 'bn' ? 'সেলস অফিসার তালিকা ও ম্যানেজমেন্ট' : 'Sales Officers management';
    }
    if (mode === 'dsr-only') {
      return language === 'bn' ? 'ডেলিভারি কর্মী তালিকা ও ম্যানেজমেন্ট' : 'Delivery personnel management';
    }
    return language === 'bn' ? 'ফিল্ড ফোর্স কর্মী ম্যানেজমেন্ট' : 'Field force personnel management';
  };

  const t = {
    title: getTitle(),
    subtitle: getSubtitle(),
    totalPersonnel: language === 'bn' ? 'মোট কর্মী' : 'Total Staff',
    salesReps: language === 'bn' ? 'সেলস অফিসার' : 'Sales Officers',
    deliveryAgents: language === 'bn' ? 'ডেলিভারি স্টাফ' : 'Delivery Staff',
    assignedShops: language === 'bn' ? 'মোট দোকান' : 'Total Shops',
    unassigned: language === 'bn' ? 'বরাদ্দহীন' : 'Not Assigned',
    searchPlaceholder: language === 'bn' ? 'নাম বা মোবাইল নম্বর দিয়ে খুঁজুন...' : 'Search by name or mobile...',
    allCompanies: language === 'bn' ? 'সকল কোম্পানি' : 'All Companies',
    clearFilters: language === 'bn' ? 'ফিল্টার রিসেট' : 'Clear Filters',
    addPersonnel: language === 'bn' ? '+ স্টাফ যোগ করুন' : '+ Add Staff',
    personnel: language === 'bn' ? 'কর্মী' : 'Staff Member',
    role: language === 'bn' ? 'পদবী' : 'Role',
    company: language === 'bn' ? 'কোম্পানি' : 'Company',
    contact: language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number',
    shops: language === 'bn' ? 'দোকান সংখ্যা' : 'Number of Shops',
    vehicle: language === 'bn' ? 'গাড়ি/ভ্যান' : 'Vehicle',
    actions: language === 'bn' ? 'অ্যাকশন' : 'Actions',
    edit: language === 'bn' ? 'সম্পাদনা' : 'Edit',
    delete: language === 'bn' ? 'মুছে ফেলুন' : 'Delete',
    view: language === 'bn' ? 'দেখুন' : 'View',
    noResults: language === 'bn' ? 'কোনো স্টাফ পাওয়া যায়নি' : 'No staff members found',
    tryDifferentFilters: language === 'bn' ? 'ভিন্ন ফিল্টার বা সার্চ ব্যবহার করুন' : 'Try different search or filters',
    serialNo: language === 'bn' ? 'ক্রমিক' : 'S/N',
    name: language === 'bn' ? 'নাম ও পদবী' : 'Name & Role',
    companyStaff: language === 'bn' ? 'স্টাফ' : 'Staff Members',
  };

  // Calculate stats
  const totalSRs = srs.length;
  const totalDSRs = deliveryMen.length;
  const totalPersonnel = totalSRs + totalDSRs;
  const assignedShopsTotal = customers.length;
  const unassignedSRs = srs.filter(sr => !sr.assignedCompanyIds || sr.assignedCompanyIds.length === 0).length;
  const unassignedDSRs = deliveryMen.filter(dm => !dm.assignedCompanyIds || dm.assignedCompanyIds.length === 0).length;

  // Filter personnel
  const filteredSRs = useMemo(() => {
    return srs.filter(sr => {
      const matchesSearch = !searchQuery || 
        sr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sr.phone && sr.phone.includes(searchQuery));
      
      const matchesCompany = companyFilter === 'All' ||
        (companyFilter === 'Unassigned' 
          ? (!sr.assignedCompanyIds || sr.assignedCompanyIds.length === 0)
          : sr.assignedCompanyIds?.includes(companyFilter));
      
      return matchesSearch && matchesCompany;
    });
  }, [srs, searchQuery, companyFilter]);

  const filteredDMs = useMemo(() => {
    return deliveryMen.filter(dm => {
      const matchesSearch = !searchQuery || 
        dm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dm.phone && dm.phone.includes(searchQuery)) ||
        (dm.vehicle && dm.vehicle.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCompany = companyFilter === 'All' ||
        (companyFilter === 'Unassigned'
          ? (!dm.assignedCompanyIds || dm.assignedCompanyIds.length === 0)
          : dm.assignedCompanyIds?.includes(companyFilter));
      
      return matchesSearch && matchesCompany;
    });
  }, [deliveryMen, searchQuery, companyFilter]);

  // Group by company
  const groupedSRs = useMemo(() => {
    const groups: Record<string, SR[]> = {};
    filteredSRs.forEach(sr => {
      const companyNames = sr.assignedCompanyIds && sr.assignedCompanyIds.length > 0
        ? sr.assignedCompanyIds
        : ['Unassigned'];
      
      companyNames.forEach(compName => {
        if (!groups[compName]) groups[compName] = [];
        groups[compName].push(sr);
      });
    });
    return groups;
  }, [filteredSRs]);

  const groupedDMs = useMemo(() => {
    const groups: Record<string, DeliveryMan[]> = {};
    filteredDMs.forEach(dm => {
      const companyNames = dm.assignedCompanyIds && dm.assignedCompanyIds.length > 0
        ? dm.assignedCompanyIds
        : ['Unassigned'];
      
      companyNames.forEach(compName => {
        if (!groups[compName]) groups[compName] = [];
        groups[compName].push(dm);
      });
    });
    return groups;
  }, [filteredDMs]);

  const toggleCompanyCollapse = (companyName: string) => {
    setCollapsedCompanies(prev => ({
      ...prev,
      [companyName]: !prev[companyName]
    }));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getShopsCount = (srName: string) => {
    return customers.filter(c => c.assignedSR?.toLowerCase() === srName.toLowerCase()).length;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCompanyFilter('All');
  };

  const hasActiveFilters = searchQuery !== '' || companyFilter !== 'All';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 -mx-6 -mt-6 px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="w-6 h-6 text-slate-700" />
              {t.title}
            </h1>
            <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
          </div>
          <button
            onClick={activeTab === 'sr' ? onAddSR : onAddDM}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.addPersonnel}
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">{t.totalPersonnel}</div>
          <div className="text-2xl font-bold text-slate-900">{totalPersonnel}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">{t.salesReps}</div>
          <div className="text-2xl font-bold text-blue-600">{totalSRs}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">{t.deliveryAgents}</div>
          <div className="text-2xl font-bold text-emerald-600">{totalDSRs}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">{t.assignedShops}</div>
          <div className="text-2xl font-bold text-slate-900">{assignedShopsTotal}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">{t.unassigned}</div>
          <div className="text-2xl font-bold text-amber-600">{unassignedSRs + unassignedDSRs}</div>
        </div>
      </div>

      {/* Tab Segmentation - Only show when mode is 'both' */}
      {mode === 'both' && (
        <div className="bg-white border border-slate-200 rounded-lg p-1 inline-flex">
          <button
            onClick={() => setActiveTab('sr')}
            className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-colors ${
              activeTab === 'sr'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 inline mr-2" />
            {t.salesReps}
          </button>
          <button
            onClick={() => setActiveTab('dsr')}
            className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-colors ${
              activeTab === 'dsr'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4 inline mr-2" />
            {t.deliveryAgents}
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full h-10 pl-10 pr-4 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="h-10 px-3 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          >
            <option value="All">{t.allCompanies}</option>
            {companies.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
            <option value="Unassigned">{t.unassigned}</option>
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 h-10 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4 inline mr-1" />
              {t.clearFilters}
            </button>
          )}
        </div>
      </div>

      {/* Personnel Table - SR Tab */}
      {(mode === 'sr-only' || (mode === 'both' && activeTab === 'sr')) && (
        <div className="space-y-4">
          {Object.keys(groupedSRs).length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{t.noResults}</h3>
              <p className="text-sm text-slate-600">{t.tryDifferentFilters}</p>
            </div>
          ) : (
            <>
              {Object.entries(groupedSRs).map(([companyName, compSRs]) => {
                const isCollapsed = collapsedCompanies[companyName];
                const isUnassigned = companyName === 'Unassigned';
                
                return (
                  <div key={companyName} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    {/* Company Header */}
                    <div
                      onClick={() => toggleCompanyCollapse(companyName)}
                      className={`px-6 py-3 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                        isUnassigned ? 'bg-slate-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {!isUnassigned && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                        <h3 className={`font-semibold text-sm uppercase tracking-wide ${
                          isUnassigned ? 'text-slate-600 italic' : 'text-slate-900'
                        }`}>
                          {companyName}
                        </h3>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {compSRs.length} {language === 'bn' ? 'জন অফিসার' : compSRs.length === 1 ? 'Officer' : 'Officers'}
                        </span>
                      </div>
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    {/* Table */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{t.serialNo}</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{t.name}</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{t.contact}</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{t.shops}</th>
                              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">{t.actions}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {compSRs.map((sr, idx) => {
                              const shopsCount = getShopsCount(sr.name);
                              const initials = getInitials(sr.name);
                              
                              return (
                                <tr key={sr.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                                    {(idx + 1).toString().padStart(2, '0')}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-sm font-semibold">
                                        {initials}
                                      </div>
                                      <div>
                                        <div className="text-sm font-semibold text-slate-900">{sr.name}</div>
                                        <div className="text-xs text-slate-500">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                            {language === 'bn' ? 'সেলস অফিসার' : 'Sales Officer'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                      <Phone className="w-4 h-4 text-slate-400" />
                                      <span className="font-mono">{sr.phone || 'N/A'}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <Store className="w-4 h-4 text-slate-400" />
                                      <span className={`text-sm font-medium ${shopsCount > 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                                        {shopsCount} {language === 'bn' ? 'দোকান' : 'shops'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => onEditSR(sr)}
                                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                                        title={t.edit}
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => onDeleteSR(sr.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title={t.delete}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Personnel Table - DSR Tab */}
      {(mode === 'dsr-only' || (mode === 'both' && activeTab === 'dsr')) && (
        <div className="space-y-4">
          {Object.keys(groupedDMs).length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{t.noResults}</h3>
              <p className="text-sm text-slate-600">{t.tryDifferentFilters}</p>
            </div>
          ) : (
            <>
              {Object.entries(groupedDMs).map(([companyName, compDMs]) => {
                const isCollapsed = collapsedCompanies[companyName];
                const isUnassigned = companyName === 'Unassigned';
                
                return (
                  <div key={companyName} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    {/* Company Header */}
                    <div
                      onClick={() => toggleCompanyCollapse(companyName)}
                      className={`px-6 py-3 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                        isUnassigned ? 'bg-slate-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {!isUnassigned && (
                          <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                        )}
                        <h3 className={`font-semibold text-sm uppercase tracking-wide ${
                          isUnassigned ? 'text-slate-600 italic' : 'text-slate-900'
                        }`}>
                          {companyName}
                        </h3>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {compDMs.length} {language === 'bn' ? 'জন স্টাফ' : compDMs.length === 1 ? 'Staff' : 'Staff Members'}
                        </span>
                      </div>
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    {/* Table */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{t.serialNo}</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{t.name}</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{t.vehicle}</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{t.contact}</th>
                              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">{t.actions}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {compDMs.map((dm, idx) => {
                              const initials = getInitials(dm.name);
                              
                              return (
                                <tr key={dm.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                                    {(idx + 1).toString().padStart(2, '0')}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-sm font-semibold">
                                        {initials}
                                      </div>
                                      <div>
                                        <div className="text-sm font-semibold text-slate-900">{dm.name}</div>
                                        <div className="text-xs text-slate-500">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                                            {language === 'bn' ? 'ডেলিভারি স্টাফ' : 'Delivery Staff'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <Truck className="w-4 h-4 text-slate-400" />
                                      <span className="text-sm text-slate-600">{dm.vehicle || 'N/A'}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                      <Phone className="w-4 h-4 text-slate-400" />
                                      <span className="font-mono">{dm.phone || 'N/A'}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => onEditDM(dm)}
                                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                                        title={t.edit}
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => onDeleteDM(dm.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title={t.delete}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
