'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Box } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  
  // UI states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');

  // Restore language choice
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_language');
      if (saved === 'en' || saved === 'bn') {
        setLanguage(saved);
      }
    }
  }, []);

  const bn = language === 'bn';

  // Check if we have an active recovery session
  useEffect(() => {
    const checkSession = async () => {
      // Small timeout to allow Supabase SDK to parse token from hash fragments
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
      } else {
        setHasSession(false);
        setErrorMsg(
          bn 
            ? 'পাসওয়ার্ড রিসেট লিংকটি অবৈধ অথবা এটার মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে নতুন লিংকের জন্য অনুরোধ করুন।' 
            : 'The password reset link is invalid or has expired. Please request a new link.'
        );
      }
      setCheckingSession(false);
    };

    checkSession();
  }, [bn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password.length < 6) {
      setErrorMsg(
        bn 
          ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' 
          : 'Password must be at least 6 characters long.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(
        bn 
          ? 'পাসওয়ার্ড দুটি মিলছে না।' 
          : 'Passwords do not match.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw error;
      }
      
      setSuccessMsg(
        bn 
          ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! আপনাকে ড্যাশবোর্ডে রিডাইরেক্ট করা হচ্ছে...' 
          : 'Password updated successfully! Redirecting to dashboard...'
      );
      
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = 'w-full h-11 px-4 rounded-none border border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5 bg-white text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400';

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-none animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
            {bn ? 'যাচাই করা হচ্ছে...' : 'Verifying session...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#fafafa] flex items-center justify-center p-4 ${bn ? 'font-bengali' : 'font-sans'}`}>
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 relative">
        
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-6 select-none">
          <div className="w-10 h-10 bg-slate-950 flex items-center justify-center shadow-lg mb-2.5">
            <Box className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
            {bn ? 'নতুন পাসওয়ার্ড সেট করুন' : 'Reset Your Password'}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Bangla Chain ERP
          </p>
        </div>

        {/* Success Screen */}
        {successMsg ? (
          <div className="text-center py-4 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <p className="text-sm font-bold text-slate-900">
              {bn ? 'পাসওয়ার্ড রিসেট সফল!' : 'Reset Successful!'}
            </p>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              {successMsg}
            </p>
          </div>
        ) : !hasSession ? (
          /* Error Screen for Expired/Invalid Session */
          <div className="space-y-5 py-2">
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-none text-rose-800">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {bn ? 'লিংকটি অকার্যকর' : 'Invalid Link'}
                </h4>
                <p className="text-xs font-semibold leading-relaxed">
                  {errorMsg}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full h-11 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {bn ? 'লগইন পেজে ফিরে যান' : 'Back to Login'}
            </button>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="px-3 py-2.5 bg-rose-50 border border-rose-100 rounded-none text-xs font-semibold text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                {bn ? 'নতুন পাসওয়ার্ড' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                {bn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all disabled:bg-slate-400 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-none animate-spin" />}
              {bn ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
