'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminLogin, adminRegister, adminChangePassword, adminExists, srLogin } from '../../lib/localStore';
import { loginDict, type LoginLang, type LoginDict } from './dict';

export type LoginTab = 'admin' | 'sr';

export interface UseLoginPageReturn {
  language:             LoginLang;
  langOpen:             boolean;
  t:                    LoginDict;
  handleSelectLang:     (lang: LoginLang) => void;
  handleToggleLang:     () => void;
  handleCloseLang:      () => void;
  loginTab:             LoginTab;
  isRegistering:        boolean;
  handleSelectAdminTab: () => void;
  handleSelectSRTab:    () => void;
  handleToggleRegister: () => void;
  isLoading:            boolean;
  error:                string;
  email:                string;
  password:             string;
  showPassword:         boolean;
  handleEmailChange:    (v: string) => void;
  handlePasswordChange: (v: string) => void;
  handleTogglePassword: () => void;
  handleAdminLogin:     (e: React.FormEvent) => void;
  srUsername:           string;
  srPassword:           string;
  showSrPass:           boolean;
  handleSrUsernameChange:(v: string) => void;
  handleSrPasswordChange:(v: string) => void;
  handleToggleSrPass:   () => void;
  handleSRLogin:        (e: React.FormEvent) => void;
  regEmail:             string;
  regPassword:          string;
  regConfirm:           string;
  showRegPass:          boolean;
  showRegConfirm:       boolean;
  handleRegEmailChange:    (v: string) => void;
  handleRegPasswordChange: (v: string) => void;
  handleRegConfirmChange:  (v: string) => void;
  handleToggleRegPass:     () => void;
  handleToggleRegConfirm:  () => void;
  handleRegister:          (e: React.FormEvent) => void;
  showForgot:           boolean;
  forgotEmail:          string;
  forgotStep:           1 | 2 | 3;
  forgotNewPass:        string;
  forgotConfirmPass:    string;
  forgotSent:           boolean;
  forgotLoading:        boolean;
  handleOpenForgot:     () => void;
  handleCloseForgot:    () => void;
  handleForgotEmailChange:   (v: string) => void;
  handleForgotNewPassChange: (v: string) => void;
  handleForgotConfirmChange: (v: string) => void;
  handleForgotStep1:    () => void;
  handleForgotStep2:    (e: React.FormEvent) => void;
}

