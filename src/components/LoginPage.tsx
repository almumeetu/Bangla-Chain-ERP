'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Shield, Globe, ChevronDown, Check,
  KeyRound, CheckCircle2,
} from 'lucide-react';
import { Language } from '../translations';

interface LoginPageProps {
  onLogin: () => void;
}

const loginDict = {
  en: {
    welcome: 'Welcome back',
    subtitle: 'Sign in to access your distribution console.',
    registerTitle: 'Create Admin Account',
    registerSubtitle: 'Register a new B2B distributor admin console.',
    email: 'Email / Username',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgot: 'Forgot password?',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    signUp: 'Create Account',
    signingUp: 'Creating account...',
    toggleToRegister: "Don't have an admin account? Create one",
    toggleToLogin: 'Already registered? Sign in instead',
    errorRequired: 'Please enter both username and password.',
    errorInvalid: 'Invalid credentials. Please try again.',
    errorPasswordMatch: 'Passwords do not match.',
    errorRegisterRequired: 'Please fill in all fields.',
    rights: 'All Rights Reserved',
    security: 'Enterprise-grade security • Data encrypted locally',
    descMain: 'Manage your wholesale distribution, track inventory, generate delivery challans, process procurement invoices, and analyze profitability — all from one unified dashboard.',
  },
  bn: {
    welcome: 'স্বাগতম',
    subtitle: 'আপনার ডিস্ট্রিবিউশন কনসোলে প্রবেশ করতে সাইন-ইন করুন।',
    registerTitle: 'অ্যাডমিন অ্যাকাউন্ট তৈরি করুন',
    registerSubtitle: 'নতুন ডিস্ট্রিবিউটর অ্যাডমিন ড্যাশবোর্ড রেজিস্টার করুন।',
    email: 'ইমেইল / ইউজারনেম',
    password: 'পাসওয়ার্ড',
    confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
    forgot: 'পাসওয়ার্ড ভুলে গেছেন?',
    signIn: 'সাইন ইন করুন',
    signingIn: 'সাইন ইন হচ্ছে...',
    signUp: 'অ্যাকাউন্ট তৈরি করুন',
    signingUp: 'অ্যাকাউন্ট তৈরি হচ্ছে...',
    toggleToRegister: 'অ্যাকাউন্ট নেই? নতুন অ্যাডমিন অ্যাকাউন্ট তৈরি করুন',
    toggleToLogin: 'ইতিমধ্যে রেজিস্টার করেছেন? সাইন ইন করুন',
    errorRequired: 'অনুগ্রহ করে ইউজারনেম এবং পাসওয়ার্ড দুটিই লিখুন।',
    errorInvalid: 'ইউজারনেম বা পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করুন।',
    errorPasswordMatch: 'পাসওয়ার্ড দুটি মিলছে না। আবার চেষ্টা করুন।',
    errorRegisterRequired: 'অনুগ্রহ করে সব তথ্য পূরণ করুন।',
    rights: 'সর্বস্বত্ব সংরক্ষিত',
    security: 'এন্টারপ্রাইজ-গ্রেড সিকিউরিটি • ডেটা স্থানীয়ভাবে সুরক্ষিত',
    descMain: 'পাইকারি সরবরাহ পরিচালনা করুন, স্টক নিয়ন্ত্রণ করুন, চালান জেনারেট করুন, প্রকিউরমেন্ট রসিদ তৈরি করুন এবং রিয়েল-টাইমে মুনাফা বিশ্লেষণ করুন — সব একটি ড্যাশবোর্ড থেকে।',
  },
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [language, setLanguage] = useState<Language>('bn');
  const [langOpen, setLangOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const [isRegistering,       setIsRegistering]       = useState(false);
  const [regEmail,            setRegEmail]            = useState('');
  const [regPassword,         setRegPassword]         = useState('');
  const [regConfirmPassword,  setRegConfirmPassword]  = useState('');
  const [showRegPassword,     setShowRegPassword]     = useState(false);
  const [showRegConfirm,      setShowRegConfirm]      = useState(false);
  const [regFocused,          setRegFocused]          = useState<string | null>(null);

  const [showForgotModal,       setShowForgotModal]       = useState(false);
  const [forgotStep,            setForgotStep]            = useState<1 | 2 | 3>(1);
  const [forgotEmail,           setForgotEmail]           = useState('');
  const [forgotAccountType,     setForgotAccountType]     = useState<'admin-default' | 'admin-custom' | 'sr' | null>(null);
  const [forgotSrName,          setForgotSrName]          = useState('');
  const [forgotVerifyAnswer,    setForgotVerifyAnswer]    = useState('');
  const [forgotNewPassword,     setForgotNewPassword]     = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError,           setForgotError]           = useState('');
  const [forgotSuccess,         setForgotSuccess]         = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_language');
      if (saved) setLanguage(saved as Language);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_language', language);
    }
  }, [language, isLoaded]);

  const handleTogglePassword = useCallback(() => setShowPassword(p => !p), []);
  const handleEmailChange    = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setEmail(e.target.value); setError(''); }, []);
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setPassword(e.target.value); setError(''); }, []);
  const handleToggleLang     = useCallback(() => setLangOpen(p => !p), []);
  const handleSelectEnglish  = useCallback(() => { setLanguage('en'); setLangOpen(false); }, []);
  const handleSelectBangla   = useCallback(() => { setLanguage('bn'); setLangOpen(false); }, []);

  const handleRegisterSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword.trim() || !regConfirmPassword.trim()) {
      setError(loginDict[language].errorRegisterRequired); return;
    }
    if (regPassword !== regConfirmPassword) {
      setError(loginDict[language].errorPasswordMatch); return;
    }
    setIsLoading(true); setError('');
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          const saved  = localStorage.getItem('erp_admins');
          const admins = saved ? JSON.parse(saved) : [];
          if (admins.some((a: any) => a.email === regEmail)) {
            setError(language === 'bn' ? 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট তৈরি করা হয়েছে।' : 'An account with this email already exists.');
            setIsLoading(false); return;
          }
          localStorage.setItem('erp_admins', JSON.stringify([...admins, { email: regEmail, password: regPassword }]));
          alert(language === 'bn' ? 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! এখন লগইন করুন।' : 'Account created! You can now log in.');
          setEmail(regEmail); setPassword(''); setIsRegistering(false);
          setRegEmail(''); setRegPassword(''); setRegConfirmPassword('');
        } catch (err) { console.error('Registration error:', err); }
      }
      setIsLoading(false);
    }, 800);
  }, [regEmail, regPassword, regConfirmPassword, language]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError(loginDict[language].errorRequired); return; }
    setIsLoading(true); setError('');
    setTimeout(() => {
      let isCustomAdmin = false;
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('erp_admins');
          if (saved) {
            const admins = JSON.parse(saved);
            if (Array.isArray(admins)) isCustomAdmin = admins.some((a: any) => a.email === email && a.password === password);
          }
        } catch (err) { console.error('erp_admins parse error:', err); }
      }
      const isAdmin = (email === 'admin' && password === 'admin') || isCustomAdmin;

      let isCustomSR = false;
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('erp_srs');
          if (saved) {
            const srs = JSON.parse(saved);
            if (Array.isArray(srs)) {
              const found = srs.find((s: any) => s.loginUsername && s.loginUsername === email && s.loginPassword === password);
              if (found) isCustomSR = true;
            }
          }
        } catch (err) { console.error('erp_srs parse error:', err); }
      }
      const builtinSRs = [
        { user: 'rakib',  pass: 'rakib123'  },
        { user: 'rahman', pass: 'rahman123' },
        { user: 'rahim',  pass: 'rahim123'  },
      ];
      const isBuiltinSR = builtinSRs.some(sr => sr.user === email && sr.pass === password);
      const isSR = isBuiltinSR || isCustomSR;

      if (isAdmin) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('erp_auth', 'true');
          localStorage.setItem('erp_user_role', 'admin');
          localStorage.setItem('erp_user_email', email);
        }
        onLogin();
      } else if (isSR) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('erp_auth', 'true');
          localStorage.setItem('erp_user_role', 'sr');
          localStorage.setItem('erp_user_email', email);
        }
        onLogin();
      } else {
        setError(loginDict[language].errorInvalid);
      }
      setIsLoading(false);
    }, 800);
  }, [email, password, language, onLogin]);

  const resetForgotState = () => {
    setForgotStep(1); setForgotEmail(''); setForgotAccountType(null); setForgotSrName('');
    setForgotVerifyAnswer(''); setForgotNewPassword(''); setForgotConfirmPassword('');
    setForgotError(''); setForgotSuccess(false);
  };
  const openForgotModal  = () => { resetForgotState(); setShowForgotModal(true); };
  const closeForgotModal = () => { setShowForgotModal(false); resetForgotState(); };

  const handleForgotStep1 = () => {
    setForgotError('');
    const input = forgotEmail.trim().toLowerCase();
    if (!input) { setForgotError(language === 'bn' ? 'অনুগ্রহ করে ইউজারনেম/ইমেইল লিখুন।' : 'Please enter your username/email.'); return; }
    if (input === 'admin') { setForgotAccountType('admin-default'); setForgotStep(2); return; }
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('erp_admins');
        if (saved) {
          const admins = JSON.parse(saved);
          if (Array.isArray(admins) && admins.find((a: any) => a.email?.toLowerCase() === input)) {
            setForgotAccountType('admin-custom'); setForgotStep(2); return;
          }
        }
      } catch { /* ignore */ }
      try {
        const saved = localStorage.getItem('erp_srs');
        if (saved) {
          const srs = JSON.parse(saved);
          if (Array.isArray(srs)) {
            const found = srs.find((s: any) => s.loginUsername?.toLowerCase() === input);
            if (found) { setForgotAccountType('sr'); setForgotSrName(found.name || input); setForgotStep(2); return; }
          }
        }
      } catch { /* ignore */ }
      const builtinSRNames: Record<string, string> = { rakib: 'SR — Rakib', rahman: 'SR — Rahman', rahim: 'SR — Rahim' };
      if (builtinSRNames[input]) { setForgotAccountType('sr'); setForgotSrName(builtinSRNames[input]); setForgotStep(2); return; }
    }
    setForgotError(language === 'bn' ? 'এই ইউজারনেম/ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।' : 'No account found with this username/email.');
  };

  const handleForgotStep2 = () => {
    setForgotError('');
    if (forgotVerifyAnswer.trim().toUpperCase() !== 'RESET') {
      setForgotError(language === 'bn' ? 'নিশ্চিতকরণের জন্য "RESET" টাইপ করুন।' : 'Please type "RESET" to confirm.');
      return;
    }
    setForgotStep(3);
  };

  const handleForgotStep3 = () => {
    setForgotError('');
    if (!forgotNewPassword.trim() || !forgotConfirmPassword.trim()) {
      setForgotError(language === 'bn' ? 'দুটি ফিল্ডই পূরণ করুন।' : 'Please fill both fields.'); return;
    }
    if (forgotNewPassword.length < 3) {
      setForgotError(language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৩ অক্ষর হতে হবে।' : 'Password must be at least 3 characters.'); return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError(language === 'bn' ? 'পাসওয়ার্ড দুটি মিলছে না।' : 'Passwords do not match.'); return;
    }
    const inputEmail = forgotEmail.trim().toLowerCase();
    if (typeof window !== 'undefined') {
      try {
        if (forgotAccountType === 'admin-default') {
          const saved  = localStorage.getItem('erp_admins');
          const admins = saved ? JSON.parse(saved) : [];
          const filtered = admins.filter((a: any) => a.email?.toLowerCase() !== 'admin');
          filtered.push({ email: inputEmail, password: forgotNewPassword });
          localStorage.setItem('erp_admins', JSON.stringify(filtered));
        } else if (forgotAccountType === 'admin-custom') {
          const saved  = localStorage.getItem('erp_admins');
          const admins = saved ? JSON.parse(saved) : [];
          localStorage.setItem('erp_admins', JSON.stringify(
            admins.map((a: any) => a.email?.toLowerCase() === inputEmail ? { ...a, password: forgotNewPassword } : a)
          ));
        } else if (forgotAccountType === 'sr') {
          const saved = localStorage.getItem('erp_srs');
          if (saved) {
            const srs = JSON.parse(saved);
            localStorage.setItem('erp_srs', JSON.stringify(
              srs.map((s: any) => s.loginUsername?.toLowerCase() === inputEmail ? { ...s, loginPassword: forgotNewPassword } : s)
            ));
          }
        }
        setForgotSuccess(true);
        setEmail(forgotEmail.trim()); setPassword('');
      } catch (err) {
        console.error('Forgot password error:', err);
        setForgotError(language === 'bn' ? 'একটি ত্রুটি হয়েছে। আবার চেষ্টা করুন।' : 'An error occurred. Please try again.');
      }
    }
  };

  if (!isLoaded) return null;

  const t = loginDict[language];
  const inputClass = (focused: boolean) =>
    `w-full h-11 px-4 rounded-lg border bg-white text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 ${
      focused ? 'border-slate-900 ring-2 ring-slate-900/5' : 'border-slate-200 hover:border-slate-300'
    }`;

  return (
    <div className="min-h-screen bg-[#fafafa] flex font-sans" onClick={() => langOpen && setLangOpen(false)}>

      {/* ── Left Panel — Brand + Info ── */}
      <div className="hidden lg:flex lg:w-[55%] bg-slate-950 relative overflow-hidden flex-col justify-between p-12 select-none">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-16 w-56 h-56 bg-white/[0.03] rounded-full blur-2xl" />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-slate-950 font-bold text-lg">D</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">DillerPro</span>
          </div>
          <p className="text-slate-500 text-[10px] font-bold tracking-wider uppercase mt-1">FMCG Distribution Management</p>
        </div>

        {/* Center messaging */}
        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              {language === 'bn' ? 'বাংলাদেশের #১ ডিস্ট্রিবিউটর সফটওয়্যার' : 'Bangladesh\'s Distributor ERP'}
            </span>
          </div>

          <h1 className="text-white text-[2rem] font-bold leading-tight tracking-tight mb-4">
            {language === 'bn'
              ? <>চালান থেকে মুনাফা পর্যন্ত —<br /><span className="text-slate-400">সব এক জায়গায়।<br />রিয়েল-টাইমে।</span></>
              : <>From challan to profit —<br /><span className="text-slate-400">everything in one place.<br />In real time.</span></>
            }
          </h1>

          <p className="text-slate-500 text-xs leading-relaxed font-medium mb-8">
            {language === 'bn'
              ? 'পাইকারি ডিলারদের জন্য তৈরি সম্পূর্ণ ব্যবস্থাপনা সফটওয়্যার। SR-ওয়াইজ বিক্রয়, গুদাম স্টক, কোম্পানি চালান, প্রকিউরমেন্ট ও দৈনিক খরচ — সব লাইভ ডেটায় ট্র্যাক করুন।'
              : 'Built for FMCG wholesale dealers. Track SR-wise sales, warehouse stock, company challans, procurement invoices, and daily expenses — all on live data.'
            }
          </p>

          <div className="space-y-2.5">
            {(language === 'bn' ? [
              { icon: '📦', label: 'স্টক ও গুদাম নিয়ন্ত্রণ', sub: 'রিয়েল-টাইম ইনভেন্টরি ট্র্যাকিং' },
              { icon: '🧾', label: 'ডেলিভারি চালান ও SR ম্যানেজমেন্ট', sub: 'প্রিন্টযোগ্য চালান শিট' },
              { icon: '💰', label: 'মুনাফা ও খরচ হিসাব', sub: 'অটো লাভ-ক্ষতি ক্যালকুলেটর' },
            ] : [
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

        {/* Footer — maker credit */}
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3 text-slate-600 text-xs font-semibold">
            <Shield className="w-4 h-4" />
            <span>{t.security}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-[10px] font-semibold">
              {language === 'bn' ? 'তৈরি করেছেন' : 'Made by'}
            </span>
            <a
              href="https://almumeetusaikat.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-white/80 hover:text-white transition-colors underline underline-offset-2 decoration-slate-600 hover:decoration-white"
            >
              Al Mumeetu Saikat
            </a>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex flex-col justify-between px-6 py-8 relative">

        {/* Language switcher */}
        <div className="flex justify-end pr-2" onClick={e => e.stopPropagation()}>
          <div className="relative">
            <button
              type="button"
              onClick={handleToggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all cursor-pointer bg-white"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              {language === 'bn' ? 'বাংলা' : 'English'}
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50 text-xs font-semibold">
                <button type="button" onClick={handleSelectEnglish}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${language === 'en' ? 'text-slate-900 bg-slate-50/50' : 'text-slate-500'}`}>
                  English {language === 'en' && <Check className="w-3.5 h-3.5 text-slate-800" />}
                </button>
                <button type="button" onClick={handleSelectBangla}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${language === 'bn' ? 'text-slate-900 bg-slate-50/50' : 'text-slate-500'}`}>
                  বাংলা {language === 'bn' && <Check className="w-3.5 h-3.5 text-slate-800" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center card */}
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
            <div className="mb-6">
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

            {/* ── Login Form ── */}
            {!isRegistering && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-2">{t.email}</label>
                  <input
                    id="login-email"
                    type="text"
                    value={email}
                    onChange={handleEmailChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder={language === 'bn' ? 'আপনার ইউজারনেম লিখুন' : 'Enter your username'}
                    autoComplete="username"
                    autoFocus
                    className={inputClass(focusedField === 'email')}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">{t.password}</label>
                    <button type="button" onClick={openForgotModal}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                      {t.forgot}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={handlePasswordChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={`${inputClass(focusedField === 'password')} pr-11`}
                    />
                    <button type="button" onClick={handleTogglePassword} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full h-11 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isLoading ? 'bg-slate-400 text-white cursor-wait' : 'bg-slate-950 hover:bg-slate-800 text-white active:scale-[0.98] shadow-sm'
                  }`}
                >
                  {isLoading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.signingIn}</>
                    : <>{t.signIn}<ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </form>
            )}

            {/* ── Register Form ── */}
            {isRegistering && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">{t.email}</label>
                  <input
                    type="text"
                    value={regEmail}
                    onChange={e => { setRegEmail(e.target.value); setError(''); }}
                    onFocus={() => setRegFocused('email')}
                    onBlur={() => setRegFocused(null)}
                    placeholder={language === 'bn' ? 'নতুন ইউজারনেম বা ইমেইল' : 'New username or email'}
                    autoComplete="username"
                    autoFocus
                    className={inputClass(regFocused === 'email')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">{t.password}</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={e => { setRegPassword(e.target.value); setError(''); }}
                      onFocus={() => setRegFocused('pass')}
                      onBlur={() => setRegFocused(null)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={`${inputClass(regFocused === 'pass')} pr-11`}
                    />
                    <button type="button" onClick={() => setShowRegPassword(p => !p)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">{t.confirmPassword}</label>
                  <div className="relative">
                    <input
                      type={showRegConfirm ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={e => { setRegConfirmPassword(e.target.value); setError(''); }}
                      onFocus={() => setRegFocused('confirm')}
                      onBlur={() => setRegFocused(null)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={`${inputClass(regFocused === 'confirm')} pr-11`}
                    />
                    <button type="button" onClick={() => setShowRegConfirm(p => !p)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                      {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full h-11 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isLoading ? 'bg-slate-400 text-white cursor-wait' : 'bg-slate-950 hover:bg-slate-800 text-white active:scale-[0.98] shadow-sm'
                  }`}
                >
                  {isLoading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.signingUp}</>
                    : <>{t.signUp}<ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </form>
            )}

            {/* Toggle */}
            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsRegistering(r => !r); setError(''); }}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                {isRegistering ? t.toggleToLogin : t.toggleToRegister}
              </button>
            </div>

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 font-bold select-none">
          &copy; 2026 DillerPro &bull; {t.rights} &bull;{' '}
          <a
            href="https://almumeetusaikat.me"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-700 transition-colors underline underline-offset-2"
          >
            Al Mumeetu Saikat
          </a>
        </p>
      </div>

      {/* ── Forgot Password Modal ── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={closeForgotModal}>
          <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'bn' ? 'পাসওয়ার্ড রিসেট' : 'Reset Password'}
                </h3>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {language === 'bn' ? `ধাপ ${forgotStep} / ৩` : `Step ${forgotStep} of 3`}
                </p>
              </div>
              {/* Progress dots */}
              <div className="ml-auto flex items-center gap-1.5">
                {[1, 2, 3].map(s => (
                  <div key={s} className={`w-2 h-2 rounded-full transition-all ${forgotStep >= s ? 'bg-slate-900' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>

            <div className="px-6 py-5">
              {forgotError && (
                <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs font-semibold text-red-600">{forgotError}</p>
                </div>
              )}

              {forgotSuccess ? (
                <div className="text-center py-3">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    {language === 'bn' ? 'পাসওয়ার্ড আপডেট হয়েছে!' : 'Password Updated!'}
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mb-5">
                    {language === 'bn' ? 'নতুন পাসওয়ার্ড দিয়ে লগইন করুন।' : 'You can now sign in with your new password.'}
                  </p>
                  <button onClick={closeForgotModal}
                    className="w-full h-10 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all">
                    {language === 'bn' ? 'লগইন পেজে যান' : 'Back to Sign In'}
                  </button>
                </div>
              ) : (
                <>
                  {forgotStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          {language === 'bn' ? 'ইউজারনেম / ইমেইল' : 'Username / Email'}
                        </label>
                        <input type="text" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                          placeholder={language === 'bn' ? 'আপনার ইউজারনেম লিখুন' : 'Enter your username'}
                          className="w-full h-11 px-4 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5 bg-white text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400"
                          autoFocus onKeyDown={e => e.key === 'Enter' && handleForgotStep1()} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={closeForgotModal}
                          className="flex-1 h-10 rounded-lg border border-slate-200 text-slate-500 text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-all">
                          {language === 'bn' ? 'বাতিল' : 'Cancel'}
                        </button>
                        <button onClick={handleForgotStep1}
                          className="flex-1 h-10 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5">
                          {language === 'bn' ? 'পরবর্তী' : 'Next'}<ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {forgotStep === 2 && (
                    <div className="space-y-4">
                      <div className="px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <p className="text-xs font-semibold text-slate-600">
                          {forgotAccountType === 'sr'
                            ? (language === 'bn' ? `অ্যাকাউন্ট: ${forgotSrName}` : `Account: ${forgotSrName}`)
                            : (language === 'bn' ? 'অ্যাডমিন অ্যাকাউন্ট পাওয়া গেছে।' : 'Admin account found.')}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          {language === 'bn' ? '"RESET" টাইপ করে নিশ্চিত করুন' : 'Type "RESET" to confirm'}
                        </label>
                        <input type="text" value={forgotVerifyAnswer} onChange={e => setForgotVerifyAnswer(e.target.value)}
                          placeholder="RESET"
                          className="w-full h-11 px-4 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5 bg-white text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400"
                          autoFocus onKeyDown={e => e.key === 'Enter' && handleForgotStep2()} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setForgotStep(1); setForgotError(''); setForgotVerifyAnswer(''); }}
                          className="flex-1 h-10 rounded-lg border border-slate-200 text-slate-500 text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5">
                          <ArrowLeft className="w-3.5 h-3.5" />{language === 'bn' ? 'পেছনে' : 'Back'}
                        </button>
                        <button onClick={handleForgotStep2}
                          className="flex-1 h-10 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5">
                          {language === 'bn' ? 'পরবর্তী' : 'Next'}<ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {forgotStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          {language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                        </label>
                        <input type="password" value={forgotNewPassword} onChange={e => setForgotNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-11 px-4 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5 bg-white text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400"
                          autoFocus />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          {language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
                        </label>
                        <input type="password" value={forgotConfirmPassword} onChange={e => setForgotConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-11 px-4 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5 bg-white text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400"
                          onKeyDown={e => e.key === 'Enter' && handleForgotStep3()} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setForgotStep(2); setForgotError(''); }}
                          className="flex-1 h-10 rounded-lg border border-slate-200 text-slate-500 text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5">
                          <ArrowLeft className="w-3.5 h-3.5" />{language === 'bn' ? 'পেছনে' : 'Back'}
                        </button>
                        <button onClick={handleForgotStep3}
                          className="flex-1 h-10 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />{language === 'bn' ? 'সেট করুন' : 'Set Password'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
