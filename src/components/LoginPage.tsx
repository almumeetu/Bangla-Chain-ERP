'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Eye, EyeOff, ArrowRight, Shield, Globe, ChevronDown, Check,
  KeyRound, CheckCircle2,
} from 'lucide-react';
import { Language } from '../translations';
import { supabase } from '../lib/supabase';
import { findSRByCredentials } from '../lib/db';

interface LoginPageProps {
  onLogin: (role: 'admin' | 'sr') => void;
}

const dict = {
  en: {
    welcome: 'Welcome back',
    subtitle: 'Sign in to access your distribution console.',
    registerTitle: 'Create Admin Account',
    registerSubtitle: 'Register a new B2B distributor admin console.',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    srUsername: 'SR Username',
    forgot: 'Forgot password?',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    signUp: 'Create Account',
    signingUp: 'Creating...',
    toggleToRegister: "Don't have an admin account? Create one",
    toggleToLogin: 'Already registered? Sign in instead',
    tabAdmin: 'Admin',
    tabSR: 'SR Login',
    errorRequired: 'Please fill in all fields.',
    errorInvalid: 'Invalid credentials. Please try again.',
    errorPasswordMatch: 'Passwords do not match.',
    errorMinPassword: 'Password must be at least 6 characters.',
    rights: 'All Rights Reserved',
    security: 'Enterprise-grade security • Data encrypted in cloud',
    resetEmailSent: 'Password reset email sent! Check your inbox.',
    resetEmailLabel: 'Enter your admin email',
    sendReset: 'Send Reset Link',
    sending: 'Sending...',
    backToLogin: 'Back to Sign In',
    forgotTitle: 'Reset Password',
    forgotSubtitle: 'We\'ll send a reset link to your email.',
  },
  bn: {
    welcome: 'স্বাগতম',
    subtitle: 'আপনার ডিস্ট্রিবিউশন কনসোলে প্রবেশ করতে সাইন-ইন করুন।',
    registerTitle: 'অ্যাডমিন অ্যাকাউন্ট তৈরি করুন',
    registerSubtitle: 'নতুন ডিস্ট্রিবিউটর অ্যাডমিন ড্যাশবোর্ড রেজিস্টার করুন।',
    email: 'ইমেইল',
    password: 'পাসওয়ার্ড',
    confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
    srUsername: 'SR ইউজারনেম',
    forgot: 'পাসওয়ার্ড ভুলে গেছেন?',
    signIn: 'সাইন ইন করুন',
    signingIn: 'সাইন ইন হচ্ছে...',
    signUp: 'অ্যাকাউন্ট তৈরি করুন',
    signingUp: 'তৈরি হচ্ছে...',
    toggleToRegister: 'অ্যাকাউন্ট নেই? নতুন অ্যাডমিন অ্যাকাউন্ট তৈরি করুন',
    toggleToLogin: 'ইতিমধ্যে রেজিস্টার করেছেন? সাইন ইন করুন',
    tabAdmin: 'অ্যাডমিন',
    tabSR: 'SR লগইন',
    errorRequired: 'অনুগ্রহ করে সব তথ্য পূরণ করুন।',
    errorInvalid: 'ইউজারনেম বা পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করুন।',
    errorPasswordMatch: 'পাসওয়ার্ড দুটি মিলছে না।',
    errorMinPassword: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে।',
    rights: 'সর্বস্বত্ব সংরক্ষিত',
    security: 'এন্টারপ্রাইজ-গ্রেড সিকিউরিটি • ডেটা ক্লাউডে সুরক্ষিত',
    resetEmailSent: 'পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে! আপনার ইমেইল চেক করুন।',
    resetEmailLabel: 'আপনার অ্যাডমিন ইমেইল লিখুন',
    sendReset: 'রিসেট লিংক পাঠান',
    sending: 'পাঠানো হচ্ছে...',
    backToLogin: 'লগইন পেজে ফিরে যান',
    forgotTitle: 'পাসওয়ার্ড রিসেট',
    forgotSubtitle: 'আপনার ইমেইলে একটি রিসেট লিংক পাঠানো হবে।',
  },
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [language, setLanguage]     = useState<Language>('en');
  const [langOpen, setLangOpen]     = useState(false);
  const [loginTab, setLoginTab]     = useState<'admin' | 'sr'>('admin');
  const [isRegistering, setIsRegistering] = useState(false);

  // Admin login
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // SR login
  const [srUsername, setSrUsername] = useState('');
  const [srPassword, setSrPassword] = useState('');
  const [showSrPass, setShowSrPass] = useState(false);

  // Register
  const [regEmail,           setRegEmail]           = useState('');
  const [regPassword,        setRegPassword]        = useState('');
  const [regConfirm,         setRegConfirm]         = useState('');
  const [showRegPass,        setShowRegPass]        = useState(false);
  const [showRegConfirm,     setShowRegConfirm]     = useState(false);

  // Forgot password
  const [showForgot,      setShowForgot]      = useState(false);
  const [forgotEmail,     setForgotEmail]     = useState('');
  const [forgotSent,      setForgotSent]      = useState(false);
  const [forgotLoading,   setForgotLoading]   = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');

  const t = dict[language];

  // Persist language preference
  useEffect(() => {
    const saved = localStorage.getItem('erp_language');
    if (saved === 'en' || saved === 'bn') setLanguage(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem('erp_language', language);
  }, [language]);

  const inputClass = (focused: boolean) =>
    `w-full h-11 px-4 rounded-lg border bg-white text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 ${
      focused
        ? 'border-slate-900 ring-2 ring-slate-900/5'
        : 'border-slate-200 hover:border-slate-300'
    }`;

  // ── Admin sign-in via Supabase Auth ──────────────────────────────
  const handleAdminLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError(t.errorRequired); return; }
    setIsLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setIsLoading(false);
    if (err) { setError(t.errorInvalid); return; }
    onLogin('admin');
  }, [email, password, t, onLogin]);

  // ── SR sign-in via custom srs table ─────────────────────────────
  const handleSRLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srUsername.trim() || !srPassword.trim()) { setError(t.errorRequired); return; }
    setIsLoading(true); setError('');
    try {
      const sr = await findSRByCredentials(srUsername.trim(), srPassword);
      if (!sr) { setError(t.errorInvalid); setIsLoading(false); return; }
      // Store SR identity in sessionStorage (no Supabase Auth session for SRs)
      sessionStorage.setItem('erp_sr_id',   sr.id);
      sessionStorage.setItem('erp_sr_name', sr.name);
      onLogin('sr');
    } catch {
      setError(t.errorInvalid);
    }
    setIsLoading(false);
  }, [srUsername, srPassword, t, onLogin]);

  // ── Admin registration via Supabase Auth ─────────────────────────
  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword.trim() || !regConfirm.trim()) { setError(t.errorRequired); return; }
    if (regPassword.length < 6) { setError(t.errorMinPassword); return; }
    if (regPassword !== regConfirm) { setError(t.errorPasswordMatch); return; }
    setIsLoading(true); setError('');
    const { error: err } = await supabase.auth.signUp({
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setIsLoading(false);
    if (err) { setError(err.message); return; }
    // Auto sign in after registration
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
    });
    if (signInErr) {
      setError(language === 'bn'
        ? 'অ্যাকাউন্ট তৈরি হয়েছে। এখন লগইন করুন।'
        : 'Account created. Please sign in.');
      setIsRegistering(false);
      return;
    }
    onLogin('admin');
  }, [regEmail, regPassword, regConfirm, t, language, onLogin]);

  // ── Forgot password — Supabase sends reset email ─────────────────
  const handleForgotPassword = useCallback(async () => {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    await supabase.auth.resetPasswordForEmail(forgotEmail.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/admin/dashboard`,
    });
    setForgotLoading(false);
    setForgotSent(true);
  }, [forgotEmail]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex font-sans" onClick={() => langOpen && setLangOpen(false)}>

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[55%] bg-slate-950 relative overflow-hidden flex-col justify-between p-12 select-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-16 w-56 h-56 bg-white/[0.03] rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-slate-950 font-bold text-lg">D</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">DillerPro</span>
          </div>
          <p className="text-slate-500 text-[10px] font-bold tracking-wider uppercase mt-1">FMCG Distribution Management</p>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              {language === 'bn' ? 'ক্লাউড-পাওয়ার্ড • যেকোনো ডিভাইসে' : 'Cloud-powered • Any device'}
            </span>
          </div>
          <h1 className="text-white text-[2rem] font-bold leading-tight tracking-tight mb-4">
            {language === 'bn'
              ? <>চালান থেকে মুনাফা পর্যন্ত —<br /><span className="text-slate-400">সব এক জায়গায়।<br />রিয়েল-টাইমে।</span></>
              : <>From challan to profit —<br /><span className="text-slate-400">everything in one place.<br />In real time.</span></>}
          </h1>
          <div className="space-y-2.5">
            {(language === 'bn' ? [
              { icon: '☁️', label: 'ক্লাউড সিঙ্ক', sub: 'যেকোনো ডিভাইস থেকে ডেটা পাবেন' },
              { icon: '📦', label: 'স্টক ও গুদাম নিয়ন্ত্রণ', sub: 'রিয়েল-টাইম ইনভেন্টরি ট্র্যাকিং' },
              { icon: '🧾', label: 'ডেলিভারি চালান ও SR ম্যানেজমেন্ট', sub: 'প্রিন্টযোগ্য চালান শিট' },
              { icon: '💰', label: 'মুনাফা ও খরচ হিসাব', sub: 'অটো লাভ-ক্ষতি ক্যালকুলেটর' },
            ] : [
              { icon: '☁️', label: 'Cloud Sync', sub: 'Access data from any device' },
              { icon: '📦', label: 'Stock & Warehouse Control', sub: 'Real-time inventory tracking' },
              { icon: '🧾', label: 'Delivery Challan & SR Management', sub: 'Printable challan sheets' },
              { icon: '💰', label: 'Profit & Expense Accounting', sub: 'Auto profit-loss calculator' },
            ]).map(item => (
              <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <span className="text-base">{item.icon}</span>
                <div>
                  <p className="text-white text-xs font-semibold leading-tight">{item.label}</p>
                  <p className="text-slate-500 text-[10px] font-medium mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3 text-slate-600 text-xs font-semibold">
            <Shield className="w-4 h-4" />
            <span>{t.security}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-[10px] font-semibold">{language === 'bn' ? 'তৈরি করেছেন' : 'Made by'}</span>
            <a href="https://almumeetusaikat.me" target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-bold text-white/80 hover:text-white transition-colors underline underline-offset-2 decoration-slate-600 hover:decoration-white">
              Al Mumeetu Saikat
            </a>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col justify-between px-6 py-8 relative">

        {/* Language switcher */}
        <div className="flex justify-end pr-2" onClick={e => e.stopPropagation()}>
          <div className="relative">
            <button type="button" onClick={() => setLangOpen(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all cursor-pointer bg-white">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              {language === 'bn' ? 'বাংলা' : 'English'}
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50 text-xs font-semibold">
                <button type="button" onClick={() => { setLanguage('en'); setLangOpen(false); }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${language === 'en' ? 'text-slate-900' : 'text-slate-500'}`}>
                  English {language === 'en' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button type="button" onClick={() => { setLanguage('bn'); setLangOpen(false); }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${language === 'bn' ? 'text-slate-900' : 'text-slate-500'}`}>
                  বাংলা {language === 'bn' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center my-6">
          <div className="w-full max-w-sm">

            {/* Mobile brand */}
            <div className="lg:hidden mb-8 text-center select-none">
              <div className="flex items-center justify-center gap-2.5 mb-2">
                <div className="w-9 h-9 bg-slate-950 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <span className="text-slate-900 font-semibold text-lg tracking-tight">DillerPro</span>
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">FMCG Distribution Management</p>
            </div>

            {/* Form header */}
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {isRegistering ? t.registerTitle : t.welcome}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {isRegistering ? t.registerSubtitle : t.subtitle}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs font-semibold text-red-600">{error}</p>
              </div>
            )}

            {/* ── Admin / SR tab switcher (only on login, not register) ── */}
            {!isRegistering && (
              <div className="flex mb-5 bg-slate-100 rounded-lg p-1 gap-1">
                <button type="button"
                  onClick={() => { setLoginTab('admin'); setError(''); }}
                  className={`flex-1 h-8 rounded-md text-[11px] font-bold transition-all cursor-pointer ${loginTab === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {t.tabAdmin}
                </button>
                <button type="button"
                  onClick={() => { setLoginTab('sr'); setError(''); }}
                  className={`flex-1 h-8 rounded-md text-[11px] font-bold transition-all cursor-pointer ${loginTab === 'sr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {t.tabSR}
                </button>
              </div>
            )}

            {/* ── ADMIN LOGIN ── */}
            {!isRegistering && loginTab === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">{t.email}</label>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="admin@example.com" autoComplete="email" autoFocus
                    className={inputClass(false)} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-700">{t.password}</label>
                    <button type="button" onClick={() => { setShowForgot(true); setForgotSent(false); setForgotEmail(email); }}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                      {t.forgot}
                    </button>
                  </div>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="••••••••" autoComplete="current-password"
                      className={`${inputClass(false)} pr-11`} />
                    <button type="button" onClick={() => setShowPassword(p => !p)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isLoading}
                  className={`w-full h-11 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${isLoading ? 'bg-slate-400 text-white cursor-wait' : 'bg-slate-950 hover:bg-slate-800 text-white shadow-sm active:scale-[0.98]'}`}>
                  {isLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.signingIn}</> : <>{t.signIn}<ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {/* ── SR LOGIN ── */}
            {!isRegistering && loginTab === 'sr' && (
              <form onSubmit={handleSRLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">{t.srUsername}</label>
                  <input type="text" value={srUsername} onChange={e => { setSrUsername(e.target.value); setError(''); }}
                    placeholder={language === 'bn' ? 'যেমন: rakib' : 'e.g. rakib'} autoComplete="username" autoFocus
                    className={inputClass(false)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">{t.password}</label>
                  <div className="relative">
                    <input type={showSrPass ? 'text' : 'password'} value={srPassword}
                      onChange={e => { setSrPassword(e.target.value); setError(''); }}
                      placeholder="••••••••" autoComplete="current-password"
                      className={`${inputClass(false)} pr-11`} />
                    <button type="button" onClick={() => setShowSrPass(p => !p)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showSrPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isLoading}
                  className={`w-full h-11 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${isLoading ? 'bg-slate-400 text-white cursor-wait' : 'bg-slate-950 hover:bg-slate-800 text-white shadow-sm active:scale-[0.98]'}`}>
                  {isLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.signingIn}</> : <>{t.signIn}<ArrowRight className="w-4 h-4" /></>}
                </button>
                <p className="text-center text-[10px] text-slate-400 font-medium">
                  {language === 'bn' ? 'SR পাসওয়ার্ড ভুললে Admin-কে জানান।' : 'Forgot SR password? Contact your Admin.'}
                </p>
              </form>
            )}

            {/* ── REGISTER ── */}
            {isRegistering && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">{t.email}</label>
                  <input type="email" value={regEmail} onChange={e => { setRegEmail(e.target.value); setError(''); }}
                    placeholder="admin@example.com" autoComplete="email" autoFocus
                    className={inputClass(false)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">{t.password}</label>
                  <div className="relative">
                    <input type={showRegPass ? 'text' : 'password'} value={regPassword}
                      onChange={e => { setRegPassword(e.target.value); setError(''); }}
                      placeholder="••••••••" autoComplete="new-password"
                      className={`${inputClass(false)} pr-11`} />
                    <button type="button" onClick={() => setShowRegPass(p => !p)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">{t.confirmPassword}</label>
                  <div className="relative">
                    <input type={showRegConfirm ? 'text' : 'password'} value={regConfirm}
                      onChange={e => { setRegConfirm(e.target.value); setError(''); }}
                      placeholder="••••••••" autoComplete="new-password"
                      className={`${inputClass(false)} pr-11`} />
                    <button type="button" onClick={() => setShowRegConfirm(p => !p)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isLoading}
                  className={`w-full h-11 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${isLoading ? 'bg-slate-400 text-white cursor-wait' : 'bg-slate-950 hover:bg-slate-800 text-white shadow-sm active:scale-[0.98]'}`}>
                  {isLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.signingUp}</> : <>{t.signUp}<ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {/* Toggle register/login */}
            {loginTab === 'admin' && (
              <div className="mt-5 text-center">
                <button onClick={() => { setIsRegistering(r => !r); setError(''); }}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                  {isRegistering ? t.toggleToLogin : t.toggleToRegister}
                </button>
              </div>
            )}

          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400 font-bold select-none">
          &copy; 2026 DillerPro &bull; {t.rights} &bull;{' '}
          <a href="https://almumeetusaikat.me" target="_blank" rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-700 transition-colors underline underline-offset-2">
            Al Mumeetu Saikat
          </a>
        </p>
      </div>

      {/* ── Forgot Password Modal ── */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowForgot(false)}>
          <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{t.forgotTitle}</h3>
                <p className="text-[10px] font-semibold text-slate-400">{t.forgotSubtitle}</p>
              </div>
            </div>
            <div className="px-6 py-5">
              {forgotSent ? (
                <div className="text-center py-3">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    {language === 'bn' ? 'ইমেইল পাঠানো হয়েছে!' : 'Email sent!'}
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mb-5">{t.resetEmailSent}</p>
                  <button onClick={() => setShowForgot(false)}
                    className="w-full h-10 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all">
                    {t.backToLogin}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">{t.resetEmailLabel}</label>
                    <input type="email" value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="admin@example.com" autoFocus
                      className="w-full h-11 px-4 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5 bg-white text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400"
                      onKeyDown={e => e.key === 'Enter' && handleForgotPassword()} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowForgot(false)}
                      className="flex-1 h-10 rounded-lg border border-slate-200 text-slate-500 text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-all">
                      {language === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button type="button" onClick={handleForgotPassword} disabled={forgotLoading}
                      className="flex-1 h-10 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:bg-slate-400">
                      {forgotLoading
                        ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.sending}</>
                        : t.sendReset}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