export function useLoginPage(onLogin: (role: 'admin' | 'sr') => void): UseLoginPageReturn {
  const [language,      setLanguage]      = useState<LoginLang>('en');
  const [langOpen,      setLangOpen]      = useState(false);
  const [loginTab,      setLoginTab]      = useState<LoginTab>('admin');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState('');

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [srUsername, setSrUsername] = useState('');
  const [srPassword, setSrPassword] = useState('');
  const [showSrPass, setShowSrPass] = useState(false);

  const [regEmail,       setRegEmail]       = useState('');
  const [regPassword,    setRegPassword]    = useState('');
  const [regConfirm,     setRegConfirm]     = useState('');
  const [showRegPass,    setShowRegPass]    = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  const [showForgot,      setShowForgot]      = useState(false);
  const [forgotEmail,     setForgotEmail]     = useState('');
  const [forgotStep,      setForgotStep]      = useState<1 | 2 | 3>(1);
  const [forgotNewPass,   setForgotNewPass]   = useState('');
  const [forgotConfirmPass,setForgotConfirmPass]= useState('');
  const [forgotSent,      setForgotSent]      = useState(false);
  const [forgotLoading,   setForgotLoading]   = useState(false);

  const t = loginDict[language];

  useEffect(() => {
    const saved = localStorage.getItem('erp_language');
    if (saved === 'en' || saved === 'bn') setLanguage(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('erp_language', language);
  }, [language]);

  const handleSelectLang     = useCallback((lang: LoginLang) => { setLanguage(lang); setLangOpen(false); }, []);
  const handleToggleLang     = useCallback(() => setLangOpen(p => !p), []);
  const handleCloseLang      = useCallback(() => setLangOpen(false), []);
  const handleSelectAdminTab = useCallback(() => { setLoginTab('admin'); setError(''); }, []);
  const handleSelectSRTab    = useCallback(() => { setLoginTab('sr');    setError(''); }, []);
  const handleToggleRegister = useCallback(() => { setIsRegistering(r => !r); setError(''); }, []);
  const handleTogglePassword = useCallback(() => setShowPassword(p => !p), []);
  const handleToggleSrPass   = useCallback(() => setShowSrPass(p => !p), []);
  const handleToggleRegPass  = useCallback(() => setShowRegPass(p => !p), []);
  const handleToggleRegConfirm = useCallback(() => setShowRegConfirm(p => !p), []);

  const handleEmailChange          = useCallback((v: string) => { setEmail(v);        setError(''); }, []);
  const handlePasswordChange       = useCallback((v: string) => { setPassword(v);     setError(''); }, []);
  const handleSrUsernameChange     = useCallback((v: string) => { setSrUsername(v);   setError(''); }, []);
  const handleSrPasswordChange     = useCallback((v: string) => { setSrPassword(v);   setError(''); }, []);
  const handleRegEmailChange       = useCallback((v: string) => { setRegEmail(v);     setError(''); }, []);
  const handleRegPasswordChange    = useCallback((v: string) => { setRegPassword(v);  setError(''); }, []);
  const handleRegConfirmChange     = useCallback((v: string) => { setRegConfirm(v);   setError(''); }, []);
  const handleForgotEmailChange    = useCallback((v: string) => { setForgotEmail(v);  setError(''); }, []);
  const handleForgotNewPassChange  = useCallback((v: string) => { setForgotNewPass(v); setError(''); }, []);
  const handleForgotConfirmChange  = useCallback((v: string) => { setForgotConfirmPass(v); setError(''); }, []);

  const handleOpenForgot = useCallback(() => {
    setForgotEmail(email);
    setForgotStep(1);
    setForgotNewPass('');
    setForgotConfirmPass('');
    setForgotSent(false);
    setError('');
    setShowForgot(true);
  }, [email]);

  const handleCloseForgot = useCallback(() => {
    setShowForgot(false);
    setForgotStep(1);
    setForgotSent(false);
    setError('');
  }, []);

  // ── Admin Login (localStorage) ─────────────────────────────────────────────
  const handleAdminLogin = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError(t.errorRequired); return; }
    setIsLoading(true);
    setError('');
    const ok = adminLogin(email.trim(), password);
    setIsLoading(false);
    if (!ok) { setError(t.errorInvalid); return; }
    onLogin('admin');
  }, [email, password, t, onLogin]);

  // ── SR Login (localStorage) ────────────────────────────────────────────────
  const handleSRLogin = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!srUsername.trim() || !srPassword.trim()) { setError(t.errorRequired); return; }
    setIsLoading(true);
    setError('');
    const sr = srLogin(srUsername.trim(), srPassword);
    setIsLoading(false);
    if (!sr) { setError(t.errorInvalid); return; }
    sessionStorage.setItem('erp_sr_id',   sr.id);
    sessionStorage.setItem('erp_sr_name', sr.name);
    onLogin('sr');
  }, [srUsername, srPassword, t, onLogin]);

  // ── Admin Register (localStorage) ─────────────────────────────────────────
  const handleRegister = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword.trim() || !regConfirm.trim()) { setError(t.errorRequired); return; }
    if (regPassword.length < 6)    { setError(t.errorMinPassword);  return; }
    if (regPassword !== regConfirm){ setError(t.errorPasswordMatch); return; }
    setIsLoading(true);
    setError('');
    const result = adminRegister(regEmail.trim(), regPassword);
    setIsLoading(false);
    if (!result.ok) {
      setError(result.error ?? t.errorInvalid);
      return;
    }
    // Auto login after registration
    onLogin('admin');
  }, [regEmail, regPassword, regConfirm, t, onLogin]);

  // ── Forgot Password — Step 1: verify email exists ─────────────────────────
  const handleForgotStep1 = useCallback(() => {
    setError('');
    if (!forgotEmail.trim()) {
      setError(language === 'bn' ? 'ইমেইল/ইউজারনেম লিখুন।' : 'Enter your email or username.');
      return;
    }
    if (!adminExists(forgotEmail.trim())) {
      setError(language === 'bn' ? 'এই অ্যাকাউন্ট পাওয়া যায়নি।' : 'No account found with this email.');
      return;
    }
    setForgotStep(2);
  }, [forgotEmail, language]);

  // ── Forgot Password — Step 2: set new password ────────────────────────────
  const handleForgotStep2 = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!forgotNewPass.trim() || !forgotConfirmPass.trim()) {
      setError(language === 'bn' ? 'দুটি ফিল্ডই পূরণ করুন।' : 'Please fill both fields.');
      return;
    }
    if (forgotNewPass.length < 6) {
      setError(language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setError(language === 'bn' ? 'পাসওয়ার্ড দুটি মিলছে না।' : 'Passwords do not match.');
      return;
    }
    setForgotLoading(true);
    const ok = adminChangePassword(forgotEmail.trim(), forgotNewPass);
    setForgotLoading(false);
    if (!ok) {
      setError(language === 'bn' ? 'পাসওয়ার্ড আপডেট করা যায়নি।' : 'Could not update password.');
      return;
    }
    setForgotSent(true);
    setForgotStep(3);
  }, [forgotEmail, forgotNewPass, forgotConfirmPass, language]);

  return {
    language, langOpen, t,
    handleSelectLang, handleToggleLang, handleCloseLang,
    loginTab, isRegistering,
    handleSelectAdminTab, handleSelectSRTab, handleToggleRegister,
    isLoading, error,
    email, password, showPassword,
    handleEmailChange, handlePasswordChange, handleTogglePassword, handleAdminLogin,
    srUsername, srPassword, showSrPass,
    handleSrUsernameChange, handleSrPasswordChange, handleToggleSrPass, handleSRLogin,
    regEmail, regPassword, regConfirm, showRegPass, showRegConfirm,
    handleRegEmailChange, handleRegPasswordChange, handleRegConfirmChange,
    handleToggleRegPass, handleToggleRegConfirm, handleRegister,
    showForgot, forgotEmail, forgotStep, forgotNewPass, forgotConfirmPass,
    forgotSent, forgotLoading,
    handleOpenForgot, handleCloseForgot,
    handleForgotEmailChange, handleForgotNewPassChange, handleForgotConfirmChange,
    handleForgotStep1, handleForgotStep2,
  };
}
