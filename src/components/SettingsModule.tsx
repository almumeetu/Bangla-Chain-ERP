'use client';

import React, { useState } from 'react';
import { Settings, ClipboardList } from 'lucide-react';
import DirectoryModule from './DirectoryModule';

interface SettingsModuleProps {
  shopName: string;
  setShopName: (name: string) => void;
  shopSubBrand: string;
  setShopSubBrand: (sub: string) => void;
  shopLogo: string;
  setShopLogo: (logo: string) => void;
  language: 'en' | 'bn';
  directoryBaseProps: any;
}

export default function SettingsModule({
  shopName,
  setShopName,
  shopSubBrand,
  setShopSubBrand,
  shopLogo,
  setShopLogo,
  language,
  directoryBaseProps
}: SettingsModuleProps) {
  const [tempName, setTempName] = useState(shopName);
  const [tempSub, setTempSub] = useState(shopSubBrand);
  const [tempLogo, setTempLogo] = useState(shopLogo);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'branding' | 'godowns'>('branding');

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
    if (confirm(language === 'bn' ? 'আপনি কি নিশ্চিত যে সমস্ত ডেটা মুছে ফেলে প্রাথমিক অবস্থায় ফিরে যেতে চান?' : 'Are you sure you want to reset all local changes and restore original demo data?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 md:p-6 text-slate-800 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-50 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-800" />
            {language === 'bn' ? 'সেটিংস এবং কনফিগারেশন' : 'Settings & Configurations'}
          </h2>
          <p className="text-slate-500 text-xs font-semibold">
            {language === 'bn' ? 'সিস্টেম ব্র্যান্ডিং, নাম, লোগো এবং গুদাম সেটিংস পরিবর্তন করুন' : 'Change distributor hub branding details, upload logo and manage locations'}
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm shrink-0 z-10 relative">
          <button
            type="button"
            onClick={() => setActiveSettingsTab('branding')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSettingsTab === 'branding' 
                ? 'bg-white text-slate-900 shadow-sm font-bold border border-slate-200/50' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {language === 'bn' ? 'সিস্টেম ব্র্যান্ডিং' : 'Hub Branding'}
          </button>
          <button
            type="button"
            onClick={() => setActiveSettingsTab('godowns')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSettingsTab === 'godowns' 
                ? 'bg-white text-slate-900 shadow-sm font-bold border border-slate-200/50' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {language === 'bn' ? 'গুদাম তালিকা' : 'Warehouse Godowns'}
          </button>
        </div>
      </div>

      {activeSettingsTab === 'branding' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Branding form */}
          <form onSubmit={handleSaveBranding} className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {language === 'bn' ? 'ব্যবসার বিবরণী ও ব্র্যান্ডিং' : 'Distributor Branding Setup'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                {language === 'bn' ? 'আপনার প্রতিষ্ঠানের নাম, লোগো ও বর্ণনা পরিবর্তন করুন যা ইনভয়েস এবং ড্যাশবোর্ডে প্রদর্শিত হবে' : 'Update the organization name, header, and logo displayed on sidebar and invoices'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'প্রতিষ্ঠানের নাম (ইংরেজি/বাংলা)' : 'Shop / Organization Name'}
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="e.g. Samir Enterprise"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold outline-none focus:border-slate-800 transition-all font-sans text-slate-800"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'উপ-শিরোনাম / ঠিকানা বা হাব' : 'Sub-heading / Hub Location'}
                </label>
                <input
                  type="text"
                  value={tempSub}
                  onChange={(e) => setTempSub(e.target.value)}
                  placeholder="e.g. Dhaka Hub"
                  className="h-11 w-full rounded-xl border border-slate-350 bg-white px-4 text-xs font-semibold outline-none focus:border-slate-800 transition-all font-sans text-slate-800"
                />
              </div>
            </div>

            {/* Logo Section */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                {language === 'bn' ? 'ব্র্যান্ড লোগো আপলোড' : 'Brand Logo / Icon'}
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-20 h-20 bg-white rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {tempLogo ? (
                    <img src={tempLogo} alt="Uploaded logo" className="w-full h-full object-cover" />
                  ) : (
                    <ClipboardList className="w-8 h-8 text-slate-400" />
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <p className="text-[11px] text-slate-500 font-semibold leading-normal">
                    {language === 'bn' ? 'জেপিজি, পিএনজি ফরম্যাটে সর্বোচ্চ ২এমবি পর্যন্ত ফাইল আপলোড করতে পারবেন।' : 'Select an image file. We will convert it and display on sidebar header immediately.'}
                  </p>
                  <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
                    <label className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer inline-block">
                      {language === 'bn' ? 'ফাইল সিলেক্ট করুন' : 'Choose Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {tempLogo && (
                      <button
                        type="button"
                        onClick={() => setTempLogo('')}
                        className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all border border-rose-150 cursor-pointer"
                      >
                        {language === 'bn' ? 'রিমুভ করুন' : 'Remove Image'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-6 text-xs font-bold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm transition-all active:scale-95"
              >
                {language === 'bn' ? 'ব্র্যান্ডিং সংরক্ষণ করুন' : 'Save branding settings'}
              </button>
            </div>
          </form>

          {/* Sidebar System parameters */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800">
                {language === 'bn' ? 'সিস্টেম অ্যাকশন' : 'Database & Operations'}
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold leading-normal">
                {language === 'bn' ? 'নতুন করে ইনভেন্টরি শুরু করতে বা সমস্ত পরিবর্তন মুছতে ডেটাবেস রিসেট করতে পারেন।' : 'Reset local storage modifications if you wish to wipe current log and restore the clean initial demo seed data.'}
              </p>
              
              <button
                type="button"
                onClick={handleResetDatabase}
                className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold cursor-pointer transition-all active:scale-95"
              >
                {language === 'bn' ? 'ডাটাবেস ফ্যাক্টরি রিসেট' : 'Factory Reset Local DB'}
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800">
                {language === 'bn' ? 'সিস্টেম স্ট্যাটাস' : 'System Overview'}
              </h3>
              <div className="space-y-2 text-xs font-semibold">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Core Engine:</span>
                  <span className="text-slate-700">Bangla-Chain ERP v3.1</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Local Timezone:</span>
                  <span className="text-slate-700">GMT+06:00 (BST)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Storage Provider:</span>
                  <span className="text-emerald-600">Local Hydrated Cache</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <DirectoryModule
          key="settings-godowns"
          {...directoryBaseProps}
          defaultTab="godowns"
          visibleTabs={['godowns']}
          pageTitle={language === 'bn' ? 'গুদাম ও সিস্টেম সেটিংস' : 'Warehouse Godowns'}
          pageSubtitle={language === 'bn' ? 'গুদাম ও স্থানসমূহ পরিচালনা' : 'Warehouse & system settings'}
        />
      )}
    </div>
  );
}
