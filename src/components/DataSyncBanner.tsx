'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, Play } from 'lucide-react';
import { useLocalStorageMigration } from '../hooks/useLocalStorageMigration';

interface DataSyncBannerProps {
  language: 'en' | 'bn';
}

export default function DataSyncBanner({ language }: DataSyncBannerProps) {
  const { migrate, loading, progress, error, success } = useLocalStorageMigration();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const keys = ['erp_products', 'erp_challans', 'erp_srs', 'erp_customers', 'erp_companies'];
      const hasLocalData = keys.some(k => {
        try {
          const item = localStorage.getItem(k);
          return item && JSON.parse(item).length > 0;
        } catch {
          return false;
        }
      });
      // Show only if legacy data exists and we haven't already marked it migrated/cleared
      setShowBanner(hasLocalData && localStorage.getItem('erp_seeded') !== 'cleared');
    }
  }, []);

  const handleSync = async () => {
    await migrate();
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          // Clear legacy data markers and reload page to pull fresh database records
          localStorage.setItem('erp_seeded', 'cleared');
          window.location.reload();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (!showBanner) return null;

  return (
    <div className="relative overflow-hidden border border-amber-200/50 bg-gradient-to-r from-amber-50/90 via-amber-100/40 to-amber-50/90 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md transition-all duration-300">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-300/10 blur-xl animate-pulse" />

      <div className="flex items-start gap-3 flex-1">
        <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 animate-pulse">
          <AlertTriangle className="w-5 h-5 shrink-0" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
            {language === 'bn' ? 'অফলাইন ডেটা সনাক্ত করা হয়েছে!' : 'Offline Local Data Detected!'}
          </h4>
          <p className="text-xs text-amber-800 font-semibold leading-relaxed max-w-2xl">
            {language === 'bn' 
              ? 'আপনার ব্রাউজারে অফলাইন ইআরপি ডেটা রয়েছে। এটিকে নতুন ক্লাউড ডাটাবেজে রূপান্তর করে সব ডিভাইসে সিঙ্ক করুন।'
              : 'You have local ERP records saved on this device. Sync them to the cloud database to access your data on any device.'}
          </p>
          
          {/* Progress / Status Log */}
          {(loading || progress || success || error) && (
            <div className="mt-2 text-xs flex items-center gap-2 font-mono">
              {loading && <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />}
              {success && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              <span className={success ? 'text-emerald-700 font-bold' : error ? 'text-rose-600 font-bold' : 'text-amber-800 font-medium'}>
                {success 
                  ? (language === 'bn' ? '✅ সিঙ্ক সফল! রিলোড হচ্ছে...' : '✅ Sync Successful! Reloading...')
                  : error 
                    ? `❌ ${error}`
                    : progress}
              </span>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={loading || success}
        onClick={handleSync}
        className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider shrink-0 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md select-none border border-amber-600/20 ${
          loading || success
            ? 'bg-amber-100 text-amber-400 cursor-not-allowed'
            : 'bg-amber-500 hover:bg-amber-600 text-white transform hover:scale-105 active:scale-95'
        }`}
      >
        {loading ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            {language === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...'}
          </>
        ) : success ? (
          <>
            <CheckCircle className="w-3.5 h-3.5" />
            {language === 'bn' ? 'সম্পন্ন' : 'Done'}
          </>
        ) : (
          <>
            <Play className="w-3 h-3 fill-white" />
            {language === 'bn' ? 'ক্লাউড ডাটাবেজে সিঙ্ক করুন' : 'Sync to Cloud Database'}
          </>
        )}
      </button>
    </div>
  );
}
