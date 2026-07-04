'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Shield, Globe, ChevronDown, Check,
  KeyRound, CheckCircle2, LayoutDashboard,
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
    signingIn: 'Signing in…',
    signUp: 'Create Account',
    signingUp: 'Creating account…',
    toggleToRegister: "Don't have an admin account? Create one",
    toggleToLogin: 'Already registered? Sign in instead',
    errorRequired: 'Please enter both username and password.',
    errorInvalid: 'Invalid credentials. Please try again.',
    errorPasswordMatch: 'Passwords do not match.',
    errorRegisterRequired: 'Please fill in all fields.',
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
    signingIn: 'সাইন ইন হচ্ছে…',
    signUp: 'অ্যাকাউন্ট তৈরি করুন',
    signingUp: 'অ্যাকাউন্ট তৈরি হচ্ছে…',
    toggleToRegister: 'অ্যাকাউন্ট নেই? নতুন অ্যাডমিন অ্যাকাউন্ট তৈরি করুন',
    toggleToLogin: 'ইতিমধ্যে রেজিস্টার করেছেন? সাইন ইন করুন',
    errorRequired: 'অনুগ্রহ করে ইউজারনেম এবং পাসওয়ার্ড দুটিই লিখুন।',
    errorInvalid: 'ইউজারনেম বা পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করুন।',
    errorPasswordMatch: 'পাসওয়ার্ড দুটি মিলছে না। আবার চেষ্টা করুন।',
    errorRegisterRequired: 'অনুগ্রহ করে সব তথ্য পূরণ করুন।',
  },
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  // ── Language Switcher ──────────────────────────────────────────────────────
  const [language, setLanguage] = useState<Language>('bn');
  const [langOpen, setLangOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Login form ─────────────────────────────────────────────────────────────
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState('');

  // ── Registration form ──────────────────────────────────────────────────────
  const [isRegistering,       setIsRegistering]       = useState(false);
  const [regEmail,            setRegEmail]            = useState('');
  const [regPassword,         setRegPassword]         = useState('');
  const [regConfirmPassword,  setRegConfirmPassword]  = useState('');

  // ── Forgot-password modal (3-step) ─────────────────────────────────────────
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

  // ── Language persistence ───────────────────────────────────────────────────
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

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleTogglePassword = useCallback(() => setShowPassword(p => !p), []);
  const handleEmailChange    = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setEmail(e.target.value); setError(''); }, []);
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setPassword(e.target.value); setError(''); }, []);
  const handleToggleLang     = useCallback(() => setLangOpen(p => !p), []);
  const handleSelectEnglish  = useCallback(() => { setLanguage('en'); setLangOpen(false); }, []);
  const handleSelectBangla   = useCallback(() => { setLanguage('bn'); setLangOpen(false); }, []);

  // ── Registration submit ────────────────────────────────────────────────────
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

  // ── Login submit ───────────────────────────────────────────────────────────
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

  // ── Forgot-password helpers ────────────────────────────────────────────────
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
          const saved    = localStorage.getItem('erp_admins');
          const admins   = saved ? JSON.parse(saved) : [];
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

  // ── Dark input class helper ────────────────────────────────────────────────
  const darkInput = 'w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold outline-none placeholder:text-white/30 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#0a0a0f' }}
      onClick={() => langOpen && setLangOpen(false)}
    >
      {/* ── Dot-grid overlay ─────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── Floating orbs ────────────────────────────────────────────────── */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600 blur-3xl opacity-10 animate-pulse pointer-events-none" />
      <div className="absolute -bottom-40 -right-20 w-[480px] h-[480px] rounded-full bg-indigo-700 blur-3xl opacity-10 animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 -right-40 w-72 h-72 rounded-full bg-purple-600 blur-3xl opacity-[0.07] animate-pulse pointer-events-none" style={{ animationDelay: '3s' }} />

      {/* ── Language switcher — top right ────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-20" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <button
            onClick={handleToggleLang}
            className="h-9 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-bold flex items-center gap-2 hover:bg-white/10 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            {language === 'bn' ? 'বাংলা' : 'English'}
            <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
          </button>
          {langOpen && (
            <div className="absolute right-0 mt-1.5 w-36 bg-[#111118] rounded-xl border border-white/10 shadow-2xl py-1 z-30">
              <button onClick={handleSelectBangla} className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${language === 'bn' ? 'text-white bg-white/5' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                🇧🇩 বাংলা {language === 'bn' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
              <button onClick={handleSelectEnglish} className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${language === 'en' ? 'text-white bg-white/5' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                🇬🇧 English {language === 'en' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            </div>
          )}
        </div>
      </div>
