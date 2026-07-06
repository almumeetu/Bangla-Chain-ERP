'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Settings, ClipboardList, Users, Eye, EyeOff, Plus, Trash2, Check, Shield, KeyRound, UserCheck, Download, Upload, Database } from 'lucide-react';
import { exportBackup, importBackup } from '../lib/backupRestore';
import { clearAllData } from '../lib/localStore';
import DirectoryModule from './DirectoryModule';
import { SR } from '../types';

interface SettingsModuleProps {
  shopName: string;
  setShopName: (name: string) => void;
  shopSubBrand: string;
  setShopSubBrand: (sub: string) => void;
  shopLogo: string;
  setShopLogo: (logo: string) => void;
  language: 'en' | 'bn';
  directoryBaseProps: any;
  srs: SR[];
  setSrs: React.Dispatch<React.SetStateAction<SR[]>>;
}

export default function SettingsModule({
  shopName,
  setShopName,
  shopSubBrand,
  setShopSubBrand,
  shopLogo,
  setShopLogo,
  language,
  directoryBaseProps,
  srs,
  setSrs
}: SettingsModuleProps) {
  const [tempName, setTempName] = useState(shopName);
  const [tempSub, setTempSub] = useState(shopSubBrand);
  const [tempLogo, setTempLogo] = useState(shopLogo);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'branding' | 'accounts' | 'godowns' | 'backup'>('branding');

  // ─── Backup / Restore ────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMsg, setImportMsg] = useState('');

  // ─── Admin password change ───────────────────────────────────
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminPwError, setAdminPwError] = useState('');
  const [adminPwSuccess, setAdminPwSuccess] = useState(false);
  const [showAdminCurrentPw, setShowAdminCurrentPw] = useState(false);
  const [showAdminNewPw, setShowAdminNewPw] = useState(false);

  // ─── SR inline edit ──────────────────────────────────────────
  const [editingSrId, setEditingSrId] = useState<string | null>(null);
  const [editSrUsername, setEditSrUsername] = useState('');
  const [editSrPassword, setEditSrPassword] = useState('');
  const [showSrPw, setShowSrPw] = useState<Record<string, boolean>>({});

  // ─── New SR quick-create ─────────────────────────────────────
  const [showNewSrForm, setShowNewSrForm] = useState(false);
  const [newSrName, setNewSrName] = useState('');
  const [newSrPhone, setNewSrPhone] = useState('');
  const [newSrUsername, setNewSrUsername] = useState('');
  const [newSrPassword, setNewSrPassword] = useState('');
  const [newSrError, setNewSrError] = useState('');

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    setShopName(tempName);
    setShopSubBrand(tempSub);
    setShopLogo(tempLogo);
    localStorage.setItem('erp_settings_shop_name', tempName);
    localStorage.setItem('erp_settings_shop_subbrand', tempSub);
    localStorage.setItem('erp_settings_shop_logo', tempLogo);
    alert(language === 'bn' ? 'ব্র্যান্ডিং তথ্য সফলভাবে আপডেট করা হয়েছে!' : 'Branding settings updated successfully!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetDatabase = () => {
    const message = language === 'bn'
      ? 'এই কাজটি সব পণ্য, কোম্পানি, এসআর, বিক্রয়, স্টক, খরচ এবং অন্যান্য ব্যবসায়িক ডেটা মুছে দিবে। আপনি কি সত্যি নতুনভাবে শুরু করতে চান?'
      : 'This will remove all products, companies, SRs, sales, stock, expenses, and other business data. Do you want to start fresh?';

    if (!confirm(message)) return;

    clearAllData();
    sessionStorage.removeItem('erp_sr_id');
    sessionStorage.removeItem('erp_sr_name');
    localStorage.removeItem('erp_auth_role');
    localStorage.removeItem('erp_active_tab');
    window.location.reload();
  };

  const handleLoadDemoData = () => {
    const message = language === 'bn'
      ? 'এটি ডেমো ডেটা লোড করবে। আপনি কি নিশ্চিত?'
      : 'This will load demo data into the system. Are you sure?';

    if (!confirm(message)) return;

    localStorage.removeItem('erp_seeded');
    window.location.reload();
  };

  // ─── Admin: change password ────────────────────────────────────
  const handleAdminPasswordChange = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setAdminPwError('');
    setAdminPwSuccess(false);

    // Verify current password
    const currentPw = adminCurrentPassword.trim();
    const newPw = adminNewPassword.trim();
    const confirmPw = adminConfirmPassword.trim();

    if (!currentPw || !newPw || !confirmPw) {
      setAdminPwError(language === 'bn' ? 'সব ফিল্ড পূরণ করুন।' : 'Please fill all fields.');
      return;
    }

    if (newPw.length < 3) {
      setAdminPwError(language === 'bn' ? 'নতুন পাসওয়ার্ড কমপক্ষে ৩ অক্ষর হতে হবে।' : 'New password must be at least 3 characters.');
      return;
    }

    if (newPw !== confirmPw) {
      setAdminPwError(language === 'bn' ? 'নতুন পাসওয়ার্ড দুটি মিলছে না।' : 'New passwords do not match.');
      return;
    }

    // Get current admin credentials
    const loggedEmail = localStorage.getItem('erp_user_email') || 'admin';
    const isDefault = (loggedEmail === 'admin' || loggedEmail === 'admin@samir.com');

    let verified = false;

    if (isDefault && (currentPw === 'admin')) {
      verified = true;
    }

    if (!verified) {
      try {
        const saved = localStorage.getItem('erp_admins');
        if (saved) {
          const admins = JSON.parse(saved);
          const found = admins.find((a: any) =>
            a.email?.toLowerCase() === loggedEmail.toLowerCase() && a.password === currentPw
          );
          if (found) verified = true;
        }
      } catch (e) {}
    }

    if (!verified) {
      setAdminPwError(language === 'bn' ? 'বর্তমান পাসওয়ার্ড সঠিক নয়।' : 'Current password is incorrect.');
      return;
    }

    // Save new password
    try {
      const saved = localStorage.getItem('erp_admins');
      const admins = saved ? JSON.parse(saved) : [];
      // Remove old entry for this email and add/update with new password
      const filtered = admins.filter((a: any) => a.email?.toLowerCase() !== loggedEmail.toLowerCase());
      filtered.push({ email: loggedEmail, password: newPw });
      localStorage.setItem('erp_admins', JSON.stringify(filtered));

      setAdminCurrentPassword('');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
      setAdminPwSuccess(true);
      setTimeout(() => setAdminPwSuccess(false), 3000);
    } catch (e) {
      setAdminPwError(language === 'bn' ? 'সংরক্ষণে সমস্যা হয়েছে।' : 'Failed to save. Please try again.');
    }
  }, [adminCurrentPassword, adminNewPassword, adminConfirmPassword, language]);

  // ─── SR: start inline edit ────────────────────────────────────
  const handleStartSrEdit = (sr: SR) => {
    setEditingSrId(sr.id);
    setEditSrUsername(sr.loginUsername || '');
    setEditSrPassword(sr.loginPassword || '');
  };

  // ─── SR: save credentials ─────────────────────────────────────
  const handleSaveSrCredentials = useCallback((srId: string) => {
    if (!editSrUsername.trim()) {
      alert(language === 'bn' ? 'ইউজারনেম দিন।' : 'Please enter a username.');
      return;
    }
    setSrs(prev => {
      const updated = prev.map(s =>
        s.id === srId
          ? { ...s, loginUsername: editSrUsername.trim(), loginPassword: editSrPassword.trim() }
          : s
      );
      localStorage.setItem('erp_srs', JSON.stringify(updated));
      return updated;
    });
    setEditingSrId(null);
  }, [editSrUsername, editSrPassword, setSrs, language]);

  // ─── New SR: create ───────────────────────────────────────────
  const handleCreateNewSr = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setNewSrError('');

    if (!newSrName.trim() || !newSrPhone.trim()) {
      setNewSrError(language === 'bn' ? 'নাম এবং ফোন নম্বর আবশ্যক।' : 'Name and phone number are required.');
      return;
    }
    if (!newSrUsername.trim()) {
      setNewSrError(language === 'bn' ? 'ইউজারনেম দিন।' : 'Please enter a username.');
      return;
    }
    if (!newSrPassword.trim() || newSrPassword.length < 3) {
      setNewSrError(language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৩ অক্ষর হতে হবে।' : 'Password must be at least 3 characters.');
      return;
    }

    // Check username duplicate
    const duplicate = srs.find(s => s.loginUsername?.toLowerCase() === newSrUsername.trim().toLowerCase());
    if (duplicate) {
      setNewSrError(language === 'bn' ? 'এই ইউজারনেম ইতিমধ্যে ব্যবহৃত হচ্ছে।' : 'This username is already taken.');
      return;
    }

    const newSr: SR = {
      id: `sr-${Date.now()}`,
      name: newSrName.trim(),
      phone: newSrPhone.trim(),
      commissionRate: 5,
      assignedCompanyIds: [],
      loginUsername: newSrUsername.trim(),
      loginPassword: newSrPassword.trim()
    };

    setSrs(prev => {
      const updated = [...prev, newSr];
      localStorage.setItem('erp_srs', JSON.stringify(updated));
      return updated;
    });

    setNewSrName('');
    setNewSrPhone('');
    setNewSrUsername('');
    setNewSrPassword('');
    setShowNewSrForm(false);
    setNewSrError('');
  }, [newSrName, newSrPhone, newSrUsername, newSrPassword, srs, setSrs, language]);

  // ─── SR: delete ──────────────────────────────────────────────
  const handleDeleteSr = (srId: string, srName: string) => {
    if (!confirm(language === 'bn' ? `"${srName}" অ্যাকাউন্ট মুছে ফেলবেন?` : `Delete SR account "${srName}"?`)) return;
    setSrs(prev => {
      const updated = prev.filter(s => s.id !== srId);
      localStorage.setItem('erp_srs', JSON.stringify(updated));
      return updated;
    });
  };

  const loggedEmail = typeof window !== 'undefined' ? (localStorage.getItem('erp_user_email') || 'admin') : 'admin';

  const tabBtn = (key: 'branding' | 'accounts' | 'godowns' | 'backup', label: string) => (
    <button
      type="button"
      onClick={() => setActiveSettingsTab(key)}
      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
        activeSettingsTab === key
          ? 'bg-white text-slate-900 shadow-sm font-bold border border-slate-200/50'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 text-slate-800 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            {language === 'bn' ? 'সেটিংস ও কনফিগারেশন' : 'Settings & Configurations'}
          </h2>
          <p className="text-slate-500 text-xs font-medium">
            {language === 'bn' ? 'ব্র্যান্ডিং, ইউজার অ্যাকাউন্ট ও গুদাম ব্যবস্থাপনা' : 'Branding, user accounts and warehouse management'}
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm shrink-0 flex-wrap gap-1">
          {tabBtn('branding',  language === 'bn' ? 'ব্র্যান্ডিং'       : 'Branding')}
          {tabBtn('accounts',  language === 'bn' ? 'ইউজার অ্যাকাউন্ট' : 'User Accounts')}
          {tabBtn('godowns',   language === 'bn' ? 'গুদাম'             : 'Godowns')}
          {tabBtn('backup',    language === 'bn' ? 'ব্যাকআপ'           : 'Backup')}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ BRANDING TAB */}
      {activeSettingsTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSaveBranding} className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                {language === 'bn' ? 'ব্যবসার বিবরণী ও ব্র্যান্ডিং' : 'Distributor Branding Setup'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {language === 'bn' ? 'প্রতিষ্ঠানের নাম, লোগো ও বর্ণনা পরিবর্তন করুন' : 'Update the organization name, header, and logo'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'প্রতিষ্ঠানের নাম' : 'Organization Name'}
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="e.g. Samir Enterprise"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold outline-none focus:border-slate-800 transition-all text-slate-800"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'উপ-শিরোনাম / হাব' : 'Sub-heading / Hub'}
                </label>
                <input
                  type="text"
                  value={tempSub}
                  onChange={(e) => setTempSub(e.target.value)}
                  placeholder="e.g. Dhaka Hub"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold outline-none focus:border-slate-800 transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                {language === 'bn' ? 'ব্র্যান্ড লোগো' : 'Brand Logo'}
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {tempLogo ? (
                    <img src={tempLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <ClipboardList className="w-7 h-7 text-slate-300" />
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-[11px] text-slate-500 font-medium">
                    {language === 'bn' ? 'JPG, PNG ফরম্যাটে আপলোড করুন।' : 'Upload JPG or PNG file.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <label className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer inline-block">
                      {language === 'bn' ? 'ফাইল বেছে নিন' : 'Choose Image'}
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    {tempLogo && (
                      <button type="button" onClick={() => setTempLogo('')} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold border border-rose-100 cursor-pointer">
                        {language === 'bn' ? 'সরান' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button type="submit" className="h-10 px-6 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer shadow-sm">
                {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Settings'}
              </button>
            </div>
          </form>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800">
                {language === 'bn' ? 'সিস্টেম অ্যাকশন' : 'Database & Operations'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                {language === 'bn' ? 'সব ব্যবসায়িক ডেটা ক্লিয়ার করে শূন্য অবস্থায় ফিরে যান।' : 'Clear all business data and start from zero.'}
              </p>
              <button type="button" onClick={handleResetDatabase} className="w-full h-10 rounded-lg border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold cursor-pointer">
                {language === 'bn' ? 'ক্লিয়ার অল' : 'Clear All'}
              </button>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 font-medium mb-3 leading-relaxed">
                  {language === 'bn' ? 'সিস্টেমটি পরীক্ষা করার জন্য ডেমো ডেটা লোড করুন।' : 'Load demo data to test the system.'}
                </p>
                <button type="button" onClick={handleLoadDemoData} className="w-full h-10 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold cursor-pointer">
                  {language === 'bn' ? 'ডেমো ডেটা লোড করুন' : 'Load Demo Data'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-800">
                {language === 'bn' ? 'সিস্টেম তথ্য' : 'System Info'}
              </h3>
              <div className="space-y-2 text-xs font-semibold">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Engine:</span>
                  <span className="text-slate-700">Bangla-Chain ERP v3.1</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Timezone:</span>
                  <span className="text-slate-700">GMT+06:00 (BST)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Storage:</span>
                  <span className="text-emerald-600">Local Cache</span>
                </div>
              </div>
            </div>

            {/* ── Backup & Restore ── */}
            
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ ACCOUNTS TAB */}
      {activeSettingsTab === 'accounts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ─── Admin Password Change ─── */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {language === 'bn' ? 'অ্যাডমিন পাসওয়ার্ড পরিবর্তন' : 'Admin Password'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {language === 'bn' ? `লগড-ইন: ${loggedEmail}` : `Logged in as: ${loggedEmail}`}
                  </p>
                </div>
              </div>

              <form onSubmit={handleAdminPasswordChange} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {language === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminCurrentPw ? 'text' : 'password'}
                      value={adminCurrentPassword}
                      onChange={e => { setAdminCurrentPassword(e.target.value); setAdminPwError(''); }}
                      placeholder="••••••••"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 pr-10 text-xs font-semibold outline-none focus:border-slate-900 focus:bg-white transition-all"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowAdminCurrentPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showAdminCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminNewPw ? 'text' : 'password'}
                      value={adminNewPassword}
                      onChange={e => { setAdminNewPassword(e.target.value); setAdminPwError(''); }}
                      placeholder="••••••••"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 pr-10 text-xs font-semibold outline-none focus:border-slate-900 focus:bg-white transition-all"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowAdminNewPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showAdminNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {language === 'bn' ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
                  </label>
                  <input
                    type="password"
                    value={adminConfirmPassword}
                    onChange={e => { setAdminConfirmPassword(e.target.value); setAdminPwError(''); }}
                    placeholder="••••••••"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>

                {adminPwError && (
                  <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-xs font-semibold text-red-600">{adminPwError}</p>
                  </div>
                )}

                {adminPwSuccess && (
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <p className="text-xs font-semibold text-emerald-700">
                      {language === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!' : 'Password changed successfully!'}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-10 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer transition-all active:scale-[0.98] shadow-sm"
                >
                  {language === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password'}
                </button>

                <p className="text-[10px] text-slate-400 font-medium text-center leading-relaxed">
                  {language === 'bn'
                    ? 'পাসওয়ার্ড পরিবর্তনের পর পরবর্তী লগইনে নতুন পাসওয়ার্ড ব্যবহার করতে হবে।'
                    : 'You will need to use the new password on next login.'}
                </p>
              </form>
            </div>
          </div>

          {/* ─── SR Accounts Management ─── */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {language === 'bn' ? 'সেলস অফিসার (SR) অ্যাকাউন্ট' : 'Sales Officer (SR) Accounts'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {srs.length} {language === 'bn' ? 'জন SR' : 'SRs registered'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowNewSrForm(p => !p); setNewSrError(''); }}
                  className="h-8 px-3 rounded-lg bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'নতুন SR' : 'Add SR'}
                </button>
              </div>

              {/* New SR quick-create form */}
              {showNewSrForm && (
                <form onSubmit={handleCreateNewSr} className="p-4 bg-indigo-50/40 border-b border-indigo-100 space-y-3">
                  <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                    {language === 'bn' ? 'নতুন SR অ্যাকাউন্ট তৈরি করুন' : 'Create New SR Account'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        {language === 'bn' ? 'নাম *' : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        value={newSrName}
                        onChange={e => { setNewSrName(e.target.value); setNewSrError(''); }}
                        placeholder={language === 'bn' ? 'যেমন: সেলিম আহমেদ' : 'e.g. Selim Ahmed'}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        {language === 'bn' ? 'ফোন *' : 'Phone *'}
                      </label>
                      <input
                        type="text"
                        value={newSrPhone}
                        onChange={e => { setNewSrPhone(e.target.value); setNewSrError(''); }}
                        placeholder="017XXXXXXXX"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono font-semibold outline-none focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        {language === 'bn' ? 'ইউজারনেম *' : 'Username *'}
                      </label>
                      <input
                        type="text"
                        value={newSrUsername}
                        onChange={e => { setNewSrUsername(e.target.value.toLowerCase().replace(/\s+/g, '')); setNewSrError(''); }}
                        placeholder="selim123"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono font-semibold outline-none focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        {language === 'bn' ? 'পাসওয়ার্ড *' : 'Password *'}
                      </label>
                      <input
                        type="text"
                        value={newSrPassword}
                        onChange={e => { setNewSrPassword(e.target.value); setNewSrError(''); }}
                        placeholder={language === 'bn' ? 'কমপক্ষে ৩ অক্ষর' : 'min. 3 chars'}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono font-semibold outline-none focus:border-indigo-400 transition-all"
                      />
                    </div>
                  </div>

                  {newSrError && (
                    <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-xs font-semibold text-red-600">{newSrError}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowNewSrForm(false); setNewSrError(''); }}
                      className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      {language === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="h-9 px-5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {language === 'bn' ? 'SR তৈরি করুন' : 'Create SR'}
                    </button>
                  </div>
                </form>
              )}

              {/* SR List */}
              <div className="divide-y divide-slate-50 max-h-[480px] overflow-y-auto">
                {srs.length === 0 ? (
                  <div className="py-10 text-center">
                    <UserCheck className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">
                      {language === 'bn' ? 'কোনো SR নেই। উপরে "নতুন SR" বাটনে ক্লিক করুন।' : 'No SRs found. Click "Add SR" above.'}
                    </p>
                  </div>
                ) : srs.map((sr, idx) => {
                  const isEditing = editingSrId === sr.id;
                  const avatarColors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500'];
                  const avatarColor = avatarColors[idx % avatarColors.length];

                  return (
                    <div key={sr.id} className={`p-4 transition-colors ${isEditing ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}>
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-lg ${avatarColor} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                          {sr.name[0].toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 truncate">{sr.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{sr.phone}</span>
                          </div>
                          {!isEditing && (
                            <div className="flex items-center gap-3 mt-0.5">
                              {sr.loginUsername ? (
                                <>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    <span className="text-slate-400">user: </span>
                                    <span className="font-bold text-slate-700">{sr.loginUsername}</span>
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                    <span className="text-slate-400">pass: </span>
                                    <span className="font-bold text-slate-700">
                                      {showSrPw[sr.id] ? (sr.loginPassword || '—') : '••••••'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setShowSrPw(p => ({ ...p, [sr.id]: !p[sr.id] }))}
                                      className="text-slate-300 hover:text-slate-600 cursor-pointer ml-0.5"
                                    >
                                      {showSrPw[sr.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                  </span>
                                </>
                              ) : (
                                <span className="text-[10px] text-amber-500 font-semibold">
                                  {language === 'bn' ? '⚠ লগইন তথ্য নেই' : '⚠ No login credentials'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {!isEditing ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartSrEdit(sr)}
                              className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-400 cursor-pointer transition-all"
                              title={language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Edit credentials'}
                            >
                              <KeyRound className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSr(sr.id, sr.name)}
                              className="h-7 w-7 rounded-lg border border-rose-100 bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 cursor-pointer transition-all"
                              title={language === 'bn' ? 'মুছুন' : 'Delete'}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {/* Inline Edit form */}
                      {isEditing && (
                        <div className="mt-3 space-y-3">
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                            {language === 'bn' ? 'লগইন তথ্য পরিবর্তন করুন' : 'Update Login Credentials'}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                                {language === 'bn' ? 'ইউজারনেম' : 'Username'}
                              </label>
                              <input
                                type="text"
                                value={editSrUsername}
                                onChange={e => setEditSrUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                                placeholder="username"
                                className="h-9 w-full rounded-lg border border-blue-200 bg-white px-3 text-xs font-mono font-semibold outline-none focus:border-blue-500 transition-all"
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                                {language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                              </label>
                              <input
                                type="text"
                                value={editSrPassword}
                                onChange={e => setEditSrPassword(e.target.value)}
                                placeholder={language === 'bn' ? 'পাসওয়ার্ড' : 'password'}
                                className="h-9 w-full rounded-lg border border-blue-200 bg-white px-3 text-xs font-mono font-semibold outline-none focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingSrId(null)}
                              className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold cursor-pointer hover:bg-slate-50"
                            >
                              {language === 'bn' ? 'বাতিল' : 'Cancel'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveSrCredentials(sr.id)}
                              className="h-8 px-4 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer hover:bg-blue-700 flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer note */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                <p className="text-[10px] text-slate-400 font-medium">
                  {language === 'bn'
                    ? 'SR-রা এই username ও password দিয়ে লগইন করবে। তারা শুধু Sales Terminal দেখতে পাবে।'
                    : 'SRs use these credentials to log in. They can only access the Sales Terminal.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ GODOWNS TAB */}
      {activeSettingsTab === 'godowns' && (
        <DirectoryModule
          key="settings-godowns"
          {...directoryBaseProps}
          defaultTab="godowns"
          visibleTabs={['godowns']}
          pageTitle={language === 'bn' ? 'গুদাম ও সিস্টেম সেটিংস' : 'Warehouse Godowns'}
          pageSubtitle={language === 'bn' ? 'গুদাম ও স্থানসমূহ পরিচালনা' : 'Warehouse & system settings'}
        />
      )}

      {/* ═══════════════════════════════════════════ BACKUP TAB */}
      {activeSettingsTab === 'backup' && (
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Header card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {language === 'bn' ? 'ডেটা ব্যাকআপ ও রিস্টোর' : 'Data Backup & Restore'}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {language === 'bn'
                    ? 'সব ডেটা JSON ফাইলে সেভ করুন। যেকোনো ডিভাইসে রিস্টোর করুন।'
                    : 'Save all data to a JSON file. Restore on any device anytime.'}
                </p>
              </div>
            </div>
          </div>

          {/* Export card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  {language === 'bn' ? 'ব্যাকআপ এক্সপোর্ট' : 'Export Backup'}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  {language === 'bn' ? 'সব ডেটা .json ফাইলে ডাউনলোড করুন' : 'Download all your data as a .json file'}
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: '🧾', label: language === 'bn' ? 'চালান' : 'Challans' },
                  { icon: '📦', label: language === 'bn' ? 'পণ্য ও স্টক' : 'Products & Stock' },
                  { icon: '💰', label: language === 'bn' ? 'হিসাব ও খরচ' : 'Accounts & Expenses' },
                  { icon: '🏢', label: language === 'bn' ? 'কোম্পানি ও রুট' : 'Companies & Routes' },
                  { icon: '👥', label: language === 'bn' ? 'SR ও কাস্টমার' : 'SRs & Customers' },
                  { icon: '⚙️', label: language === 'bn' ? 'সেটিংস' : 'Settings' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-base leading-none">{item.icon}</span>
                    <span className="text-[11px] font-semibold text-slate-600">{item.label}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => exportBackup(shopName)}
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-sm font-bold cursor-pointer flex items-center justify-center gap-2.5 transition-all shadow-sm shadow-emerald-200"
              >
                <Download className="w-4 h-4" />
                {language === 'bn' ? 'এখনই ব্যাকআপ ডাউনলোড করুন' : 'Download Backup Now'}
              </button>
              <p className="text-center text-[10px] text-slate-400 font-medium">
                {language === 'bn'
                  ? `ফাইলের নাম: ${shopName.replace(/\s+/g, '_')}_backup_[তারিখ].json`
                  : `File: ${shopName.replace(/\s+/g, '_')}_backup_[date].json`}
              </p>
            </div>
          </div>

          {/* Import card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-blue-50/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  {language === 'bn' ? 'ব্যাকআপ থেকে রিস্টোর' : 'Restore from Backup'}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  {language === 'bn' ? '.json ব্যাকআপ ফাইল আপলোড করুন' : 'Upload a previously exported .json backup file'}
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Warning */}
              <div className="flex gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
                <span className="text-base leading-none shrink-0">⚠️</span>
                <p className="text-[11px] font-semibold text-amber-700 leading-relaxed">
                  {language === 'bn'
                    ? 'রিস্টোর করলে বর্তমান সব ডেটা মুছে যাবে এবং ব্যাকআপ ফাইলের ডেটা লোড হবে।'
                    : 'Restoring will replace ALL current data with the backup file contents. This cannot be undone.'}
                </p>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImportStatus('idle');
                  setImportMsg('');
                  importBackup(
                    file,
                    () => {
                      setImportStatus('success');
                      setImportMsg(
                        language === 'bn'
                          ? '✓ ডেটা সফলভাবে রিস্টোর হয়েছে! পেজ রিলোড হচ্ছে…'
                          : '✓ Data restored successfully! Reloading page…'
                      );
                      setTimeout(() => window.location.reload(), 1800);
                    },
                    (msg) => {
                      setImportStatus('error');
                      setImportMsg(msg);
                    },
                  );
                  // reset so same file can be re-selected
                  e.target.value = '';
                }}
              />

              {/* Drop zone / click to upload */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => { setImportStatus('idle'); setImportMsg(''); fileInputRef.current?.click(); }}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50 p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-all">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">
                    {language === 'bn' ? 'ফাইল বেছে নিন' : 'Click to choose file'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {language === 'bn' ? 'শুধুমাত্র .json ফাইল গ্রহণযোগ্য' : 'Only .json backup files are accepted'}
                  </p>
                </div>
              </div>

              {/* Status messages */}
              {importStatus === 'success' && (
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-xs font-bold text-emerald-700">{importMsg}</p>
                </div>
              )}
              {importStatus === 'error' && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-red-600">
                    {language === 'bn' ? 'রিস্টোর ব্যর্থ হয়েছে' : 'Restore failed'}
                  </p>
                  <p className="text-[11px] text-red-500 font-medium">{importMsg}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
