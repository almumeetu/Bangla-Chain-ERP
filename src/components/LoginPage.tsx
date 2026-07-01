'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, Shield, Globe, ChevronDown, Check } from 'lucide-react';
import { Language } from '../translations';

interface LoginPageProps {
  onLogin: () => void;
}

const loginDict = {
  en: {
    welcome: 'Welcome back',
    subtitle: 'Sign in to access your admin console.',
    email: 'Email Address',
    password: 'Password',
    forgot: 'Forgot password?',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    demoTitle: 'Demo Credentials',
    errorRequired: 'Please enter both email and password.',
    errorInvalid: 'Invalid credentials. Please try again.',
    rights: 'All Rights Reserved',
    security: 'Enterprise-grade security • Data encrypted locally',
    titleMain: 'Your complete business management platform.',
    descMain: 'Manage your wholesale distribution, track inventory, generate delivery challans, process procurement invoices, and analyze profitability — all from one unified dashboard.',
  },
  bn: {
    welcome: 'স্বাগতম',
    subtitle: 'আপনার অ্যাডমিন প্যানেলে প্রবেশ করতে সাইন-ইন করুন।',
    email: 'ইমেইল ঠিকানা',
    password: 'পাসওয়ার্ড',
    forgot: 'পাসওয়ার্ড ভুলে গেছেন?',
    signIn: 'সাইন ইন করুন',
    signingIn: 'সাইন ইন হচ্ছে...',
    demoTitle: 'ডেমো লগইন তথ্য',
    errorRequired: 'অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড দুটিই লিখুন।',
    errorInvalid: 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করুন।',
    rights: 'সর্বস্বত্ব সংরক্ষিত',
    security: 'এন্টারপ্রাইজ-গ্রেড সিকিউরিটি • ডেটা স্থানীয়ভাবে সুরক্ষিত',
    titleMain: 'আপনার ব্যবসার সম্পূর্ণ ডিস্ট্রিবিউশন প্ল্যাটফর্ম।',
    descMain: 'পাইকারি সরবরাহ পরিচালনা করুন, স্টক নিয়ন্ত্রণ করুন, চালান জেনারেট করুন, প্রকিউরমেন্ট রসিদ তৈরি করুন এবং রিয়েল-টাইমে মুনাফা বিশ্লেষণ করুন — সব একটি ড্যাশবোর্ড থেকে।',
  }
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  
  // Language Switcher State
  const [language, setLanguage] = useState<Language>('bn');
  const [langOpen, setLangOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_language');
      if (saved) {
        setLanguage(saved as Language);
      }
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_language', language);
    }
  }, [language, isLoaded]);

  const handleTogglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  }, []);

  const handleToggleLang = useCallback(() => {
    setLangOpen(prev => !prev);
  }, []);

  const handleSelectEnglish = useCallback(() => {
    setLanguage('en');
    setLangOpen(false);
  }, []);

  const handleSelectBangla = useCallback(() => {
    setLanguage('bn');
    setLangOpen(false);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError(loginDict[language].errorRequired);
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate authentication delay for professional feel
    setTimeout(() => {
      // Default credentials: admin@samir.com / admin123
      if (
        (email === 'admin@samir.com' && password === 'admin123') ||
        (email === 'admin' && password === 'admin')
      ) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('erp_auth', 'true');
          localStorage.setItem('erp_auth_user', email);
        }
        onLogin();
      } else {
        setError(loginDict[language].errorInvalid);
        setIsLoading(false);
      }
    }, 800);
  }, [email, password, language, onLogin]);

  return (
    <div className={`min-h-screen bg-[#fafafa] flex font-sans ${language === 'bn' ? 'font-bengali' : 'font-gotham'}`}>

      {/* Left Panel — Brand + Illustration */}
      <div className="hidden lg:flex lg:w-[55%] bg-slate-950 relative overflow-hidden flex-col justify-between p-12 select-none">
        
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        {/* Floating accent shapes */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-16 w-56 h-56 bg-white/[0.03] rounded-full blur-2xl" />

        {/* Top brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-slate-950 font-bold text-lg">S</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">Samir Enterprise</span>
          </div>
          <p className="text-slate-500 text-[10px] font-bold tracking-wider uppercase mt-1">Distribution Management System</p>
        </div>

        {/* Center messaging */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-white text-3xl font-semibold leading-tight tracking-tight mb-5">
            {language === 'bn' ? 'আপনার ব্যবসার সম্পূর্ণ' : 'Your complete business'}<br />
            <span className="text-slate-400">{language === 'bn' ? 'ডিস্ট্রিবিউশন প্ল্যাটফর্ম।' : 'management platform.'}</span>
          </h1>
          <p className="text-slate-500 text-xs leading-relaxed font-semibold">
            {loginDict[language].descMain}
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {language === 'bn' 
              ? ['সেলস POS', 'চালান শিট', 'স্টক নিয়ন্ত্রণ', 'প্রকিউরমেন্ট', 'ব্যয় ও হিসাব', 'পিডিএফ রিপোর্ট']
              : ['Sales POS', 'Challan Sheets', 'Stock Control', 'Procurement', 'Accounting', 'PDF Reports']
            .map(tag => (
              <span key={tag} className="px-3 py-1.5 rounded-md bg-white/[0.06] text-slate-400 text-[10px] font-semibold uppercase tracking-wider border border-white/[0.06]">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex items-center gap-3 text-slate-600 text-xs font-semibold">
          <Shield className="w-4 h-4" />
          <span>{loginDict[language].security}</span>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex flex-col justify-between px-6 py-8 relative">
        
        {/* Top-Right Language switch controls */}
        <div className="flex justify-end pr-2">
          <div className="relative">
            <button
              id="login-lang-btn"
              type="button"
              onClick={handleToggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-205 hover:border-slate-350 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all cursor-pointer bg-white"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              {language === 'bn' ? 'বাংলা' : 'English'}
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50 text-xs font-semibold">
                <button
                  type="button"
                  onClick={handleSelectEnglish}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                    language === 'en' ? 'text-slate-900 bg-slate-50/50' : 'text-slate-500'
                  }`}
                >
                  English
                  {language === 'en' && <Check className="w-3.5 h-3.5 text-slate-800" />}
                </button>
                <button
                  type="button"
                  onClick={handleSelectBangla}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                    language === 'bn' ? 'text-slate-900 bg-slate-50/50' : 'text-slate-500'
                  }`}
                >
                  বাংলা
                  {language === 'bn' && <Check className="w-3.5 h-3.5 text-slate-800" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center Card */}
        <div className="flex-1 flex items-center justify-center my-6">
          <div className="w-full max-w-sm">

            {/* Mobile brand (shows on smaller screens) */}
            <div className="lg:hidden mb-8 text-center select-none">
              <div className="flex items-center justify-center gap-2.5 mb-2">
                <div className="w-9 h-9 bg-slate-950 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-slate-900 font-semibold text-lg tracking-tight">Samir Enterprise</span>
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Distribution Management System</p>
            </div>

            {/* Form header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{loginDict[language].welcome}</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">{loginDict[language].subtitle}</p>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email field */}
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-2">
                  {loginDict[language].email}
                </label>
                <input
                  id="login-email"
                  type="text"
                  value={email}
                  onChange={handleEmailChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="admin@samir.com"
                  autoComplete="email"
                  className={`w-full h-11 px-4 rounded-lg border bg-white text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-350 ${
                    focusedField === 'email'
                      ? 'border-slate-900 ring-2 ring-slate-900/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                />
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                    {loginDict[language].password}
                  </label>
                  <button type="button" className="text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                    {loginDict[language].forgot}
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
                    className={`w-full h-11 px-4 pr-11 rounded-lg border bg-white text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-350 ${
                      focusedField === 'password'
                        ? 'border-slate-900 ring-2 ring-slate-900/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleTogglePassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs font-semibold text-red-600">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className={`w-full h-11 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isLoading
                    ? 'bg-slate-400 text-white cursor-wait'
                    : 'bg-slate-950 hover:bg-slate-800 text-white active:scale-[0.98] shadow-sm'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {loginDict[language].signingIn}
                  </>
                ) : (
                  <>
                    {loginDict[language].signIn}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[9px] font-bold text-slate-405 uppercase tracking-wider mb-2">{loginDict[language].demoTitle}</p>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-semibold">
                  Email: <span className="font-mono font-bold text-slate-700">admin@samir.com</span>
                </p>
                <p className="text-xs text-slate-500 font-semibold">
                  Password: <span className="font-mono font-bold text-slate-700">admin123</span>
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 font-bold select-none">
          &copy; 2026 Samir Enterprise &bull; {loginDict[language].rights}
        </p>

      </div>
    </div>
  );
}
