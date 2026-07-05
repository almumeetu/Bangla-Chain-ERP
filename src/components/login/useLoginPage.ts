'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { findSRByCredentials } from '../../lib/db';
import { loginDict, type LoginLang, type LoginDict } from './dict';

export type LoginTab = 'admin' | 'sr';

export interface UseLoginPageReturn {
  // language
  language:           LoginLang;
  langOpen:           boolean;
  t:                  LoginDict;
  handleSelectLang:   (lang: LoginLang) => void;
  handleToggleLang:   () => void;
  handleCloseLang:    () => void;

  // tabs / view
  loginTab:           LoginTab;
  isRegistering:      boolean;
  handleSelectAdminTab:() => void;
  handleSelectSRTab:  () => void;
  handleToggleRegister:() => void;

  // shared state
  isLoading:          boolean;
  error:              string;

  // admin login
  email:              string;
  password:           string;
  showPassword:       boolean;
  handleEmailChange:  (v: string) => void;
  handlePasswordChange:(v: string) => void;
  handleTogglePassword:() => void;
  handleAdminLogin:   (e: React.FormEvent) => void;

  // SR login
  srUsername:         string;
  srPassword:         string;
  showSrPass:         boolean;
  handleSrUsernameChange:(v: string) => void;
  handleSrPasswordChange:(v: string) => void;
  handleToggleSrPass: () => void;
  handleSRLogin:      (e: React.FormEvent) => void;

  // register
  regEmail:           string;
  regPassword:        string;
  regConfirm:         string;
  showRegPass:        boolean;
  showRegConfirm:     boolean;
  handleRegEmailChange:(v: string) => void;
  handleRegPasswordChange:(v: string) => void;
  handleRegConfirmChange:(v: string) => void;
  handleToggleRegPass:() => void;
  handleToggleRegConfirm:() => void;
  handleRegister:     (e: React.FormEvent) => void;

  // forgot password
  showForgot:         boolean;
  forgotEmail:        string;
  forgotSent:         boolean;
  forgotLoading:      boolean;
  handleOpenForgot:   () => void;
  handleCloseForgot:  () => void;
  handleForgotEmailChange:(v: string) => void;
  handleForgotPassword:() => void;
}

export function useLoginPage(
  onLogin: (role: 'admin' | 'sr') => void,
): UseLoginPageReturn {
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

  const [regEmail,      setRegEmail]      = useState('');
  const [regPassword,   setRegPassword]   = useState('');
  const [regConfirm,    setRegConfirm]    = useState('');
  const [showRegPass,   setShowRegPass]   = useState(false);
  const [showRegConfirm,setShowRegConfirm]= useState(false);

  const [showForgot,    setShowForgot]    = useState(false);
  const [forgotEmail,   setForgotEmail]   = useState('');
  const [forgotSent,    setForgotSent]    = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const t = loginDict[language];

  useEffect(() => {
    const saved = localStorage.getItem('erp_language');
    if (saved === 'en' || saved === 'bn') setLanguage(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('erp_language', language);
  }, [language]);

  const handleSelectLang    = useCallback((lang: LoginLang) => { setLanguage(lang); setLangOpen(false); }, []);
  const handleToggleLang    = useCallback(() => setLangOpen(p => !p), []);
  const handleCloseLang     = useCallback(() => setLangOpen(false), []);
  const handleSelectAdminTab= useCallback(() => { setLoginTab('admin'); setError(''); }, []);
  const handleSelectSRTab   = useCallback(() => { setLoginTab('sr');    setError(''); }, []);
  const handleToggleRegister= useCallback(() => { setIsRegistering(r => !r); setError(''); }, []);
  const handleTogglePassword= useCallback(() => setShowPassword(p => !p), []);
  const handleToggleSrPass  = useCallback(() => setShowSrPass(p => !p),   []);
  const handleToggleRegPass = useCallback(() => setShowRegPass(p => !p),   []);
  const handleToggleRegConfirm = useCallback(() => setShowRegConfirm(p => !p), []);

  const handleEmailChange   = useCallback((v: string) => { setEmail(v);       setError(''); }, []);
  const handlePasswordChange= useCallback((v: string) => { setPassword(v);    setError(''); }, []);
  const handleSrUsernameChange=useCallback((v: string)=> { setSrUsername(v);  setError(''); }, []);
  const handleSrPasswordChange=useCallback((v: string)=> { setSrPassword(v);  setError(''); }, []);
  const handleRegEmailChange= useCallback((v: string) => { setRegEmail(v);    setError(''); }, []);
  const handleRegPasswordChange=useCallback((v: string)=>{ setRegPassword(v); setError(''); }, []);
  const handleRegConfirmChange=useCallback((v: string) => { setRegConfirm(v); setError(''); }, []);
  const handleForgotEmailChange=useCallback((v: string)=> { setForgotEmail(v); }, []);
  const handleOpenForgot    = useCallback(() => { setForgotEmail(email); setForgotSent(false); setShowForgot(true); }, [email]);
  const handleCloseForgot   = useCallback(() => setShowForgot(false), []);

  const handleAdminLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const hasFields = email.trim() && password.trim();
    if (!hasFields) { setError(t.errorRequired); return; }
    setIsLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setIsLoading(false);
    if (err) { setError(t.errorInvalid); return; }
    onLogin('admin');
  }, [email, password, t, onLogin]);

  const handleSRLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const hasFields = srUsername.trim() && srPassword.trim();
    if (!hasFields) { setError(t.errorRequired); return; }
    setIsLoading(true);
    setError('');
    const sr = await findSRByCredentials(srUsername.trim(), srPassword).catch(() => null);
    if (!sr) {
      setError(t.errorInvalid);
      setIsLoading(false);
      return;
    }
    sessionStorage.setItem('erp_sr_id',   sr.id);
    sessionStorage.setItem('erp_sr_name', sr.name);
    setIsLoading(false);
    onLogin('sr');
  }, [srUsername, srPassword, t, onLogin]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const hasFields = regEmail.trim() && regPassword.trim() && regConfirm.trim();
    if (!hasFields)               { setError(t.errorRequired);     return; }
    if (regPassword.length < 6)   { setError(t.errorMinPassword);  return; }
    if (regPassword !== regConfirm){ setError(t.errorPasswordMatch); return; }
    setIsLoading(true);
    setError('');
    const { error: signUpErr } = await supabase.auth.signUp({
      email:    regEmail.trim().toLowerCase(),
      password: regPassword,
      options:  { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (signUpErr) { setError(signUpErr.message); setIsLoading(false); return; }
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email:    regEmail.trim().toLowerCase(),
      password: regPassword,
    });
    setIsLoading(false);
    if (signInErr) {
      setError(language === 'bn' ? 'অ্যাকাউন্ট তৈরি হয়েছে। এখন লগইন করুন।' : 'Account created. Please sign in.');
      setIsRegistering(false);
      return;
    }
    onLogin('admin');
  }, [regEmail, regPassword, regConfirm, t, language, onLogin]);

  const handleForgotPassword = useCallback(async () => {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    await supabase.auth.resetPasswordForEmail(forgotEmail.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/admin/dashboard`,
    });
    setForgotLoading(false);
    setForgotSent(true);
  }, [forgotEmail]);

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
    showForgot, forgotEmail, forgotSent, forgotLoading,
    handleOpenForgot, handleCloseForgot, handleForgotEmailChange, handleForgotPassword,
  };
}
